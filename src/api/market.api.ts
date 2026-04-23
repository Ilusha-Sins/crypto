import { apiRequest } from './client';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function createMarketStreamUrl(symbol: string, interval: string) {
  const params = new URLSearchParams({
    symbol,
    interval,
  });
  return `${API_URL}/market/stream?${params.toString()}`;
}

export type MarketPriceResponse = {
  symbol: string;
  price: string;
};

export type MarketKlineResponse = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

export type MarketSymbolsResponse = {
  items: string[];
};

export function getMarketPrice(symbol: string) {
  return apiRequest<MarketPriceResponse>(`/market/price?symbol=${symbol}`, {
    auth: false,
  });
}

export function getMarketSymbols() {
  return apiRequest<MarketSymbolsResponse>('/market/symbols', {
    auth: false,
  });
}

export function getMarketKlines(
  symbol: string,
  interval: string,
  limit = 500,
  endTime?: number,
) {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: String(limit),
  });

  if (endTime) {
    params.set('endTime', String(endTime));
  }

  return apiRequest<MarketKlineResponse[]>(`/market/klines?${params.toString()}`, {
    auth: false,
  });
}