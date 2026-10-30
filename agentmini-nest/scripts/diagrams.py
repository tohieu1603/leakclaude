"""Render the architectural diagrams used by the project report.

We deliberately avoid graphviz/mermaid dependencies — every figure is built
with matplotlib using a consistent color palette and saved as a high-DPI PNG
into docs/figures/. The builder script embeds them with captions placed below
each image, following the academic convention.

Diagram catalogue
-----------------
fig-context.png         system-context (actors + system boundary)
fig-architecture.png    layered component diagram with packages
fig-class.png           class diagram of the Tool subsystem
fig-sequence.png        sequence diagram of a single turn
fig-state.png           state diagram of the agent loop
fig-tool-pipeline.png   tool-execution pipeline with branches
fig-compaction.png      compaction decision tree
fig-persistence.png     JSONL persistence layout + write queue
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.patches as patches
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch

FIG_DIR = Path(__file__).resolve().parent.parent / "docs" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

# ── Palette (subtle, professional) ───────────────────────────────────────────
PALETTE = {
    "bg":        "#fafbfc",
    "interface": "#dbe7f5",   # interface layer (HTTP / clients)
    "engine":    "#e6dff5",   # orchestration layer
    "service":   "#f5e3d6",   # services (compaction, commands, ai)
    "tool":      "#d8ecd8",   # tool implementations
    "storage":   "#f3d6d6",   # persistence layer
    "border":    "#2c3e50",
    "arrow":     "#34495e",
    "text":      "#1c2a39",
    "accent":    "#3a6ea5",
    "muted":     "#7d8a98",
}

FONT_TITLE = 12
FONT_LABEL = 10
FONT_SMALL = 9
FONT_TINY  = 8


# ── Drawing primitives ───────────────────────────────────────────────────────

def _save(fig, name):
    out = FIG_DIR / name
    fig.savefig(out, dpi=200, bbox_inches="tight",
                facecolor=PALETTE["bg"], edgecolor="none")
    plt.close(fig)
    return out


def _new_canvas(width, height, *, padding=False):
    fig, ax = plt.subplots(figsize=(width, height))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, height * 10 / width)
    ax.axis("off")
    fig.patch.set_facecolor(PALETTE["bg"])
    if padding:
        fig.tight_layout(pad=1)
    return fig, ax


def _box(ax, x, y, w, h, label, *, fill=PALETTE["interface"], fontsize=FONT_LABEL,
         border=PALETTE["border"], lw=1.0, bold=False, italic=False):
    rect = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.04,rounding_size=0.10",
        linewidth=lw, edgecolor=border, facecolor=fill,
    )
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h / 2, label,
            ha="center", va="center", fontsize=fontsize, color=PALETTE["text"],
            weight=("bold" if bold else "normal"),
            style=("italic" if italic else "normal"))


def _layer(ax, x, y, w, h, title, *, fill, dashed=False):
    """Draw a layer container — a rounded box with a title strip."""
    rect = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.12",
        linewidth=1.4, edgecolor=PALETTE["border"], facecolor=fill,
        linestyle=("--" if dashed else "-"),
    )
    ax.add_patch(rect)
    ax.text(x + 0.18, y + h - 0.28, title,
            ha="left", va="top", fontsize=FONT_LABEL, weight="bold",
            color=PALETTE["text"])


def _arrow(ax, x1, y1, x2, y2, *, label="", dashed=False, color=None, fontsize=FONT_SMALL):
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle="-|>", mutation_scale=14,
        linewidth=1.0,
        color=(color or PALETTE["arrow"]),
        linestyle=("--" if dashed else "-"),
    )
    ax.add_patch(arrow)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 + 0.12
        ax.text(mx, my, label, ha="center", va="bottom", fontsize=fontsize,
                color=PALETTE["text"])


def _legend(ax, items, x, y):
    """items = [(label, fill), ...]"""
    box_w, box_h = 0.30, 0.24
    for i, (lab, fill) in enumerate(items):
        bx = x
        by = y - i * 0.42
        rect = patches.Rectangle((bx, by), box_w, box_h,
                                 linewidth=0.8, edgecolor=PALETTE["border"],
                                 facecolor=fill)
        ax.add_patch(rect)
        ax.text(bx + box_w + 0.12, by + box_h / 2, lab,
                ha="left", va="center", fontsize=FONT_TINY, color=PALETTE["text"])


# ── Figures ─────────────────────────────────────────────────────────────────

def figure_context() -> Path:
    """System-context diagram: actors and external systems around the box."""
    fig, ax = _new_canvas(9.5, 5.5)
    # Central system box
    _box(ax, 3.6, 1.6, 3.0, 2.2, "AgentMini-Nest\nSystem",
         fill=PALETTE["engine"], fontsize=FONT_TITLE, bold=True)
    # Actors / external systems
    _box(ax, 0.4, 2.2, 2.2, 1.0, "End User\n(curl / CLI / browser)",
         fill=PALETTE["interface"], fontsize=FONT_SMALL)
    _box(ax, 7.6, 3.4, 1.7, 0.9, "LLM Provider\n(OpenAI-compat)",
         fill=PALETTE["service"], fontsize=FONT_SMALL)
    _box(ax, 7.6, 1.6, 1.7, 0.9, "Search APIs\n(Brave / DDG)",
         fill=PALETTE["service"], fontsize=FONT_SMALL)
    _box(ax, 0.4, 0.3, 2.2, 0.9, "Workspace files\n(local FS)",
         fill=PALETTE["tool"], fontsize=FONT_SMALL)
    _box(ax, 4.2, 0.3, 2.0, 0.9, "Sessions on disk\n(JSONL)",
         fill=PALETTE["storage"], fontsize=FONT_SMALL)
    _box(ax, 6.7, 0.3, 1.8, 0.9, "Web pages\n(HTTP fetch)",
         fill=PALETTE["service"], fontsize=FONT_SMALL)

    _arrow(ax, 2.6, 2.7, 3.6, 2.7, label="HTTP + SSE")
    _arrow(ax, 6.6, 2.85, 7.6, 3.85, label="stream chat")
    _arrow(ax, 7.6, 3.85, 6.6, 2.85, label="text/tool deltas", dashed=True)
    _arrow(ax, 6.6, 2.5, 7.6, 2.05, label="WebSearch")
    _arrow(ax, 4.4, 1.6, 3.5, 1.2, label="Bash/Read/Write")
    _arrow(ax, 5.0, 1.6, 5.2, 1.2, label="JSONL r/w", dashed=True)
    _arrow(ax, 6.2, 1.6, 7.5, 1.2, label="WebFetch")

    ax.text(5, 5.0, "Figure: System context — boundaries and external interactions",
            ha="center", fontsize=FONT_TINY, style="italic", color=PALETTE["muted"])
    return _save(fig, "fig-context.png")


def figure_architecture() -> Path:
    """Layered architecture with package containers + components inside."""
    fig, ax = _new_canvas(11, 7.5)

    # Layer containers (drawn first, behind)
    _layer(ax, 0.2, 5.4, 10.6, 1.6, "Interface layer", fill=PALETTE["interface"])
    _layer(ax, 0.2, 3.0, 10.6, 2.2, "Orchestration layer", fill=PALETTE["engine"])
    _layer(ax, 0.2, 0.5, 10.6, 2.3, "Storage and external layer", fill=PALETTE["storage"])

    # Interface components
    _box(ax, 0.45, 5.6, 2.4, 1.1, "ChatController\n(NestJS @Controller)\nSSE writer", fontsize=FONT_TINY,
         fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 3.15, 5.6, 2.4, 1.1, "ClientSessionMap\nIP+UA -> sessionId\n(in-memory)", fontsize=FONT_TINY,
         fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 5.85, 5.6, 2.4, 1.1, "CommandRegistry\n8 slash commands\nlazy lookup", fontsize=FONT_TINY,
         fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 8.55, 5.6, 2.0, 1.1, "TodoStore\nsession-scoped\nin-memory", fontsize=FONT_TINY,
         fill="#ffffff", border=PALETTE["accent"])

    # Orchestration components
    _box(ax, 0.45, 3.2, 2.4, 1.9, "QueryService\nasync generator\nturn loop\n+ retry / dedup\n+ parallel calls",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 3.15, 3.2, 2.4, 1.9, "AiService\nOpenAI streaming\nbackoff retry\nstream_options.include_usage",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 5.85, 3.2, 2.4, 1.9, "CompactionService\nmicroCompact +\nfull compact\ncircuit breaker",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 8.55, 3.2, 2.0, 1.9, "ToolRegistry\nstrip-nulls\nzod validate\ntimeout / cap\nabort signal",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])

    # Storage / external components
    _box(ax, 0.45, 0.7, 2.4, 1.9, "SessionService\nRAM cache\nlazy resume\npersist hooks",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 3.15, 0.7, 2.4, 1.9, "SessionStore\nJSONL append queue\nFLUSH_MS=100\nrewrite on compact",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])
    _box(ax, 5.85, 0.7, 2.4, 1.9, "Tool implementations\nBash, Read, Write,\nEdit, MultiEdit, Glob,\nGrep, LS, WebFetch,\nWebSearch, TodoWrite,\nSleep",
         fontsize=FONT_TINY, fill=PALETTE["tool"], border=PALETTE["border"])
    _box(ax, 8.55, 0.7, 2.0, 1.9, "External\nLLM provider\nBrave / DDG\nFilesystem\nHTTP",
         fontsize=FONT_TINY, fill=PALETTE["service"], border=PALETTE["border"])

    # Vertical edges between layers (a few representative ones)
    for x in (1.65, 4.35, 7.05, 9.55):
        _arrow(ax, x, 5.6, x, 5.1, label="")
        _arrow(ax, x, 3.2, x, 2.6, label="")

    _legend(ax, [
        ("Interface layer", PALETTE["interface"]),
        ("Orchestration layer", PALETTE["engine"]),
        ("Storage / external", PALETTE["storage"]),
        ("Tool implementations", PALETTE["tool"]),
    ], x=0.2, y=7.0)
    return _save(fig, "fig-architecture.png")


def figure_class_diagram() -> Path:
    """UML-style class diagram of the Tool subsystem."""
    fig, ax = _new_canvas(11, 7.5)

    def klass(x, y, w, h, name, attrs, methods, *, italic_name=False, fill="#ffffff"):
        # Header
        rect = patches.Rectangle((x, y), w, h, linewidth=1.0,
                                 edgecolor=PALETTE["border"], facecolor=fill)
        ax.add_patch(rect)
        # Title strip
        title_h = 0.35
        ax.add_patch(patches.Rectangle((x, y + h - title_h), w, title_h,
                                       linewidth=0, facecolor=PALETTE["interface"]))
        ax.text(x + w / 2, y + h - title_h / 2, name,
                ha="center", va="center", fontsize=FONT_LABEL,
                weight="bold", style=("italic" if italic_name else "normal"),
                color=PALETTE["text"])
        # Separator between attributes and methods
        attr_top = y + h - title_h
        ax.plot([x, x + w], [attr_top - 0.05, attr_top - 0.05],
                color=PALETTE["border"], lw=0.5)
        # Attributes
        line_y = attr_top - 0.32
        for a in attrs:
            ax.text(x + 0.12, line_y, a, ha="left", va="top",
                    fontsize=FONT_TINY, color=PALETTE["text"], family="monospace")
            line_y -= 0.30
        # Methods separator
        sep_y = line_y + 0.15
        ax.plot([x, x + w], [sep_y, sep_y], color=PALETTE["border"], lw=0.5)
        for m in methods:
            ax.text(x + 0.12, line_y, m, ha="left", va="top",
                    fontsize=FONT_TINY, color=PALETTE["text"], family="monospace")
            line_y -= 0.30

    # Tool interface
    klass(0.4, 4.5, 3.4, 2.6, "<<interface>> Tool",
          attrs=["+ name: string",
                 "+ prompt: string",
                 "+ schema: ZodTypeAny",
                 "+ readOnly: boolean",
                 "+ concurrencySafe?: boolean",
                 "+ timeoutMs?: number",
                 "+ maxResultSizeChars?: number"],
          methods=["+ call(input, ctx): Promise<ToolResult>"],
          italic_name=True, fill=PALETTE["interface"])

    # Concrete tools
    klass(4.4, 5.2, 2.7, 1.9, "BashTool",
          attrs=["- config: AppConfig"],
          methods=["+ call(input, ctx)"],
          fill=PALETTE["tool"])
    klass(7.4, 5.2, 3.2, 1.9, "WebFetchTool",
          attrs=["+ timeoutMs = 65000"],
          methods=["+ call(input, ctx)"],
          fill=PALETTE["tool"])
    klass(4.4, 2.9, 2.7, 1.9, "ReadTool",
          attrs=["- config: AppConfig"],
          methods=["+ call(input, ctx)"],
          fill=PALETTE["tool"])
    klass(7.4, 2.9, 3.2, 1.9, "TodoWriteTool",
          attrs=["- store: TodoStore"],
          methods=["+ call(input, ctx)"],
          fill=PALETTE["tool"])

    # Registry (uses Tool[])
    klass(0.4, 1.0, 3.4, 2.7, "ToolRegistry",
          attrs=["- tools: Map<string, Tool>"],
          methods=["+ get(name): Tool",
                   "+ names(): string[]",
                   "+ isConcurrencySafe(name): bool",
                   "+ toDefinitions(): ToolDef[]",
                   "+ execute(name, args, signal): ToolResult"],
          fill="#ffffff")

    # Inheritance arrows (open triangle approximation)
    def implements(ax, x1, y1, x2, y2):
        arrow = FancyArrowPatch((x1, y1), (x2, y2),
                                arrowstyle="-|>", mutation_scale=18,
                                linestyle="--", linewidth=1.0,
                                color=PALETTE["border"])
        ax.add_patch(arrow)

    implements(ax, 5.7, 5.2, 3.6, 5.5)
    implements(ax, 8.9, 5.2, 3.7, 5.7)
    implements(ax, 5.7, 4.8, 3.6, 5.0)
    implements(ax, 8.9, 4.8, 3.7, 5.2)

    # ToolRegistry uses Tool
    _arrow(ax, 2.1, 3.7, 2.1, 4.5, label="aggregates", dashed=True, fontsize=FONT_TINY)
    return _save(fig, "fig-class.png")


def figure_sequence() -> Path:
    """UML sequence diagram with proper lifelines and activation bars."""
    fig, ax = _new_canvas(11, 8.5)

    actors = ["Client", "ChatController", "QueryService", "AiService", "ToolRegistry", "Tool impl."]
    xs = [0.8, 2.7, 4.7, 6.7, 8.5, 10.2]
    top_y = 7.8
    bottom_y = 0.5

    # Actor headers
    for x, name in zip(xs, actors):
        _box(ax, x - 0.7, top_y - 0.4, 1.4, 0.5, name,
             fill=PALETTE["interface"], fontsize=FONT_TINY, bold=True)
        ax.plot([x, x], [top_y - 0.4, bottom_y], color=PALETTE["muted"],
                lw=0.6, ls=":")

    # Activation bars
    def activation(x, y_top, y_bot, color=PALETTE["accent"]):
        rect = patches.Rectangle((x - 0.07, y_bot), 0.14, y_top - y_bot,
                                 linewidth=0.6, edgecolor=PALETTE["border"],
                                 facecolor=color, alpha=0.85)
        ax.add_patch(rect)

    activation(xs[1], 7.2, 0.7)
    activation(xs[2], 6.6, 0.9)
    activation(xs[3], 5.9, 5.2)
    activation(xs[3], 4.5, 4.0)
    activation(xs[4], 3.2, 1.6)
    activation(xs[5], 2.9, 2.1)

    def msg(y, a, b, label, *, dashed=False, fs=FONT_TINY):
        ax.annotate("",
            xy=(xs[b] + (-0.07 if a < b else 0.07), y),
            xytext=(xs[a] + (0.07 if a < b else -0.07), y),
            arrowprops=dict(arrowstyle="-|>", color=PALETTE["arrow"], lw=1.0,
                            linestyle=("--" if dashed else "-")))
        x_mid = (xs[a] + xs[b]) / 2
        ax.text(x_mid, y + 0.10, label, ha="center", va="bottom",
                fontsize=fs, color=PALETTE["text"])

    msg(7.3, 0, 1, "POST /api/chat (msg, ?sessionId)")
    msg(6.95, 1, 1, "resolveSessionId (body | header | clientMap)")
    msg(6.55, 1, 2, "run({messages, signal, callbacks})")
    msg(6.15, 2, 2, "shouldAutoCompact?")
    msg(5.8, 2, 3, "stream(messages, tools)")
    msg(5.4, 3, 2, "text_delta + tool_call deltas", dashed=True)
    msg(5.05, 2, 1, "yield text_delta", dashed=True)
    msg(4.7, 1, 0, "SSE: text_delta", dashed=True)

    msg(4.3, 2, 4, "execute(name, args, signal)")
    msg(3.9, 4, 5, "tool.call(input, ctx)")
    msg(3.5, 5, 4, "ToolResult", dashed=True)
    msg(3.1, 4, 2, "ToolResult (truncated, isError)", dashed=True)
    msg(2.75, 2, 1, "yield tool_start + tool_result", dashed=True)
    msg(2.4, 1, 0, "SSE: tool events", dashed=True)

    msg(1.85, 2, 2, "loop until no tool_calls or maxTurns")
    msg(1.3, 2, 1, "yield done {usage, turns}", dashed=True)
    msg(0.9, 1, 0, "SSE: done", dashed=True)
    return _save(fig, "fig-sequence.png")


def figure_state() -> Path:
    """State diagram of one chat request through the engine."""
    fig, ax = _new_canvas(11, 6)

    states = [
        (1.0, 4.5, 2.0, 1.0, "Idle\n(controller)"),
        (4.0, 4.5, 2.4, 1.0, "Pre-turn check\n(compact?)"),
        (7.4, 4.5, 2.4, 1.0, "Streaming\n(LLM call)"),
        (4.0, 2.5, 2.4, 1.0, "Tool execution\n(parallel/seq)"),
        (7.4, 2.5, 2.4, 1.0, "Append history\n+ persist"),
        (4.0, 0.5, 2.4, 1.0, "Done\n(emit usage)"),
        (1.0, 0.5, 2.0, 1.0, "Aborted\n(client closed)"),
    ]
    fills = [PALETTE["interface"], PALETTE["engine"], PALETTE["service"],
             PALETTE["tool"], PALETTE["storage"], PALETTE["interface"], PALETTE["service"]]
    for (x, y, w, h, lab), f in zip(states, fills):
        _box(ax, x, y, w, h, lab, fill=f, fontsize=FONT_SMALL)

    _arrow(ax, 3.0, 5.0, 4.0, 5.0, label="POST /chat")
    _arrow(ax, 6.4, 5.0, 7.4, 5.0, label="under threshold")
    _arrow(ax, 5.2, 4.5, 5.2, 3.5, label="tool_calls present")
    _arrow(ax, 8.6, 4.5, 8.6, 3.0, label="no tool_calls")
    _arrow(ax, 8.6, 3.0, 6.4, 3.0, label="")
    _arrow(ax, 6.4, 3.0, 5.2, 3.5, label="loop")
    _arrow(ax, 5.2, 2.5, 5.2, 1.5, label="maxTurns / break")
    _arrow(ax, 4.0, 1.0, 3.0, 1.0, label="signal aborted", dashed=True)
    _arrow(ax, 3.0, 1.0, 1.0, 1.0, label="cleanup", dashed=True)

    # Self loop on streaming
    ax.annotate("", xy=(8.6, 4.6), xytext=(8.6, 4.4),
                arrowprops=dict(arrowstyle="-|>", color=PALETTE["arrow"], lw=1))
    ax.text(8.7, 4.55, "delta", fontsize=FONT_TINY)

    ax.text(5.5, 5.7, "States visited per chat request",
            ha="center", fontsize=FONT_TINY, style="italic", color=PALETTE["muted"])
    return _save(fig, "fig-state.png")


def figure_tool_pipeline() -> Path:
    fig, ax = _new_canvas(11, 6)
    boxes = [
        (0.3, 4.5, 1.7, 0.9, "model\nemits tool_call\n(JSON deltas)", PALETTE["interface"]),
        (2.2, 4.5, 1.7, 0.9, "stripTopLevelNulls\n(normalise)", PALETTE["service"]),
        (4.1, 4.5, 1.7, 0.9, "Zod\nvalidate", PALETTE["service"]),
        (6.0, 4.5, 1.7, 0.9, "AbortSignal\ncombine\n(client + timer)", PALETTE["service"]),
        (7.9, 4.5, 1.6, 0.9, "tool.call()", PALETTE["tool"]),
        (9.7, 4.5, 1.0, 0.9, "result", PALETTE["interface"]),

        (0.3, 2.7, 3.1, 1.1,
         "Concurrency policy\nreadOnly => parallel\nwrites => sequential", PALETTE["engine"]),
        (3.6, 2.7, 3.0, 1.1,
         "Per-tool timeout\nPromise.race\n(default 30s)", PALETTE["engine"]),
        (6.8, 2.7, 3.9, 1.1,
         "maxResultSizeChars\ntruncate to 100K\n(keeps context bounded)", PALETTE["engine"]),

        (0.3, 0.6, 10.4, 1.3,
         "Yield order: tool_start  ->  tool_result.\n"
         "Append { role: 'tool', tool_call_id, content } to history.\n"
         "Dedup guard: same fingerprint > 3 turns => inject reminder, then break.",
         PALETTE["storage"]),
    ]
    for x, y, w, h, lab, fill in boxes:
        _box(ax, x, y, w, h, lab, fill=fill, fontsize=FONT_TINY)

    for x in (2.0, 3.9, 5.8, 7.7, 9.6):
        _arrow(ax, x, 4.95, x + 0.18, 4.95, label="")
    _arrow(ax, 1.7, 4.5, 1.7, 3.8, label="")
    _arrow(ax, 5.0, 4.5, 5.0, 3.8, label="")
    _arrow(ax, 8.7, 4.5, 8.7, 3.8, label="")
    _arrow(ax, 5.0, 2.7, 5.0, 1.9, label="")
    return _save(fig, "fig-tool-pipeline.png")


def figure_compaction() -> Path:
    fig, ax = _new_canvas(11, 6)
    _box(ax, 0.3, 4.6, 2.4, 0.9, "Pre-turn\nestimateTokens()", fill=PALETTE["interface"], fontsize=FONT_SMALL)
    _box(ax, 3.2, 4.6, 2.6, 0.9, "tokens > 171,000?", fill=PALETTE["engine"], fontsize=FONT_SMALL)
    _box(ax, 6.4, 4.6, 4.3, 0.9, "Continue normal turn", fill=PALETTE["tool"], fontsize=FONT_SMALL)

    _box(ax, 0.3, 3.0, 2.4, 0.9, "microCompact()\ntruncate large\ntool results", fill=PALETTE["service"], fontsize=FONT_TINY)
    _box(ax, 3.2, 3.0, 2.6, 0.9, "still > threshold?", fill=PALETTE["engine"], fontsize=FONT_SMALL)
    _box(ax, 6.4, 3.0, 4.3, 0.9, "Use cheap pass only", fill=PALETTE["tool"], fontsize=FONT_SMALL)

    _box(ax, 0.3, 1.4, 3.0, 1.0,
         "compact()\nLLM summarise\nextract <summary>", fill=PALETTE["service"], fontsize=FONT_TINY)
    _box(ax, 3.6, 1.4, 3.4, 1.0,
         "Replace history with\n[system, boundary+summary, tail]", fill=PALETTE["service"], fontsize=FONT_TINY)
    _box(ax, 7.2, 1.4, 3.5, 1.0,
         "Persist rewrite to JSONL\n+ append compact marker", fill=PALETTE["storage"], fontsize=FONT_TINY)

    _box(ax, 0.3, 0.05, 10.4, 0.7,
         "On failure: increment consecutive failure counter; "
         "after 3 fails the circuit breaker skips compaction this session.",
         fill=PALETTE["interface"], fontsize=FONT_TINY, italic=True)

    _arrow(ax, 2.7, 5.0, 3.2, 5.0)
    _arrow(ax, 5.8, 5.0, 6.4, 5.0, label="no", dashed=True)
    _arrow(ax, 4.5, 4.6, 4.5, 3.9, label="yes")
    _arrow(ax, 2.7, 3.4, 3.2, 3.4)
    _arrow(ax, 5.8, 3.4, 6.4, 3.4, label="no", dashed=True)
    _arrow(ax, 4.5, 3.0, 4.5, 2.4, label="yes")
    _arrow(ax, 3.3, 1.9, 3.6, 1.9)
    _arrow(ax, 7.0, 1.9, 7.2, 1.9)
    return _save(fig, "fig-compaction.png")


def figure_persistence() -> Path:
    fig, ax = _new_canvas(11, 6)

    _layer(ax, 0.2, 4.4, 10.6, 1.4, "~/.agentmini-nest/sessions/", fill=PALETTE["storage"])

    _box(ax, 0.4, 2.4, 5.0, 1.7,
         "<sessionId>.jsonl\n\n"
         "{ type: 'header', version, sessionId, createdAt }\n"
         "{ type: 'message', message: APIMessage, recordedAt }\n"
         "{ type: 'message', ... }\n"
         "{ type: 'compact', stats, recordedAt }",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])

    _box(ax, 5.6, 2.4, 5.2, 1.7,
         "<sessionId>.meta.json\n\n"
         "{ sessionId, createdAt, lastActiveAt,\n"
         "  cumulativeInputTokens, cumulativeOutputTokens,\n"
         "  messageCount }",
         fontsize=FONT_TINY, fill="#ffffff", border=PALETTE["accent"])

    _box(ax, 0.4, 0.6, 6.4, 1.5,
         "Append-only writes via debounced queue\n"
         "FLUSH_MS = 100, group-by-file\n"
         "rewriteAfterCompaction: drain -> writeFile (whole file)",
         fontsize=FONT_TINY, fill=PALETTE["service"])
    _box(ax, 7.0, 0.6, 3.8, 1.5,
         "Resume:\nSessionService.getOrCreate(id)\n-> RAM cache\n-> disk fallback\n-> fresh otherwise",
         fontsize=FONT_TINY, fill=PALETTE["engine"])

    _arrow(ax, 1.3, 2.4, 1.3, 2.1, label="append")
    _arrow(ax, 6.0, 2.4, 6.0, 2.1, label="rewrite", dashed=True)
    _arrow(ax, 3.5, 0.6, 1.3, 0.4, label="")
    return _save(fig, "fig-persistence.png")


def figure_usecase() -> Path:
    """UML-style use-case diagram with actors and system boundary."""
    fig, ax = _new_canvas(11, 7)

    # System boundary
    boundary = patches.FancyBboxPatch(
        (3.0, 0.4), 5.5, 6.0,
        boxstyle="round,pad=0.05,rounding_size=0.15",
        linewidth=1.2, edgecolor=PALETTE["border"], facecolor="#ffffff",
    )
    ax.add_patch(boundary)
    ax.text(5.75, 6.2, "AgentMini-Nest", ha="center", fontsize=FONT_LABEL, weight="bold")

    # Use cases (ellipses)
    cases = [
        (3.4, 5.4, 2.0, 0.6, "UC-01: Hỏi đáp"),
        (5.7, 5.4, 2.0, 0.6, "UC-02: Đếm tệp / Bash"),
        (3.4, 4.5, 2.0, 0.6, "UC-03: Tạo / sửa Excel"),
        (5.7, 4.5, 2.0, 0.6, "UC-04: Tìm kiếm web"),
        (3.4, 3.6, 2.0, 0.6, "UC-05: Khôi phục phiên"),
        (5.7, 3.6, 2.0, 0.6, "UC-06: Nén ngữ cảnh"),
        (3.4, 2.7, 2.0, 0.6, "UC-07: Xuất bản hội thoại"),
        (5.7, 2.7, 2.0, 0.6, "UC-08: Quản lý todo"),
        (4.6, 1.6, 2.0, 0.6, "UC-09: Quan sát chi phí"),
    ]
    for x, y, w, h, lab in cases:
        ell = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.02,rounding_size=0.30",
            linewidth=1.0, edgecolor=PALETTE["border"], facecolor=PALETTE["interface"],
        )
        ax.add_patch(ell)
        ax.text(x + w / 2, y + h / 2, lab, ha="center", va="center",
                fontsize=FONT_TINY, color=PALETTE["text"])

    # Actors as stick-figure-ish boxes
    _box(ax, 0.5, 4.5, 1.6, 0.9, "Người dùng", fill=PALETTE["service"], fontsize=FONT_SMALL, bold=True)
    _box(ax, 0.5, 2.6, 1.6, 0.9, "Tập lệnh CLI", fill=PALETTE["service"], fontsize=FONT_SMALL, bold=True)
    _box(ax, 9.0, 4.5, 1.6, 0.9, "Mô hình LLM", fill=PALETTE["engine"], fontsize=FONT_SMALL, bold=True)
    _box(ax, 9.0, 2.6, 1.6, 0.9, "Search API", fill=PALETTE["engine"], fontsize=FONT_SMALL, bold=True)

    # Actor → use case edges
    for ax_x, lines in [
        (2.1, [(3.4, 5.7), (3.4, 4.8), (3.4, 3.9)]),
        (2.1, [(3.4, 2.9), (4.6, 1.9)]),
    ]:
        for tx, ty in lines:
            ax.plot([ax_x, tx], [4.95, ty + 0.3], color=PALETTE["arrow"], lw=0.8)
    # Right side
    for ax_x, lines in [
        (9.0, [(7.7, 5.7), (7.7, 4.8), (7.7, 3.9)]),
        (9.0, [(7.7, 2.9)]),
    ]:
        for tx, ty in lines:
            ax.plot([ax_x, tx], [4.95, ty + 0.3], color=PALETTE["arrow"], lw=0.8, ls="--")
    return _save(fig, "fig-usecase.png")


def figure_deployment() -> Path:
    """Deployment diagram: nodes, processes, files, network."""
    fig, ax = _new_canvas(11, 6)

    # Client node
    _layer(ax, 0.2, 3.6, 2.8, 1.9, "Client host", fill=PALETTE["interface"])
    _box(ax, 0.45, 3.85, 2.3, 0.9, "curl / browser /\nagentmini CLI",
         fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)

    # Server node
    _layer(ax, 3.4, 3.6, 4.8, 1.9, "Server host (Node.js 20+)", fill=PALETTE["engine"])
    _box(ax, 3.65, 4.6, 1.9, 0.7, "NestJS app\nport 3000", fill="#ffffff",
         border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 5.75, 4.6, 1.0, 0.7, "ts-node", fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 6.95, 4.6, 1.1, 0.7, "Child\nprocesses\n(Bash)", fill=PALETTE["tool"], fontsize=FONT_TINY)
    _box(ax, 3.65, 3.75, 4.45, 0.8, "Process memory: sessions Map + RAM cache + TodoStore + ClientSessionMap",
         fill="#ffffff", border=PALETTE["muted"], fontsize=FONT_TINY, italic=True)

    # External services
    _layer(ax, 8.6, 3.6, 2.2, 1.9, "External", fill=PALETTE["service"])
    _box(ax, 8.8, 4.6, 1.85, 0.7, "LLM provider", fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 8.8, 3.75, 1.85, 0.7, "Search APIs / Web", fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)

    # Filesystem node
    _layer(ax, 0.2, 0.5, 10.6, 2.6, "Local filesystem", fill=PALETTE["storage"])
    _box(ax, 0.5, 1.8, 2.6, 1.0, "Workspace files\n(read/write via tools)",
         fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 3.3, 1.8, 3.8, 1.0,
         "~/.agentmini-nest/sessions/\n<id>.jsonl   <id>.meta.json",
         fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 7.3, 1.8, 3.4, 1.0, ".env\nAI_API_KEY, AI_API_URL, AI_MODEL,\nPORT, SESSIONS_DIR, ...",
         fill="#ffffff", border=PALETTE["accent"], fontsize=FONT_TINY)
    _box(ax, 0.5, 0.7, 10.0, 0.7,
         "Node modules: @nestjs/*, openai, zod, fast-glob, zod-to-json-schema",
         fill="#ffffff", border=PALETTE["muted"], fontsize=FONT_TINY, italic=True)

    # Edges
    _arrow(ax, 3.0, 4.6, 3.4, 4.6, label="HTTP/SSE")
    _arrow(ax, 8.2, 4.95, 8.6, 4.95, label="HTTPS")
    _arrow(ax, 8.2, 4.0, 8.6, 4.0, label="HTTPS", dashed=True)
    _arrow(ax, 5.5, 3.6, 4.5, 2.8, label="JSONL r/w")
    _arrow(ax, 4.0, 3.6, 1.7, 2.8, label="Bash / Read / Write")
    _arrow(ax, 6.8, 3.6, 8.0, 2.8, label=".env at boot", dashed=True)
    return _save(fig, "fig-deployment.png")


def figure_data_model() -> Path:
    """Entity-style diagram of the in-memory and on-disk data structures."""
    fig, ax = _new_canvas(11, 5.5)

    def entity(x, y, w, h, name, fields):
        rect = patches.Rectangle((x, y), w, h, linewidth=1.0,
                                 edgecolor=PALETTE["border"], facecolor="#ffffff")
        ax.add_patch(rect)
        title_h = 0.32
        ax.add_patch(patches.Rectangle((x, y + h - title_h), w, title_h,
                                       linewidth=0, facecolor=PALETTE["interface"]))
        ax.text(x + w / 2, y + h - title_h / 2, name,
                ha="center", va="center", fontsize=FONT_LABEL, weight="bold",
                color=PALETTE["text"])
        ax.plot([x, x + w], [y + h - title_h - 0.04, y + h - title_h - 0.04],
                color=PALETTE["border"], lw=0.5)
        line_y = y + h - title_h - 0.28
        for f in fields:
            ax.text(x + 0.15, line_y, f, ha="left", va="top",
                    fontsize=FONT_TINY, family="monospace", color=PALETTE["text"])
            line_y -= 0.28

    entity(0.3, 1.5, 3.4, 3.5, "Session",
           ["id: UUID",
            "apiMessages: APIMessage[]",
            "cumulative: { in, out }",
            "createdAt: Date",
            "lastActiveAt: Date",
            "persisted: boolean"])

    entity(4.0, 1.5, 3.4, 3.5, "APIMessage",
           ["role: 'system'|'user'|'assistant'|'tool'",
            "content: string | null",
            "tool_calls?: ToolCall[]",
            "tool_call_id?: string"])

    entity(7.7, 1.5, 3.0, 3.5, "ToolCall",
           ["id: string",
            "type: 'function'",
            "function:",
            "  name: string",
            "  arguments: string (JSON)"])

    entity(0.3, 0.2, 5.0, 1.0, "JSONL line types (on disk)",
           ["header | message | compact"])
    entity(5.6, 0.2, 5.1, 1.0, "meta.json sidecar",
           ["createdAt, lastActiveAt, cumulative*, messageCount"])

    _arrow(ax, 3.7, 3.5, 4.0, 3.5, label="has many")
    _arrow(ax, 7.4, 3.5, 7.7, 3.5, label="optional", dashed=True)
    return _save(fig, "fig-data-model.png")


def render_all() -> dict[str, Path]:
    return {
        "context":      figure_context(),
        "architecture": figure_architecture(),
        "class":        figure_class_diagram(),
        "sequence":     figure_sequence(),
        "state":        figure_state(),
        "tool":         figure_tool_pipeline(),
        "compaction":   figure_compaction(),
        "persistence":  figure_persistence(),
        "usecase":      figure_usecase(),
        "deployment":   figure_deployment(),
        "data_model":   figure_data_model(),
    }


if __name__ == "__main__":
    for k, p in render_all().items():
        print(f"{k}: {p}")
