# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

`skillio` is a TypeScript npm CLI + library for auditing AI agent skill usage (Claude Code and Codex). It parses session logs and manages a skills lock file.

## Commands

```sh
# Build (bun is not in PATH — use full path)
~/.bun/bin/bun run node_modules/.bin/bunup

# Lint / format
npm run lint            # biome check src/
npm run format          # biome format --write src/

# Tests
npm test                # unit tests (src/**/*.test.ts)
npm run test:e2e        # e2e tests — requires a fresh build first

# Run a single unit test file
npx vitest run src/extractors/attributed.test.ts

# CLI (after build)
node dist/cli.js --help
node dist/cli.js                                  # both agents, all-time, scoped to cwd repo
node dist/cli.js -g                               # force global scope from any repo
node dist/cli.js -a claude-code -p 7d             # claude-only, last 7d, scoped
node dist/cli.js -a claude-code codex -p 1m       # both agents (space-separated), last month
node dist/cli.js audit                            # legacy: 'audit' keyword stripped silently
node dist/cli.js list
node dist/cli.js remove brainstorming --dry-run
node dist/cli.js remove brainstorming writing-plans   # multi-remove

# Full prepublish check (lint → unit → build → e2e)
npm run lint && npm test && npm run build && npm run test:e2e

# Release (after version bump + commit)
npm publish --otp=<6digits>
git tag -a v<x.y.z> -m "v<x.y.z>" && git push origin v<x.y.z>
gh release create v<x.y.z> --repo ihororlovskyi/skillio --title "v<x.y.z>" --notes "..."
# Optional: deprecate prior version
npm deprecate skillio@<old> "Newer version available — npm i -g skillio@latest"
```

## Architecture

### Package structure

