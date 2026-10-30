import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ToolsModule } from '../tools/tools.module';
import { CompactionModule } from '../services/compaction/compaction.module';
import { StorageModule } from '../services/storage/storage.module';
import { QueryService } from './query.service';
import { SessionService } from './session.service';

@Module({
  imports: [AiModule, forwardRef(() => ToolsModule), CompactionModule, StorageModule],
  providers: [QueryService, SessionService],
  exports: [QueryService, SessionService],
})
export class EngineModule {}
