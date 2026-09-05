import { Controller, Get, Post, Patch, Delete, Body, Query, Param, Req, UseGuards, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import type { UserProfile, PagedResponse, AdminLoginResponse, AdminSecretResponse } from '@shared/api.interface';
import { AdminGuard, generateAdminToken, verifyAdminPassword, generateSecretToken, verifyAdminSecret, validateSecretToken } from '@server/common/guards/admin.guard';
import { WISH_MESSAGES } from '@server/config/admin.config';
import type { Request } from 'express';

interface UpdateProfileDto { nickname?: string; avatarUrl?: string; }
interface UpdateRoleDto { role: 'admin' | 'user'; }
interface AdminLoginDto { password: string; }
interface AdminSecretDto { secret: string; }

@Controller('api/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<UserProfile> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) return { id: '', userId: '', nickname: '游客', avatarUrl: '', role: 'user', totalCheckins: 0, currentStreak: 0, longestStreak: 0, level: 1, lastCheckinDate: null, createdAt: new Date(0).toISOString() };
    return this.usersService.getProfile(userId, req.checkinUser?.nickname ?? undefined);
  }

  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto): Promise<UserProfile> {
    const userId = req.checkinUser?.userId ?? null;
    if (!userId) throw new BadRequestException('请先设置昵称');
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('batch')
  async getBatch(@Query('ids') ids: string): Promise<{ users: UserProfile[] }> {
    return this.usersService.getBatch(ids ? ids.split(',').filter(s => s.length > 0) : []);
  }

  @Get('list')
  @UseGuards(AdminGuard)
  async listUsers(@Query('page') page: string = '1', @Query('pageSize') pageSize: string = '20'): Promise<PagedResponse<UserProfile>> {
    return this.usersService.listUsers(parseInt(page, 10) || 1, parseInt(pageSize, 10) || 20);
  }

  @Patch(':userId/role')
  @UseGuards(AdminGuard)
  async updateUserRole(@Param('userId') targetUserId: string, @Body() dto: UpdateRoleDto): Promise<UserProfile> {
    return this.usersService.updateUserRole(targetUserId, dto.role);
  }

  @Delete(':userId')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('userId') targetUserId: string): Promise<{ success: true }> {
    return this.usersService.deleteUser(targetUserId);
  }
}

@Controller('api/admin')
export class AdminController {
  @Post('secret')
  async verifySecret(@Body() dto: AdminSecretDto): Promise<AdminSecretResponse> {
    if (!dto.secret || !verifyAdminSecret(dto.secret)) {
      return { secretToken: '', message: WISH_MESSAGES[Math.floor(Math.random() * WISH_MESSAGES.length)] };
    }
    return { secretToken: generateSecretToken() };
  }

  @Post('login')
  async login(@Req() req: Request, @Body() dto: AdminLoginDto): Promise<AdminLoginResponse> {
    const secretToken = req.headers['x-admin-secret-token'] as string | undefined;
    if (!secretToken || !validateSecretToken(secretToken)) throw new UnauthorizedException('验证失败');
    if (!dto.password || !verifyAdminPassword(dto.password)) throw new UnauthorizedException('密码错误');
    return { token: generateAdminToken() };
  }
}
