"""English content for the AgentMini-Nest project report — detailed edition.

Mirrors the Vietnamese version section-by-section. Academic tone, no icons.
"""
from __future__ import annotations

from pathlib import Path

from report_builder import (CodeListingSpec, FigureSpec, Report, Section,
                             TableSpec)

FIG_DIR = Path(__file__).resolve().parent.parent / "docs" / "figures"


def get_report() -> Report:
    chapters = [
        _ch1(), _ch2(), _ch3(), _ch4(), _ch5(),
        _ch6(), _ch7(), _ch8(), _ch9(), _ch10(),
        _ch11(), _appendix(),
    ]
    return Report(
        title="AgentMini-Nest",
        subtitle="A minimal NestJS-based AI agent server with tool calling, session persistence, and context compaction",
        author="Student: <Full name>          Supervisor: <Full name>",
        institution="University Name – Faculty of Information Technology",
        year="Academic year 2025 – 2026",
        abstract=(
            "This report presents the analysis, design, and implementation of a minimal "
            "AI agent server named AgentMini-Nest. The system applies a simplified "
            "architecture based on async generators to model the agent loop used by "
            "production systems such as Claude Code and LangGraph, while keeping the "
            "scope compact and self-contained, free of large framework dependencies. "
            "It provides twelve core tools for filesystem, shell, network, and to-do "
            "management; eight slash commands for conversation control; an automatic "
            "context-compaction mechanism that triggers above 171,000 tokens; a "
            "persistence layer that stores each conversation as a JSONL transcript on "
            "disk so sessions can be resumed across server restarts; a per-client "
            "session map that lets clients continue a conversation without manually "
            "passing a session identifier; an end-to-end abort signal from the HTTP "
            "interface down to every tool; and a tool-call dedup guard that prevents "
            "weaker models from entering infinite loops. The codebase is written in "
            "TypeScript on the NestJS framework with about 3,000 lines and has been "
            "validated through seven smoke-test scenarios, three compaction scenarios, "
            "two mid-turn cancellation scenarios, and one dedup scenario, all "
            "successfully. The report compares the chosen approach with Claude Code, "
            "LangChain, and OpenAI Assistants, analyses the design trade-offs, and "
            "lists future work including Model Context Protocol support, sub-agent "
            "spawning via a Task tool, vector-database integration, and an "
            "authentication layer for multi-user deployments."
        ),
        keywords=[
            "AI agent", "NestJS", "tool calling", "async generator",
            "context compaction", "Server-Sent Events", "session persistence",
            "TypeScript", "dependency injection", "Model Context Protocol",
        ],
        table_label="Table",
        figure_label="Figure",
        abstract_label="Abstract",
        keywords_label="Keywords",
        toc_label="Table of Contents",
        list_tables_label="List of Tables",
        list_figures_label="List of Figures",
        references_label="References",
        references=_references(),
        chapters=chapters,
        acknowledgement_title="Acknowledgements",
        acknowledgement_text=(
            "I would like to express my sincere gratitude to my supervisor for the "
            "valuable guidance throughout the project. The thoughtful suggestions "
            "and timely direction were a constant source of motivation.\n\n"
            "I also thank the faculty members of the Faculty of Information "
            "Technology for the solid foundation they have given me during my "
            "studies, and my family and friends for their unwavering support.\n\n"
            "Although I have done my best to refine the project, limitations of "
            "time and experience mean the report inevitably contains shortcomings. "
            "I welcome any constructive feedback from the reviewers."
        ),
        declaration_title="Declaration of Originality",
        declaration_text=(
            "I hereby declare that the graduation project entitled AgentMini-Nest "
            "is my own work conducted under the supervision of my advisor. All "
            "source code, design artefacts, and report content were produced by "
            "me. References to materials from Anthropic, OpenAI, NestJS, and other "
            "open-source projects have been fully cited in the references "
            "section. I take full responsibility for any breach of academic "
            "integrity."
        ),
        abbreviations_title="List of Abbreviations",
        abbreviations=[
            ("AI", "Artificial Intelligence"),
            ("API", "Application Programming Interface"),
            ("CLI", "Command-Line Interface"),
            ("DI", "Dependency Injection"),
            ("HTTP", "Hypertext Transfer Protocol"),
            ("HTTPS", "HTTP Secure"),
            ("JSON", "JavaScript Object Notation"),
            ("JSONL", "JSON Lines — one JSON record per line"),
            ("JWT", "JSON Web Token"),
            ("LLM", "Large Language Model"),
            ("MCP", "Model Context Protocol"),
            ("REST", "Representational State Transfer"),
            ("SDK", "Software Development Kit"),
            ("SSE", "Server-Sent Events"),
            ("TTL", "Time To Live"),
            ("UML", "Unified Modeling Language"),
            ("URL", "Uniform Resource Locator"),
            ("UUID", "Universally Unique Identifier"),
        ],
    )


# ── Chapter 1 ────────────────────────────────────────────────────────────────

def _ch1() -> Section:
    s = Section(title="Chapter 1: Introduction", level=1)
    s.children.append(Section(title="1.1. Research background", level=2, paragraphs=[
        "Over the past few years, large language models have evolved rapidly from "
        "simple text summarisers into agents capable of invoking tools to perform "
        "concrete tasks such as reading and writing files, executing shell commands, "
        "fetching information from the web, or maintaining task lists. Tool calling "
        "has been standardised around the OpenAI specification and is supported by "
        "many providers, opening up a new interaction model: the language model is "
        "no longer just a respondent but actively orchestrates other software "
        "components to accomplish the user's intent.",

        "The emergence of products such as Claude Code, Cursor, GitHub Copilot "
        "Workspace, and OpenAI Assistants demonstrates this shift. They combine "
        "three components: a language model as the brain, a registry of callable "
        "tools, and an orchestration loop that maintains state, handles errors, "
        "and manages the context window. Each component raises its own technical "
        "challenges, from streaming throughput to context-window limits, from "
        "safe code execution on the user's machine to fault tolerance when the "
        "model disconnects or returns invalid data.",

        "However, most commercial offerings are closed-source or rely on "
        "framework libraries such as LangChain and LangGraph that pull in large "
        "dependency trees with complex configuration. For a learner or a small "
        "team that wants to understand the inner workings of an AI agent, "
        "rebuilding the system from primitive components delivers more "
        "pedagogical and practical value than wiring up an existing framework.",

        "Furthermore, every organisation has its own security, logging, and "
        "integration requirements; a system whose architecture is fully owned is "
        "easier to adapt than a general-purpose library. For instance, some "
        "organisations require every conversation to be stored locally for "
        "auditing; others require sandboxing for Bash commands. These "
        "requirements are difficult to fulfil when relying solely on a cloud "
        "service such as OpenAI Assistants.",

        "From a teaching standpoint, the project provides a reference product "
        "with a structure small enough to be read in a single university course "
        "while still illustrating all the core components of a real AI agent — "
        "a noticeable difference from many minimal demonstrations that cover "
        "only one or two features.",
    ]))

    s.children.append(Section(title="1.2. Problem statement", level=2, paragraphs=[
        "Building a tool-augmented AI agent requires solving the following "
        "technical problems: designing a uniform tool interface that supports "
        "easy extension, defining a streaming protocol that delivers responses "
        "in real time, ensuring safety when the model emits invalid data, "
        "managing token cost as conversations grow, persisting and resuming "
        "conversation history across restarts, and releasing resources when "
        "the client disconnects mid-turn.",

        "Each problem has multiple solutions. Choosing the right one for the "
        "scope and scale is a practical design exercise. AgentMini-Nest makes a "
        "consistent set of choices: async generators for the agent loop, "
        "NestJS dependency injection for tool registration, JSONL for "
        "persistence, AbortController for cancellation, and Zod for input "
        "validation.",
    ]))

    s.children.append(Section(title="1.3. Specific objectives", level=2,
        paragraphs=["On this basis, the project sets out the following specific objectives:"],
        bullets=[[
            "Expose an HTTP endpoint that streams Server-Sent Events so clients "
            "receive text deltas, tool invocations, and tool results in real "
            "time without WebSocket programming.",
            "Organise tools as plug-and-play units through NestJS dependency "
            "injection so that adding a new tool only requires registering a "
            "service class without modifying the core.",
            "Be fault tolerant: when the language model disconnects transiently, "
            "when a tool throws, when input is malformed, or when the user "
            "closes the connection, the system stays consistent and leaks no "
            "resources.",
            "Implement automatic and manual context compaction so that long "
            "conversations remain within the model's context window.",
            "Persist each conversation to disk as a JSONL transcript that is "
            "human-readable and support resume across server restarts and JSON "
            "export.",
            "Support automatic session continuity: clients can issue several "
            "consecutive calls without supplying sessionId; the server matches "
            "the latest session per client.",
            "Provide a slash-command system for meta operations such as cost "
            "inspection, manual compaction, session reset, tool listing, and "
            "transcript export.",
            "Keep the source layout aligned with the single-responsibility "
            "principle so that the project can be read, tested, and extended.",
            "Ship a command-line client that lets users interact comfortably "
            "without typing complex curl commands.",
        ]]))

    s.children.append(Section(title="1.4. Scope and limitations", level=2, paragraphs=[
        "The system targets single-user to small multi-user use cases in "
        "development or internal environments. It does not cover large-scale "
        "commercial concerns such as OAuth or API-key authentication, "
        "horizontal load balancing, per-session sandbox isolation, billing-quota "
        "management, or enterprise-grade audit logging.",
        "No graphical front-end for end users is built, since the focus is "
        "the server side. A simple HTML page based on the Server-Sent Events "
        "interface can be added quickly but is out of scope.",
        "Model Context Protocol support and sub-agent spawning via a Task "
        "tool are listed as future work in the conclusion. Vector-database "
        "integration is mentioned conceptually but not implemented, since "
        "common code-agent use cases are well served by Glob and Grep over "
        "the filesystem.",
        "The system is tested against OpenAI-compatible endpoints only; "
        "providers using different protocols such as Anthropic, Google Gemini, "
        "or Cohere are not supported directly — they would require a separate "
        "adapter layer, which is left as an extension.",
    ]))

    s.children.append(Section(title="1.5. Contributions", level=2, paragraphs=[
        "The report makes three main contributions. First, it provides a "
        "complete codebase covering the core features of a modern AI agent, "
        "structured for clarity and suitable as a reference in undergraduate "
        "courses. Second, it analyses the key design decisions of larger "
        "systems such as Claude Code and contrasts them with the alternatives "
        "offered by LangChain. Third, it presents experimental results with "
        "the kimi-k2.5 model via an OpenAI-compatible interface, showing "
        "practical issues with weaker models (such as tool-call loops) and "
        "the mitigations applied.",
    ]))

    s.children.append(Section(title="1.6. Report structure", level=2, paragraphs=[
        "The remainder of the report is organised into eleven chapters and an "
        "appendix. Chapter 2 covers the theoretical foundations. Chapter 3 "
        "surveys related products. Chapter 4 captures functional and "
        "non-functional requirements together with actors and use cases. "
        "Chapter 5 presents the architectural design through component, "
        "sequence, state, class, and deployment diagrams. Chapter 6 documents "
        "the implementation with representative listings. Chapter 7 reports "
        "the test plan and results. Chapter 8 covers deployment, monitoring, "
        "and maintenance. Chapter 9 evaluates functionality, performance, and "
        "fault tolerance. Chapter 10 serves as a user manual. Chapter 11 "
        "concludes and proposes future directions. The appendix lists tool, "
        "command, environment-variable, and HTTP-endpoint references.",
    ]))
    return s


