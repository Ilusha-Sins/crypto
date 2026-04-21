import React, { useMemo, useState } from "react";
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
} from "./indicators";
import Gauge from "./Gauge";

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

  const fmt = (v: number | null) => (v === null ? "—" : v.toFixed(2));

  const fmtPrice = (v: number | null) => {
    if (v === null || v === undefined) return "—";
    if (v < 1) return v.toFixed(4);
    if (v < 10) return v.toFixed(3);
    return v.toFixed(2);
  };

  const indicators = [
    {
      name: "RSI(14)",
      value: fmt(rsiVal),
      action:
        rsiVal === null
          ? "Немає даних"
          : rsiVal > 70
            ? "Перекупленість"
            : rsiVal < 30
              ? "Перепроданість"
              : "Нейтрально",
    },
    {
      name: "STOCH(9,6)",
      value: fmt(stochVal),
      action:
        stochVal === null
          ? "Немає даних"
          : stochVal > 80
            ? "Перекупленість"
            : stochVal < 20
              ? "Перепроданість"
              : "Нейтрально",
    },
    {
      name: "STOCHRSI(14)",
      value: fmt(stochRsiVal),
      action:
        stochRsiVal === null
          ? "Немає даних"
          : stochRsiVal > 80
            ? "Перекупленість"
            : stochRsiVal < 20
              ? "Перепроданість"
              : "Нейтрально",
    },
    {
      name: "MACD(12,26)",
      value: fmt(macdVal),
      action:
        macdVal === null ? "Немає даних" : macdVal > 0 ? "Купувати" : "Продавати",
    },
    {
      name: "ADX(14)",
      value: fmt(adxVal),
      action:
        adxVal === null ? "Немає даних" : adxVal > 25 ? "Тренд" : "Немає тренду",
    },
    {
      name: "Williams %R",
      value: fmt(willrVal),
      action:
        willrVal === null
          ? "Немає даних"
          : willrVal > -20
            ? "Перекупленість"
            : willrVal < -80
              ? "Перепроданість"
              : "Нейтрально",
    },
    {
      name: "CCI(14)",
      value: fmt(cciVal),
      action:
        cciVal === null
          ? "Немає даних"
          : cciVal > 100
            ? "Перекупленість"
            : cciVal < -100
              ? "Перепроданість"
              : "Нейтрально",
    },
    {
      name: "ATR(14)",
      value: fmt(atrVal),
      action: atrVal === null ? "Немає даних" : "Волатильність",
    },
    {
      name: "ROC(12)",
      value: fmt(rocVal),
      action:
        rocVal === null ? "Немає даних" : rocVal > 0 ? "Купувати" : "Продавати",
    },
  ];

  const periods = [5, 10, 20, 50, 100, 200];
  const maRows = periods.map((p) => {
    const sma = calcMA(candles, p);
    const ema = calcEMA(candles, p);

    let action = "—";
    if (sma !== null) {
      action = lastClose > sma ? "Купувати" : "Продавати";
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
    name: "Classic",
    pivot: pp,
    r1: 2 * pp - l,
    r2: pp + range,
    r3: h + 2 * (pp - l),
    s1: 2 * pp - h,
    s2: pp - range,
    s3: l - 2 * (h - pp),
  };

  const fib = {
    name: "Fibonacci",
    pivot: pp,
    r1: pp + range * 0.382,
    r2: pp + range * 0.618,
    r3: pp + range * 1.0,
    s1: pp - range * 0.382,
    s2: pp - range * 0.618,
    s3: pp - range * 1.0,
  };

  const camarilla = {
    name: "Camarilla",
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

    items.forEach((i) => {
      const act = i.action.toLowerCase();
      if (act.includes("куп") || act.includes("перепроданість")) buy++;
      else if (act.includes("продав") || act.includes("перекупленість")) sell++;
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
    totalBuy > totalSell ? "Купувати" : totalSell > totalBuy ? "Продавати" : "Нейтрально";

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

export default function TechnicalAnalysis({
  candles = [],
  symbol = "BTC",
  interval = "1h",
}: TechnicalAnalysisProps) {
  const [showDetails, setShowDetails] = useState(false);

  const analysis = useMemo(() => calculateAnalysis(candles), [candles]);

  if (!analysis) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500"
      >
        {candles.length === 0
          ? "Очікування даних..."
          : "Недостатньо даних для розрахунку (потрібно > 50 свічок)"}
      </div>
    );
  }

  const { indicators, maRows, pivots, scores, summary } = analysis;

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Технічний аналіз {symbol}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Інтервал: {interval} • Локальні індикатори
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Gauge value={scores.total} label="Загальний підсумок" />
        <Gauge value={scores.oscillators} label="Осцилятори" />
        <Gauge value={scores.movingAverages} label="Ковзні середні" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
          <div className="text-sm text-gray-500 mb-2">Summary</div>
          <div className="text-lg font-bold text-gray-800 mb-2">{summary.action}</div>
          <div className="text-sm text-gray-600">Buy: {summary.buy}</div>
          <div className="text-sm text-gray-600">Sell: {summary.sell}</div>
          <div className="text-sm text-gray-600">Neutral: {summary.neutral}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex justify-between items-center p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="font-semibold text-gray-700">Детальні дані індикаторів</span>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${
              showDetails ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-8">
              <div className="flex-1 min-w-[300px]">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">Осцилятори</h4>
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                    <tr>
                      <th className="py-2">Назва</th>
                      <th className="py-2 text-right">Значення</th>
                      <th className="py-2 text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.map((row) => (
                      <tr key={row.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-700">{row.name}</td>
                        <td className="py-3 text-right font-mono">{row.value}</td>
                        <td
                          className={`py-3 text-right font-medium ${
                            row.action.includes("Куп") || row.action.includes("Перепроданість")
                              ? "text-green-600"
                              : row.action.includes("Продав") || row.action.includes("Перекупленість")
                                ? "text-red-600"
                                : "text-gray-400"
                          }`}
                        >
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-1 min-w-[300px]">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">Ковзні середні</h4>
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                    <tr>
                      <th className="py-2">Період</th>
                      <th className="py-2 text-right">Simple</th>
                      <th className="py-2 text-right">Exponential</th>
                      <th className="py-2 text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maRows.map((row) => (
                      <tr key={row.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-700">{row.name}</td>
                        <td className="py-3 text-right font-mono">{row.simple}</td>
                        <td className="py-3 text-right font-mono">{row.exp}</td>
                        <td
                          className={`py-3 text-right font-medium ${
                            row.action === "Купувати"
                              ? "text-green-600"
                              : row.action === "Продавати"
                                ? "text-red-600"
                                : "text-gray-400"
                          }`}
                        >
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">Точки розвороту (Pivots)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center text-gray-600 border-collapse">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left">Тип</th>
                      <th className="px-3 py-3">S3</th>
                      <th className="px-3 py-3">S2</th>
                      <th className="px-3 py-3">S1</th>
                      <th className="px-3 py-3 text-blue-600 font-bold">P</th>
                      <th className="px-3 py-3">R1</th>
                      <th className="px-3 py-3">R2</th>
                      <th className="px-3 py-3">R3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivots.map((p) => (
                      <tr key={p.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-left font-medium text-gray-800">{p.name}</td>
                        <td className="px-3 py-3 font-mono">{p.S3}</td>
                        <td className="px-3 py-3 font-mono">{p.S2}</td>
                        <td className="px-3 py-3 font-mono">{p.S1}</td>
                        <td className="px-3 py-3 font-mono font-bold text-blue-600 bg-blue-50/50">
                          {p.pivot}
                        </td>
                        <td className="px-3 py-3 font-mono">{p.R1}</td>
                        <td className="px-3 py-3 font-mono">{p.R2}</td>
                        <td className="px-3 py-3 font-mono">{p.R3}</td>
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