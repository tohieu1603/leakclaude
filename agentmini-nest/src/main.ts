// Bootstrap the NestJS app and print the agent banner.

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONFIG, type AppConfig } from './config/config.module';
import { ToolRegistry } from './tools/tool-registry.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });
  app.enableCors({ origin: '*', credentials: true });
  app.enableShutdownHooks();

  const config = app.get<AppConfig>(APP_CONFIG);
  const registry = app.get(ToolRegistry);

  await app.listen(config.server.port);

  const log = new Logger('AgentMini-Nest');
  log.log('-----------------------------------------');
  log.log(`URL    : http://localhost:${config.server.port}`);
  log.log(`Model  : ${config.ai.model}`);
  log.log(`Tools  : ${registry.names().join(', ')}`);
  log.log(`Env    : ${config.server.env}`);
  log.log('-----------------------------------------');
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[Bootstrap]', e);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[UnhandledRejection]', reason);
});