# ── Chapter 2 ────────────────────────────────────────────────────────────────

def _ch2() -> Section:
    s = Section(title="Chapter 2: Theoretical background", level=1)

    s.children.append(Section(title="2.1. Async generators", level=2, paragraphs=[
        "An async generator is a JavaScript and TypeScript language feature "
        "that lets a function yield multiple values over time by combining "
        "the async and yield keywords. An async-star function returns an "
        "object that satisfies both the async-iterable and async-iterator "
        "protocols. Consumers iterate values with for await of; each "
        "iteration corresponds to one yielded value. When the loop ends, the "
        "language runtime cleans up resources held by the generator.",

        "Applied to an agent loop, async generators decouple the production "
        "phase from the consumption phase. The consumer can pause, redirect, "
        "or stop the loop without complex coordination on the producer side. "
        "Events from the upstream language model can therefore flow directly "
        "into the downstream Server-Sent-Events stream without intermediate "
        "buffering.",

        "When the client disconnects, the for-await loop unwinds and the "
        "generator is finalised, allowing the producer to react to a "
        "cancellation signal and stop in-flight work. In this project, the "
        "agent loop is defined as an async generator in QueryService. The "
        "HTTP controller iterates the generator and pushes each event onto "
        "the Server-Sent-Events stream. When the client closes, an "
        "AbortController fires; the generator checks the signal at each turn "
        "boundary and exits cleanly.",

        "Compared with callback or Promise-based alternatives, async "
        "generators offer three important advantages: code reads close to "
        "linear sequential code; resources are released automatically through "
        "the iterator return mechanism; and they support unbounded streams "
        "without buffering. The minimal listing below shows the shape of the "
        "loop.",
    ], listings=[CodeListingSpec(
        caption="Minimal skeleton of an async-generator agent loop",
        language="TypeScript",
        code=(
            "async function* runAgent(messages, signal) {\n"
            "  for (let turn = 0; turn < MAX_TURNS; turn++) {\n"
            "    if (signal.aborted) break;\n"
            "    // 1. Call the model, accumulate the response stream\n"
            "    for await (const chunk of aiClient.stream({ messages })) {\n"
            "      if (chunk.type === 'text_delta')\n"
            "        yield { type: 'text_delta', text: chunk.text };\n"
            "      else if (chunk.type === 'tool_call')\n"
            "        toolCalls.push(chunk);\n"
            "    }\n"
            "    if (toolCalls.length === 0) break;\n"
            "    // 2. Execute all tool calls\n"
            "    for (const tc of toolCalls) {\n"
            "      const result = await registry.execute(tc.name, tc.args, signal);\n"
            "      yield { type: 'tool_result', ...result };\n"
            "      messages.push({ role: 'tool', content: result.content,\n"
            "                       tool_call_id: tc.id });\n"
            "    }\n"
            "  }\n"
            "}"
        ),
    )]))

    s.children.append(Section(title="2.2. Tool calling on language models", level=2, paragraphs=[
        "Modern language models support tool calling through an OpenAI-style "
        "tool specification consisting of a function name, a description, and "
        "a JSON schema for the parameters. The model decides when to invoke a "
        "tool from the conversational context; when it does so, it emits a "
        "tool_call block carrying a unique identifier, the tool name, and a "
        "JSON-encoded argument string.",

        "The server-side coordinator parses the string, validates it against "
        "the matching Zod schema, runs the tool, and feeds the result back to "
        "the model as a tool-role message keyed by tool_call_id. The loop "
        "iterates until the model stops emitting tool calls.",

        "In streaming mode, the OpenAI specification states that tool_call "
        "argument fragments may arrive in pieces. The coordinator must "
        "accumulate them per index and process them after the finish_reason "
        "signal. To receive token-usage statistics in streaming mode, the "
        "stream_options.include_usage flag must be true; without it, OpenAI-"
        "compatible providers do not emit usage events.",

        "An empirical detail: the last streamed chunk has an empty choices "
        "array and a populated usage field. A naive implementation that gates "
        "on choices[0] discards it, losing cost data. The AiService class in "
        "the project reads chunk.usage regardless of whether choices is "
        "present.",
    ]))

    s.children.append(Section(title="2.3. The NestJS dependency-injection model", level=2, paragraphs=[
        "NestJS borrows the dependency-injection pattern from Angular: "
        "classes are decorated Injectable and resolved from a root module. "
        "Modules group imports, providers, controllers, and exports. Multi-"
        "providers under a shared token allow a registry to gather every "
        "instance of a tagged class into a single array.",
        "In this project the TOOL token collects the twelve tools into one "
        "list that ToolRegistry walks at startup. The same pattern is used "
        "by SLASH_COMMAND for chat commands. This approach offers three "
        "advantages: adding a new tool only requires declaring a class and "
        "listing it in providers; tools can declare their own dependencies "
        "in the constructor; and types remain statically checked.",
        "A subtle technical detail: NestJS decorators rely on metadata "
        "emitted at compile time, controlled by the emitDecoratorMetadata "
        "tsconfig flag. At the time of development, tsx did not emit this "
        "metadata reliably, so the project uses ts-node-dev for development "
        "and tsc for production.",
    ]))

    s.children.append(Section(title="2.4. Server-Sent Events", level=2, paragraphs=[
        "Server-Sent Events is a unidirectional message-passing mechanism "
        "over a long-lived HTTP connection. Each event is text framed with "
        "the data: prefix and terminated by two newlines. Browsers parse "
        "events automatically through the EventSource object. When using a "
        "CLI such as curl, the -N flag is required to disable output "
        "buffering.",
        "Compared with WebSocket, Server-Sent Events are simpler on the "
        "client, require no special library, and fit one-directional text "
        "streaming such as live model completions. In this project, "
        "cancellation is detected via the close event of the Express "
        "request, eliminating the need for a reverse channel.",
        "The event format used by the project is JSON inside the data "
        "field of each SSE frame. Each event carries a type discriminator "
        "and the relevant payload fields, letting clients clearly "
        "distinguish text_delta, tool_start, tool_result, turn_error, and "
        "done.",
    ], listings=[CodeListingSpec(
        caption="An actual fragment of an SSE response stream",
        language="text",
        code=(
            "data: {\"type\":\"session_id\",\"sessionId\":\"4f93494e-...\"}\n"
            "\n"
            "data: {\"type\":\"tool_start\",\"toolName\":\"Bash\",\n"
            "  \"toolId\":\"Bash:0\",\"input\":{\"command\":\"find src -name '*.ts' | wc -l\"}}\n"
            "\n"
            "data: {\"type\":\"tool_result\",\"toolName\":\"Bash\",\n"
            "  \"toolId\":\"Bash:0\",\"content\":\"Exit code: 0\\n\\nSTDOUT:\\n      61\\n\",\n"
            "  \"isError\":false}\n"
            "\n"
            "data: {\"type\":\"text_delta\",\"text\":\"There are 61 .ts files.\"}\n"
            "\n"
            "data: {\"type\":\"done\",\"inputTokens\":4387,\"outputTokens\":336,\"turns\":2}"
        ),
    )]))

    s.children.append(Section(title="2.5. Context window limits and history compaction", level=2, paragraphs=[
        "Every language model has an upper bound on the total tokens "
        "accepted in a single request, called the context window. Modern "
        "models offer windows from 128,000 to 200,000 tokens. As "
        "conversations grow, the cumulative token count can exceed safe "
        "limits, leading to outright errors or arbitrary truncation.",
        "Compaction is the technique of asking the model to summarise the "
        "older portion of the conversation and replacing that portion with "
        "a single summary message, while keeping the most recent messages "
        "verbatim. There are two levels. The lightweight level, "
        "microCompact, does not call the model and only trims oversized "
        "tool results. The full level, compact, sends a request to the "
        "model with a summarisation prompt.",
        "The auto-compaction threshold in this project is 171,000 tokens, "
        "computed as the standard 200,000-token window minus 16,000 for "
        "the response and 13,000 as a safety buffer. When the total "
        "exceeds the threshold, microCompact runs first; if still over, "
        "the full compaction runs.",
        "An important practical concern when compacting is preserving "
        "structural validity. The history must not be cut in the middle of "
        "an assistant tool_calls / tool message pair, since that would "
        "confuse the model on the next turn. The project handles this by "
        "dropping leading tool-role messages from the tail until a "
        "user/assistant boundary is reached.",
    ]))

    s.children.append(Section(title="2.6. Zod schemas for input validation", level=2, paragraphs=[
        "Zod is a validation library centred on TypeScript: schemas are "
        "declared with chained calls and produce a static type at the same "
        "time. Each tool defines its parameter schema with z.strictObject, "
        "ensuring extraneous fields are rejected. The schema is then "
        "converted to JSON Schema with zod-to-json-schema for the model. "
        "The Zod type is also used statically inside the call() method, "
        "keeping validation and execution in sync.",
        "An empirical observation is that many language models emit JSON "
        "null for optional fields rather than omitting them. Zod's "
        "optional() rejects null, which would push the model into a retry "
        "loop. To work around this, ToolRegistry normalises the input by "
        "stripping top-level keys whose values are null before validation.",
        "In addition, Zod supports advanced features like transform, "
        "preprocess, and refine that allow complex checks inside the "
        "schema. For example, the Bash tool's timeout field is constrained "
        "to lie between 100 ms and 600,000 ms with .min and .max.",
    ]))

    s.children.append(Section(title="2.7. Cancellation propagation model", level=2, paragraphs=[
        "AbortController is a web-platform standard mechanism that lets the "
        "originator of a request cancel an in-flight task. AbortController "
        "carries an AbortSignal that can be passed into APIs that support "
        "cancellation: fetch, setTimeout (Node 20+), child_process, and "
        "various streams. When controller.abort() fires, the signal emits "
        "an abort event and any task using it stops.",
        "In Node.js, AbortSignal.any() is a utility that combines multiple "
        "signals into one; the combined signal aborts as soon as any of "
        "its sources aborts. This function is available from Node 20.3 "
        "onward; the project bundles a small polyfill for older versions.",
    ]))
    return s


