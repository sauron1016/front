/**
 * Central API client with automatic authentication
 */

import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach stored token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global listeners for 401 responses (e.g. force logout from anywhere)
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      unauthorizedListeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

/** Extract the backend's standard { success, data } payload */
export function unwrap<T>(responseData: unknown): T {
  const payload = responseData as { data?: T };
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return responseData as T;
}
