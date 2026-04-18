
export const calcMA = (candles: any[], period: number): number | null => {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.c, 0);
  return sum / period;
};

export const calcEMA = (candles: any[], period: number): number | null => {
  if (candles.length < period) return null;
  const closes = candles.map((c) => c.c);
  const k = 2 / (period + 1);
  
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * k + ema;
  }
  return ema;
};


export const calculateSeriesMA = (candles: any[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const closes = candles.map(c => c.c);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

export const calculateSeriesEMA = (candles: any[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const closes = candles.map(c => c.c);
  const k = 2 / (period + 1);

  let prevEma: number | null = null;

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (prevEma === null) {
      const slice = closes.slice(0, period);
      prevEma = slice.reduce((a, b) => a + b, 0) / period;
      result.push(prevEma);
    } else {
      const currentEma = (closes[i] - prevEma) * k + prevEma;
      result.push(currentEma);
      prevEma = currentEma;
    }
  }
  return result;
};

export const calculateBollingerBands = (candles: any[], period: number = 20, stdDevMultiplier: number = 2) => {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  const closes = candles.map(c => c.c);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    
    const squaredDiffs = slice.map(val => Math.pow(val - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(sma);
    upper.push(sma + stdDev * stdDevMultiplier);
    lower.push(sma - stdDev * stdDevMultiplier);
  }

  return { upper, middle, lower };
};


export const calcRSI = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period + 1) return null;
  const closes = candles.map((c) => c.c);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

export const calcStoch = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period) return null;
  const current = candles[candles.length - 1].c;
  const slice = candles.slice(-period);
  const low = Math.min(...slice.map((c) => c.l));
  const high = Math.max(...slice.map((c) => c.h));

  if (high === low) return 50;
  return ((current - low) / (high - low)) * 100;
};

export const calcStochRSI = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period * 2) return null;
  
  const closes = candles.map((c) => c.c);
  const rsiSeries: number[] = [];
  
  let gains = 0;
  let losses = 0;
  
  for(let i=1; i<=period; i++) {
      const diff = closes[i] - closes[i-1];
      if(diff>=0) gains+=diff; else losses-=diff;
  }
  let avgGain = gains/period;
  let avgLoss = losses/period;
  
  rsiSeries.push(avgLoss === 0 ? 100 : 100 - 100/(1+avgGain/avgLoss));

  for(let i=period+1; i<closes.length; i++) {
      const diff = closes[i] - closes[i-1];
      const g = diff > 0 ? diff : 0;
      const l = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period-1) + g)/period;
      avgLoss = (avgLoss * (period-1) + l)/period;
      rsiSeries.push(avgLoss === 0 ? 100 : 100 - 100/(1+avgGain/avgLoss));
  }

  if(rsiSeries.length < period) return null;

  const currentRSI = rsiSeries[rsiSeries.length - 1];
  const recentRSIs = rsiSeries.slice(-period);
  const minRSI = Math.min(...recentRSIs);
  const maxRSI = Math.max(...recentRSIs);

  if(maxRSI === minRSI) return 50;
  return ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
};

export const calcMACD = (candles: any[], fastPeriod: number = 12, slowPeriod: number = 26): number | null => {
  if (candles.length < slowPeriod) return null;
  const closes = candles.map((c) => c.c);

  let emaFast = closes.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  const kFast = 2 / (fastPeriod + 1);
  for (let i = fastPeriod; i < closes.length; i++) {
    emaFast = (closes[i] - emaFast) * kFast + emaFast;
  }

  let emaSlow = closes.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;
  const kSlow = 2 / (slowPeriod + 1);
  for (let i = slowPeriod; i < closes.length; i++) {
    emaSlow = (closes[i] - emaSlow) * kSlow + emaSlow;
  }

  return emaFast - emaSlow;
};

export const calcWilliamsR = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const currentClose = candles[candles.length - 1].c;
  const highestHigh = Math.max(...slice.map((c) => c.h));
  const lowestLow = Math.min(...slice.map((c) => c.l));

  if (highestHigh === lowestLow) return 0;
  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
};

export const calcCCI = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period) return null;
  
  const tps = candles.map(c => (c.h + c.l + c.c) / 3);
  
  const slicedTP = tps.slice(-period);
  const smaTP = slicedTP.reduce((a, b) => a + b, 0) / period;
  
  const meanDev = slicedTP.reduce((acc, val) => acc + Math.abs(val - smaTP), 0) / period;
  
  const currentTP = tps[tps.length - 1];
  
  if (meanDev === 0) return 0;
  return (currentTP - smaTP) / (0.015 * meanDev);
};

