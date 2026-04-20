import { apiRequest } from './client';
import type { PlaceMarketOrderInput } from '../types/api';

export function placeMarketOrder(input: PlaceMarketOrderInput) {
  return apiRequest('/orders/market', {
    method: 'POST',
    auth: true,
    body: input,
  });
}