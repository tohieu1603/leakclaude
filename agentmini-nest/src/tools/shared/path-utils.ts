// Workspace path resolution. All file/shell tools route through resolveSafePath
// so the agent cannot escape WORKSPACE_ROOT.

import { isAbsolute, resolve, relative } from 'path';
import { homedir } from 'os';

export function expandPath(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

export function resolveSafePath(workspaceRoot: string, p: string): string {
  const expanded = expandPath(p);
  const absRoot = resolve(workspaceRoot);
  const target = isAbsolute(expanded) ? resolve(expanded) : resolve(absRoot, expanded);
  const rel = relative(absRoot, target);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path "${p}" is outside the workspace root "${absRoot}"`);
  }
  return target;
}

export function toRelative(workspaceRoot: string, abs: string): string {
  const r = relative(resolve(workspaceRoot), abs);
  return r === '' ? '.' : r;
}
