# TODO

Deferred features tracked here so they don't get lost.

## 1. Tab completion for `skl rm`

**Goal:** when user types `skl rm <Tab>`, shell suggests skill names from
`skills-lock.json` in current scope.

**Plan:**

- Add `--names` flag to `src/commands/list.ts` that prints skill names one per
  line (no JSON wrapping). Default JSON output stays unchanged so existing
  consumers don't break.
- New subcommand `skl completion <bash|zsh|fish>` that prints a shell
  completion script to stdout. The script shells out to `skl ls --names` (and
  forwards `-g` if it's already on the current command line) to enumerate
  candidates after `rm`/`remove`.
- Document install in README:
  - zsh: `skl completion zsh > "${fpath[1]}/_skl"`
  - bash: `eval "$(skl completion bash)"` in `.bashrc`
  - fish: `skl completion fish > ~/.config/fish/completions/skl.fish`
- Tests: e2e snapshot of generated scripts; unit test for `--names` output.

**Open questions:**

- Which shells to support on day one? macOS default is zsh — start there,
  add bash/fish if asked.
- Does `skl rm -g <Tab>` need to enumerate the global lock file? Easy to do
  by inspecting `$words` / `COMP_WORDS` in the script.

## 2. Auto-prune skill files via `npx skills rm`

**Goal:** by default, `skl rm <name>` should also delete the actual skill
files (currently it only edits `skills-lock.json`).

**Plan:**

- After successful `removeSkillFromLock`, spawn `npx -y skills rm <name>` via
  `spawnSync` with inherited stdio so the user sees progress.
- Add `--no-prune` flag for opt-out (lock-only removal — current behavior).
- `--dry-run` should print `Would run: npx skills rm <name>` alongside the
  existing "Would remove" lines.
- On `npx` failure: log the error, but don't auto-rollback the lock file.
  The existing `.tmp/skills-lock.json.bak` backup is enough for manual
  recovery.

**Open questions:**

- Confirm the actual package name. `npx skills` was mentioned but the npm
  registry doesn't have an unscoped `skills` CLI — it might be scoped
  (`@something/skills`) or a different name entirely. Verify before wiring
  the spawn call, otherwise `--no-prune` becomes the only working mode.
- Should the spawn respect `--global`? Likely yes — pass `-g` through if
  the lock-file scope was global.
- Consider whether multiple skills should batch into one `npx skills rm a b c`
  call vs N separate spawns (latency vs partial-failure granularity).
