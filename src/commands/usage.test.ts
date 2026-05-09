import { describe, expect, it } from 'vitest';
import { formatUsageRow } from './usage';

describe('formatUsageRow', () => {
  it('formats a used row with multiplication', () => {
    expect(
      formatUsageRow({
        count: 91,
        name: 'subagent-driven-development',
        tokens: 58,
        status: 'ok',
        countWidth: 2,
        nameWidth: 27,
        totalWidth: 4,
      }),
    ).toBe('91 subagent-driven-development  ~ 58 tok * 91     = ~ 5278 tok');
  });

  it('formats a missed row with literal "missed"', () => {
    expect(
      formatUsageRow({
        count: 0,
        name: 'caveman',
        tokens: 41,
        status: 'ok',
        countWidth: 2,
        nameWidth: 27,
        totalWidth: 4,
      }),
    ).toBe(' 0 caveman                      ~ 41 tok missed   = ~    0 tok');
  });

  it('formats a missing-on-disk row', () => {
    expect(
      formatUsageRow({
        count: 0,
        name: 'ghost',
        tokens: undefined,
        status: 'missing',
        countWidth: 2,
        nameWidth: 27,
        totalWidth: 4,
      }),
    ).toBe(' 0 ghost                        missing');
  });

  it('formats a no-frontmatter row', () => {
    expect(
      formatUsageRow({
        count: 0,
        name: 'plain',
        tokens: undefined,
        status: 'no-frontmatter',
        countWidth: 2,
        nameWidth: 27,
        totalWidth: 4,
      }),
    ).toBe(' 0 plain                        (no frontmatter)');
  });
});
