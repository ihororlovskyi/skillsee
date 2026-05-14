# Changelog

## 0.1.11 (2026-05-14)

### Breaking

- **`skl rm` no longer touches `skills-lock.json` by default.** Pass `--force-lock` to remove
  the lock entry. The previous "skip if git-tracked, override with `--force-lock`" logic is
  removed entirely. Scripts that relied on default lock removal need `--force-lock` added.
- **`--period` syntax cleanup.** `s/m/h/d/w` only. Notable: **`1m` now means 1 minute, not
  30 days.** Longhand `30sec`, `5min` and units `m` (month) / `y` (year) are rejected.
  Migration: `5min`→`5m`, `1m` (month)→`30d`, `1y`→`365d` or `52w`.

### Added

- **`skl rm --all`.** Wipes every skill in scope (disk only). Combine with `--force-lock`
  to also clear lock entries. Mutually exclusive with positional names.
- **Picker `remove` option.** Bare `skl` in TTY now shows `remove` in the main menu;
  selecting it opens a secondary picker listing every skill in scope. Orphans-on-disk
  (present on disk, missing from `skills-lock.json`) are labeled with a red `(orphan)`
  suffix to distinguish them from `cost`'s `missing` (in-lock, no `SKILL.md`).
- **Instant `y/N` confirm.** `skl rm` in a TTY resolves on a single keystroke — no Enter
  required. Pipes and CI still use the line-based readline fallback unchanged.

### Changed

- **`skl ls` redesign.** Row order is now `.agents/skills` → `.claude/skills` →
  `skills-lock.json`. Disk names are painted green for real directories and yellow for
  symlinks (`lstatSync` check). The `skills-lock.json` row shows only orphans-in-lock
  (entries with no disk presence in either source); an empty orphan set renders
  `All skills onboard!` in green.
- **`skl usage` spacing.** The blank line that used to appear before each agent header
  inside a scope is gone. Blank lines BEFORE the scope header (`Local`/`Global`) and
  BEFORE `Total:` are unchanged.

### Removed

- `src/utils/git.ts` (`isTrackedByGit`) — no longer used after the `rm` rewrite.

### History

The repository history of `.gitignore` is rewritten via `git filter-repo --blob-callback`
to drop seven legacy patterns from every historical revision. Existing clones must
`git fetch --all --tags --force && git reset --hard origin/main`. Provenance attestations
for v0.1.0–v0.1.10 reference pre-rewrite SHAs that no longer exist (Sigstore signatures
remain valid; repo-SHA chain is broken for those versions). v0.1.11 establishes a fresh
chain.

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
