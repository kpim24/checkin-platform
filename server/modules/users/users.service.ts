import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { userProfiles, checkinRecords, chatMessages } from '@server/database/schema';
import type { UserProfile, PagedResponse } from '@shared/api.interface';

type UserProfileRow = typeof userProfiles.$inferSelect;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private toUserProfile(row: UserProfileRow): UserProfile {
    return { id: row.id, userId: row.userId, nickname: row.nickname, avatarUrl: row.avatarUrl ?? '', role: row.role as 'admin' | 'user', totalCheckins: row.totalCheckins, currentStreak: row.currentStreak, longestStreak: row.longestStreak, level: row.level, lastCheckinDate: row.lastCheckinDate ?? null, createdAt: row.createdAt.toISOString() };
  }

  async ensureProfile(userId: string, userName: string | undefined): Promise<UserProfile> {
    const existing = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (existing.length > 0) return this.toUserProfile(existing[0]);
    const inserted = await this.db.insert(userProfiles).values({ userId, nickname: userName || `用户${userId.slice(-4)}`, avatarUrl: '', role: 'user', totalCheckins: 0, currentStreak: 0, longestStreak: 0, level: 1, lastCheckinDate: null }).returning();
    this.logger.log(`Created new user profile for ${userId}`);
    return this.toUserProfile(inserted[0]);
  }

  async getProfile(userId: string, userName: string | undefined): Promise<UserProfile> { return this.ensureProfile(userId, userName); }

  async updateProfile(userId: string, data: { nickname?: string; avatarUrl?: string }): Promise<UserProfile> {
    const patch: Partial<typeof userProfiles.$inferInsert> = {};
    if (data.nickname !== undefined) {
      const trimmed = data.nickname.trim();
      if (trimmed.length < 1 || trimmed.length > 50) throw new BadRequestException('昵称长度必须在1-50个字符之间');
      patch.nickname = trimmed;
    }
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    if (Object.keys(patch).length === 0) throw new BadRequestException('未提供可更新字段');
    patch.updatedAt = new Date();
    const updated = await this.db.update(userProfiles).set(patch).where(eq(userProfiles.userId, userId)).returning();
    if (updated.length === 0) return this.ensureProfile(userId, patch.nickname);
    return this.toUserProfile(updated[0]);
  }

  async getBatch(userIds: string[]): Promise<{ users: UserProfile[] }> {
    if (userIds.length === 0) return { users: [] };
    const rows = await this.db.select().from(userProfiles).where(inArray(userProfiles.userId, userIds));
    return { users: rows.map(row => this.toUserProfile(row)) };
  }

  async listUsers(page: number, pageSize: number): Promise<PagedResponse<UserProfile>> {
    const offset = (page - 1) * pageSize;
    const [countResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userProfiles),
      this.db.select().from(userProfiles).orderBy(desc(userProfiles.totalCheckins)).limit(pageSize).offset(offset),
    ]);
    return { items: rows.map(row => this.toUserProfile(row)), total: Number(countResult[0]?.count ?? 0), page, pageSize };
  }

  async updateUserRole(targetUserId: string, role: 'admin' | 'user'): Promise<UserProfile> {
    if (role !== 'admin' && role !== 'user') throw new BadRequestException('无效的角色');
    const updated = await this.db.update(userProfiles).set({ role, updatedAt: new Date() }).where(eq(userProfiles.userId, targetUserId)).returning();
    if (updated.length === 0) throw new NotFoundException('用户不存在');
    return this.toUserProfile(updated[0]);
  }

  async deleteUser(targetUserId: string): Promise<{ success: true }> {
    const target = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, targetUserId)).limit(1);
    if (target.length === 0) throw new NotFoundException('用户不存在');
    await this.db.transaction(async (tx) => {
      await tx.delete(chatMessages).where(eq(chatMessages.userId, targetUserId));
      await tx.delete(checkinRecords).where(eq(checkinRecords.userId, targetUserId));
      await tx.delete(userProfiles).where(eq(userProfiles.userId, targetUserId));
    });
    this.logger.log(`Admin deleted user ${targetUserId}`);
    return { success: true };
  }
}
