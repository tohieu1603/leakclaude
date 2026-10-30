import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { ToolsModule } from '../tools/tools.module';
import { CommandsModule } from '../services/commands/commands.module';
import { ChatController } from './chat.controller';
import { ClientSessionMap } from './client-session-map.service';

@Module({
  imports: [EngineModule, ToolsModule, CommandsModule],
  controllers: [ChatController],
  providers: [ClientSessionMap],
})
export class ChatModule {}
