import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

export const CHECKIN_USER_ID_HEADER = 'x-checkin-user-id';
export const CHECKIN_NICKNAME_HEADER = 'x-checkin-nickname';

declare module 'express' {
  interface Request {
    checkinUser?: { userId: string | null; nickname: string | null };
  }
}

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UserContextMiddleware.name);
  use(req: Request, _res: Response, next: NextFunction): void {
    const userIdHeader: string | undefined = req.headers[CHECKIN_USER_ID_HEADER] as string | undefined;
    const nicknameHeader: string | undefined = req.headers[CHECKIN_NICKNAME_HEADER] as string | undefined;
    const userId: string | null = userIdHeader && typeof userIdHeader === 'string' && userIdHeader.trim().length > 0 ? userIdHeader.trim() : null;
    const nickname: string | null = nicknameHeader && typeof nicknameHeader === 'string' && nicknameHeader.trim().length > 0 ? decodeURIComponent(nicknameHeader.trim()) : null;
    req.checkinUser = { userId, nickname };
    next();
  }
}
