import { Controller, Get, Post, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import type { CheckinStatus, CalendarHeatmapItem, LeaderboardItem, PagedResponse } from '@shared/api.interface';
import type { Request } from 'express';

interface MakeupDto { date: string; }

@Controller('api/checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  async checkin(@Req() req: Request): Promise<{ success: true; status: CheckinStatus }> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) throw new BadRequestException('请先设置昵称');
    return this.checkinService.checkin(userId, req.checkinUser?.nickname ?? undefined);
  }

  @Post('makeup')
  async makeup(@Req() req: Request, @Body() dto: MakeupDto): Promise<{ success: true; status: CheckinStatus }> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) throw new BadRequestException('请先设置昵称');
    return this.checkinService.makeup(userId, dto.date);
  }

  @Get('status')
  async getStatus(@Req() req: Request): Promise<CheckinStatus> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) return { todayChecked: false, currentStreak: 0, longestStreak: 0, totalCheckins: 0, level: 1, makeupAvailable: 3 };
    return this.checkinService.getStatus(userId);
  }

  @Get('calendar')
  async getCalendar(@Req() req: Request, @Query('year') year?: string, @Query('month') month?: string): Promise<{ items: CalendarHeatmapItem[] }> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) return { items: [] };
    return this.checkinService.getCalendar(userId, year ? parseInt(year, 10) : new Date().getFullYear(), month ? parseInt(month, 10) : undefined);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('page') page: string = '1', @Query('pageSize') pageSize: string = '20'): Promise<PagedResponse<LeaderboardItem>> {
    return this.checkinService.getLeaderboard(parseInt(page, 10) || 1, parseInt(pageSize, 10) || 20);
  }

  @Get('today-users')
  async getTodayUsers(): Promise<{ users: LeaderboardItem[] }> {
    return this.checkinService.getTodayUsers();
  }
}