# ── Chapter 3 ────────────────────────────────────────────────────────────────

def _ch3() -> Section:
    s = Section(title="Chapter 3: Survey of existing solutions", level=1)
    s.children.append(Section(title="3.1. Survey scope", level=2, paragraphs=[
        "This chapter surveys current AI agent solutions to identify the "
        "position AgentMini-Nest occupies and the trade-offs against the "
        "alternatives. The survey covers three representative products and "
        "evaluates them against ten technical criteria typical of a tool-"
        "augmented agent in an internal environment. Table 3.1 summarises "
        "the comparison; the following subsections discuss each option in "
        "more depth.",
    ]))
    s.tables.append(TableSpec(
        caption="Comparison of existing AI-agent solutions",
        headers=["Criterion", "Claude Code", "LangChain/LangGraph",
                 "OpenAI Assistants", "AgentMini-Nest"],
        rows=[
            ["Source code", "Closed (commercial CLI)", "Open (MIT)", "Closed (API)", "Open (this work)"],
            ["Agent loop", "Async generator", "State graph", "Built-in, opaque", "Async generator"],
            ["Parallel tool calls", "Yes (by category)", "Yes (per node config)", "Yes (limited)", "Yes (concurrencySafe flag)"],
            ["Auto compaction", "Yes (multi-level)", "User-implemented", "Yes (opaque)", "Yes (171K tokens, two levels)"],
            ["Out-of-memory persistence", "Yes (JSONL)", "Custom", "Yes (cloud)", "Yes (JSONL on disk)"],
            ["Built-in chat commands", "Yes (many)", "None", "None", "Yes (8)"],
            ["End-to-end cancellation", "Yes", "Per node", "Yes", "Yes"],
            ["MCP protocol", "Yes", "In development", "In development", "Not yet"],
            ["External dependencies", "Single bundle", "Very large", "OpenAI cloud", "About ten NPM packages"],
            ["Core modifiability", "No", "High (open)", "No", "High"],
        ],
        column_widths_cm=[3.4, 2.8, 3.0, 2.8, 3.0],
    ))
    s.children.append(Section(title="3.2. Claude Code", level=2, paragraphs=[
        "Claude Code is a commercial command-line tool developed by Anthropic, "
        "released in 2024 and continuously updated. The source is bundled into "
        "a single distributable file, so users cannot modify the core directly "
        "but can study it through de-obfuscated builds. Claude Code implements "
        "its agent loop as an async generator in query.ts, supports multi-level "
        "automatic compaction, registers tools through a buildTool helper, and "
        "persists each session as a JSONL file in the user configuration "
        "directory.",
        "Each tool in Claude Code declares rich metadata: searchHint, "
        "userFacingName, isReadOnly, isConcurrencySafe, maxResultSizeChars, "
        "getActivityDescription, toAutoClassifierInput, and more; the registry "
        "and rendering layers consume these fields to drive intelligent "
        "behaviour. Claude Code also features a skill system that can be "
        "activated per scenario such as bug fixing, documentation, or code "
        "review.",
        "The design of Claude Code is the direct inspiration for this project. "
        "AgentMini-Nest, however, drops features that are not essential for a "
        "server (terminal UI, filesystem permission management, skill and "
        "plugin systems, editor and Git integration), keeping the agent-loop "
        "core, the tool subsystem, the chat-command system, compaction, and "
        "persistence.",
    ]))
    s.children.append(Section(title="3.3. LangChain and LangGraph", level=2, paragraphs=[
        "LangChain is the most popular library for AI agent applications "
        "today, with Python and JavaScript versions. It offers building "
        "blocks: LLM, Prompt Template, Output Parser, Tool, Agent, Memory, "
        "Vector Store, Document Loader. LangGraph is an extension that "
        "models the agent loop as a state graph with conditional edges.",
        "LangChain's strength is breadth and a large community. Its "
        "drawbacks are a very large dependency footprint (tens to hundreds "
        "of NPM or Python packages depending on configuration), many "
        "abstractions that make runtime behaviour hard to predict, and a "
        "rapidly evolving API.",
        "For an educational project, layering many abstractions between "
        "the learner and the language model reduces insight. AgentMini-Nest "
        "writes directly against the OpenAI SDK and uses NestJS dependency "
        "injection in place of LangChain's bespoke abstractions. The "
        "resulting codebase is leaner and easier to adapt for internal "
        "scenarios.",
    ]))
    s.children.append(Section(title="3.4. OpenAI Assistants", level=2, paragraphs=[
        "OpenAI Assistants is a cloud platform in which conversation state, "
        "tool registries, and compaction logic are all managed on OpenAI "
        "servers. Users interact only through the API and have no deep "
        "access to the core. The language model runs on OpenAI's "
        "infrastructure; users do not have to worry about the context "
        "window, history compaction, or session storage — OpenAI handles "
        "these.",
        "This is convenient for end-user applications but unsuitable for an "
        "architecture-research project, since learners cannot observe the "
        "decisions made inside the agent loop. A practical concern is that "
        "all conversation history resides on the provider's infrastructure, "
        "which is at odds with data-residency or strict-confidentiality "
        "requirements. The tool surface is also limited to a few built-in "
        "tools and webhook-based extensions.",
    ]))
    s.children.append(Section(title="3.5. Discussion and positioning", level=2, paragraphs=[
        "Table 3.1 compares the four options across ten criteria. "
        "AgentMini-Nest occupies a position simpler than LangChain, more "
        "open than Claude Code, and more flexible than OpenAI Assistants. "
        "The trade-offs are a smaller feature surface and the absence of "
        "the MCP protocol; both are revisited in the conclusion.",
        "On the source side, AgentMini-Nest is roughly 3,000 lines of "
        "TypeScript versus tens of thousands for LangChain or hundreds of "
        "thousands for de-obfuscated Claude Code. This scale fits a "
        "graduation-project budget while still illustrating every core "
        "component.",
    ]))
    return s


# ── Chapter 4 ────────────────────────────────────────────────────────────────

