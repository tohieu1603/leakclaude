import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { MemoryService } from '../../memory/memory.service';
import { REMEMBER_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().min(1).max(200),
  type: z.enum(['user', 'feedback', 'project', 'reference']),
  content: z.string().min(1),
});

@Injectable()
export class RememberTool implements Tool<typeof inputSchema> {
  readonly name = REMEMBER_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(private readonly memory: MemoryService) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    try {
      const r = await this.memory.write(input);
      return ok(`Saved memory: ${r.name} (${r.type}) → ${r.path}`);
    } catch (e) {
      return err(`Failed to save memory: ${(e as Error).message}`);
    }
  }
}
