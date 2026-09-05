import { Inject, Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, gte, lt, desc, count, inArray } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { userProfiles, checkinRecords } from '@server/database/schema';
import type { CheckinStatus, CalendarHeatmapItem, LeaderboardItem, PagedResponse } from '@shared/api.interface';
import { UsersService } from '../users/users.service';

type UserProfileRow = typeof userProfiles.$inferSelect;
type CheckinRecordRow = typeof checkinRecords.$inferSelect;

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase, private readonly usersService: UsersService) {}

  private getToday(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getYesterday(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private calcLevel(total: number): number { return Math.max(1, Math.floor(total / 10) + 1); }

  private async getThisMonthMakeupCount(userId: string, today: string): Promise<number> {
    const [year, month] = today.split('-');
    const monthStart = `${year}-${month}-01`;
    const nextMonthNum = Number(month) + 1;
    const nextYear = nextMonthNum > 12 ? String(Number(year) + 1) : year;
    const nextMonthStr = nextMonthNum > 12 ? '01' : String(nextMonthNum).padStart(2, '0');
    const result = await this.db.select({ count: count() }).from(checkinRecords).where(and(eq(checkinRecords.userId, userId), eq(checkinRecords.isMakeup, true), gte(checkinRecords.checkinDate, monthStart), lt(checkinRecords.checkinDate, `${nextYear}-${nextMonthStr}-01`)));
    return Number(result[0]?.count ?? 0);
  }

  private toLeaderboardItem(row: UserProfileRow, rank: number): LeaderboardItem {
    return { userId: row.userId, nickname: row.nickname, avatarUrl: row.avatarUrl ?? '', totalCheckins: row.totalCheckins, currentStreak: row.currentStreak, rank };
  }

  async checkin(userId: string, userName: string | undefined): Promise<{ success: true; status: CheckinStatus }> {
    await this.usersService.ensureProfile(userId, userName);
    const today = this.getToday();
    const existing = await this.db.select().from(checkinRecords).where(and(eq(checkinRecords.userId, userId), eq(checkinRecords.checkinDate, today))).limit(1);
    if (existing.length > 0) throw new ConflictException('今日已签到');
    const profileRow = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const profile = profileRow[0];
    const yesterday = this.getYesterday(today);
    const newStreak = profile.lastCheckinDate === yesterday ? profile.currentStreak + 1 : 1;
    const newTotal = profile.totalCheckins + 1;
    const newLongest = Math.max(profile.longestStreak, newStreak);
    const newLevel = this.calcLevel(newTotal);
    await this.db.transaction(async (tx) => {
      await tx.insert(checkinRecords).values({ userId, checkinDate: today, isMakeup: false });
      await tx.update(userProfiles).set({ totalCheckins: newTotal, currentStreak: newStreak, longestStreak: newLongest, lastCheckinDate: today, level: newLevel, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
    });
    const makeupCount = await this.getThisMonthMakeupCount(userId, today);
    this.logger.log(`User ${userId} checked in on ${today}`);
    return { success: true, status: { todayChecked: true, currentStreak: newStreak, longestStreak: newLongest, totalCheckins: newTotal, level: newLevel, makeupAvailable: Math.max(0, 3 - makeupCount) } };
  }

  async makeup(userId: string, dateStr: string): Promise<{ success: true; status: CheckinStatus }> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new BadRequestException('日期格式不正确，应为 YYYY-MM-DD');
    const today = this.getToday();
    const targetDate = new Date(dateStr);
    const todayDate = new Date(today);
    if (isNaN(targetDate.getTime())) throw new BadRequestException('无效的日期');
    if (dateStr === today) throw new BadRequestException('当天不能补签，请使用正常签到');
    if (targetDate > todayDate) throw new BadRequestException('不能补签未来日期');
    const thirtyDaysAgo = new Date(todayDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (targetDate < thirtyDaysAgo) throw new BadRequestException('只能补签30天内的日期');
    const existing = await this.db.select().from(checkinRecords).where(and(eq(checkinRecords.userId, userId), eq(checkinRecords.checkinDate, dateStr))).limit(1);
    if (existing.length > 0) throw new ConflictException('该日期已签到');
    const makeupCount = await this.getThisMonthMakeupCount(userId, today);
    if (makeupCount >= 3) throw new ConflictException('本月补签次数已用完');
    const profileRow = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const profile = profileRow[0];
    const newTotal = profile.totalCheckins + 1;
    const newLevel = this.calcLevel(newTotal);
    await this.db.transaction(async (tx) => {
      await tx.insert(checkinRecords).values({ userId, checkinDate: dateStr, isMakeup: true });
      await tx.update(userProfiles).set({ totalCheckins: newTotal, level: newLevel, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
    });
    this.logger.log(`User ${userId} made up checkin for ${dateStr}`);
    return { success: true, status: { todayChecked: false, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, totalCheckins: newTotal, level: newLevel, makeupAvailable: Math.max(0, 3 - makeupCount - 1) } };
  }

  async getStatus(userId: string): Promise<CheckinStatus> {
    const today = this.getToday();
    const [todayRow, profileRow] = await Promise.all([
      this.db.select().from(checkinRecords).where(and(eq(checkinRecords.userId, userId), eq(checkinRecords.checkinDate, today))).limit(1),
      this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
    ]);
    const makeupCount = await this.getThisMonthMakeupCount(userId, today);
    if (profileRow.length === 0) return { todayChecked: false, currentStreak: 0, longestStreak: 0, totalCheckins: 0, level: 1, makeupAvailable: 3 };
    const profile = profileRow[0];
    return { todayChecked: todayRow.length > 0, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, totalCheckins: profile.totalCheckins, level: profile.level, makeupAvailable: Math.max(0, 3 - makeupCount) };
  }

  async getCalendar(userId: string, year: number, month?: number): Promise<{ items: CalendarHeatmapItem[] }> {
    let start: string, end: string;
    if (month !== undefined) {
      start = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonthNum = month + 1;
      const nextYear = nextMonthNum > 12 ? year + 1 : year;
      const nextMonthStr = nextMonthNum > 12 ? '01' : String(nextMonthNum).padStart(2, '0');
      end = `${nextYear}-${nextMonthStr}-01`;
    } else { start = `${year}-01-01`; end = `${year + 1}-01-01`; }
    const records = await this.db.select().from(checkinRecords).where(and(eq(checkinRecords.userId, userId), gte(checkinRecords.checkinDate, start), lt(checkinRecords.checkinDate, end)));
    return { items: records.map(rec => ({ date: rec.checkinDate, checked: true, isMakeup: rec.isMakeup })) };
  }

  async getLeaderboard(page: number, pageSize: number): Promise<PagedResponse<LeaderboardItem>> {
    const offset = (page - 1) * pageSize;
    const [countResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userProfiles),
      this.db.select().from(userProfiles).orderBy(desc(userProfiles.totalCheckins), desc(userProfiles.currentStreak)).limit(pageSize).offset(offset),
    ]);
    return { items: rows.map((row, idx) => this.toLeaderboardItem(row, offset + idx + 1)), total: Number(countResult[0]?.count ?? 0), page, pageSize };
  }

  async getTodayUsers(): Promise<{ users: LeaderboardItem[] }> {
    const today = this.getToday();
    const todayRecords = await this.db.select().from(checkinRecords).where(eq(checkinRecords.checkinDate, today)).orderBy(desc(checkinRecords.createdAt)).limit(50);
    if (todayRecords.length === 0) return { users: [] };
    const userIds = todayRecords.map(r => r.userId);
    const profileRows = await this.db.select().from(userProfiles).where(inArray(userProfiles.userId, userIds));
    const profileMap = new Map<string, UserProfileRow>();
    for (const row of profileRows) profileMap.set(row.userId, row);
    return { users: todayRecords.map((rec, idx) => { const profile = profileMap.get(rec.userId); return profile ? this.toLeaderboardItem(profile, idx + 1) : null; }).filter((item): item is LeaderboardItem => item !== null) };
  }
}
