import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { MemoryService } from '../../memory/memory.service';
import { FORGET_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({ name: z.string().min(1) });

@Injectable()
export class ForgetTool implements Tool<typeof inputSchema> {
  readonly name = FORGET_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(private readonly memory: MemoryService) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const removed = await this.memory.delete(input.name);
    if (!removed) return err(`No memory named "${input.name}"`);
    return ok(`Forgot memory: ${input.name}`);
  }
}
