import { describe, expect, it } from 'vitest';
import { run } from './helpers';

describe('skl completion', () => {
  it('prints bash completion script', () => {
    const { stdout, exitCode } = run(['completion', 'bash'], process.cwd());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('_skillio_completions()');
    expect(stdout).toContain('complete -F _skillio_completions skl');
    expect(stdout).toContain('skl list --names');
  });

  it('prints zsh completion script', () => {
    const { stdout, exitCode } = run(['completion', 'zsh'], process.cwd());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('compdef _skillio skl skillio');
    expect(stdout).toContain('skl list --names');
  });

  it('prints fish completion script', () => {
    const { stdout, exitCode } = run(['completion', 'fish'], process.cwd());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('__skillio_skill_names');
    expect(stdout).toContain('skl list --names');
  });

  it('errors on unknown shell with exit 1', () => {
    const { stderr, exitCode } = run(['completion', 'ohmyzsh'], process.cwd());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('unknown shell: ohmyzsh');
  });
});
