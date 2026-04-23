import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import axios from "axios";
import { getMarketKlines, getMarketSymbols } from "../api/market.api";

import {
  detectCandlePatterns,
  calculateSeriesMA,
  calculateSeriesEMA,
  calculateBollingerBands,
} from "./indicators";
import { Candle, Volume, DrawingObject } from "../types";
import ChartHeader from "./ChartHeader";
import DrawingToolbar from "./DrawingToolbar";
import { useChartPlugins } from "../hooks/useChartPlugins";

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
  if (intv.endsWith("m")) return num * 60 * 1000;
  if (intv.endsWith("h")) return num * 60 * 60 * 1000;
  if (intv.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  if (intv.endsWith("w")) return num * 7 * 24 * 60 * 60 * 1000;
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
  const [interval, setInterval] = useState("1m");
  const [symbol, setSymbol] = useState(selectedSymbol ?? "BTC");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [symbolsList, setSymbolsList] = useState<string[]>([]);

  const [overlays, setOverlays] = useState({
    sma: false,
    ema: false,
    bb: false,
    patterns: true,
  });

  const [drawTool, setDrawTool] = useState<"cursor" | "line" | "rect" | "text" | "fib">(
    "cursor",
  );
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
      setSymbolsList(["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE"]);
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
        setErrorMsg("Дані для цієї пари відсутні.");
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
    console.error("Помилка завантаження даних:", err);
    if (!endTime) {
      setErrorMsg("Помилка завантаження market data з backend.");
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
        candleInstance.current.update("none");
      }

      if (volumeInstance.current?.options.scales?.x) {
        volumeInstance.current.options.scales.x.min = xMin;
        volumeInstance.current.options.scales.x.max = xMax;
        volumeInstance.current.update("none");
      }
    }
  }, [xMin, xMax]);

  const handlePan = (chart: Chart) => {
    if (loadingOlder.current || drawTool !== "cursor") return;

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

  const handleManualZoom = (direction: "in" | "out") => {
    if (xMin === null || xMax === null) return;

    const currentRange = xMax - xMin;
    const center = xMin + currentRange / 2;
    const intervalMs = getIntervalMs(interval);
    const factor = direction === "in" ? 0.8 : 1.25;

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

    const ctx = candleRef.current.getContext("2d");
    if (!ctx) return;

    if (candleInstance.current) {
      candleInstance.current.destroy();
      candleInstance.current = null;
    }

    const datasets: any[] = [
      {
        type: "candlestick",
        label: `${symbol}/USDT`,
        data: data as any,
        color: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
        borderColor: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
        order: 1,
      },
    ];

    if (overlays.sma && indicatorSeries.sma.length) {
      datasets.push({
        type: "line",
        label: "SMA (20)",
        data: indicatorSeries.sma.map((v, i) => ({ x: data[i].x, y: v })),
        borderColor: "#fbbf24",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 2,
      });
    }

    if (overlays.ema && indicatorSeries.ema.length) {
      datasets.push({
        type: "line",
        label: "EMA (20)",
        data: indicatorSeries.ema.map((v, i) => ({ x: data[i].x, y: v })),
        borderColor: "#8b5cf6",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 2,
      });
    }

    if (overlays.bb && indicatorSeries.bb?.upper.length) {
      datasets.push(
        {
          type: "line",
          label: "BB Upper",
          data: indicatorSeries.bb.upper.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: "rgba(59, 130, 246, 0.5)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          order: 3,
        },
        {
          type: "line",
          label: "BB Lower",
          data: indicatorSeries.bb.lower.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: "rgba(59, 130, 246, 0.5)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: "-1",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          order: 3,
        },
        {
          type: "line",
          label: "BB Middle",
          data: indicatorSeries.bb.middle.map((v, i) => ({ x: data[i].x, y: v })),
          borderColor: "rgba(59, 130, 246, 0.8)",
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
      type: "candlestick",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        events: [
          "mousemove",
          "mouseout",
          "click",
          "touchstart",
          "touchmove",
          "touchend",
          "mousedown",
          "mouseup",
        ],
        layout: { padding: { bottom: 24, left: 0, right: 0, top: 20 } },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: { boxWidth: 12, font: { size: 10 } },
          },
          tooltip: {
            enabled: drawTool === "cursor",
            position: "nearest",
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
              enabled: drawTool === "cursor",
              mode: "x",
              onPan: ({ chart }) => {
                handlePan(chart);
                syncZoom(chart);
              },
            },
            zoom: {
              wheel: { enabled: false },
              pinch: { enabled: true },
              mode: "x",
              onZoom: ({ chart }) => syncZoom(chart),
            } as any,
          },
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "MMM dd HH:mm" },
            min: xMin || undefined,
            max: xMax || undefined,
            grid: {
              color: "#f3f4f6",
              borderDash: [4, 4],
            } as any,
            ticks: { display: false, source: "auto" },
          },
          y: {
            position: "right",
            grid: {
              color: "#f3f4f6",
              borderDash: [4, 4],
            } as any,
            ticks: {
              color: "#4b5563",
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

    const ctx = volumeRef.current.getContext("2d");
    if (!ctx) return;

    if (volumeInstance.current) {
      volumeInstance.current.destroy();
      volumeInstance.current = null;
    }

    volumeInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: volumeData.map((d) => d.x),
        datasets: [
          {
            label: "Об'єм",
            data: volumeData.map((d) => d.y),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            barThickness: "flex",
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
          zoom: {
            pan: {
              enabled: drawTool === "cursor",
              mode: "x",
              onPan: ({ chart }) => syncZoom(chart),
            },
            zoom: {
              enabled: true,
              mode: "x",
              onZoom: ({ chart }) => syncZoom(chart),
            } as any,
          },
        },
        scales: {
          x: {
            type: "time",
            time: {},
            min: xMin || undefined,
            max: xMax || undefined,
            grid: { display: false },
            ticks: { color: "#4b5563", source: "auto" },
          },
          y: {
            position: "right",
            grid: { display: false },
            ticks: {
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

        if (message.e === "kline") {
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
    } catch (e) {
      console.error(e);
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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col">
      <ChartHeader
        symbol={symbol}
        setSymbol={handleSymbolChange}
        interval={interval}
        setInterval={setInterval}
        overlays={overlays}
        setOverlays={setOverlays}
        symbolsList={symbolsList}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[60px_1fr] gap-6">
        <div className="flex justify-center">
          <DrawingToolbar
            drawTool={drawTool}
            setDrawTool={setDrawTool}
            setDrawings={setDrawings}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative flex flex-col min-h-[600px]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {symbol} <span className="text-sm font-normal text-gray-500">/ USDT</span>
              </h2>
              <div className="text-sm text-gray-400">Таймфрейм: {interval}</div>
            </div>

            <button
              onClick={resetView}
              className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-lg transition-colors"
            >
              Скинути
            </button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3" />
              <span className="text-gray-500 font-medium">Завантаження...</span>
            </div>
          )}

          {errorMsg && !isLoading && (
            <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-xl">
              <span className="text-red-500 text-lg font-semibold mb-2">
                Помилка: {errorMsg}
              </span>
              <button
                onClick={() => void fetchHistoricalData(interval)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Спробувати знову
              </button>
            </div>
          )}

          <div className="flex flex-col flex-1 relative group">
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button
                onClick={() => handleManualZoom("out")}
                className="flex items-center justify-center w-8 h-8 bg-white/90 shadow-sm border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-lg"
                title="Зменшити масштаб"
              >
                -
              </button>
              <button
                onClick={() => handleManualZoom("in")}
                className="flex items-center justify-center w-8 h-8 bg-white/90 shadow-sm border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-lg"
                title="Збільшити масштаб"
              >
                +
              </button>
            </div>

            <button
              onClick={() => scrollChart(-1)}
              className="absolute left-2 top-1/3 z-20 p-2 bg-white/80 shadow-md border border-gray-100 rounded-full text-gray-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="absolute right-2 top-1/3 z-20 p-2 bg-white/80 shadow-md border border-gray-100 rounded-full text-gray-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div
              className={`flex-grow relative w-full h-[75%] ${
                drawTool !== "cursor" ? "cursor-crosshair" : "cursor-default"
              }`}
            >
              <canvas ref={candleRef} />
            </div>

            <div className="relative w-full h-[25%] mt-1 border-t border-gray-100 pt-2">
              <canvas ref={volumeRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}