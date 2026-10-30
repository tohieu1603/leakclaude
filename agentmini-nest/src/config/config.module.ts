// Loads and validates env into a strongly-typed config provider

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

const EnvSchema = z.object({
  AI_API_KEY: z.string().min(1),
  AI_API_URL: z.string().url(),
  AI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WORKSPACE_ROOT: z.string().min(1).default(process.cwd()),

  // Auth: comma-separated allowlist of API keys. Empty/unset → auth disabled
  // (dev mode). Clients must send `Authorization: Bearer <key>` or
  // `X-API-Key: <key>` when this is set.
  API_KEYS: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])),

  // Rate limit: requests per TTL window per client (IP or API-key). Set
  // RATE_LIMIT_DISABLED=1 to disable entirely (e.g. behind another rate limiter).
  RATE_LIMIT_DISABLED: z.coerce.boolean().default(false),
  RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(30),
});

export type AppConfig = {
  ai: { apiKey: string; baseUrl: string; model: string };
  server: { port: number; env: string; isDev: boolean };
  workspaceRoot: string;
  auth: { apiKeys: string[]; enabled: boolean };
  rateLimit: { enabled: boolean; ttlMs: number; max: number };
};

export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: APP_CONFIG,
      inject: [ConfigService],
      useFactory: (cs: ConfigService): AppConfig => {
        const parsed = EnvSchema.safeParse({
          AI_API_KEY: cs.get('AI_API_KEY'),
          AI_API_URL: cs.get('AI_API_URL'),
          AI_MODEL: cs.get('AI_MODEL'),
          PORT: cs.get('PORT'),
          NODE_ENV: cs.get('NODE_ENV'),
          WORKSPACE_ROOT: cs.get('WORKSPACE_ROOT'),
          API_KEYS: cs.get('API_KEYS'),
          RATE_LIMIT_DISABLED: cs.get('RATE_LIMIT_DISABLED'),
          RATE_LIMIT_TTL_MS: cs.get('RATE_LIMIT_TTL_MS'),
          RATE_LIMIT_MAX: cs.get('RATE_LIMIT_MAX'),
        });
        if (!parsed.success) {
          // Fail fast — invalid env should never reach runtime
          console.error('Invalid env:', parsed.error.flatten().fieldErrors);
          process.exit(1);
        }
        const e = parsed.data;
        return {
          ai: { apiKey: e.AI_API_KEY, baseUrl: e.AI_API_URL, model: e.AI_MODEL },
          server: { port: e.PORT, env: e.NODE_ENV, isDev: e.NODE_ENV === 'development' },
          workspaceRoot: e.WORKSPACE_ROOT,
          auth: { apiKeys: e.API_KEYS, enabled: e.API_KEYS.length > 0 },
          rateLimit: {
            enabled: !e.RATE_LIMIT_DISABLED,
            ttlMs: e.RATE_LIMIT_TTL_MS,
            max: e.RATE_LIMIT_MAX,
          },
        };
      },
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
