# Changelog

## 0.1.10 (2026-05-13)

### Fixes
- `skl usage` (claude-code, attributed/merged modes): same skill re-invoked
  after a non-attributed line is now counted as a separate invocation.
- `skl usage` (codex, function_call exec_command): only read-like commands
  (`cat`, `sed`, `head`, `tail`, `bat`, `batcat`, `less`, `more`) are
  counted. Skips output redirection (`>`, `>>`, `2>`, `&>`) and heredoc
  bodies. Fixes false positives from fixture-generation and search commands.

### Features
- Bare `skl` in a TTY shows an interactive picker
  ({usage, cost, list, quit}). Non-TTY invocations (CI, pipes) preserve
  the legacy bare→cost behavior. `remove` is intentionally omitted from
  the menu and will return in a future iteration with a skill-name picker.
- `skl rm` now skips modifying `skills-lock.json` when the file is
  git-tracked; warning to stderr. Pass `--force-lock` to override.
- `skl usage` no longer renders skills with `count=0`.
- `skl cost` shows `~? tok  missing` (red) for skills missing from disk.
- `skl list` always renders three source rows (`.claude/skills`,
  `.agents/skills`, `skills-lock.json`) with `0 skills` for empty sources.

### Style
- Blank line moved to BEFORE `Local`/`Global`/`Total` headers (was after).

## 0.1.8 (2026-05-12)

### Breaking Changes

- **`skl` (bare, no subcommand)** now runs `skl cost` instead of the
  Global + Local + Total summary. For per-agent activations + consumption,
  run `skl usage`.
- `skl summary` subcommand removed (it was the previous bare behavior).

### Added

- `skl cst` alias for `skl cost` (and existing `co`).
- `skl usg` alias for `skl usage` (and existing `us`).
- Cyan highlighting for skill names in `skl cost`, `skl ls`, and `skl usage` output.
- Dependabot: automatic weekly PRs for npm deps and GitHub Actions versions.
- CI: matrix on Node 20 + 22 with `fail-fast: false` and a per-ref concurrency group; adds a `tsc --noEmit` typecheck step.

### Internal

- `.github/actions/checks` composite action holds the shared lint/typecheck/unit/build/e2e sequence; both `ci.yml` and `release.yml` call it (zero duplication).
