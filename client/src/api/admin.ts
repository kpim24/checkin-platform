import { logger } from '@lark-apaas/client-toolkit/logger';
import { request } from './index';

export interface AdminStats { totalUsers: number; totalCheckins: number; totalMessages: number; activeUsersToday: number; }
export interface AdminLoginResult { success: boolean; token: string; }
export interface AdminSecretResult { success: boolean; secretToken: string; message?: string; }

export async function getAdminStats(): Promise<AdminStats> {
  try { return await request.get<AdminStats>('/api/admin/stats'); } catch (error: unknown) { logger.error('getAdminStats failed', error); throw error; }
}

export async function verifyAdminSecret(secret: string): Promise<AdminSecretResult> {
  try {
    const result = await request.post<{ secretToken: string; message?: string }>('/api/admin/secret', { secret });
    return { success: !!result.secretToken, secretToken: result.secretToken || '', message: result.message };
  } catch (error: unknown) { logger.error('verifyAdminSecret failed', error); throw error; }
}

export async function adminLogin(password: string, secretToken: string): Promise<AdminLoginResult> {
  try {
    const result = await request.post<{ token: string }>('/api/admin/login', { password }, { headers: { 'x-admin-secret-token': secretToken } });
    return { success: !!result.token, token: result.token || '' };
  } catch (error: unknown) { logger.error('adminLogin failed', error); throw error; }
}
