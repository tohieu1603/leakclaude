// ApiKeyGuard — opt-in API-key auth.
//
// Activated only when the API_KEYS env var contains one or more comma-
// separated keys. Without it, the guard is a no-op so dev mode keeps
// working without ceremony.
//
// Clients can present the key in either of two headers:
//   Authorization: Bearer <key>
//   X-API-Key: <key>
//
// The matched key is exposed on req.apiKey so downstream code (the
// per-client session map, rate-limit tracker) can identify the caller.

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/config.module';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    if (config.auth.enabled) {
      this.logger.log(`API-key auth enabled (${config.auth.apiKeys.length} key(s) configured)`);
    } else {
      this.logger.warn('API-key auth disabled — set API_KEYS env to enable');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.auth.enabled) return true;
    const req = context.switchToHttp().getRequest<Request & { apiKey?: string }>();
    const presented = this.extractKey(req);
    if (!presented) {
      throw new UnauthorizedException('Missing API key. Send Authorization: Bearer <key> or X-API-Key: <key>.');
    }
    if (!this.config.auth.apiKeys.includes(presented)) {
      // Don't reveal which keys exist — opaque rejection
      throw new UnauthorizedException('Invalid API key');
    }
    req.apiKey = presented;
    return true;
  }

  private extractKey(req: Request): string | null {
    const authz = req.header('authorization');
    if (authz?.toLowerCase().startsWith('bearer ')) {
      return authz.slice(7).trim();
    }
    const xKey = req.header('x-api-key');
    if (xKey) return xKey.trim();
    return null;
  }
}
