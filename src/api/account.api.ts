import { apiRequest } from './client';
import type { DemoAccount } from '../types/api';

export function getMyAccount() {
  return apiRequest<DemoAccount>('/accounts/me', {
    auth: true,
  });
}

export function resetMyAccount() {
  return apiRequest<DemoAccount>('/accounts/reset', {
    method: 'POST',
    auth: true,
  });
}