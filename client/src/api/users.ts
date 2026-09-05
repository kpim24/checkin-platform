import { logger } from '@lark-apaas/client-toolkit/logger';
import { request } from './index';
import type { UserProfile, PagedResponse } from '@shared/api.interface';

export async function getProfile(): Promise<UserProfile> { try { return await request.get<UserProfile>('/api/users/profile'); } catch (error: unknown) { logger.error('getProfile failed', error); throw error; } }
export async function updateProfile(data: { nickname?: string; avatarUrl?: string }): Promise<UserProfile> { try { return await request.patch<UserProfile>('/api/users/profile', data); } catch (error: unknown) { logger.error('updateProfile failed', error); throw error; } }
export async function getBatchUsers(ids: string[]): Promise<{ users: UserProfile[] }> { try { return await request.get<{ users: UserProfile[] }>('/api/users/batch', { params: { ids: ids.join(',') } }); } catch (error: unknown) { logger.error('getBatchUsers failed', error); throw error; } }
export async function listUsers(page: number, pageSize: number): Promise<PagedResponse<UserProfile>> { try { return await request.get<PagedResponse<UserProfile>>('/api/users', { params: { page, pageSize } }); } catch (error: unknown) { logger.error('listUsers failed', error); throw error; } }
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<UserProfile> { try { return await request.patch<UserProfile>(`/api/users/${userId}/role`, { role }); } catch (error: unknown) { logger.error('updateUserRole failed', error); throw error; } }
export async function deleteUser(userId: string): Promise<{ success: boolean }> { try { return await request.delete<{ success: boolean }>(`/api/users/${userId}`); } catch (error: unknown) { logger.error('deleteUser failed', error); throw error; } }
