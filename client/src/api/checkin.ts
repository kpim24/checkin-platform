import { logger } from '@lark-apaas/client-toolkit/logger';
import { request } from './index';
import type { CheckinStatus, CalendarHeatmapItem, LeaderboardItem, PagedResponse } from '@shared/api.interface';

export async function checkin(): Promise<{ success: boolean; status: CheckinStatus }> {
  try { return await request.post<{ success: boolean; status: CheckinStatus }>('/api/checkin'); } catch (error: unknown) { logger.error('checkin failed', error); throw error; }
}

export async function makeupCheckin(date: string): Promise<{ success: boolean; status: CheckinStatus }> {
  try { return await request.post<{ success: boolean; status: CheckinStatus }>('/api/checkin/makeup', { date }); } catch (error: unknown) { logger.error('makeupCheckin failed', error); throw error; }
}

export async function getCheckinStatus(): Promise<CheckinStatus> {
  try { return await request.get<CheckinStatus>('/api/checkin/status'); } catch (error: unknown) { logger.error('getCheckinStatus failed', error); throw error; }
}

export async function getCalendar(year: number, month?: number): Promise<{ items: CalendarHeatmapItem[] }> {
  try { return await request.get<{ items: CalendarHeatmapItem[] }>('/api/checkin/calendar', { params: { year, month } }); } catch (error: unknown) { logger.error('getCalendar failed', error); throw error; }
}

export async function getLeaderboard(page: number, pageSize: number): Promise<PagedResponse<LeaderboardItem>> {
  try { return await request.get<PagedResponse<LeaderboardItem>>('/api/checkin/leaderboard', { params: { page, pageSize } }); } catch (error: unknown) { logger.error('getLeaderboard failed', error); throw error; }
}

export async function getTodayUsers(): Promise<{ users: LeaderboardItem[] }> {
  try { return await request.get<{ users: LeaderboardItem[] }>('/api/checkin/today-users'); } catch (error: unknown) { logger.error('getTodayUsers failed', error); throw error; }
}
