import { apiRequest } from './client';
import type { AnalysisRunResult } from '../types/api';

export function runAnalysis(payload: {
  symbol: string;
  interval: string;
  limit?: number;
  language?: 'uk' | 'en';
}) {
  return apiRequest<AnalysisRunResult>('/analysis/run', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function getAnalysisHistory(query = '') {
  return apiRequest(`/analysis/history${query}`, {
    auth: true,
  });
}

export function getAnalysisById(analysisId: string) {
  return apiRequest(`/analysis/history/${analysisId}`, {
    auth: true,
  });
}