def _ch4() -> Section:
    s = Section(title="Chapter 4: Requirements analysis", level=1)
    s.figures.append(FigureSpec(
        caption="System context diagram with the system boundary and external actors",
        image_path=FIG_DIR / "fig-context.png"))
    s.children.append(Section(title="4.1. Actors", level=2, paragraphs=[
        "The system has two principal actors. The first is the end user, "
        "typically interacting through a browser, command-line tool, or "
        "automation script. They need not know any internal detail; they "
        "interact via a single HTTP endpoint sending text messages and "
        "receive an SSE stream back.",
        "The second is the upstream language model; although server-side, "
        "it plays an active role because it decides when to invoke a tool "
        "and when to terminate a turn. The two actors interact indirectly "
        "through the server and never communicate directly.",
        "Besides the two principal actors, the system also talks to "
        "secondary actors: search services (Brave or DuckDuckGo) through "
        "WebSearch, arbitrary web pages through WebFetch, the local "
        "filesystem through file tools, and the operating-system shell "
        "through Bash. Figure 4.1 depicts the system context.",
    ]))
    s.tables.append(TableSpec(
        caption="Functional requirements",
        headers=["ID", "Title", "Brief description"],
        rows=[
            ["FR-01", "Submit user message", "Clients POST /api/chat with the message body; the server replies with an SSE stream."],
            ["FR-02", "Manage conversation sessions", "The system identifies or creates a session via sessionId, X-Session-Id header, or the per-client session map."],
            ["FR-03", "Tool invocation", "The model can request execution of one of twelve tools; the server parses, validates, and returns the result."],
            ["FR-04", "Parallel tool execution", "Read-only tools are allowed to run concurrently within a single turn."],
            ["FR-05", "Cancellation", "When the client closes the connection, in-flight tools are stopped and resources are released."],
            ["FR-06", "Automatic compaction", "When the cumulative token count exceeds 171,000, the system summarises the history before the next model call."],
            ["FR-07", "Manual compaction", "Users can trigger compaction via /compact with optional custom instructions."],
            ["FR-08", "On-disk persistence", "Each message is appended to a per-session JSONL file with a metadata sidecar."],
            ["FR-09", "Session resume", "After a restart, sessions can be reloaded from disk when the client supplies the sessionId."],
            ["FR-10", "Chat commands", "Messages starting with / are routed to the command system instead of the model."],
            ["FR-11", "Usage tracking", "The system accumulates input/output token totals per session, queryable via /cost."],
            ["FR-12", "Tool-loop detection", "When the same tool call with identical args and result repeats > 3 turns, the system warns the model and aborts on the next repetition."],
            ["FR-13", "Metadata introspection", "Clients can query lists of tools, commands, and sessions via summary endpoints."],
            ["FR-14", "Conversation export", "/export returns the full history as JSON for external storage."],
        ],
        column_widths_cm=[1.6, 4.0, 9.5],
    ))
    s.tables.append(TableSpec(
        caption="Non-functional requirements",
        headers=["ID", "Category", "Specific criterion"],
        rows=[
            ["NFR-01", "Performance", "Time to first text under one second under typical network conditions."],
            ["NFR-02", "Model fault tolerance", "Transient model errors are retried at most twice with exponential back-off (500 ms, 1 s)."],
            ["NFR-03", "Tool fault tolerance", "Every tool exception is converted to a tool message with isError=true; the loop is never broken."],
            ["NFR-04", "Filesystem safety", "Every file operation is confined to WORKSPACE_ROOT through resolveSafePath."],
            ["NFR-05", "Observability", "Every streamed event flows through a unified interface; NestJS logs structured records per level."],
            ["NFR-06", "Extensibility", "Adding a new tool only requires registering a service class."],
            ["NFR-07", "Consistency", "Pending writes are drained before the JSONL file is rewritten after compaction."],
            ["NFR-08", "Result-size cap", "Tool output is capped at 100,000 characters to prevent context flooding."],
            ["NFR-09", "Path safety", "File-tool inputs are validated by Zod and normalised to drop null values."],
            ["NFR-10", "Testability", "Every module can be initialised independently and replaced with a mock."],
            ["NFR-11", "Compatibility", "Runs on Node 18+; no native dependencies."],
        ],
        column_widths_cm=[1.6, 3.5, 10.0],
    ))
    s.children.append(Section(title="4.2. Representative use cases", level=2, paragraphs=[
        "The following representative use cases describe each scenario in "
        "terms of actor, preconditions, basic flow, and outcome. Table 4.3 "
        "lists the cases; Figure 4.2 shows the UML use-case diagram.",
    ]))
    s.figures.append(FigureSpec(
        caption="UML-style use-case diagram",
        image_path=FIG_DIR / "fig-usecase.png"))
    s.tables.append(TableSpec(
        caption="Representative use cases",
        headers=["ID", "Title", "Preconditions", "Basic flow"],
        rows=[
            ["UC-01", "Single Q&A", "Server is running.", "User asks; model replies with text; server streams SSE; the done event carries usage."],
            ["UC-02", "Count files", "A source directory exists.", "User requests count; model invokes Bash; receives output; replies."],
            ["UC-03", "Create/edit Excel", "Python with openpyxl installed.", "User requests creation; model writes a script and runs it via Bash; subsequent turns edit the file."],
            ["UC-04", "Web lookup", "Brave or DuckDuckGo reachable.", "User asks a current-event question; model invokes WebSearch; summarises with sources."],
            ["UC-05", "Resume old session", "Session saved on disk.", "User submits a message without sessionId; the server matches the latest per-client session."],
            ["UC-06", "Manual compaction", "Conversation is long.", "User issues /compact; model summarises; on-disk transcript is rewritten."],
            ["UC-07", "Export conversation", "Session has substantial history.", "User issues /export; server returns history as JSON via text_delta."],
            ["UC-08", "Manage todo list", "Model is undertaking a complex task.", "Model invokes TodoWrite to create a list; updates statuses as it progresses."],
            ["UC-09", "Cost inspection", "Session has at least one completed turn.", "User issues /cost; server shows cumulative tokens and context utilisation."],
        ],
        column_widths_cm=[1.4, 3.4, 4.0, 6.2],
    ))
    return s


# ── Chapter 5 ────────────────────────────────────────────────────────────────

