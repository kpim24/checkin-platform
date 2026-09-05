import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export * as usersApi from './users';
export * as checkinApi from './checkin';
export * as chatApi from './chat';
export * as adminApi from './admin';

export const STORAGE_USER_KEY = 'checkin_user';
export const STORAGE_ADMIN_KEY = 'admin_token';

export interface CheckinLocalUser { userId: string; nickname: string; avatarUrl: string; }

function getStoredUser(): CheckinLocalUser | null {
  try { const raw = localStorage.getItem(STORAGE_USER_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as CheckinLocalUser; return parsed.userId ? parsed : null; } catch (e: unknown) { logger.error('parse stored user failed', e); return null; }
}
function getStoredUserId(): string | null { return getStoredUser()?.userId ?? null; }
function getStoredNickname(): string | null { return getStoredUser()?.nickname ?? null; }
function getStoredAdminToken(): string | null { try { return localStorage.getItem(STORAGE_ADMIN_KEY); } catch (e: unknown) { logger.error('read admin token failed', e); return null; } }
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const userId = getStoredUserId(); if (userId) headers['x-checkin-user-id'] = userId;
  const nickname = getStoredNickname(); if (nickname) headers['x-checkin-nickname'] = encodeURIComponent(nickname);
  const adminToken = getStoredAdminToken(); if (adminToken) headers['x-admin-token'] = adminToken;
  return headers;
}
type RequestConfig = { params?: Record<string, unknown>; headers?: Record<string, string>; };
export const request = {
  async get<T>(url: string, config?: RequestConfig): Promise<T> { const headers = { ...buildHeaders(), ...(config?.headers ?? {}) }; const { data } = await axiosForBackend.get<T>(url, { params: config?.params, headers }); return data; },
  async post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<T> { const headers = { ...buildHeaders(), ...(config?.headers ?? {}) }; const { data } = await axiosForBackend.post<T>(url, body, { params: config?.params, headers }); return data; },
  async patch<T>(url: string, body?: unknown, config?: RequestConfig): Promise<T> { const headers = { ...buildHeaders(), ...(config?.headers ?? {}) }; const { data } = await axiosForBackend.patch<T>(url, body, { params: config?.params, headers }); return data; },
  async delete<T>(url: string, config?: RequestConfig): Promise<T> { const headers = { ...buildHeaders(), ...(config?.headers ?? {}) }; const { data } = await axiosForBackend.delete<T>(url, { params: config?.params, headers }); return data; },
};