export const calcATR = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period + 1) return null;
  
  let trs: number[] = [];
  for(let i = 1; i < candles.length; i++) {
      const h = candles[i].h;
      const l = candles[i].l;
      const cp = candles[i-1].c;
      const tr = Math.max(h - l, Math.abs(h - cp), Math.abs(l - cp));
      trs.push(tr);
  }
  
  let atr = trs.slice(0, period).reduce((a,b)=>a+b, 0) / period;
  
  for(let i = period; i < trs.length; i++) {
      atr = (atr * (period - 1) + trs[i]) / period;
  }
  
  return atr;
};

export const calcROC = (candles: any[], period: number = 12): number | null => {
  if (candles.length < period + 1) return null;
  const current = candles[candles.length - 1].c;
  const prev = candles[candles.length - 1 - period].c;
  if(prev === 0) return 0;
  return ((current - prev) / prev) * 100;
};

export const calcADX = (candles: any[], period: number = 14): number | null => {
  if (candles.length < period * 2) return null;

  let tr = 0;
  let plusDm = 0;
  let minusDm = 0;

  let trs: number[] = [];
  let plusDms: number[] = [];
  let minusDms: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const highDiff = curr.h - prev.h;
    const lowDiff = prev.l - curr.l;

    const currentTR = Math.max(
      curr.h - curr.l,
      Math.abs(curr.h - prev.c),
      Math.abs(curr.l - prev.c)
    );
    
    let currentPlusDm = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
    let currentMinusDm = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;

    trs.push(currentTR);
    plusDms.push(currentPlusDm);
    minusDms.push(currentMinusDm);
  }

  let smoothTR = trs.slice(0, period).reduce((a,b)=>a+b, 0);
  let smoothPlusDm = plusDms.slice(0, period).reduce((a,b)=>a+b, 0);
  let smoothMinusDm = minusDms.slice(0, period).reduce((a,b)=>a+b, 0);

  let dxs: number[] = [];

  const smooth = (prev: number, curr: number) => prev - (prev/period) + curr;

  for (let i = period; i < trs.length; i++) {
    smoothTR = smooth(smoothTR, trs[i]);
    smoothPlusDm = smooth(smoothPlusDm, plusDms[i]);
    smoothMinusDm = smooth(smoothMinusDm, minusDms[i]);

    const diPlus = (smoothPlusDm / smoothTR) * 100;
    const diMinus = (smoothMinusDm / smoothTR) * 100;
    const dx = (Math.abs(diPlus - diMinus) / (diPlus + diMinus)) * 100;
    dxs.push(dx);
  }

  if (dxs.length < period) return null;

  const finalDXs = dxs.slice(-period);
  const adx = finalDXs.reduce((a,b)=>a+b, 0) / period;

  return adx;
};

export interface PatternResult {
  x: number;
  label: string;
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
}

export const detectCandlePatterns = (candles: any[]): PatternResult[] => {
    const results: PatternResult[] = [];
    if (candles.length < 3) return results;

    for (let i = 2; i < candles.length; i++) {
        const curr = candles[i];
        const prev = candles[i-1];
        
        const isGreen = curr.c > curr.o;
        const isRed = curr.c < curr.o;
        const prevRed = prev.c < prev.o;
        const prevGreen = prev.c > prev.o;
        
        const body = Math.abs(curr.c - curr.o);
        const upperWick = curr.h - Math.max(curr.c, curr.o);
        const lowerWick = Math.min(curr.c, curr.o) - curr.l;
        const totalLen = curr.h - curr.l;

        if (prevRed && isGreen && curr.c > prev.o && curr.o < prev.c) {
             results.push({ x: curr.x, label: 'E', name: 'Bullish Engulfing', type: 'bullish' });
        } 
        else if (prevGreen && isRed && curr.c < prev.o && curr.o > prev.c) {
             results.push({ x: curr.x, label: 'E', name: 'Bearish Engulfing', type: 'bearish' });
        }
        else if (lowerWick > 2 * body && upperWick < body * 0.5 && lowerWick > 0.3 * totalLen) {
             results.push({ x: curr.x, label: 'H', name: 'Hammer', type: 'bullish' });
        }
        else if (upperWick > 2 * body && lowerWick < body * 0.5 && upperWick > 0.3 * totalLen) {
             results.push({ x: curr.x, label: 'S', name: 'Shooting Star', type: 'bearish' });
        }
        else if (body < totalLen * 0.1 && totalLen > 0) {
            results.push({ x: curr.x, label: 'D', name: 'Doji', type: 'neutral' });
        }
    }
    return results;
};