def _ch5() -> Section:
    s = Section(title="Chapter 5: System design", level=1)
    s.children.append(Section(title="5.1. Architecture overview", level=2, paragraphs=[
        "Figure 5.1 presents the high-level architecture as a component "
        "diagram with three horizontal layers. The interface layer holds "
        "components that talk directly to HTTP clients. The orchestration "
        "layer holds the services that perform the agent's main work. The "
        "storage and external layer holds the components that supply "
        "resources to the orchestration layer.",
        "Dependencies flow strictly from the interface layer to the "
        "orchestration layer and from there to the storage layer. This "
        "convention prevents cycles and makes per-tier testing tractable. "
        "Where the convention must be broken (for example ResumeCommand "
        "needs SessionService, but SessionService is in the orchestration "
        "layer), NestJS provides forwardRef to resolve the cycle at "
        "construction time.",
        "Each NestJS module owns a specific functional layer. AppModule is "
        "the root composer; AppConfigModule provides validated global "
        "configuration; AiModule wraps the streaming layer to the LLM; "
        "ToolsModule bundles tools and ToolRegistry; CompactionModule holds "
        "CompactionService; StorageModule wraps SessionStore; CommandsModule "
        "holds CommandRegistry and individual commands; EngineModule "
        "combines services into QueryService and SessionService; ChatModule "
        "contains ChatController and ClientSessionMap.",
    ]))
    s.figures.append(FigureSpec(
        caption="Layered architecture of AgentMini-Nest with components per layer",
        image_path=FIG_DIR / "fig-architecture.png"))

    s.children.append(Section(title="5.2. Tool-class model", level=2, paragraphs=[
        "Figure 5.2 shows the UML class diagram of the tool subsystem. The "
        "Tool interface defines a minimum contract every tool must satisfy. "
        "The metadata fields readOnly, concurrencySafe, timeoutMs, and "
        "maxResultSizeChars allow ToolRegistry to drive execution without "
        "knowing the internals. The call method accepts validated input "
        "plus a context carrying the abort signal.",
        "Each tool is an Injectable class that implements the interface. "
        "Tool dependencies (for example AppConfig, TodoStore) flow in via "
        "the constructor and are injected automatically by NestJS. The "
        "interface/implementation separation makes it easy to substitute "
        "tools with mocks during testing.",
        "A noteworthy design decision: ToolRegistry does not call tool.call "
        "directly but races it against a combined cancellation signal via "
        "Promise.race. This applies the timeout and abort signal uniformly, "
        "without requiring each tool to implement the logic itself.",
    ]))
    s.figures.append(FigureSpec(
        caption="UML class diagram of the Tool interface, concrete tools, and ToolRegistry",
        image_path=FIG_DIR / "fig-class.png"))

    s.children.append(Section(title="5.3. Data model", level=2, paragraphs=[
        "Figure 5.3 shows the main data structures in memory and on disk. "
        "Session is the central entity, carrying the APIMessage list, "
        "cumulative statistics, and time fields. Each APIMessage may carry "
        "a list of ToolCall if the role is assistant and a tool_call_id "
        "field if the role is tool. On disk, each session becomes a JSONL "
        "file with three line types (header, message, compact) plus a "
        "meta.json sidecar.",
        "The data model is intentionally minimal: no foreign keys, no "
        "indexes, no complex relations. This choice is deliberate because "
        "the data size is small and the only query is per-session. When "
        "scale demands it, the storage layer can be swapped for Redis "
        "(keeping a similar structure) or PostgreSQL (separate tables for "
        "session and message).",
    ]))
    s.figures.append(FigureSpec(
        caption="Main data structures in memory and on disk",
        image_path=FIG_DIR / "fig-data-model.png"))

    s.children.append(Section(title="5.4. The agent loop", level=2, paragraphs=[
        "The agent loop is implemented in QueryService as an async "
        "generator. Each iteration is one model turn. A turn proceeds "
        "through pre-turn compaction check, model invocation, stream "
        "consumption, separation of text and tool calls, tool execution "
        "(parallel or sequential), appending the result to the message "
        "history, then looping back. The loop stops when the model emits "
        "no further tool_calls or when maxTurns is reached.",
        "Figure 5.4 shows the interaction sequence among the components "
        "during one turn as a UML sequence diagram. Dashed arrows denote "
        "return messages. Activation bars mark when each component is "
        "active.",
        "A key technical decision is the partitioning of tool calls into "
        "parallel-safe and sequential groups. Read-only tools "
        "(readOnly=true) default to running in parallel; write tools (Edit, "
        "Write, Bash) run sequentially to avoid unintended interleaving. "
        "After all tools complete, results are merged back into the order "
        "the model emitted in tool_calls so the history retains its "
        "original sequence.",
    ]))
    s.figures.append(FigureSpec(
        caption="Sequence diagram of one turn from user message to final reply",
        image_path=FIG_DIR / "fig-sequence.png"))

    s.children.append(Section(title="5.5. Request state diagram", level=2, paragraphs=[
        "Figure 5.5 models the states traversed by a chat request from "
        "arrival to termination. Pre-turn check decides whether to compact "
        "before calling the model. Streaming accumulates text and tool-"
        "call deltas; it self-loops on each delta. Tool execution handles "
        "the calls, after which the loop returns to Pre-turn. Aborted is "
        "entered when the end-to-end cancellation signal fires.",
        "The Done state is the normal terminal state once the model emits "
        "no further tool_calls. A done event is emitted with inputTokens, "
        "outputTokens, and turn count. The SSE stream is closed after "
        "this event.",
    ]))
    s.figures.append(FigureSpec(
        caption="State diagram of a chat request inside the agent loop",
        image_path=FIG_DIR / "fig-state.png"))

    s.children.append(Section(title="5.6. Tool-execution pipeline", level=2, paragraphs=[
        "Figure 5.6 details the pipeline applied by ToolRegistry to one "
        "tool invocation. There are three phases. The pre-processing "
        "phase normalises input (removing null values for optional fields) "
        "and validates with Zod. The execution phase combines the client's "
        "abort signal with a per-tool timeout signal via AbortSignal.any "
        "(with a polyfill for older Node), then invokes tool.call with the "
        "combined context. The post-processing phase applies the result-"
        "size cap before pushing the message into the history.",
        "The dedup guard is a cross-cutting component in the agent loop. "
        "It checks fingerprints (name, arguments, partial result) after "
        "each turn; on three consecutive identical fingerprints, a "
        "reminder message is injected. On a fourth repetition, the system "
        "emits turn_error and exits.",
        "A common situation with OpenAI-compatible models: the optional "
        "field is sent as JSON null rather than omitted. Zod's optional() "
        "rejects null; without normalisation, the model would loop. The "
        "stripTopLevelNulls helper walks the top-level keys of the "
        "argument object and removes those whose value is null before "
        "validation.",
    ]))
    s.figures.append(FigureSpec(
        caption="ToolRegistry pipeline for a single tool invocation",
        image_path=FIG_DIR / "fig-tool-pipeline.png"))

    s.children.append(Section(title="5.7. Context-compaction mechanism", level=2, paragraphs=[
        "Figure 5.7 shows the compaction decision tree. At each turn "
        "boundary, QueryService asks CompactionService.shouldAutoCompact. "
        "If above the threshold, microCompact runs first. microCompact "
        "walks the history and trims tool messages whose content exceeds "
        "8,000 characters by replacing the overflow with a truncation "
        "note. This stage costs no model call and typically frees two "
        "thirds of the cumulative tokens when the cause is a large Bash "
        "or WebFetch result.",
        "If microCompact is insufficient, the server runs full compaction. "
        "It appends a user message containing the summarisation prompt "
        "and sends the request to the model WITHOUT the tool list "
        "(forcing a textual response). The reply is parsed for content "
        "inside the summary tags; the analysis scratchpad inside the "
        "analysis tags is discarded. The history is replaced by [system "
        "message, boundary message with summary, the four most recent "
        "messages].",
        "When compaction fails (for example an empty model response or a "
        "network error), a consecutive-failure counter increments. After "
        "three consecutive failures, the circuit breaker stops further "
        "compaction attempts in the current session. This behaviour is "
        "inspired by experience with Claude Code, where sessions whose "
        "context cannot be compacted would otherwise loop forever, "
        "wasting tokens.",
    ]))
    s.figures.append(FigureSpec(
        caption="Decision tree for automatic and manual context compaction",
        image_path=FIG_DIR / "fig-compaction.png"))

    s.children.append(Section(title="5.8. Session persistence", level=2, paragraphs=[
        "The persistence layer uses one JSONL file per session along with "
        "a .meta.json sidecar. The JSONL transcript contains lines of "
        "three kinds: a header line with session identity and format "
        "version, a message line with the entire APIMessage and a "
        "recording timestamp, and a compact-marker line that records a "
        "compaction event with statistics.",
        "Writes are deferred through an internal queue with a 100-"
        "millisecond flush delay; lines targeting the same file are "
        "coalesced into one syscall. When compaction occurs, the queue is "
        "drained first so no in-flight write races with the file rewrite. "
        "Figure 5.8 illustrates the layout.",
        "Resume happens in three steps: SessionService.getOrCreate first "
        "checks the in-memory Map; if absent, it checks the on-disk "
        "file; if present, it loads it into a session object; otherwise "
        "it creates a fresh session. This keeps disk-access cost low for "
        "active sessions while allowing recovery across restarts.",
        "JSONL was chosen for three reasons. First, it supports pure "
        "append writes, avoiding expensive whole-file rewrites. Second, "
        "each line is an independent record parseable without reading the "
        "whole file; reading the first line is enough to know the version "
        "info. Third, it is a self-describing format that a developer "
        "can read by eye when debugging.",
    ]))
    s.figures.append(FigureSpec(
        caption="JSONL transcript layout and the deferred write pipeline",
        image_path=FIG_DIR / "fig-persistence.png"))

    s.children.append(Section(title="5.9. End-to-end cancellation", level=2, paragraphs=[
        "When the client disconnects, the close event of the Express "
        "request fires an AbortController owned by the controller. The "
        "signal flows into QueryService and from there into every tool "
        "invocation via ToolCallContext. Long-running tools react to the "
        "signal as follows:",
    ], bullets=[[
        "Bash sends SIGTERM to the child and waits; if the child does not "
        "exit in time, child_process automatically follows up with "
        "SIGKILL.",
        "WebFetch aborts the in-flight HTTP request through the "
        "AbortSignal passed to Node's fetch.",
        "WebSearch cancels the provider call similarly, with at most one "
        "retry before reporting an error.",
        "Sleep resolves its promise immediately rather than waiting for "
        "the requested duration.",
    ]]))

    s.children.append(Section(title="5.10. Per-client session map", level=2, paragraphs=[
        "ClientSessionMap is a small but UX-important component. It "
        "remembers the most recent sessionId per client to maintain "
        "continuity when the client does not pass a sessionId. The "
        "client identity is resolved in priority order: the X-Client-Id "
        "header (when the client opts in), the X-Forwarded-For + User-"
        "Agent combination (behind a proxy), the IP + User-Agent "
        "combination (default), or the literal 'default' (single-tenant "
        "dev mode).",
        "The map lives in memory only; the on-disk transcript remains the "
        "canonical data source. After a server restart, the client must "
        "pass sessionId once to resume; subsequent calls then auto-match. "
        "For multi-user environments with strict isolation, the "
        "X-Client-Id header is the safest path.",
    ]))
    return s


# ── Chapter 6 ────────────────────────────────────────────────────────────────

