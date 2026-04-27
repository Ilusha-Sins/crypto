import { getStoredToken, clearAuthStorage } from '../auth/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (options.auth) {
    const token = getStoredToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearAuthStorage();
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const errorData = (await response.json()) as
        | { message?: string | string[] }
        | undefined;

      if (Array.isArray(errorData?.message)) {
        message = errorData.message.join(', ');
      } else if (typeof errorData?.message === 'string') {
        message = errorData.message;
      }
    } catch {
      //
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}