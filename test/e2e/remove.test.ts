import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './helpers';

function gitInit(cwd: string): void {
  execSync('git init -q', { cwd });
  execSync('git config user.email t@t', { cwd });
  execSync('git config user.name t', { cwd });
  execSync('git add skills-lock.json', { cwd });
  execSync('git commit -q -m init', { cwd });
}

const LOCK_DIR = join(process.cwd(), 'test', 'fixtures', 'lock');

let TMP = '';

beforeEach(() => {
  TMP = mkdtempSync(join(tmpdir(), 'skl-rm-e2e-'));
  cpSync(LOCK_DIR, TMP, { recursive: true });
});

afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('skl rm', () => {
  it('--yes removes from lock and deletes .claude/skills directory', () => {
    expect(existsSync(join(TMP, '.claude/skills/skill-foo/SKILL.md'))).toBe(true);
    const { stdout, exitCode } = run(['rm', '--yes', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed "skill-foo" from skills-lock.json');
    expect(stdout).toMatch(/Removed "skill-foo" from \.claude\/skills/);
    expect(existsSync(join(TMP, '.claude/skills/skill-foo'))).toBe(false);
    const { stdout: lsOut } = run(['ls'], TMP);
    expect(lsOut).toMatch(/skills-lock\.json\s+:\s+(?!.*\bskill-foo\b).*/);
  });

  it('--dry-run shows the plan without deleting', () => {
    const { stdout, exitCode } = run(['rm', '--dry-run', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Will remove "skill-foo"');
    expect(stdout).toContain('skills-lock.json');
    expect(existsSync(join(TMP, '.claude/skills/skill-foo/SKILL.md'))).toBe(true);
  });

  it('reports skips when skill is missing from a source', () => {
    const { stdout, exitCode } = run(['rm', '--yes', 'skill-baz'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed "skill-baz" from skills-lock.json');
    expect(stdout).toContain('Skipped .claude/skills (not found)');
  });

  it('exits 1 when nothing matches', () => {
    const { stdout, exitCode } = run(['rm', '--yes', 'nonexistent'], TMP);
    expect(exitCode).toBe(1);
    expect(stdout).toContain('"nonexistent" is not in lock or on disk');
  });

  it('removes multiple skills with a single confirmation (--yes)', () => {
    const { stdout, exitCode } = run(['rm', '--yes', 'skill-foo', 'skill-bar'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed "skill-foo"');
    expect(stdout).toContain('Removed "skill-bar"');
    expect(existsSync(join(TMP, '.claude/skills/skill-foo'))).toBe(false);
    expect(existsSync(join(TMP, '.claude/skills/skill-bar'))).toBe(false);
  });

  it('rm alias works', () => {
    const { stdout, exitCode } = run(['remove', '--yes', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed "skill-foo"');
  });

  it('skips lock when skills-lock.json is git-tracked', () => {
    gitInit(TMP);
    const { stderr, exitCode } = run(['rm', '--yes', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stderr).toContain('Skipping skills-lock.json (tracked by git');
    expect(existsSync(join(TMP, '.claude/skills/skill-foo'))).toBe(false);
    const lock = JSON.parse(readFileSync(join(TMP, 'skills-lock.json'), 'utf8'));
    expect(Object.keys(lock.skills)).toContain('skill-foo');
  });

  it('--force-lock overrides skip and modifies tracked lock', () => {
    gitInit(TMP);
    const { stdout, exitCode } = run(['rm', '--yes', '--force-lock', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Removed "skill-foo" from skills-lock.json');
  });

  it('--dry-run annotates the git-tracked lock skip in the plan', () => {
    gitInit(TMP);
    const { stdout, stderr, exitCode } = run(['rm', '--dry-run', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('skills-lock.json (skipped: git-tracked; use --force-lock)');
    expect(stderr).toContain('Skipping skills-lock.json (tracked by git');
  });
});
