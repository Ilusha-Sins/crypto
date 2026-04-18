import axios from "axios";
import { Candle, Volume } from "../types";

const BASE_URL = "https://api.binance.com/api/v3";

export const fetchExchangeInfo = async (): Promise<string[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/exchangeInfo`);
    return res.data.symbols
      .filter((s: any) => s.quoteAsset === "USDT" && s.status === "TRADING")
      .map((s: any) => s.baseAsset)
      .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
      .sort();
  } catch (err) {
    console.error("Failed to fetch symbols", err);
    return ["BTC", "ETH", "BNB", "SOL", "XRP"];
  }
};

export const fetchKlines = async (symbol: string, interval: string, limit = 500, endTime?: number) => {
  const params: any = {
    symbol: symbol + "USDT",
    interval: interval,
    limit,
  };
  if (endTime) params.endTime = endTime;

  const response = await axios.get(`${BASE_URL}/klines`, { params });
  
  if (!response.data || !Array.isArray(response.data)) {
    throw new Error("Invalid data received");
  }

  const candles: Candle[] = response.data.map((d: any) => ({
    x: d[0],
    o: parseFloat(d[1]),
    h: parseFloat(d[2]),
    l: parseFloat(d[3]),
    c: parseFloat(d[4]),
    v: parseFloat(d[5]),
  }));

  const volumes: Volume[] = response.data.map((d: any) => ({
    x: d[0],
    y: parseFloat(d[5]),
  }));

  return { candles, volumes };
};
