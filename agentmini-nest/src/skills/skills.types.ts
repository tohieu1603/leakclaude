// A "skill" is a markdown document containing domain expertise (style guide,
// runbook, framework conventions, vendor API quirks, etc.). At boot we scan a
// catalogue of skill files and expose:
//   1. /skill <name>  — slash command to load a skill's body into the
//      conversation as a user system-reminder so the model can apply it.
//   2. /skills        — list all available skills with their descriptions
//
// This is the cheaper, file-based variant of MCP prompts: skills don't need
// a server, just a markdown file.

export interface SkillFile {
  name: string;
  description: string;
  body: string;
  source: string;
}

export interface SkillFrontmatter {
  description?: string;
  tags?: string[];
}
