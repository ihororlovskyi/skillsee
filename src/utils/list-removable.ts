import { discoverSkills } from './discover-skills';

export interface ListRemovableInput {
  isGlobal: boolean;
  cwd: string;
  lockPath: string;
}

export interface ListRemovableResult {
  inLock: string[];
  orphan: string[];
}

export function listRemovableTargets(input: ListRemovableInput): ListRemovableResult {
  const records = [...discoverSkills(input).values()];
  const inLock: string[] = [];
  const orphan: string[] = [];
  for (const r of records) {
    if (r.sources.includes('lock')) inLock.push(r.name);
    else orphan.push(r.name);
  }
  inLock.sort();
  orphan.sort();
  return { inLock, orphan };
}
