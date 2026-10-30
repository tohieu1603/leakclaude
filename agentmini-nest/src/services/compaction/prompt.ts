// Compact summary prompt. Modeled on Claude Code's services/compact/prompt.ts —
// asks the model for a chronological structured summary that preserves intent,
// files, errors, and pending tasks so the new conversation can continue.

export const COMPACT_PROMPT = `Your task is to create a detailed summary of the conversation so far, paying close attention to the user's explicit requests and your previous actions.
This summary should be thorough in capturing technical details, code patterns, and architectural decisions that would be essential for continuing development work without losing context.

Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts. In your analysis process:

1. Chronologically analyze each message and section of the conversation. For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like file names, full code snippets, function signatures, file edits
   - Errors that you ran into and how you fixed them
   - Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
2. Double-check for technical accuracy and completeness, addressing each required element thoroughly.

Your summary should include the following sections:

1. Primary Request and Intent: Capture all of the user's explicit requests and intents in detail
2. Key Technical Concepts: List all important technical concepts, technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Include full code snippets where applicable.
4. Errors and fixes: List all errors you ran into, and how you fixed them. Pay special attention to specific user feedback.
5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
6. All user messages: List ALL user messages that are not tool results. These are critical for understanding feedback and changing intent.
7. Pending Tasks: Outline any pending tasks that you have explicitly been asked to work on.
8. Current Work: Describe in detail what was being worked on immediately before this summary request.
9. Optional Next Step: List the next step that is DIRECTLY in line with the user's most recent explicit requests. If your last task was concluded, only list next steps if explicitly in line with the user's request.

Output format:

<analysis>
[Your thought process]
</analysis>

<summary>
1. Primary Request and Intent: ...
2. Key Technical Concepts: ...
3. Files and Code Sections: ...
4. Errors and fixes: ...
5. Problem Solving: ...
6. All user messages: ...
7. Pending Tasks: ...
8. Current Work: ...
9. Optional Next Step: ...
</summary>

CRITICAL: Respond with TEXT ONLY. Do NOT call any tools. You already have all the context you need in the conversation above.`;

// Strip the <analysis> scratchpad and return only the final <summary> body.
export function extractSummary(raw: string): string {
  const summaryMatch = raw.match(/<summary>([\s\S]*?)<\/summary>/i);
  if (summaryMatch) return summaryMatch[1].trim();
  // No tags — fall back to stripping <analysis> if present, else the raw text.
  return raw.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '').trim() || raw.trim();
}
