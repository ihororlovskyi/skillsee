import { describe, expect, it } from 'vitest';
import { isUserTurnEntry } from './claude-entry';

describe('isUserTurnEntry', () => {
  it('returns true for type=user with role=user and text content', () => {
    const entry = {
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text: 'hi' }] },
    };
    expect(isUserTurnEntry(entry)).toBe(true);
  });

  it('returns false for tool_result wrapper (user role, but tool_result content)', () => {
    const entry = {
      type: 'user',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x' }] },
    };
    expect(isUserTurnEntry(entry)).toBe(false);
  });

  it('returns true for plain string content (legacy form)', () => {
    const entry = { type: 'user', message: { role: 'user', content: 'hi there' } };
    expect(isUserTurnEntry(entry)).toBe(true);
  });

  it('returns false for assistant entries', () => {
    const entry = {
      type: 'assistant',
      message: { role: 'assistant', content: [{ type: 'text', text: 'ok' }] },
    };
    expect(isUserTurnEntry(entry)).toBe(false);
  });

  it('returns false for non-user metadata types', () => {
    expect(isUserTurnEntry({ type: 'system' })).toBe(false);
    expect(isUserTurnEntry({ type: 'permission-mode' })).toBe(false);
    expect(isUserTurnEntry({ type: 'attachment' })).toBe(false);
    expect(isUserTurnEntry({ type: 'file-history-snapshot' })).toBe(false);
  });

  it('returns false for malformed entries', () => {
    expect(isUserTurnEntry(null)).toBe(false);
    expect(isUserTurnEntry('string')).toBe(false);
    expect(isUserTurnEntry({})).toBe(false);
    expect(isUserTurnEntry({ type: 'user' })).toBe(false);
  });
});
