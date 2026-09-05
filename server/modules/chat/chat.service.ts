import { Inject, Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { chatMessages, userProfiles } from '@server/database/schema';
import type { ChatMessage, PagedResponse } from '@shared/api.interface';
import { UsersService } from '../users/users.service';

type ChatMessageRow = typeof chatMessages.$inferSelect;
type UserProfileRow = typeof userProfiles.$inferSelect;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase, private readonly usersService: UsersService) {}

  private async attachUserInfo(rows: ChatMessageRow[]): Promise<ChatMessage[]> {
    if (rows.length === 0) return [];
    const userIds = [...new Set(rows.map(r => r.userId))];
    const userRows = await this.db.select().from(userProfiles).where(inArray(userProfiles.userId, userIds));
    const userMap = new Map<string, { nickname: string; avatarUrl: string }>();
    for (const u of userRows) userMap.set(u.userId, { nickname: u.nickname, avatarUrl: u.avatarUrl ?? '' });
    return rows.map(row => {
      const user = userMap.get(row.userId) ?? { nickname: `用户${row.userId.slice(-4)}`, avatarUrl: '' };
      return { id: row.id, userId: row.userId, nickname: user.nickname, avatarUrl: user.avatarUrl, content: row.content, createdAt: row.createdAt.toISOString() };
    });
  }

  async getMessages(page: number, pageSize: number): Promise<PagedResponse<ChatMessage>> {
    const offset = (page - 1) * pageSize;
    const [countResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(chatMessages),
      this.db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(pageSize).offset(offset),
    ]);
    return { items: await this.attachUserInfo(rows), total: Number(countResult[0]?.count ?? 0), page, pageSize };
  }

  async sendMessage(userId: string, content: string, userName: string | undefined): Promise<ChatMessage> {
    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 500) throw new BadRequestException('消息长度必须在1-500个字符之间');
    await this.usersService.ensureProfile(userId, userName);
    const inserted = await this.db.insert(chatMessages).values({ userId, content: trimmed }).returning();
    this.logger.log(`User ${userId} sent message ${inserted[0].id}`);
    return (await this.attachUserInfo(inserted))[0];
  }

  async deleteMessage(operatorUserId: string, messageId: string, isAdmin: boolean): Promise<{ success: true }> {
    const existing = await this.db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
    if (existing.length === 0) throw new NotFoundException('消息不存在');
    if (!isAdmin && existing[0].userId !== operatorUserId) throw new ForbiddenException('无权限删除该消息');
    await this.db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    this.logger.log(isAdmin ? `Admin deleted message ${messageId}` : `User ${operatorUserId} deleted message ${messageId}`);
    return { success: true };
  }

  async getLatest(): Promise<{ latestId: string | null; count: number }> {
    const [countResult, latest] = await Promise.all([
      this.db.select({ count: count() }).from(chatMessages),
      this.db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(1),
    ]);
    return { latestId: latest.length > 0 ? latest[0].id : null, count: Number(countResult[0]?.count ?? 0) };
  }
}
