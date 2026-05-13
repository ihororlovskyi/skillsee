import { describe, expect, it } from 'vitest';
import { extractSkillReadsFromCmd } from './codex-cmd';

describe('extractSkillReadsFromCmd', () => {
  it('counts cat .../foo/SKILL.md', () => {
    expect(extractSkillReadsFromCmd('cat /a/b/foo/SKILL.md')).toEqual(['foo']);
  });

  it("counts sed -n '1,180p' .../bar/SKILL.md", () => {
    expect(extractSkillReadsFromCmd("sed -n '1,180p' /a/bar/SKILL.md")).toEqual(['bar']);
  });

  it('counts head, tail, bat, batcat, less, more', () => {
    expect(extractSkillReadsFromCmd('head /a/h/SKILL.md')).toEqual(['h']);
    expect(extractSkillReadsFromCmd('tail -n 5 /a/t/SKILL.md')).toEqual(['t']);
    expect(extractSkillReadsFromCmd('bat /a/b/SKILL.md')).toEqual(['b']);
    expect(extractSkillReadsFromCmd('batcat /a/bc/SKILL.md')).toEqual(['bc']);
    expect(extractSkillReadsFromCmd('less /a/l/SKILL.md')).toEqual(['l']);
    expect(extractSkillReadsFromCmd('more /a/m/SKILL.md')).toEqual(['m']);
  });

  it('dedupes the same skill referenced twice in one cmd', () => {
    expect(extractSkillReadsFromCmd('cat /a/foo/SKILL.md /a/foo/SKILL.md')).toEqual(['foo']);
  });

  it('does NOT count printf > .../noise/SKILL.md (redirect)', () => {
    expect(extractSkillReadsFromCmd('printf x > /a/noise/SKILL.md')).toEqual([]);
  });

  it('does NOT count cat ... > .../write/SKILL.md (redirect target)', () => {
    expect(extractSkillReadsFromCmd('cat /etc/passwd > /a/write/SKILL.md')).toEqual([]);
  });

  it('does NOT count heredoc body containing cat .../fixture/SKILL.md', () => {
    const cmd = `cat <<'EOF' > /tmp/x.json
{"cmd":"cat /a/fixture/SKILL.md"}
EOF`;
    expect(extractSkillReadsFromCmd(cmd)).toEqual([]);
  });

  it('does NOT count tab-indented heredoc <<-EOF body', () => {
    const cmd = 'cat <<-\'EOF\' > /tmp/x.json\n\t{"cmd":"cat /a/fixture/SKILL.md"}\n\tEOF';
    expect(extractSkillReadsFromCmd(cmd)).toEqual([]);
  });

  it('does NOT count rg .../SKILL.md (rg is not read-like)', () => {
    expect(extractSkillReadsFromCmd('rg SKILL.md /a/x/SKILL.md')).toEqual([]);
  });

  it('does NOT count grep .../SKILL.md', () => {
    expect(extractSkillReadsFromCmd('grep -l SKILL.md /a/y/SKILL.md')).toEqual([]);
  });

  it('handles pipe segments: cat .../foo/SKILL.md | head', () => {
    expect(extractSkillReadsFromCmd('cat /a/foo/SKILL.md | head')).toEqual(['foo']);
  });

  it('handles && segments: cat foo && cat .../bar/SKILL.md', () => {
    expect(extractSkillReadsFromCmd('cat /tmp/x && cat /a/bar/SKILL.md')).toEqual(['bar']);
  });

  it('allows 2> stderr redirect alongside legitimate read', () => {
    expect(extractSkillReadsFromCmd('cat /a/x/SKILL.md 2> /tmp/err')).toEqual(['x']);
  });

  it('blocks &> write-redirect even when target is SKILL.md', () => {
    expect(extractSkillReadsFromCmd('cat /etc/passwd &> /a/y/SKILL.md')).toEqual([]);
  });

  it('blocks no-space write redirect cmd>file', () => {
    expect(extractSkillReadsFromCmd('cat /etc/passwd>/a/z/SKILL.md')).toEqual([]);
  });

  it('returns empty for non-read-like first token', () => {
    expect(extractSkillReadsFromCmd('echo /a/x/SKILL.md')).toEqual([]);
    expect(extractSkillReadsFromCmd('jq . /a/x/SKILL.md')).toEqual([]);
  });
});
