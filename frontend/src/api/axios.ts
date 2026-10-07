import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiSuccess } from '../types/api';
import { AUTH_LOGOUT_EVENT } from '../utils/constants';
import { tokenStorage } from '../utils/storage';

export const API_URL: string = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/** Origin of the API server, used to build absolute URLs for uploaded images. */
export const API_ORIGIN = new URL(API_URL, window.location.origin).origin;

export const http = axios.create({
  baseURL: API_URL,
  timeout: 60_000,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    // Wrong credentials on the login form must not trigger a global logout
    if (status === 401 && !PUBLIC_AUTH_PATHS.some((path) => url.startsWith(path))) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `{ success, data }` envelope of every API response. */
const unwrap = async <T>(request: Promise<{ data: ApiSuccess<T> }>) => (await request).data.data;

export const api = {
  get: <T>(url: string, params?: object, config?: AxiosRequestConfig) =>
    unwrap<T>(http.get(url, { ...config, params })),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(http.post(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(http.put(url, body, config)),
  delete: <T = null>(url: string) => unwrap<T>(http.delete(url)),
};
