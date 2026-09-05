import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { ADMIN_PASSWORD, ADMIN_SECRET } from '@server/config/admin.config';
import { randomUUID } from 'crypto';

const adminTokens = new Map<string, boolean>();
const secretTokens = new Map<string, boolean>();
const logger = new Logger('AdminAuth');

export function validateAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  return adminTokens.has(token);
}

export function generateAdminToken(): string {
  const token: string = randomUUID();
  adminTokens.set(token, true);
  return token;
}

export function generateSecretToken(): string {
  const token: string = randomUUID();
  secretTokens.set(token, true);
  return token;
}

export function validateSecretToken(token: string | undefined): boolean {
  if (!token) return false;
  return secretTokens.has(token);
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function verifyAdminSecret(secret: string): boolean {
  return secret === ADMIN_SECRET;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest<Request>();
    const token: string | undefined = req.headers['x-admin-token'] as string | undefined;
    if (!token || typeof token !== 'string') throw new ForbiddenException('缺少管理员令牌');
    if (!adminTokens.has(token)) throw new ForbiddenException('管理员令牌无效');
    return true;
  }
}

export { logger as adminLogger };
