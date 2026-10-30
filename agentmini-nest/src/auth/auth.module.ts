// Auth module: registers the ApiKeyGuard so any module that needs it can
// import it. The guard itself is wired globally in AppModule via
// APP_GUARD so every controller is protected by default.

import { Global, Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

@Global()
@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
