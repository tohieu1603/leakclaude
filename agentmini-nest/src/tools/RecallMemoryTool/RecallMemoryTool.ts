import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { MemoryService } from '../../memory/memory.service';
import { RECALL_MEMORY_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  name: z.string().optional(),
});

@Injectable()
export class RecallMemoryTool implements Tool<typeof inputSchema> {
  readonly name = RECALL_MEMORY_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = true;

  constructor(private readonly memory: MemoryService) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    if (!input.name) {
      const all = await this.memory.list();
      if (all.length === 0) return ok('(no memories saved yet)');
      const lines = all.map((m) => `- ${m.name} [${m.type}] — ${m.description}`);
      return ok(`Memory catalogue (${all.length}):\n${lines.join('\n')}`);
    }
    const rec = await this.memory.read(input.name);
    if (!rec) return err(`No memory named "${input.name}"`);
    return ok(`# ${rec.name} (${rec.type})\n${rec.description}\n\n${rec.content}`);
  }
}
