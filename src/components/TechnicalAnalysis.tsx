import { useMemo, useState } from 'react';
import {
  calcRSI,
  calcMA,
  calcEMA,
  calcATR,
  calcCCI,
  calcWilliamsR,
  calcROC,
  calcADX,
  calcMACD,
  calcStoch,
  calcStochRSI,
} from './indicators';
import Gauge from './Gauge';
import { cardStyle, panelPaddedStyle, subtleTextStyle } from '../styles/ui';

interface AnalysisResult {
  indicators: Array<{ name: string; value: string; action: string }>;
  maRows: Array<{ name: string; simple: string; exp: string; action: string }>;
  pivots: Array<any>;
  summary: { buy: number; sell: number; neutral: number; action: string };
  scores: {
    oscillators: number;
    movingAverages: number;
    total: number;
  };
}

function calculateAnalysis(candles: any[]): AnalysisResult | null {
  if (!candles || candles.length < 50) return null;

  const lastClose = candles[candles.length - 1].c;

  const rsiVal = calcRSI(candles, 14);
  const stochVal = calcStoch(candles, 9);
  const stochRsiVal = calcStochRSI(candles, 14);
  const macdVal = calcMACD(candles, 12, 26);
  const adxVal = calcADX(candles, 14);
  const willrVal = calcWilliamsR(candles, 14);
  const cciVal = calcCCI(candles, 14);
  const atrVal = calcATR(candles, 14);
  const rocVal = calcROC(candles, 12);

  const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(2));

  const fmtPrice = (v: number | null) => {
    if (v === null || v === undefined) return '—';
    if (v < 1) return v.toFixed(4);
    if (v < 10) return v.toFixed(3);
    return v.toFixed(2);
  };

  const indicators = [
    {
      name: 'RSI(14)',
      value: fmt(rsiVal),
      action:
        rsiVal === null
          ? 'Немає даних'
          : rsiVal > 70
            ? 'Перекупленість'
            : rsiVal < 30
              ? 'Перепроданість'
              : 'Нейтрально',
    },
    {
      name: 'STOCH(9,6)',
      value: fmt(stochVal),
      action:
        stochVal === null
          ? 'Немає даних'
          : stochVal > 80
            ? 'Перекупленість'
            : stochVal < 20
              ? 'Перепроданість'
              : 'Нейтрально',
    },
    {
      name: 'STOCHRSI(14)',
      value: fmt(stochRsiVal),
      action:
        stochRsiVal === null
          ? 'Немає даних'
          : stochRsiVal > 80
            ? 'Перекупленість'
            : stochRsiVal < 20
              ? 'Перепроданість'
              : 'Нейтрально',
    },
    {
      name: 'MACD(12,26)',
      value: fmt(macdVal),
      action:
        macdVal === null ? 'Немає даних' : macdVal > 0 ? 'Купувати' : 'Продавати',
    },
    {
      name: 'ADX(14)',
      value: fmt(adxVal),
      action:
        adxVal === null ? 'Немає даних' : adxVal > 25 ? 'Тренд' : 'Немає тренду',
    },
    {
      name: 'Williams %R',
      value: fmt(willrVal),
      action:
        willrVal === null
          ? 'Немає даних'
          : willrVal > -20
            ? 'Перекупленість'
            : willrVal < -80
              ? 'Перепроданість'
              : 'Нейтрально',
    },
    {
      name: 'CCI(14)',
      value: fmt(cciVal),
      action:
        cciVal === null
          ? 'Немає даних'
          : cciVal > 100
            ? 'Перекупленість'
            : cciVal < -100
              ? 'Перепроданість'
              : 'Нейтрально',
    },
    {
      name: 'ATR(14)',
      value: fmt(atrVal),
      action: atrVal === null ? 'Немає даних' : 'Волатильність',
    },
    {
      name: 'ROC(12)',
      value: fmt(rocVal),
      action:
        rocVal === null ? 'Немає даних' : rocVal > 0 ? 'Купувати' : 'Продавати',
    },
  ];

  const periods = [5, 10, 20, 50, 100, 200];
  const maRows = periods.map((p) => {
    const sma = calcMA(candles, p);
    const ema = calcEMA(candles, p);

    let action = '—';
    if (sma !== null) {
      action = lastClose > sma ? 'Купувати' : 'Продавати';
    }

    return {
      name: `MA${p}`,
      simple: fmtPrice(sma),
      exp: fmtPrice(ema),
      action,
    };
  });

  const lastCandle = candles[candles.length - 1];
  const { h, l, c, o } = lastCandle;
  const pp = (h + l + c) / 3;
  const range = h - l;

  const classic = {
    name: 'Classic',
    pivot: pp,
    r1: 2 * pp - l,
    r2: pp + range,
    r3: h + 2 * (pp - l),
    s1: 2 * pp - h,
    s2: pp - range,
    s3: l - 2 * (h - pp),
  };

  const fib = {
    name: 'Fibonacci',
    pivot: pp,
    r1: pp + range * 0.382,
    r2: pp + range * 0.618,
    r3: pp + range * 1.0,
    s1: pp - range * 0.382,
    s2: pp - range * 0.618,
    s3: pp - range * 1.0,
  };

  const camarilla = {
    name: 'Camarilla',
    pivot: pp,
    r1: c + (range * 1.1) / 12,
    r2: c + (range * 1.1) / 6,
    r3: c + (range * 1.1) / 4,
    s1: c - (range * 1.1) / 12,
    s2: c - (range * 1.1) / 6,
    s3: c - (range * 1.1) / 4,
  };

  const ppWoodie = (h + l + 2 * c) / 4;
  const woodie = {
    name: "Woodie's",
    pivot: ppWoodie,
    r1: 2 * ppWoodie - l,
    r2: ppWoodie + range,
    r3: null,
    s1: 2 * ppWoodie - h,
    s2: ppWoodie - range,
    s3: null,
  };

  let xVal = 0;
  if (c < o) xVal = h + 2 * l + c;
  else if (c > o) xVal = 2 * h + l + c;
  else xVal = h + l + 2 * c;

  const demark = {
    name: "DeMark's",
    pivot: xVal / 4,
    r1: xVal / 2 - l,
    s1: xVal / 2 - h,
    r2: null,
    s2: null,
    r3: null,
    s3: null,
  };

  const formatPivotRow = (pObj: any) => ({
    name: pObj.name,
    S3: fmtPrice(pObj.s3),
    S2: fmtPrice(pObj.s2),
    S1: fmtPrice(pObj.s1),
    pivot: fmtPrice(pObj.pivot),
    R1: fmtPrice(pObj.r1),
    R2: fmtPrice(pObj.r2),
    R3: fmtPrice(pObj.r3),
  });

  const pivots = [
    formatPivotRow(classic),
    formatPivotRow(fib),
    formatPivotRow(camarilla),
    formatPivotRow(woodie),
    formatPivotRow(demark),
  ];

  const countSignals = (items: Array<{ action: string }>) => {
    let buy = 0;
    let sell = 0;
    let neutral = 0;

    items.forEach((item) => {
      const act = item.action.toLowerCase();
      if (act.includes('куп') || act.includes('перепроданість')) buy++;
      else if (act.includes('продав') || act.includes('перекупленість')) sell++;
      else neutral++;
    });

    return { buy, sell, neutral, total: buy + sell + neutral };
  };

  const oscStats = countSignals(indicators);
  const maStats = countSignals(maRows);

  const totalBuy = oscStats.buy + maStats.buy;
  const totalSell = oscStats.sell + maStats.sell;
  const totalNeutral = oscStats.neutral + maStats.neutral;
  const totalCount = oscStats.total + maStats.total;

  const summaryAction =
    totalBuy > totalSell
      ? 'Купувати'
      : totalSell > totalBuy
        ? 'Продавати'
        : 'Нейтрально';

  const calcScore = (b: number, s: number, t: number) => {
    if (t === 0) return 0;
    return (b - s) / t;
  };

  return {
    indicators,
    maRows,
    pivots,
    summary: {
      buy: totalBuy,
      sell: totalSell,
      neutral: totalNeutral,
      action: summaryAction,
    },
    scores: {
      oscillators: calcScore(oscStats.buy, oscStats.sell, oscStats.total),
      movingAverages: calcScore(maStats.buy, maStats.sell, maStats.total),
      total: calcScore(totalBuy, totalSell, totalCount),
    },
  };
}

