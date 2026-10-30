// TodoWrite — session-scoped task list. Modeled on Claude Code's TodoWriteTool.
// The store's active session is set by the chat controller before each turn.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { DESCRIPTION, PROMPT, TODO_WRITE_TOOL_NAME } from './prompt';
import { TodoStore } from './todo-store.service';

const todoSchema = z.strictObject({
  content: z.string().min(1).describe('Imperative form, e.g. "Run tests"'),
  activeForm: z.string().min(1).describe('Present continuous form, e.g. "Running tests"'),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

const inputSchema = z.strictObject({
  todos: z.array(todoSchema).describe('The updated todo list'),
});

@Injectable()
export class TodoWriteTool implements Tool<typeof inputSchema> {
  readonly name = TODO_WRITE_TOOL_NAME;
  // Use both the description and the prompt — the description goes into the
  // tool definition top line, the prompt extends it with the usage guide.
  readonly prompt = `${DESCRIPTION}\n\n${PROMPT}`;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(private readonly store: TodoStore) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    const sessionId = this.store.getActiveSession();
    if (!sessionId) {
      return err('No active session. The TodoWrite tool can only be invoked from within a chat session.');
    }
    // Enforce the "exactly one in_progress" invariant
    const inProgress = input.todos.filter((t) => t.status === 'in_progress').length;
    if (inProgress > 1) {
      return err(`Invalid todo list: ${inProgress} tasks are in_progress. Only ONE task may be in_progress at a time.`);
    }
    this.store.setTodos(sessionId, input.todos);
    return ok(
      'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable.',
    );
  }
}