Dual-output build via `bunup.config.ts` (two entries):
- `src/index.ts` → `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `.d.ts` types
- `src/cli.ts` → `dist/cli.js` (ESM only, no types)

**`src/extractors/`** — pure functions `(entry: unknown) => string[]`, no I/O:
- `attributed.ts` — reads `entry.attributionSkill`
- `activations.ts` — deep-walks for `{type:"tool_use", name:"Skill"}` (Claude) or `exec_command_end`/`<skill>` XML (Codex)
- `mentions.ts` — scans all strings for `foo/SKILL.md` paths or `superpowers:name` tokens

**`src/readers/`** — combine extractors with filesystem I/O:
- `claude.ts` — reads `~/.claude/projects/**/*.jsonl`, skips files older than `since` by mtime
- `codex.ts` — reads `~/.codex/sessions/**/*.jsonl` (activations) or `~/.codex/history.jsonl` (mentions)

**`src/commands/`** — `audit.ts` exports `auditArgs` + `runAudit` (composed at root in `cli.ts`, no `audit` subcommand exists); `list.ts`, `remove.ts`, and `cost.ts` are citty subcommands (`list`/`ls`, `remove`/`rm`, `cost`); `remove` accepts one or more space-separated skill names via `process.argv` parsing. `cost` reads each skill's `SKILL.md` frontmatter and estimates tokens via a `chars / CHARS_PER_TOKEN` heuristic (no external tokenizer).

**`src/lock/file.ts`** — read/write `skills-lock.json` (local) or `~/.agents/.skill-lock.json` (global); atomic writes via temp file. No backup on remove — `removeSkillFromLock` overwrites in-place.

**`src/utils/`** — `period.ts` (period shorthands incl. `'all'`, returns ms), `jsonl.ts` (line reader), `expand-home.ts`, `scope.ts` (cwd → repo / global detection, Claude project-dir encoding), `walk.ts`, `skill-files.ts` (resolves `<scope>/.claude/skills/<name>/SKILL.md`, extracts YAML frontmatter, estimates tokens via `CHARS_PER_TOKEN` constant — currently `4`), `update-check.ts` (zero-dep npm registry version check with 24h cache at `~/.cache/skillio/version.json`, prints notice to stderr; opt-out via `SKILLIO_NO_UPDATE_CHECK=1`)

**`test/e2e/`** — spawn `dist/cli.js` via `spawnSync`, fixtures in `test/fixtures/{claude,codex,lock}/`

### Lock file format

```json
{ "skills": { "skill-name": {} } }
```

`Object.keys(lock.skills)` gives installed skill names.

## Gotchas

- **bun path**: `npm run build` intentionally calls `~/.bun/bin/bun run node_modules/.bin/bunup`; keep that full path unless Bun is guaranteed to be in PATH.
- **audit lives at root, not as a subcommand**: bare `skillio` runs the audit. `src/cli.ts` composes `auditArgs` + `runAudit` directly into the root `defineCommand`. There's no `audit` subcommand keyword. Citty 0.2.x runs root `run` even when a subcommand matches, so the root run guards on `process.argv[2]` against `SUBCOMMAND_NAMES = {list, ls, remove, rm, cost}` and bails out — otherwise list/remove output would be followed by audit output.
- **scope auto-detection**: `runAudit` calls `detectScope(cwd)`. Rule: `cwd === $HOME` → global; `cwd` is inside a `.git` repo → scoped to repo root; otherwise → scoped to `cwd` literally. `--global`/`-g` and `--root <dir>` both force global. For Claude this means switching `root` to `~/.claude/projects/<encoded-cwd>`; for Codex it means filtering session files by `payload.cwd` (case-insensitive on macOS via `norm()` in `scope.ts`).
- **agent flag uses `\x1f` as internal separator**: `cli.ts:mergeAgentArgs` collects space-separated and repeated `-a/--agent` values, joins with `\x1f` (Unit Separator), and `audit.ts:parseAgents` splits on it. Comma is intentionally NOT a separator — `-a claude,codex` is treated as one unknown agent name.
- **e2e tests require a fresh build**: `npm run test:e2e` spawns `dist/cli.js` — stale build = wrong behavior.
- **package name locked to `skillio` (unscoped)**: npm's similarity guard blocks short unscoped renames (tested: `skls`, `skcl`, `sklio` all rejected). Bypass: scoped names skip the guard. The `@skillio` NPM org exists and is owned by `ihororlovskyi` — use `@skillio/<sub>` for any sibling packages. Short CLI command names are independent of pkg name (set via `bin`), so a shorter command doesn't require a shorter pkg.
- **two CLI bin names**: `package.json:bin` registers both `skillio` and `skl` → same `dist/cli.js`. After global install, both work in `$PATH`. Scope detection is identical for both.
- **CLI version source**: `src/cli.ts` reads `version` from `package.json` via `createRequire` at runtime — don't hardcode in `meta.version`.

## Operating rules

- **Zero runtime deps.** The package has no `dependencies`. Do not add any without explicit user approval; `devDependencies` is fine. `skl cost` uses an in-house `chars / CHARS_PER_TOKEN` heuristic (`src/utils/skill-files.ts`) instead of a tokenizer dep — known to be ~10-19% over real reference numbers; tunable via the single `CHARS_PER_TOKEN` constant when the user provides reference data.
- **Update notice on every CLI run.** `cli.ts` awaits `maybePrintUpdateNotice(version)` before `runMain`. Hits `https://registry.npmjs.org/skillio/latest` once per 24h (cached in `~/.cache/skillio/version.json`), 1.5s timeout, prints to stderr if newer is available. Opt-out: `SKILLIO_NO_UPDATE_CHECK=1`. Implemented with `node:https` only — keep zero-dep.
- **npm 2FA is enabled.** `npm publish` requires `--otp=<6digits>` from the user. Don't omit the flag.
- **`npm whoami` should print `ihororlovskyi`.** Safe to run unattended to verify auth before suggesting a release sequence.
- **Commits and pushes are user-only.** The user makes all `git commit` and `git push` calls. Strategy: fewer commits = better, so batch related work and don't fragment changes. The agent must NOT run `git commit` / `git push` itself, and must NOT prompt the user to commit or push as part of task completion. Just report what changed and stop.
- **`gh` is logged in.** Safe to call `gh` commands directly (e.g., `gh release create`, `gh pr view`).
- **Release preflight: emit a full command sequence, don't execute it.** When the user asks to publish/release, output the complete sequence in one block: version bump (`npm version X.Y.Z --no-git-tag-version`), `git add` + `git commit`, `git tag -a vX.Y.Z`, `npm publish --otp=<6digits>`, `git push origin main` + `git push origin vX.Y.Z`, and `gh release create vX.Y.Z` with release notes **in English**. Don't run any of these steps yourself — the user runs them.