interface TechnicalAnalysisProps {
  candles: any[];
  symbol: string;
  interval: string;
}

function actionColor(action: string) {
  if (
    action.includes('Куп') ||
    action.includes('Перепроданість') ||
    action.includes('куп')
  ) {
    return '#51cf66';
  }

  if (
    action.includes('Продав') ||
    action.includes('Перекупленість') ||
    action.includes('продав')
  ) {
    return '#ff6b6b';
  }

  return '#9ca3af';
}

export default function TechnicalAnalysis({
  candles = [],
  symbol = 'BTC',
  interval = '1h',
}: TechnicalAnalysisProps) {
  const [showDetails, setShowDetails] = useState(false);

  const analysis = useMemo(() => calculateAnalysis(candles), [candles]);

  if (!analysis) {
    return (
      <div
        style={{
          ...panelPaddedStyle,
          textAlign: 'center',
          color: '#9ca3af',
        }}
      >
        {candles.length === 0
          ? 'Очікування даних...'
          : 'Недостатньо даних для розрахунку (потрібно > 50 свічок)'}
      </div>
    );
  }

  const { indicators, maRows, pivots, scores, summary } = analysis;

  return (
    <div style={{ width: '100%', display: 'grid', gap: 16 }}>
      <div style={panelPaddedStyle}>
        <h3 style={{ margin: 0, fontSize: 22 }}>Technical Analysis {symbol}</h3>
        <p style={{ margin: '8px 0 0 0', ...subtleTextStyle }}>
          Interval: {interval} · Local indicators only
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <Gauge value={scores.total} label="Загальний підсумок" />
        <Gauge value={scores.oscillators} label="Осцилятори" />
        <Gauge value={scores.movingAverages} label="Ковзні середні" />

        <div
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ ...subtleTextStyle, marginBottom: 8 }}>Summary</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {summary.action}
          </div>
          <div style={{ color: '#d1d5db' }}>Buy: {summary.buy}</div>
          <div style={{ color: '#d1d5db' }}>Sell: {summary.sell}</div>
          <div style={{ color: '#d1d5db' }}>Neutral: {summary.neutral}</div>
        </div>
      </div>

      <div
        style={{
          ...panelPaddedStyle,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            background: '#171717',
            color: '#fff',
            border: 'none',
            borderBottom: showDetails ? '1px solid #2a2a2a' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 700,
          }}
        >
          <span>Детальні дані індикаторів</span>
          <span
            style={{
              transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: '#9ca3af',
            }}
          >
            ▼
          </span>
        </button>

        {showDetails && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <h4 style={{ marginTop: 0, marginBottom: 16 }}>Осцилятори</h4>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                    color: '#d1d5db',
                  }}
                >
                  <thead style={{ borderBottom: '1px solid #2a2a2a', color: '#9ca3af' }}>
                    <tr>
                      <th style={{ padding: '10px 0', textAlign: 'left' }}>Назва</th>
                      <th style={{ padding: '10px 0', textAlign: 'right' }}>Значення</th>
                      <th style={{ padding: '10px 0', textAlign: 'right' }}>Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.map((row) => (
                      <tr key={row.name} style={{ borderBottom: '1px solid #202020' }}>
                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{row.name}</td>
                        <td
                          style={{
                            padding: '12px 0',
                            textAlign: 'right',
                            fontFamily:
                              'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
                          }}
                        >
                          {row.value}
                        </td>
                        <td
                          style={{
                            padding: '12px 0',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: actionColor(row.action),
                          }}
                        >
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ flex: 1, minWidth: 320 }}>
                <h4 style={{ marginTop: 0, marginBottom: 16 }}>Ковзні середні</h4>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                    color: '#d1d5db',
                  }}
                >
                  <thead style={{ borderBottom: '1px solid #2a2a2a', color: '#9ca3af' }}>
                    <tr>
                      <th style={{ padding: '10px 0', textAlign: 'left' }}>Період</th>
                      <th style={{ padding: '10px 0', textAlign: 'right' }}>Simple</th>
                      <th style={{ padding: '10px 0', textAlign: 'right' }}>
                        Exponential
                      </th>
                      <th style={{ padding: '10px 0', textAlign: 'right' }}>Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maRows.map((row) => (
                      <tr key={row.name} style={{ borderBottom: '1px solid #202020' }}>
                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{row.name}</td>
                        <td
                          style={{
                            padding: '12px 0',
                            textAlign: 'right',
                            fontFamily:
                              'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
                          }}
                        >
                          {row.simple}
                        </td>
                        <td
                          style={{
                            padding: '12px 0',
                            textAlign: 'right',
                            fontFamily:
                              'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
                          }}
                        >
                          {row.exp}
                        </td>
                        <td
                          style={{
                            padding: '12px 0',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: actionColor(row.action),
                          }}
                        >
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <h4 style={{ marginBottom: 16 }}>Точки розвороту (Pivots)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                    color: '#d1d5db',
                  }}
                >
                  <thead
                    style={{
                      background: '#171717',
                      color: '#9ca3af',
                      borderBottom: '1px solid #2a2a2a',
                    }}
                  >
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Тип</th>
                      <th style={{ padding: '12px 10px' }}>S3</th>
                      <th style={{ padding: '12px 10px' }}>S2</th>
                      <th style={{ padding: '12px 10px' }}>S1</th>
                      <th style={{ padding: '12px 10px', color: '#93c5fd' }}>P</th>
                      <th style={{ padding: '12px 10px' }}>R1</th>
                      <th style={{ padding: '12px 10px' }}>R2</th>
                      <th style={{ padding: '12px 10px' }}>R3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivots.map((pivot) => (
                      <tr key={pivot.name} style={{ borderBottom: '1px solid #202020' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                          {pivot.name}
                        </td>
                        <td style={{ padding: '12px 10px' }}>{pivot.S3}</td>
                        <td style={{ padding: '12px 10px' }}>{pivot.S2}</td>
                        <td style={{ padding: '12px 10px' }}>{pivot.S1}</td>
                        <td
                          style={{
                            padding: '12px 10px',
                            fontWeight: 800,
                            color: '#93c5fd',
                            background: 'rgba(37, 99, 235, 0.08)',
                          }}
                        >
                          {pivot.pivot}
                        </td>
                        <td style={{ padding: '12px 10px' }}>{pivot.R1}</td>
                        <td style={{ padding: '12px 10px' }}>{pivot.R2}</td>
                        <td style={{ padding: '12px 10px' }}>{pivot.R3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}