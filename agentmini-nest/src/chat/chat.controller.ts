// POST /api/chat — accepts a message and streams SSE events.
// If the message starts with "/", route to the slash-command registry instead
// of the LLM. Plumbs an AbortController to the engine so client disconnect
// cancels in-flight tools (Bash, WebFetch, WebSearch, Sleep all honor it).

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { QueryService } from '../engine/query.service';
import { SessionService } from '../engine/session.service';
import { TodoStore } from '../tools/TodoWriteTool/todo-store.service';
import { ToolRegistry } from '../tools/tool-registry.service';
import { CommandRegistry } from '../services/commands/command-registry.service';
import type { CommandResult } from '../services/commands/command.interface';
import { ClientSessionMap } from './client-session-map.service';
import { HooksService } from '../hooks/hooks.service';
import { UserQuestionBus } from '../tools/shared/user-question-bus.service';
import type { SSEEvent, UserContentPart } from '../common/types';

// Image input: array of URLs (http(s)://, data:image/...;base64,..., or file://).
// Vision-capable models receive these as content_parts; non-vision models
// ignore them (OpenAI-compat behavior).
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(20_000),
  sessionId: z.string().uuid().nullish().transform((v) => v ?? undefined),
  images: z
    .array(
      z.union([
        z.string().min(1),
        z.object({
          url: z.string().min(1),
          detail: z.enum(['low', 'high', 'auto']).optional(),
        }),
      ]),
    )
    .max(10)
    .optional(),
});

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly query: QueryService,
    private readonly sessions: SessionService,
    private readonly todos: TodoStore,
    private readonly registry: ToolRegistry,
    private readonly commands: CommandRegistry,
    private readonly clients: ClientSessionMap,
    private readonly hooks: HooksService,
    private readonly questions: UserQuestionBus,
  ) {}

  // Client posts to this endpoint to answer an outstanding AskUserQuestion.
  @Post('answer')
  async answer(@Body() body: unknown): Promise<{ ok: boolean; error?: string }> {
    const schema = z.object({
      questionId: z.string().min(1),
      choices: z.array(z.string()).min(1),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
    }
    const ok = this.questions.answer(parsed.data.questionId, parsed.data.choices);
    return ok ? { ok: true } : { ok: false, error: 'Unknown or already-answered questionId' };
  }

  @Get('stats')
  async stats() {
    const persisted = await this.sessions.list();
    return {
      activeSessions: this.sessions.count(),
      persistedSessions: persisted.length,
      tools: this.registry.names(),
      commands: this.commands.list().map((c) => '/' + c.name),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('sessions')
  async listSessions() {
    return { sessions: await this.sessions.list() };
  }

  @Delete(':sessionId')
  async clear(@Param('sessionId') sessionId: string) {
    this.todos.clearSession(sessionId);
    return this.sessions.reset(sessionId);
  }

  @Post()
  async chat(@Req() req: Request, @Res() res: Response, @Body() body: unknown): Promise<void> {
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Resolve sessionId: explicit body > header X-Session-Id > per-client last-session map.
    // This makes consecutive curl calls Just Work without the user threading sessionId.
    const clientId = this.clients.resolveClientId(req);
    const headerSessionId = req.header('x-session-id');
    const resolvedSessionId =
      parsed.data.sessionId ?? headerSessionId ?? this.clients.get(clientId) ?? undefined;

    const wasResumed = !!resolvedSessionId;
    const session = await this.sessions.getOrCreate(resolvedSessionId);
    this.clients.set(clientId, session.id);
    this.todos.setActiveSession(session.id);
    sendSSE(res, { type: 'session_id', sessionId: session.id });

    // SessionStart hook (fire-and-forget — hook errors must not block chat)
    void this.hooks.run({ event: 'SessionStart', sessionId: session.id, resumed: wasResumed });

    // Slash command routing: bypass the LLM entirely
    const parsedCmd = CommandRegistry.parse(parsed.data.message);
    if (parsedCmd) {
      try {
        const result = await this.commands.dispatch(parsedCmd.name, parsedCmd.args, {
          session,
          messages: session.apiMessages,
          cumulative: session.cumulative,
        });
        // /compact rewrites apiMessages in-place — persist the new transcript
        if (result.type === 'compact') {
          await this.sessions.persistAfterCompaction(session, {
            before: result.before,
            after: result.after,
            freedTokens: result.freedTokens,
            manual: true,
          });
        }
        emitCommandResult(res, result);
      } catch (e) {
        sendSSE(res, { type: 'error', message: `Command failed: ${(e as Error).message}` });
      } finally {
        sendSSE(res, { type: 'done', inputTokens: 0, outputTokens: 0, turns: 0 });
        res.end();
      }
      return;
    }

    // UserPromptSubmit hook — may inject additional context as a system
    // reminder, or deny the whole prompt with a reason. Runs BEFORE we
    // persist the user message so a denied prompt never enters history.
    const submitHook = await this.hooks.run({
      event: 'UserPromptSubmit',
      sessionId: session.id,
      message: parsed.data.message,
    });
    if (submitHook.decision === 'deny') {
      sendSSE(res, {
        type: 'error',
        message: submitHook.reason ?? 'Prompt blocked by UserPromptSubmit hook.',
      });
      sendSSE(res, { type: 'done', inputTokens: 0, outputTokens: 0, turns: 0 });
      res.end();
      return;
    }

    // Regular chat path — persist the user message first. If the client sent
    // images, build a multi-part content array so vision-capable models can see
    // them; otherwise keep the plain-string form for backwards compatibility.
    const userContent: string | UserContentPart[] = parsed.data.images?.length
      ? [
          { type: 'text' as const, text: parsed.data.message },
          ...parsed.data.images.map((img): UserContentPart =>
            typeof img === 'string'
              ? { type: 'image_url', image_url: { url: img } }
              : { type: 'image_url', image_url: img },
          ),
        ]
      : parsed.data.message;
    await this.sessions.appendUser(session, userContent);
    // If a hook produced extra context, inject it as a system-reminder user
    // message so the model picks it up on this turn but it doesn't pollute the
    // user-visible transcript.
    if (submitHook.additionalContext) {
      session.apiMessages.push({
        role: 'user',
        content: `<system-reminder>${submitHook.additionalContext}</system-reminder>`,
      });
    }
    // Track where the next persist-on-append window starts (right after user msg)
    let nextPersistIdx = session.apiMessages.length;

    // Plumb client-disconnect into an AbortSignal that the engine + every tool sees
    const ctrl = new AbortController();
    req.on('close', () => ctrl.abort(new Error('client disconnected')));

    // Register a question emitter for this session so AskUserQuestion calls
    // mid-turn surface to this SSE stream. Deregister on close so a later
    // request for the same session doesn't see stale handlers.
    const unsubscribeQuestions = this.questions.registerEmitter(session.id, {
      emit: (q) =>
        sendSSE(res, {
          type: 'ask_user',
          questionId: q.id,
          question: q.question,
          options: q.options,
          multiSelect: q.multiSelect,
        }),
    });
    req.on('close', unsubscribeQuestions);

    let inputTokens = 0;
    let outputTokens = 0;
    try {
      for await (const event of this.query.run({
        messages: session.apiMessages,
        signal: ctrl.signal,
        sessionId: session.id,
        onMessageAppended: async (idx) => {
          // Persist any message at-or-after the last checkpoint
          if (idx >= nextPersistIdx) {
            await this.sessions.persistMessages(session, nextPersistIdx);
            nextPersistIdx = session.apiMessages.length;
          }
        },
        onCompacted: async (stats) => {
          await this.sessions.persistAfterCompaction(session, stats);
          // Reset checkpoint — apiMessages was rewritten in place
          nextPersistIdx = session.apiMessages.length;
        },
      })) {
        if (ctrl.signal.aborted) break;
        sendSSE(res, event);
        if (event.type === 'done') {
          inputTokens = event.inputTokens;
          outputTokens = event.outputTokens;
        }
      }
      await this.sessions.recordTurnUsage(session, inputTokens, outputTokens);
      // Stop hook — fire-and-forget end-of-turn notification
      void this.hooks.run({
        event: 'Stop',
        sessionId: session.id,
        turns: 0,
        inputTokens,
        outputTokens,
      });
    } catch (e) {
      // Defense in depth — engine usually catches its own errors and emits SSE events
      const msg = e instanceof Error ? e.message : String(e);
      sendSSE(res, { type: 'error', message: msg });
    } finally {
      res.end();
    }
  }
}

function sendSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Render a CommandResult as one or more SSE events. We map all non-streaming
// command output to text_delta so existing frontends can consume it without
// special-casing. 'compact' / 'cleared' results also emit a typed signal event
// so UIs that care can update their session state.
function emitCommandResult(res: Response, r: CommandResult): void {
  switch (r.type) {
    case 'text':
      sendSSE(res, { type: 'text_delta', text: r.value });
      return;
    case 'compact':
      sendSSE(res, {
        type: 'tool_result',
        toolName: 'Compact',
        toolId: 'manual-compact',
        content: `Compacted: ${r.before} → ${r.after} tokens (freed ${r.freedTokens})`,
        isError: false,
      });
      sendSSE(res, { type: 'text_delta', text: r.summaryText });
      return;
    case 'cleared':
      sendSSE(res, {
        type: 'tool_result',
        toolName: 'Clear',
        toolId: 'manual-clear',
        content: `Conversation cleared (session ${r.sessionId}).`,
        isError: false,
      });
      return;
  }
}
