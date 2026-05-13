import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from './helpers';

const COST_DIR = join(process.cwd(), 'test', 'fixtures', 'cost');

describe('bare skl', () => {
  it('non-TTY (piped stdout) falls back to cost', () => {
    const { stdout, exitCode } = run([], COST_DIR);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Total: ~\d+ tok across/);
  });
});