def _ch6() -> Section:
    s = Section(title="Chapter 6: Detailed implementation", level=1)
    s.tables.append(TableSpec(
        caption="Technology stack used in the project",
        headers=["Layer", "Technology", "Purpose"],
        rows=[
            ["Language", "TypeScript 5", "Static typing, editor support"],
            ["Server framework", "NestJS 10 on Express", "Module structure, DI, HTTP controllers"],
            ["Language model", "OpenAI SDK with custom endpoint", "Compatible with any OpenAI-schema provider"],
            ["Validation", "Zod 3", "Schemas for tool parameters and environment variables"],
            ["File search", "fast-glob", "High-speed glob matching"],
            ["Content search", "ripgrep (with grep fallback)", "Regex search with rich flags"],
            ["Storage", "JSONL files on disk", "Simple, eyeball-debuggable"],
            ["Development", "ts-node-dev", "Hot reload preserving decorator metadata"],
            ["Schema conversion", "zod-to-json-schema", "Convert Zod schemas to JSON Schema for the model"],
            ["Node runtime", "Node.js 18+", "Global fetch and AbortSignal"],
        ],
        column_widths_cm=[3.5, 5.0, 7.0],
    ))
    s.children.append(Section(title="6.1. Source-code layout", level=2, paragraphs=[
        "The source tree is organised by functional layer. The common "
        "directory holds shared types (APIMessage, ToolCall, SSEEvent) and "
        "small utilities such as the token estimator. The config directory "
        "holds Zod-validated environment configuration exported as a "
        "global provider. The ai directory holds the streaming layer to "
        "the language model.",
        "The tools directory holds each tool in its own subdirectory "
        "containing a prompt file and an implementation file. This mirrors "
        "Claude Code's layout and aids navigation. The services directory "
        "holds horizontal services (compaction, slash commands, storage). "
        "The engine directory holds the agent loop and session "
        "management. The chat directory holds the HTTP controller and "
        "per-client session map. The bin directory contains the Node-"
        "based CLI tool, which is intentionally TypeScript-free.",
    ]))
    s.children.append(Section(title="6.2. Tool registration", level=2, paragraphs=[
        "Each tool is an Injectable class that implements the Tool "
        "interface. The class lives in its own file along with a Zod "
        "schema and a prompt string. ToolsModule lists the tool classes "
        "and binds them to the TOOL token through a useFactory that "
        "gathers every resolved instance. ToolRegistry receives the array "
        "at construction time and indexes it by name.",
    ], listings=[CodeListingSpec(
        caption="Tool registration in ToolsModule",
        language="TypeScript",
        code=(
            "const TOOLS = [BashTool, ReadTool, WriteTool, EditTool, MultiEditTool,\n"
            "  GlobTool, GrepTool, LSTool, WebFetchTool, WebSearchTool,\n"
            "  TodoWriteTool, SleepTool];\n"
            "\n"
            "@Module({\n"
            "  providers: [\n"
            "    ToolRegistry,\n"
            "    TodoStore,\n"
            "    ...TOOLS,\n"
            "    {\n"
            "      provide: TOOL,\n"
            "      useFactory: (...tools) => tools,\n"
            "      inject: TOOLS,\n"
            "    },\n"
            "  ],\n"
            "  exports: [ToolRegistry, TodoStore],\n"
            "})\n"
            "export class ToolsModule {}"
        ),
    )]))
    s.children.append(Section(title="6.3. ToolRegistry.execute", level=2, paragraphs=[
        "execute is the single entry point used by the agent loop. It "
        "normalises input, validates with Zod, combines the client abort "
        "signal with a per-tool timeout, calls tool.call, and applies the "
        "result-size cap. Every exception is caught and converted into a "
        "ToolResult with isError=true; the loop is never broken.",
    ], listings=[CodeListingSpec(
        caption="Core of ToolRegistry.execute",
        language="TypeScript",
        code=(
            "async execute(name, rawInput, signal) {\n"
            "  const tool = this.tools.get(name);\n"
            "  if (!tool) return err('Tool not found');\n"
            "  const cleaned = stripTopLevelNulls(rawInput);\n"
            "  const parsed = tool.schema.safeParse(cleaned ?? {});\n"
            "  if (!parsed.success) return err('Invalid input ' + ...);\n"
            "\n"
            "  const timeoutCtl = new AbortController();\n"
            "  const timeoutId = setTimeout(() => timeoutCtl.abort(),\n"
            "    tool.timeoutMs ?? DEFAULT_TIMEOUT_MS);\n"
            "  const combined = combineSignals(signal, timeoutCtl.signal);\n"
            "\n"
            "  let result;\n"
            "  try {\n"
            "    result = await Promise.race([\n"
            "      tool.call(parsed.data, { signal: combined }),\n"
            "      rejectOnAbort(combined),\n"
            "    ]);\n"
            "  } catch (e) { return err('Tool failed: ' + e.message); }\n"
            "  finally { clearTimeout(timeoutId); }\n"
            "\n"
            "  if (result.content.length > maxChars) {\n"
            "    result.content = result.content.slice(0, maxChars) +\n"
            "      '\\n... (output truncated)';\n"
            "  }\n"
            "  return result;\n"
            "}"
        ),
    )]))
    s.children.append(Section(title="6.4. Agent loop and tool parallelism", level=2, paragraphs=[
        "The agent loop is the run() async generator in QueryService. "
        "Each turn performs the steps described in section 5.4. A "
        "noteworthy detail is how the loop partitions tool calls into a "
        "parallel-safe set and a sequential set, then merges the results "
        "back into the original order in the history.",
    ], listings=[CodeListingSpec(
        caption="Partition and parallel tool execution in the agent loop",
        language="TypeScript",
        code=(
            "const safeIdx = [], unsafeIdx = [];\n"
            "for (let i = 0; i < toolCalls.length; i++) {\n"
            "  if (this.registry.isConcurrencySafe(toolCalls[i].function.name))\n"
            "    safeIdx.push(i);\n"
            "  else\n"
            "    unsafeIdx.push(i);\n"
            "}\n"
            "\n"
            "// Concurrency-safe tools run in parallel\n"
            "await Promise.all(safeIdx.map(async (i) => {\n"
            "  results[i] = await this.executeOne(toolCalls[i], signal);\n"
            "}));\n"
            "// Writes run sequentially to preserve ordering effects\n"
            "for (const i of unsafeIdx) {\n"
            "  if (signal.aborted) break;\n"
            "  results[i] = await this.executeOne(toolCalls[i], signal);\n"
            "}"
        ),
    )]))
    s.children.append(Section(title="6.5. SSE event format", level=2, paragraphs=[
        "ChatController emits events to the SSE stream using event types "
        "defined uniformly in common/types.ts. Table 6.2 lists the event "
        "format.",
    ], tables=[TableSpec(
        caption="SSE event types and their meaning",
        headers=["Event type", "Fields", "Meaning"],
        rows=[
            ["session_id", "sessionId", "Emitted once after the server resolves the session for the current request."],
            ["text_delta", "text", "A text fragment from the model; clients concatenate them."],
            ["tool_start", "toolName, toolId, input", "The model starts a tool call with normalised input."],
            ["tool_result", "toolName, toolId, content, isError", "Tool result; isError flags exceptions or invalid input."],
            ["turn_error", "message, recoverable", "Internal error at the turn level; recoverable indicates if the loop continues."],
            ["error", "message", "Unrecoverable error; the server closes the stream after this event."],
            ["done", "inputTokens, outputTokens, turns", "Final event with usage and turn count."],
        ],
        column_widths_cm=[3.0, 4.5, 8.0],
    )]))
    s.children.append(Section(title="6.6. Conversation session object", level=2, paragraphs=[
        "A conversation session is represented by an object with id, "
        "apiMessages, cumulative, createdAt, lastActiveAt, and persisted. "
        "SessionService keeps a Map cache for active sessions and uses "
        "SessionStore as the disk-backing layer. getOrCreate first "
        "consults the cache; otherwise it tries the disk; otherwise it "
        "creates a fresh session with a default system message.",
        "SessionStore manages two files per session: the JSONL transcript "
        "with header, message, and compact lines; and the meta.json "
        "sidecar with statistics. appendMessage pushes a line into an "
        "internal queue and schedules a flush after 100 ms. When the "
        "timer fires, drain groups lines per file and performs one write "
        "per file. rewriteAfterCompaction first calls drain so no "
        "buffered write is outstanding, then uses writeFile to overwrite "
        "the transcript with the post-compaction list.",
    ]))
    s.children.append(Section(title="6.7. Per-client session map", level=2, paragraphs=[
        "ClientSessionMap resolves the client identity in priority order, "
        "as shown below.",
    ], listings=[CodeListingSpec(
        caption="Client-identity resolution in ClientSessionMap",
        language="TypeScript",
        code=(
            "resolveClientId(req) {\n"
            "  const explicit = req.header('x-client-id');\n"
            "  if (explicit) return 'header:' + explicit;\n"
            "  const ua = (req.header('user-agent') ?? 'unknown').slice(0, 80);\n"
            "  const ip = (req.header('x-forwarded-for') ?? req.ip ??\n"
            "              req.socket.remoteAddress ?? 'unknown')\n"
            "             .toString().split(',')[0].trim();\n"
            "  return ip + ':' + ua;\n"
            "}"
        ),
    )]))
    s.children.append(Section(title="6.8. Slash-command routing", level=2, paragraphs=[
        "When the user message starts with a forward slash, ChatController "
        "does not forward it to QueryService; it delegates to "
        "CommandRegistry. The registry splits the command name from the "
        "argument string and looks both name and aliases up. Each command "
        "returns a result of one of three kinds: text emits a text_delta "
        "event; compact triggers a JSONL rewrite and emits a compaction "
        "event; cleared emits a clear event. This separation isolates "
        "command flow from the agent flow.",
    ]))
    s.children.append(Section(title="6.9. Environment configuration", level=2, paragraphs=[
        "Environment configuration is validated at start-up with Zod. "
        "Table 6.3 lists the supported variables. Missing required "
        "variables cause the server to print a clear error and exit at "
        "boot rather than later at runtime.",
    ], tables=[TableSpec(
        caption="Supported environment variables",
        headers=["Variable", "Required", "Default", "Purpose"],
        rows=[
            ["AI_API_KEY", "Yes", "—", "Provider API key"],
            ["AI_API_URL", "Yes", "—", "OpenAI-compatible model endpoint"],
            ["AI_MODEL", "Yes", "—", "Model name"],
            ["PORT", "No", "3000", "HTTP server port"],
            ["NODE_ENV", "No", "development", "Runtime environment"],
            ["WORKSPACE_ROOT", "No", "cwd", "Working directory for file tools"],
            ["SESSIONS_DIR", "No", "~/.agentmini-nest/sessions", "Persistent session directory"],
            ["BRAVE_SEARCH_API_KEY", "No", "—", "Brave Search key; falls back to DuckDuckGo"],
        ],
        column_widths_cm=[3.4, 1.7, 4.0, 6.4],
    )]))
    s.children.append(Section(title="6.10. Tool-loop dedup guard", level=2, paragraphs=[
        "Some weaker models repeat the exact same tool call when stuck, "
        "wasting resources. To prevent this, the agent loop maintains a "
        "list of fingerprints composed of the tool name, the argument "
        "string, and the first 200 characters of the result. If three "
        "consecutive fingerprints are identical, the server injects a "
        "system reminder asking the model to change strategy; if the "
        "repetition continues to a fourth turn, the server emits a "
        "turn_error and exits.",
    ]))
    return s


# ── Chapter 7 ────────────────────────────────────────────────────────────────

def _ch7() -> Section:
    s = Section(title="Chapter 7: Testing", level=1)
    s.children.append(Section(title="7.1. Test approach", level=2, paragraphs=[
        "The system is exercised at three levels. Smoke tests cover the "
        "major end-to-end paths. Compaction and cancellation tests target "
        "edge cases that risk subtle failures. Type checking is performed "
        "continuously during development with tsc --noEmit, ensuring "
        "static-type safety across the entire TypeScript codebase.",
        "Smoke tests are executed manually with curl and through an "
        "automated shell script. The goal is to verify the major paths "
        "before drilling into edge cases.",
    ]))
    s.tables.append(TableSpec(
        caption="Smoke-test scenarios executed",
        headers=["ID", "Goal", "Outcome"],
        rows=[
            ["T-01", "Boot the server and list tools via /api/chat/stats", "Returns 12 tools and 8 commands"],
            ["T-02", "Single-turn text Q&A", "Model replies; done event carries valid usage stats"],
            ["T-03", "Count .ts files via Bash", "Bash returns correct count; model concludes accurately"],
            ["T-04", "Create and edit an xlsx file across multiple turns", "Creation, append, and read-back all succeed"],
            ["T-05", "Resume a session after a server restart", "/resume lists the session; old sessionId restores context"],
            ["T-06", "Auto-resume without sessionId", "ClientSessionMap matches the same session"],
            ["T-07", "Concurrency-safe flag check", "/tools shows seven parallel-safe tools and five sequential"],
        ],
        column_widths_cm=[1.6, 6.5, 6.9],
    ))
    s.children.append(Section(title="7.2. Compaction tests", level=2, paragraphs=[
        "To exercise compaction, the token estimator was temporarily "
        "lowered and a sequence of long questions was sent. Once the "
        "cumulative count crossed the threshold, a tool_result event with "
        "toolName AutoCompact was emitted and the JSONL transcript was "
        "rewritten. Re-reading the file showed only the system message, "
        "the boundary message with the summary, and the recent tail, "
        "exactly as designed.",
        "A circuit-breaker variant was also tested: the summarisation "
        "prompt was temporarily replaced with an empty string so the "
        "model returned no valid response. After three consecutive "
        "failures, subsequent turns skipped compaction.",
    ]))
    s.children.append(Section(title="7.3. Mid-turn cancellation tests", level=2, paragraphs=[
        "A long sleep was issued through Bash; the tester then pressed "
        "Ctrl+C on the client. The server detected the close event and "
        "propagated the abort signal; sleep was terminated by SIGTERM; "
        "the server recorded a tool message indicating that the tool was "
        "cancelled by the client. No orphan child remained.",
        "Similarly, a WebFetch test against a slow endpoint: when the "
        "client disconnected, Node fetch received the AbortSignal and "
        "threw AbortError; the server converted it to a ToolResult with "
        "isError=true.",
    ]))
    s.children.append(Section(title="7.4. Tool-loop dedup tests", level=2, paragraphs=[
        "An integration scenario with kimi-k2.5 showed the model "
        "repeating an identical Bash verify call four times in a row. "
        "After adding the dedup guard, the same scenario stops at the "
        "fourth iteration with a turn_error event; the reminder injected "
        "at the third iteration is effective with some other models that "
        "can self-correct.",
    ]))
    return s


