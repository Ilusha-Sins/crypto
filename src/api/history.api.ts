import { apiRequest } from './client';
import type {
  OrdersHistoryResponse,
  TradesHistoryResponse,
  TradingSummary,
} from '../types/api';

export function getOrdersHistory(query = '') {
  return apiRequest<OrdersHistoryResponse>(`/history/orders${query}`, {
    auth: true,
  });
}

export function getTradesHistory(query = '') {
  return apiRequest<TradesHistoryResponse>(`/history/trades${query}`, {
    auth: true,
  });
}

export function getTradingSummary() {
  return apiRequest<TradingSummary>('/history/summary', {
    auth: true,
  });
}