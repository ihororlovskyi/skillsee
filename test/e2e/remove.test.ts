import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './helpers';

const CLI = resolve(__dirname, '..', '..', 'dist', 'cli.js');

const LOCK_DIR = join(process.cwd(), 'test', 'fixtures', 'lock');

let TMP = '';

beforeEach(() => {
  TMP = mkdtempSync(join(tmpdir(), 'skl-rm-e2e-'));
  cpSync(LOCK_DIR, TMP, { recursive: true });
});

afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('skl rm', () => {
  it('--yes removes disk skills (lock kept by default)', () => {
    expect(existsSync(join(TMP, '.claude/skills/skill-foo/SKILL.md'))).toBe(true);
    const { stdout, exitCode } = run(['rm', '--yes', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Kept "skill-foo" in skills-lock.json (no --force-lock)');
    expect(stdout).toMatch(/Removed "skill-foo" from \.claude\/skills/);
    expect(existsSync(join(TMP, '.claude/skills/skill-foo'))).toBe(false);
    // lock still contains skill-foo
    const lock = JSON.parse(readFileSync(join(TMP, 'skills-lock.json'), 'utf8'));
    expect(Object.keys(lock.skills)).toContain('skill-foo');
  });

  it('--dry-run shows the plan without deleting', () => {
    const { stdout, exitCode } = run(['rm', '--dry-run', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Will remove "skill-foo"');
    expect(stdout).toContain('skills-lock.json (kept; use --force-lock to remove lock entry)');
    expect(existsSync(join(TMP, '.claude/skills/skill-foo/SKILL.md'))).toBe(true);
  });

  it('reports skips when skill is missing from a source', () => {
    const { stdout, exitCode } = run(['rm', '--yes', 'skill-baz'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Kept "skill-baz" in skills-lock.json (no --force-lock)');
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
    expect(stdout).toContain('Kept "skill-foo" in skills-lock.json (no --force-lock)');
    expect(stdout).toContain('Kept "skill-bar" in skills-lock.json (no --force-lock)');
    expect(existsSync(join(TMP, '.claude/skills/skill-foo'))).toBe(false);
    expect(existsSync(join(TMP, '.claude/skills/skill-bar'))).toBe(false);
    // lock still has both
    const lock = JSON.parse(readFileSync(join(TMP, 'skills-lock.json'), 'utf8'));
    expect(Object.keys(lock.skills)).toContain('skill-foo');
    expect(Object.keys(lock.skills)).toContain('skill-bar');
  });

  it('rm alias works', () => {
    const { stdout, exitCode } = run(['remove', '--yes', 'skill-foo'], TMP);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Kept "skill-foo"');
  });

  it('default leaves lock untouched (lock preservation)', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'skl-rm-'));
    writeFileSync(join(tmpDir, 'skills-lock.json'), JSON.stringify({ skills: { foo: {} } }));
    mkdirSync(join(tmpDir, '.claude', 'skills', 'foo'), { recursive: true });
    writeFileSync(join(tmpDir, '.claude', 'skills', 'foo', 'SKILL.md'), 'x');

    const r = spawnSync(process.execPath, [CLI, 'rm', 'foo', '--yes'], {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, SKILLIO_NO_UPDATE_CHECK: '1' },
    });
    expect(r.status).toBe(0);

    const lock = JSON.parse(readFileSync(join(tmpDir, 'skills-lock.json'), 'utf8'));
    expect(lock.skills).toHaveProperty('foo'); // lock kept
    expect(existsSync(join(tmpDir, '.claude', 'skills', 'foo'))).toBe(false); // disk gone
    expect(r.stdout).toContain('Kept');
    expect(r.stdout).toContain('skills-lock.json');

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('--force-lock removes lock entry', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'skl-rm-'));
    writeFileSync(join(tmpDir, 'skills-lock.json'), JSON.stringify({ skills: { foo: {}, bar: {} } }));

    const r = spawnSync(
      process.execPath,
      [CLI, 'rm', 'foo', '--force-lock', '--yes'],
      { cwd: tmpDir, encoding: 'utf8', env: { ...process.env, SKILLIO_NO_UPDATE_CHECK: '1' } },
    );
    expect(r.status).toBe(0);

    const lock = JSON.parse(readFileSync(join(tmpDir, 'skills-lock.json'), 'utf8'));
    expect(lock.skills).not.toHaveProperty('foo');
    expect(lock.skills).toHaveProperty('bar');
    expect(r.stdout).toContain('Removed');

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('printPlan announces "kept" without --force-lock', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'skl-rm-'));
    writeFileSync(join(tmpDir, 'skills-lock.json'), JSON.stringify({ skills: { foo: {} } }));
    mkdirSync(join(tmpDir, '.claude', 'skills', 'foo'), { recursive: true });
    writeFileSync(join(tmpDir, '.claude', 'skills', 'foo', 'SKILL.md'), 'x');

    const r = spawnSync(process.execPath, [CLI, 'rm', 'foo', '--dry-run'], {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, SKILLIO_NO_UPDATE_CHECK: '1' },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('skills-lock.json (kept; use --force-lock to remove lock entry)');

    rmSync(tmpDir, { recursive: true, force: true });
  });
});