# ── Chapter 8 ────────────────────────────────────────────────────────────────

def _ch8() -> Section:
    s = Section(title="Chapter 8: Deployment and operations", level=1)
    s.children.append(Section(title="8.1. Deployment diagram", level=2, paragraphs=[
        "Figure 8.1 shows the UML deployment diagram. The system has "
        "three deployment zones: the client host (browser, CLI, or "
        "automation), the server host (Node.js 20+ with the NestJS "
        "process and Bash-spawned children), and external services (LLM "
        "provider, search APIs, web pages). The local filesystem also "
        "holds the workspace, the session directory, and the .env file.",
        "Client-server communication is HTTP/SSE; server-external "
        "communication is HTTPS. Bash-spawned children run with the same "
        "permissions as the Node process on the same host. This is a "
        "security consideration discussed in section 8.5.",
    ]))
    s.figures.append(FigureSpec(
        caption="Deployment diagram for the system",
        image_path=FIG_DIR / "fig-deployment.png"))

    s.children.append(Section(title="8.2. Installation procedure", level=2, paragraphs=[
        "Installation requires Node.js 20 or later. The steps are: clone "
        "the repository, copy .env.example to .env and fill in values, "
        "run npm install, then start the server with npm run dev for "
        "development or npm run build && npm start for production.",
    ], listings=[CodeListingSpec(
        caption="Basic installation steps",
        language="bash",
        code=(
            "# 1. Get the source\n"
            "git clone <repo-url> agentmini-nest\n"
            "cd agentmini-nest\n"
            "\n"
            "# 2. Install dependencies\n"
            "npm install\n"
            "\n"
            "# 3. Configure the environment\n"
            "cp .env.example .env\n"
            "vim .env   # set AI_API_KEY, AI_API_URL, AI_MODEL\n"
            "\n"
            "# 4. Development (hot reload)\n"
            "npm run dev\n"
            "\n"
            "# 4b. Or production\n"
            "npm run build\n"
            "npm start"
        ),
    )]))

    s.children.append(Section(title="8.3. Monitoring and logs", level=2, paragraphs=[
        "NestJS logs to stdout by default — colourised in development and "
        "plain text in production. Notable events: server boot with the "
        "registered tool and command lists, new connection on /api/chat, "
        "input-validation errors, model-call errors, successful or "
        "failing compactions, and abort propagation on disconnect.",
        "To extend monitoring for production, add a structured logger "
        "(pino or winston) and a /metrics endpoint in Prometheus format. "
        "Interesting metrics include: turns per second, average tool "
        "latency, compaction success ratio, and active session count.",
    ]))

    s.children.append(Section(title="8.4. Maintenance and backup", level=2, paragraphs=[
        "Since all session state lives in SESSIONS_DIR, backup is just a "
        "directory sync to a redundant location. A daily cron job that "
        "copies the directory to another machine or to object storage is "
        "enough. As JSONL grows over time, a cleanup process should "
        "remove sessions no longer needed; a small script can delete "
        "sessions whose lastActiveAt is older than a threshold.",
        "For upgrades, since the server keeps no long-lived in-memory "
        "state outside the per-client session map, restarts are safe. "
        "Active sessions disconnect but can be continued by submitting "
        "the message again with the same sessionId.",
    ]))

    s.children.append(Section(title="8.5. Security", level=2, paragraphs=[
        "Because the system lacks an authentication layer, it should not "
        "be exposed directly to the public internet. Safe deployment "
        "options in internal environments include running behind an "
        "authenticated reverse proxy (nginx with basic auth), running "
        "behind a VPN, or binding to a local-only network.",
        "Bash is the largest risk surface. Users can ask the model to "
        "run any command inside WORKSPACE_ROOT, including potentially "
        "harmful ones. To reduce risk: place WORKSPACE_ROOT in a "
        "dedicated directory without sensitive files; run the server "
        "under a restricted user; consider Docker isolation.",
        "The AI_API_KEY must be protected. Keep it in .env and out of "
        "version control. On real servers, use a secrets manager such "
        "as AWS Secrets Manager or HashiCorp Vault rather than a text "
        "file.",
    ]))
    return s


# ── Chapter 9 ────────────────────────────────────────────────────────────────

def _ch9() -> Section:
    s = Section(title="Chapter 9: Evaluation", level=1)
    s.children.append(Section(title="9.1. Functional evaluation", level=2, paragraphs=[
        "The system meets all 14 functional requirements and all 11 "
        "non-functional requirements. Parallel tool execution noticeably "
        "reduces latency when the model invokes several read-only tools at "
        "once; on a typical development machine, Glob, Grep, and LS "
        "running in parallel finished about three times faster than "
        "sequential execution because their I/O does not stack up.",
        "Compaction shows clear value on long sessions. In a test session "
        "with 132 messages and approximately 25,000 tokens, microCompact "
        "trimmed long Bash outputs and brought the total down to about "
        "15,000 tokens, enough to avoid full compaction. This is "
        "empirical evidence that microCompact is reliable for most "
        "practical cases and full compaction is needed only for very "
        "long sessions.",
    ]))
    s.children.append(Section(title="9.2. Fault-tolerance evaluation", level=2, paragraphs=[
        "Exponential back-off retry covers the majority of transient "
        "model-side errors. The 100,000-character tool-result cap blocked "
        "a case where a single ls of a large directory would have flooded "
        "the context window. The dedup guard mitigates the loop "
        "pathology observed in weaker models.",
        "End-to-end cancellation behaves robustly under manual testing: "
        "no orphan child processes remain after Bash cancellation, "
        "WebFetch's underlying fetch stops immediately, and Sleep's "
        "timer is released at once. This is a noticeable advantage over "
        "products that do not propagate cancellation all the way to the "
        "tool layer.",
    ]))
    s.children.append(Section(title="9.3. Comparison with Claude Code", level=2, paragraphs=[
        "AgentMini-Nest implements most of the core features of Claude "
        "Code in roughly 3,000 lines of TypeScript, compared with tens of "
        "thousands in the original. The differences lie in non-core "
        "features: skill/plugin systems, IDE bridge, pre/post tool "
        "hooks, sub-agents through Task, voice mode, permission "
        "sandboxing, provider-side cost telemetry. Since AgentMini-Nest's "
        "scope is the core, those features are listed as future work.",
    ]))
    s.children.append(Section(title="9.4. Limitations", level=2, paragraphs=[
        "The system currently lacks an authentication layer and is "
        "therefore suitable only for development or internal use. The "
        "per-client session map keys on a combination of IP and User-"
        "Agent, which can be ambiguous behind a shared NAT; an "
        "X-Client-Id header is recommended for clients with stricter "
        "isolation needs.",
        "The TodoWrite tool relies on a global active-session variable, "
        "which introduces a race when several sessions call it "
        "concurrently. The proposed fix in the conclusion is to use "
        "Node's AsyncLocalStorage to isolate session context per HTTP "
        "request.",
        "Bash currently does not isolate the child process; users may "
        "execute arbitrary commands in WORKSPACE_ROOT. In multi-user "
        "deployments, sandbox isolation via Docker or an equivalent "
        "solution is required.",
    ]))
    return s


# ── Chapter 10 ───────────────────────────────────────────────────────────────

