import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listRemovableTargets } from './list-removable';

describe('listRemovableTargets', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'skl-rm-list-'));
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  function seed(opts: {
    lock?: Record<string, unknown>;
    claudeNames?: string[];
    agentsNames?: string[];
  }) {
    const lockPath = join(tmp, 'skills-lock.json');
    writeFileSync(lockPath, JSON.stringify({ skills: opts.lock ?? {} }, null, 2));
    if (opts.claudeNames) {
      for (const name of opts.claudeNames) {
        mkdirSync(join(tmp, '.claude', 'skills', name), { recursive: true });
        writeFileSync(join(tmp, '.claude', 'skills', name, 'SKILL.md'), '---\nname: x\n---\nbody');
      }
    }
    if (opts.agentsNames) {
      for (const name of opts.agentsNames) {
        mkdirSync(join(tmp, '.agents', 'skills', name), { recursive: true });
        writeFileSync(join(tmp, '.agents', 'skills', name, 'SKILL.md'), '---\nname: x\n---\nbody');
      }
    }
    return lockPath;
  }

  it('returns inLock + orphan partitions, both alphabetic', () => {
    const lockPath = seed({
      lock: { 'b-locked': {}, 'a-locked': {} },
      claudeNames: ['b-locked', 'd-orphan', 'c-orphan'],
    });
    const r = listRemovableTargets({ isGlobal: false, cwd: tmp, lockPath });
    expect(r.inLock).toEqual(['a-locked', 'b-locked']);
    expect(r.orphan).toEqual(['c-orphan', 'd-orphan']);
  });

  it('empty when no skills present in scope', () => {
    const lockPath = seed({});
    const r = listRemovableTargets({ isGlobal: false, cwd: tmp, lockPath });
    expect(r.inLock).toEqual([]);
    expect(r.orphan).toEqual([]);
  });

  it('orphan is on-disk AND not in lock (skill in lock but no disk → NOT an orphan here)', () => {
    const lockPath = seed({
      lock: { 'phantom-in-lock': {} },
      claudeNames: ['disk-orphan'],
    });
    const r = listRemovableTargets({ isGlobal: false, cwd: tmp, lockPath });
    expect(r.inLock).toEqual(['phantom-in-lock']);
    expect(r.orphan).toEqual(['disk-orphan']);
  });

  it('counts .agents/skills as on-disk too', () => {
    const lockPath = seed({
      agentsNames: ['only-agents'],
    });
    const r = listRemovableTargets({ isGlobal: false, cwd: tmp, lockPath });
    expect(r.orphan).toEqual(['only-agents']);
  });
});
