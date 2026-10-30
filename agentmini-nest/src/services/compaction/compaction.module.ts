import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { CompactionService } from './compaction.service';

@Module({
  imports: [AiModule],
  providers: [CompactionService],
  exports: [CompactionService],
})
export class CompactionModule {}