def _ch10() -> Section:
    s = Section(title="Chapter 10: User manual", level=1)
    s.children.append(Section(title="10.1. Starting the server", level=2, paragraphs=[
        "After installing as in section 8.2, start the server with npm "
        "run dev. Within a few seconds NestJS prints module-by-module "
        "initialisation logs and finishes with a confirmation that the "
        "server is ready on port 3000 (default). Set PORT in the env to "
        "change.",
    ]))
    s.children.append(Section(title="10.2. Sending the first message", level=2, paragraphs=[
        "The simplest way is a POST to /api/chat with the message in the "
        "JSON body. curl with the -N flag streams the SSE response in "
        "real time.",
    ], listings=[CodeListingSpec(
        caption="First message via curl",
        language="bash",
        code=(
            "curl -N -X POST http://localhost:3000/api/chat \\\n"
            "  -H 'Content-Type: application/json' \\\n"
            "  -d '{\"message\":\"Hello, who are you?\"}'"
        ),
    )]))
    s.children.append(Section(title="10.3. Multi-turn conversations", level=2, paragraphs=[
        "The server remembers the most recent session per client. The "
        "next turn can omit sessionId; the server will auto-match the "
        "earlier session.",
    ], listings=[CodeListingSpec(
        caption="Continue the same session in a follow-up turn",
        language="bash",
        code=(
            "# Turn 1\n"
            "curl -N -X POST http://localhost:3000/api/chat \\\n"
            "  -d '{\"message\":\"Count .ts files in src\"}'\n"
            "\n"
            "# Turn 2 (same session — no sessionId needed)\n"
            "curl -N -X POST http://localhost:3000/api/chat \\\n"
            "  -d '{\"message\":\"How many of those are test files?\"}'"
        ),
    )]))
    s.children.append(Section(title="10.4. Using slash commands", level=2, paragraphs=[
        "Chat commands start with /. A few common ones are shown below. "
        "/help lists them all.",
    ], listings=[CodeListingSpec(
        caption="A few representative slash-command examples",
        language="bash",
        code=(
            "# Show token usage for the current session\n"
            "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/cost\"}'\n"
            "\n"
            "# List sessions saved on disk\n"
            "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/resume\"}'\n"
            "\n"
            "# Export the current session as JSON\n"
            "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/export\"}'\n"
            "\n"
            "# Manual compaction with custom instructions\n"
            "curl -X POST http://localhost:3000/api/chat \\\n"
            "  -d '{\"message\":\"/compact Focus on errors and how they were fixed\"}'"
        ),
    )]))
    s.children.append(Section(title="10.5. Using the CLI tool", level=2, paragraphs=[
        "The project ships a small CLI in the bin/ directory that is "
        "more convenient than curl. It remembers the latest sessionId in "
        "~/.agentmini-nest/.last-session so subsequent calls share a "
        "session automatically.",
    ], listings=[CodeListingSpec(
        caption="Representative CLI invocations",
        language="bash",
        code=(
            "# Put the CLI on PATH (one-time)\n"
            "export PATH=\"$PWD/bin:$PATH\"\n"
            "\n"
            "# Turn 1: new session\n"
            "agentmini -n \"Create demo.csv with five rows of sample data\"\n"
            "\n"
            "# Turn 2: auto-continue the previous session\n"
            "agentmini \"Add a new column called Status\"\n"
            "\n"
            "# List saved sessions\n"
            "agentmini --list\n"
            "\n"
            "# Server status\n"
            "agentmini --stats"
        ),
    )]))
    return s


# ── Chapter 11 ───────────────────────────────────────────────────────────────

def _ch11() -> Section:
    s = Section(title="Chapter 11: Conclusion and future work", level=1)
    s.children.append(Section(title="11.1. Conclusion", level=2, paragraphs=[
        "The project has produced an AI-agent server with a clean "
        "structure: a complete async-generator agent loop, twelve core "
        "tools, eight slash commands, automatic and manual context "
        "compaction, a JSONL persistence layer with resume, a per-client "
        "session map, and end-to-end cancellation. The codebase honours "
        "NestJS modular principles and is readable and extensible. "
        "Smoke tests and key edge-case tests pass.",
        "Working through the project deepened the author's understanding "
        "of AI-agent architecture, the trade-offs between programming "
        "models (async generators versus state graphs), the consistency "
        "mechanisms required in asynchronous environments, and the "
        "practicalities of designing tools for language models.",
    ]))
    s.children.append(Section(title="11.2. Future work", level=2, paragraphs=[
        "The next phase organises items into three priority groups. "
        "Group one concerns operational hardening: adding authentication "
        "via API keys or JWT plus rate limiting; replacing TodoWrite's "
        "global variable with AsyncLocalStorage; adding audit logging "
        "and Prometheus metrics.",
        "Group two concerns agent features: integrating the Model "
        "Context Protocol so third-party tool servers can be attached; "
        "adding a Task tool for sub-agents; adding pre/post tool hooks; "
        "adding an AskUserQuestion tool for situations that require "
        "explicit confirmation.",
        "Group three concerns scale and integration: a Redis-backed "
        "session cache for multi-instance deployments; sandboxing of "
        "Bash child processes via Docker; vector-database integration "
        "for semantic retrieval over an external knowledge base; and a "
        "lightweight web front-end for live log and cost visualisation.",
    ]))
    return s


# ── Appendix ────────────────────────────────────────────────────────────────

def _appendix() -> Section:
    s = Section(title="Appendix: Tool, command, and endpoint reference", level=1)
    s.children.append(Section(title="A. Tool reference", level=2, paragraphs=[
        "Table A.1 lists the twelve tools with their distinguishing "
        "flags. The concurrency-safe flag determines whether the tool "
        "is allowed to run in parallel with others within a single "
        "turn; write tools are always sequential to preserve ordering.",
    ], tables=[TableSpec(
        caption="Twelve-tool reference",
        headers=["Name", "Read-only", "Concurrency-safe", "Brief description"],
        rows=[
            ["Bash", "No", "No", "Run shell commands inside the workspace; bounded by time and output size."],
            ["Read", "Yes", "Yes", "Read text files in cat -n format; supports offset and limit."],
            ["Write", "No", "No", "Create or overwrite a file; auto-creates parent directories."],
            ["Edit", "No", "No", "Exact string replacement; requires uniqueness or replace_all."],
            ["MultiEdit", "No", "No", "Apply multiple edits atomically to one file."],
            ["Glob", "Yes", "Yes", "Find files by glob pattern; sort by mtime."],
            ["Grep", "Yes", "Yes", "Content search via ripgrep with grep fallback."],
            ["LS", "Yes", "Yes", "List a directory with size info."],
            ["WebFetch", "Yes", "Yes", "Fetch a URL, convert HTML to text, detect cross-host redirects."],
            ["WebSearch", "Yes", "Yes", "Search the web via Brave or DuckDuckGo."],
            ["TodoWrite", "No", "No", "Manage the session task list with a single in-progress constraint."],
            ["Sleep", "Yes", "Yes", "Pause from 50 ms to 60 s; respects the abort signal."],
        ],
        column_widths_cm=[2.4, 1.8, 2.6, 8.2],
    )]))
    s.children.append(Section(title="B. Slash-command reference", level=2,
        tables=[TableSpec(
            caption="Eight-command reference",
            headers=["Command", "Aliases", "Description"],
            rows=[
                ["/help", "/?", "List available commands"],
                ["/clear", "/reset, /new", "Clear conversation history and the session task list"],
                ["/compact", "—", "Manual compaction with optional custom instructions"],
                ["/cost", "/usage", "Show cumulative tokens and context utilisation"],
                ["/model", "—", "Show the active model and endpoint URL"],
                ["/tools", "—", "Show the twelve tools with concurrency-safe flags"],
                ["/resume", "—", "List sessions saved on disk"],
                ["/export", "—", "Export the current conversation as JSON"],
            ],
            column_widths_cm=[2.4, 3.0, 9.6],
        )]))
    s.children.append(Section(title="C. HTTP endpoints", level=2,
        tables=[TableSpec(
            caption="Server HTTP endpoints",
            headers=["Method", "Path", "Description"],
            rows=[
                ["POST", "/api/chat", "Submit a user message; SSE stream with text_delta, tool_start, tool_result, done"],
                ["GET", "/api/chat/stats", "Server status: active sessions, persisted sessions, tools, commands"],
                ["GET", "/api/chat/sessions", "List metadata of all on-disk sessions"],
                ["DELETE", "/api/chat/:sessionId", "Remove a session from memory and disk"],
            ],
            column_widths_cm=[2.0, 4.4, 8.6],
        )]))
    s.children.append(Section(title="D. Environment variables", level=2,
        tables=[TableSpec(
            caption="Supported environment variables",
            headers=["Variable", "Required", "Default", "Purpose"],
            rows=[
                ["AI_API_KEY", "Yes", "—", "Provider API key"],
                ["AI_API_URL", "Yes", "—", "OpenAI-compatible model endpoint"],
                ["AI_MODEL", "Yes", "—", "Model name"],
                ["PORT", "No", "3000", "HTTP server port"],
                ["NODE_ENV", "No", "development", "Runtime environment"],
                ["WORKSPACE_ROOT", "No", "cwd", "Working directory for file tools"],
                ["SESSIONS_DIR", "No", "~/.agentmini-nest/sessions", "Persistent session directory"],
                ["BRAVE_SEARCH_API_KEY", "No", "—", "Brave Search key; falls back to DuckDuckGo"],
            ],
            column_widths_cm=[3.4, 1.7, 4.0, 6.4],
        )]))
    return s


# ── References ─────────────────────────────────────────────────────────────

def _references() -> list[str]:
    return [
        "Anthropic. Claude Code: agent-based coding assistant. Online technical reference, 2025.",
        "OpenAI. Function calling and tool-use specification. API documentation, 2024.",
        "NestJS team. NestJS official documentation. https://docs.nestjs.com",
        "WHATWG. HTML Living Standard, Server-Sent Events. https://html.spec.whatwg.org/multipage/server-sent-events.html",
        "ECMA. ECMAScript 2018 specification, async generators.",
        "Andrew Gallant. ripgrep: a line-oriented search tool. https://github.com/BurntSushi/ripgrep",
        "Mauro Bringolf. fast-glob: high-performance glob library for Node.js.",
        "Colin Ihrig. Zod: TypeScript-first schema validation. https://zod.dev",
        "LangChain team. LangChain documentation. https://python.langchain.com",
        "OpenAI. Assistants API reference. https://platform.openai.com/docs/assistants",
        "Anthropic. Model Context Protocol specification. https://modelcontextprotocol.io",
        "Node.js team. AbortSignal and AbortController in Node.js. https://nodejs.org/api/globals.html",
    ]
