import { Inject, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule, APP_CONFIG, type AppConfig } from './config/config.module';
import { AiModule } from './ai/ai.module';
import { ToolsModule } from './tools/tools.module';
import { EngineModule } from './engine/engine.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { McpModule } from './mcp/mcp.module';
import { HooksModule } from './hooks/hooks.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SkillsModule } from './skills/skills.module';
import { MemoryModule } from './memory/memory.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    // ThrottlerModule reads the per-route limits from config so a single env
    // var change covers the whole app. When RATE_LIMIT_DISABLED=1 we use a
    // ridiculously high cap so the module is effectively a no-op without
    // having to short-circuit each route.
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ([
        {
          name: 'default',
          ttl: config.rateLimit.ttlMs,
          limit: config.rateLimit.enabled ? config.rateLimit.max : 1_000_000,
        },
      ]),
    }),
    HooksModule,
    PermissionsModule,
    SkillsModule,
    MemoryModule,
    SchedulerModule,
    AiModule,
    ToolsModule,
    EngineModule,
    AgentsModule,
    ChatModule,
    McpModule,
  ],
  providers: [
    // Global guards — order matters: ThrottlerGuard runs first so brute-force
    // attempts on the auth header are also rate-limited, then ApiKeyGuard
    // checks the credential.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {
  // Forces the config to resolve at module construction so any env errors
  // surface at boot rather than at first request.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(@Inject(APP_CONFIG) _cfg: AppConfig) {}
}
