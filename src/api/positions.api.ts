import { apiRequest } from './client';
import type {
  ClosedPositionsResponse,
  OpenPositionsResponse,
  PositionDetailsResponse,
} from '../types/api';

export function getOpenPositions() {
  return apiRequest<OpenPositionsResponse>('/positions/open', {
    auth: true,
  });
}

export function getClosedPositions() {
  return apiRequest<ClosedPositionsResponse>('/positions/closed', {
    auth: true,
  });
}

export function getPositionById(positionId: string) {
  return apiRequest<PositionDetailsResponse>(`/positions/${positionId}`, {
    auth: true,
  });
}

export function updatePositionRisk(
  positionId: string,
  payload: {
    stopLoss?: string | null;
    takeProfit?: string | null;
  },
) {
  return apiRequest(`/positions/${positionId}/risk`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}