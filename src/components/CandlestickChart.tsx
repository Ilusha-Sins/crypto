import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { getMarketKlines, getMarketSymbols } from '../api/market.api';

import {
  detectCandlePatterns,
  calculateSeriesMA,
  calculateSeriesEMA,
  calculateBollingerBands,
} from './indicators';
import { Candle, Volume, DrawingObject } from '../types';
import ChartHeader from './ChartHeader';
import DrawingToolbar from './DrawingToolbar';
import { useChartPlugins } from '../hooks/useChartPlugins';
import {
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  panelStyle,
  withDisabled,
} from '../styles/ui';

Chart.register(CandlestickController, CandlestickElement, zoomPlugin);

type CandlestickChartProps = {
  selectedSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  onMarketDataChange?: (payload: {
    symbol: string;
    interval: string;
    candles: Candle[];
    currentPrice: number;
    isLoading: boolean;
    errorMsg: string | null;
  }) => void;
};

const getIntervalMs = (intv: string): number => {
  const num = parseInt(intv, 10);
  if (intv.endsWith('m')) return num * 60 * 1000;
  if (intv.endsWith('h')) return num * 60 * 60 * 1000;
  if (intv.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  if (intv.endsWith('w')) return num * 7 * 24 * 60 * 60 * 1000;
  return 60 * 1000;
};

export default function CandlestickChart({
  selectedSymbol,
  onSymbolChange,
  onMarketDataChange,
}: CandlestickChartProps) {
  const candleRef = useRef<HTMLCanvasElement>(null);
  const candleInstance = useRef<Chart | null>(null);
  const volumeRef = useRef<HTMLCanvasElement>(null);
  const volumeInstance = useRef<Chart | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [data, setData] = useState<Candle[]>([]);
  const [volumeData, setVolumeData] = useState<Volume[]>([]);
  const [interval, setInterval] = useState('1m');
  const [symbol, setSymbol] = useState(selectedSymbol ?? 'BTC');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [symbolsList, setSymbolsList] = useState<string[]>([]);

  const [overlays, setOverlays] = useState({
    sma: false,
    ema: false,
    bb: false,
    patterns: true,
  });

  const [drawTool, setDrawTool] = useState<
    'cursor' | 'line' | 'rect' | 'text' | 'fib'
  >('cursor');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const drawingInProgress = useRef<DrawingObject | null>(null);

  const [xMin, setXMin] = useState<number | null>(null);
  const [xMax, setXMax] = useState<number | null>(null);

  const loadedRange = useRef<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const loadingOlder = useRef(false);

  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== symbol) {
      setSymbol(selectedSymbol);
    }
  }, [selectedSymbol, symbol]);

  const handleSymbolChange = (nextSymbol: string) => {
    const normalized = nextSymbol.trim().toUpperCase();
    setSymbol(normalized);
    onSymbolChange?.(normalized);
  };

  const patterns = useMemo(() => detectCandlePatterns(data), [data]);

  const indicatorSeries = useMemo(() => {
    if (data.length === 0) {
      return { sma: [], ema: [], bb: null };
    }

    return {
      sma: calculateSeriesMA(data, 20),
      ema: calculateSeriesEMA(data, 20),
      bb: calculateBollingerBands(data, 20, 2),
    };
  }, [data]);

  const customPlugins = useChartPlugins({
    data,
    patterns,
    overlays,
    drawTool,
    drawings,
    setDrawings,
    drawingInProgress,
    interval,
  });

  useEffect(() => {
    async function fetchSymbols() {
      try {
        const response = await getMarketSymbols();
        setSymbolsList(response.items);
      } catch {
        setSymbolsList(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE']);
      }
    }

    void fetchSymbols();
  }, []);

  const setInitialView = (candles: Candle[]) => {
    if (candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    const intervalMs = getIntervalMs(interval);
    const viewRange = intervalMs * 40;

    setXMin(lastCandle.x - viewRange);
    setXMax(lastCandle.x + intervalMs * 5);
  };

  const fetchHistoricalData = async (
    selectedInterval: string,
    endTime: number | null = null,
    limit = 500,
  ) => {
    try {
      if (!endTime) {
        setErrorMsg(null);
      }

      const response = await getMarketKlines(
        `${symbol}USDT`,
        selectedInterval,
        limit,
        endTime ?? undefined,
      );

      if (!response || response.length === 0) {
        if (!endTime) {
          setErrorMsg('Дані для цієї пари відсутні.');
        }
        return;
      }

      const formatted: Candle[] = response.map((d) => ({
        x: d.openTime,
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close,
        v: d.volume,
      }));

      const volumeFormatted: Volume[] = response.map((d) => ({
        x: d.openTime,
        y: d.volume,
      }));

      setData((prevData) => {
        const all = endTime ? [...formatted, ...prevData] : formatted;
        const uniqueMap = new Map<number, Candle>();

        for (const candle of all) {
          uniqueMap.set(candle.x, candle);
        }

        const uniqueArr = Array.from(uniqueMap.values()).sort((a, b) => a.x - b.x);

        if (uniqueArr.length > 0) {
          loadedRange.current.min = uniqueArr[0].x;
          loadedRange.current.max = uniqueArr[uniqueArr.length - 1].x;

          if (!endTime) {
            setInitialView(uniqueArr);
          }
        }

        return uniqueArr;
      });

      setVolumeData((prevVolume) => {
        const allVol = endTime ? [...volumeFormatted, ...prevVolume] : volumeFormatted;
        const uniqueVolMap = new Map<number, Volume>();

        for (const vol of allVol) {
          uniqueVolMap.set(vol.x, vol);
        }

        return Array.from(uniqueVolMap.values()).sort((a, b) => a.x - b.x);
      });
    } catch (err) {
      console.error('Помилка завантаження даних:', err);
      if (!endTime) {
        setErrorMsg('Помилка завантаження market data з backend.');
      }
    } finally {
      loadingOlder.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);
    loadedRange.current = { min: null, max: null };
    loadingOlder.current = false;
    setData([]);
    setVolumeData([]);
    setXMin(null);
    setXMax(null);

    void fetchHistoricalData(interval);
  }, [interval, symbol]);

  useEffect(() => {
    if (xMin !== null && xMax !== null) {
      if (candleInstance.current?.options.scales?.x) {
        candleInstance.current.options.scales.x.min = xMin;
        candleInstance.current.options.scales.x.max = xMax;
        candleInstance.current.update('none');
      }

      if (volumeInstance.current?.options.scales?.x) {
        volumeInstance.current.options.scales.x.min = xMin;
        volumeInstance.current.options.scales.x.max = xMax;
        volumeInstance.current.update('none');
      }
    }
  }, [xMin, xMax]);

  const handlePan = (chart: Chart) => {
    if (loadingOlder.current || drawTool !== 'cursor') return;

    const xScale = chart.scales.x;
    if (!xScale || loadedRange.current.min === null) return;

    const visibleMin = xScale.min;
    const loadedMin = loadedRange.current.min;
    const intervalMs = getIntervalMs(interval);

    if (visibleMin - loadedMin < intervalMs * 20) {
      loadingOlder.current = true;
      void fetchHistoricalData(interval, loadedMin - 1, 500);
    }
  };

  const syncZoom = (chart: Chart) => {
    const { min, max } = chart.scales.x;
    setXMin(min);
    setXMax(max);
  };

  const handleManualZoom = (direction: 'in' | 'out') => {
    if (xMin === null || xMax === null) return;

    const currentRange = xMax - xMin;
    const center = xMin + currentRange / 2;
    const intervalMs = getIntervalMs(interval);
    const factor = direction === 'in' ? 0.8 : 1.25;

    let newRange = currentRange * factor;
    const minRange = intervalMs * 10;
    const maxRange = intervalMs * 500;

    if (newRange < minRange) newRange = minRange;
    if (newRange > maxRange) newRange = maxRange;

    setXMin(center - newRange / 2);
    setXMax(center + newRange / 2);
  };

  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const ctx = candleRef.current.getContext('2d');
    if (!ctx) return;

    if (candleInstance.current) {
      candleInstance.current.destroy();
      candleInstance.current = null;
    }

    const datasets: any[] = [
      {
        type: 'candlestick',
        label: `${symbol}/USDT`,
        data: data as any,
        color: { up: '#22c55e', down: '#ef4444', unchanged: '#9ca3af' },
        borderColor: { up: '#22c55e', down: '#ef4444', unchanged: '#9ca3af' },
        order: 1,
      },
    ];

    if (overlays.sma && indicatorSeries.sma.length) {
      datasets.push({
        type: 'line',
        label: 'SMA (20)',
        data: indicatorSeries.sma.map((v, i) => ({ x: data[i].x, y: v })),
        borderColor: '#fbbf24',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 2,
      });
    }

    if (overlays.ema && indicatorSeries.ema.length) {
      datasets.push({
        type: 'line',
        label: 'EMA (20)',
        data: indicatorSeries.ema.map((v, i) => ({ x: data[i].x, y: v })),
        borderColor: '#8b5cf6',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 2,
      });
    }

    if (overlays.bb && indicatorSeries.bb?.upper.length) {
      datasets.push(
        {
          type: 'line',
          label: 'BB Upper',
          data: indicatorSeries.bb.upper.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          order: 3,
        },
        {
          type: 'line',
          label: 'BB Lower',
          data: indicatorSeries.bb.lower.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: 'rgba(59, 130, 246, 0.5)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: '-1',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          order: 3,
        },
        {
          type: 'line',
          label: 'BB Middle',
          data: indicatorSeries.bb.middle.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0,
          order: 3,
        },
      );
    }

    const formatPrice = (num: number) => {
      if (num < 1) return num.toFixed(4);
      if (num < 10) return num.toFixed(3);
      return num.toFixed(2);
    };

    candleInstance.current = new Chart(ctx, {
      type: 'candlestick',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        events: [
          'mousemove',
          'mouseout',
          'click',
          'touchstart',
          'touchmove',
          'touchend',
          'mousedown',
          'mouseup',
        ],
        layout: { padding: { bottom: 24, left: 0, right: 0, top: 20 } },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              font: { size: 10 },
              color: '#d1d5db',
            },
          },
          tooltip: {
            enabled: drawTool === 'cursor',
            position: 'nearest',
            backgroundColor: '#111827',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#2a2a2a',
            borderWidth: 1,
            callbacks: {
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const candleX = data[idx].x;
                const pat = patterns.find((p) => p.x === candleX);

                if (pat && overlays.patterns) {
                  return `Pattern: ${pat.name}`;
                }

                return [];
              },
            },
          },
          zoom: {
            pan: {
              enabled: drawTool === 'cursor',
              mode: 'x',
              onPan: ({ chart }) => {
                handlePan(chart);
                syncZoom(chart);
              },
            },
            zoom: {
              wheel: { enabled: false },
              pinch: { enabled: true },
              mode: 'x',
              onZoom: ({ chart }) => syncZoom(chart),
            } as any,
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { tooltipFormat: 'MMM dd HH:mm' },
            min: xMin || undefined,
            max: xMax || undefined,
            grid: {
              color: 'rgba(255,255,255,0.06)',
              borderDash: [4, 4],
            } as any,
            ticks: { display: false, source: 'auto', color: '#9ca3af' },
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(255,255,255,0.06)',
              borderDash: [4, 4],
            } as any,
            ticks: {
              color: '#9ca3af',
              callback: (value) => formatPrice(value as number),
            },
            afterFit: (axis: any) => {
              axis.width = 65;
            },
          },
        },
      },
      plugins: customPlugins,
    });

    return () => {
      if (candleInstance.current) {
        candleInstance.current.destroy();
        candleInstance.current = null;
      }
    };
  }, [
    customPlugins,
    data,
    drawTool,
    indicatorSeries,
    interval,
    overlays,
    patterns,
    symbol,
    xMax,
    xMin,
  ]);

  useEffect(() => {
    if (!volumeRef.current || volumeData.length === 0) return;

    const ctx = volumeRef.current.getContext('2d');
    if (!ctx) return;

    if (volumeInstance.current) {
      volumeInstance.current.destroy();
      volumeInstance.current = null;
    }

    volumeInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: volumeData.map((d) => d.x),
        datasets: [
          {
            label: "Об'єм",
            data: volumeData.map((d) => d.y),
            backgroundColor: 'rgba(59, 130, 246, 0.45)',
            barThickness: 'flex',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        layout: { padding: 0 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#2a2a2a',
            borderWidth: 1,
          },
          zoom: {
            pan: {
              enabled: drawTool === 'cursor',
              mode: 'x',
              onPan: ({ chart }) => syncZoom(chart),
            },
            zoom: {
              enabled: true,
              mode: 'x',
              onZoom: ({ chart }) => syncZoom(chart),
            } as any,
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {},
            min: xMin || undefined,
            max: xMax || undefined,
            grid: { display: false },
            ticks: { color: '#9ca3af', source: 'auto' },
          },
          y: {
            position: 'right',
            grid: { display: false },
            ticks: {
              color: '#9ca3af',
              maxTicksLimit: 3,
              callback: (val) => formatVolume(val as number),
            },
            afterFit: (axis: any) => {
              axis.width = 65;
            },
          },
        },
      },
    });

    return () => {
      if (volumeInstance.current) {
        volumeInstance.current.destroy();
        volumeInstance.current = null;
      }
    };
  }, [drawTool, interval, volumeData, xMax, xMin]);

  useEffect(() => {
    if (isLoading || data.length === 0) return;

    const wsSymbol = symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${wsSymbol}usdt@kline_${interval}`;

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.e === 'kline') {
          const k = message.k;

          const candle: Candle = {
            x: k.t,
            o: parseFloat(k.o),
            h: parseFloat(k.h),
            l: parseFloat(k.l),
            c: parseFloat(k.c),
            v: parseFloat(k.v),
          };

          const volume: Volume = {
            x: k.t,
            y: parseFloat(k.v),
          };

          upsertData(candle, volume);
        }
      };
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [data.length, interval, isLoading, symbol]);

  const upsertData = (candle: Candle, volume: Volume) => {
    setData((prev) => {
      if (prev.length === 0) return [candle];

      const last = prev[prev.length - 1];
      if (last.x === candle.x) {
        const next = [...prev];
        next[next.length - 1] = candle;
        return next;
      }

      return [...prev, candle];
    });

    setVolumeData((prev) => {
      if (prev.length === 0) return [volume];

      const last = prev[prev.length - 1];
      if (last.x === volume.x) {
        const next = [...prev];
        next[next.length - 1] = volume;
        return next;
      }

      return [...prev, volume];
    });
  };

  useEffect(() => {
    onMarketDataChange?.({
      symbol,
      interval,
      candles: data,
      currentPrice: data.length > 0 ? data[data.length - 1].c : 0,
      isLoading,
      errorMsg,
    });
  }, [symbol, interval, data, isLoading, errorMsg, onMarketDataChange]);

  const scrollChart = (direction: -1 | 1) => {
    const chart = candleInstance.current;
    if (!chart) return;

    const { min, max } = chart.scales.x;
    const range = max - min;
    const step = range * 0.2;

    setXMin(min + step * direction);
    setXMax(max + step * direction);

    if (direction === -1) {
      handlePan(chart);
    }
  };

  const resetView = () => setInitialView(data);

  const formatVolume = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      style={{
        width: '100%',
        margin: '0 auto',
        padding: '16px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: 'transparent',
      }}
    >
      <ChartHeader
        symbol={symbol}
        setSymbol={handleSymbolChange}
        interval={interval}
        setInterval={setInterval}
        overlays={overlays}
        setOverlays={setOverlays}
        symbolsList={symbolsList}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DrawingToolbar
            drawTool={drawTool}
            setDrawTool={setDrawTool}
            setDrawings={setDrawings}
          />
        </div>

        <div
          style={{
            ...panelStyle,
            padding: 16,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 640,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #2a2a2a',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#f9fafb',
                }}
              >
                {symbol}{' '}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#9ca3af',
                  }}
                >
                  / USDT
                </span>
              </h2>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                Таймфрейм: {interval}
              </div>
            </div>

            <button
              onClick={resetView}
              style={{
                ...buttonSecondaryStyle,
                padding: '8px 12px',
              }}
            >
              Скинути
            </button>
          </div>

          {isLoading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(17,17,17,0.82)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '3px solid rgba(147,197,253,0.18)',
                  borderTopColor: '#60a5fa',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 12,
                }}
              />
              <span style={{ color: '#d1d5db', fontWeight: 600 }}>Завантаження...</span>
            </div>
          ) : null}

          {errorMsg && !isLoading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(17,17,17,0.9)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#f87171',
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Помилка: {errorMsg}
              </span>
              <button
                onClick={() => void fetchHistoricalData(interval)}
                style={buttonPrimaryStyle}
              >
                Спробувати знову
              </button>
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 20,
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                onClick={() => handleManualZoom('out')}
                style={{
                  ...withDisabled(buttonSecondaryStyle, false),
                  width: 34,
                  height: 34,
                  padding: 0,
                  borderRadius: 10,
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Зменшити масштаб"
              >
                -
              </button>
              <button
                onClick={() => handleManualZoom('in')}
                style={{
                  ...withDisabled(buttonSecondaryStyle, false),
                  width: 34,
                  height: 34,
                  padding: 0,
                  borderRadius: 10,
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Збільшити масштаб"
              >
                +
              </button>
            </div>

            <button
              onClick={() => scrollChart(-1)}
              style={{
                position: 'absolute',
                left: 8,
                top: '34%',
                zIndex: 20,
                width: 38,
                height: 38,
                borderRadius: 999,
                border: '1px solid #2a2a2a',
                background: 'rgba(23,23,23,0.92)',
                color: '#d1d5db',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                style={{ height: 20, width: 20 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() => scrollChart(1)}
              style={{
                position: 'absolute',
                right: 8,
                top: '34%',
                zIndex: 20,
                width: 38,
                height: 38,
                borderRadius: 999,
                border: '1px solid #2a2a2a',
                background: 'rgba(23,23,23,0.92)',
                color: '#d1d5db',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                style={{ height: 20, width: 20 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div
              style={{
                flexGrow: 1,
                position: 'relative',
                width: '100%',
                height: '75%',
                cursor: drawTool !== 'cursor' ? 'crosshair' : 'default',
              }}
            >
              <canvas ref={candleRef} />
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '25%',
                marginTop: 8,
                borderTop: '1px solid #2a2a2a',
                paddingTop: 8,
              }}
            >
              <canvas ref={volumeRef} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}