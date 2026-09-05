import { logger } from '@lark-apaas/client-toolkit/logger';
import { request } from './index';
import type { ChatMessage, PagedResponse } from '@shared/api.interface';

export async function getMessages(page: number, pageSize: number): Promise<PagedResponse<ChatMessage>> {
  try { return await request.get<PagedResponse<ChatMessage>>('/api/chat/messages', { params: { page, pageSize } }); } catch (error: unknown) { logger.error('getMessages failed', error); throw error; }
}

export async function sendMessage(content: string): Promise<ChatMessage> {
  try { return await request.post<ChatMessage>('/api/chat/messages', { content }); } catch (error: unknown) { logger.error('sendMessage failed', error); throw error; }
}

export async function deleteMessage(id: string): Promise<{ success: boolean }> {
  try { return await request.delete<{ success: boolean }>(`/api/chat/messages/${id}`); } catch (error: unknown) { logger.error('deleteMessage failed', error); throw error; }
}

export async function getLatestMessage(): Promise<{ latestId: string | null; count: number }> {
  try { return await request.get<{ latestId: string | null; count: number }>('/api/chat/latest'); } catch (error: unknown) { logger.error('getLatestMessage failed', error); throw error; }
}
