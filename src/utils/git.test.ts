import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isTrackedByGit } from './git';

let TMP = '';
let TRACKED = '';
let UNTRACKED = '';

beforeAll(() => {
  TMP = mkdtempSync(join(tmpdir(), 'skl-git-'));
  execSync('git init -q', { cwd: TMP });
  execSync('git config user.email t@t', { cwd: TMP });
  execSync('git config user.name t', { cwd: TMP });
  TRACKED = join(TMP, 'tracked.json');
  UNTRACKED = join(TMP, 'untracked.json');
  writeFileSync(TRACKED, '{}\n');
  writeFileSync(UNTRACKED, '{}\n');
  execSync(`git add ${TRACKED}`, { cwd: TMP });
  execSync('git commit -q -m init', { cwd: TMP });
});

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe('isTrackedByGit', () => {
  it('returns true for a tracked file', () => {
    expect(isTrackedByGit(TRACKED)).toBe(true);
  });

  it('returns false for an untracked file', () => {
    expect(isTrackedByGit(UNTRACKED)).toBe(false);
  });

  it('returns false for a missing file', () => {
    expect(isTrackedByGit(join(TMP, 'missing.json'))).toBe(false);
  });

  it('returns false outside any git repo', () => {
    const nonRepo = mkdtempSync(join(tmpdir(), 'skl-no-git-'));
    const f = join(nonRepo, 'x.json');
    writeFileSync(f, '{}');
    expect(isTrackedByGit(f)).toBe(false);
    rmSync(nonRepo, { recursive: true, force: true });
  });
});
