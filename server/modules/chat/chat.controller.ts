import { Controller, Get, Post, Delete, Body, Query, Param, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatMessage, PagedResponse } from '@shared/api.interface';
import { validateAdminToken } from '@server/common/guards/admin.guard';
import type { Request } from 'express';

interface SendMessageDto { content: string; }

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  async getMessages(@Query('page') page: string = '1', @Query('pageSize') pageSize: string = '50'): Promise<PagedResponse<ChatMessage>> {
    return this.chatService.getMessages(parseInt(page, 10) || 1, parseInt(pageSize, 10) || 50);
  }

  @Post('messages')
  async sendMessage(@Req() req: Request, @Body() dto: SendMessageDto): Promise<ChatMessage> {
    const userId: string | null = req.checkinUser?.userId ?? null;
    if (!userId) throw new BadRequestException('请先设置昵称');
    return this.chatService.sendMessage(userId, dto.content, req.checkinUser?.nickname ?? undefined);
  }

  @Delete('messages/:id')
  async deleteMessage(@Req() req: Request, @Param('id') id: string): Promise<{ success: true }> {
    const adminToken = req.headers['x-admin-token'] as string | undefined;
    const isAdmin = validateAdminToken(adminToken);
    const userId = req.checkinUser?.userId ?? null;
    if (!isAdmin && !userId) throw new ForbiddenException('未登录或无权限');
    return this.chatService.deleteMessage(userId ?? '', id, isAdmin);
  }

  @Get('latest')
  async getLatest(): Promise<{ latestId: string | null; count: number }> {
    return this.chatService.getLatest();
  }
}
