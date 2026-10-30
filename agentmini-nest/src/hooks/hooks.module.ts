import { Global, Module } from '@nestjs/common';
import { HooksService } from './hooks.service';

// Global so any module (engine, tools, chat) can inject HooksService without
// re-importing HooksModule everywhere.
@Global()
@Module({
  providers: [HooksService],
  exports: [HooksService],
})
export class HooksModule {}
