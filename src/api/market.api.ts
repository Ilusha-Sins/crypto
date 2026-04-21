import { apiRequest } from './client';

export type MarketPriceResponse = {
  symbol: string;
  price: string;
};

export function getMarketPrice(symbol: string) {
  return apiRequest<MarketPriceResponse>(`/market/price?symbol=${symbol}`, {
    auth: false,
  });
}