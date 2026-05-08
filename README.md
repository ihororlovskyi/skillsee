# skillio

[![npm version](https://img.shields.io/npm/v/skillio)](https://www.npmjs.com/package/skillio)
[![CI](https://github.com/ihororlovskyi/skillio/actions/workflows/ci.yml/badge.svg)](https://github.com/ihororlovskyi/skillio/actions/workflows/ci.yml)

Audit and manage AI agent skills for Claude Code and OpenAI Codex.

## Installation

```sh
# one-off (no install needed)
npx skillio audit --agent claude --period 7d
pnpm dlx skillio audit --agent codex --period 2w

# global install
npm install -g skillio
pnpm add -g skillio
```

## Usage

```sh
skillio --agent claude --period 7d         # audit last 7 days (default subcommand)
skillio audit --agent claude --period 7d   # audit last 7 days (attributed mode)
skillio audit --agent codex --mode activations  # codex activations
skillio audit -a claude codex --period 2w  # both agents, space-separated
skillio audit -a claude,codex --period 2w  # both agents, comma-separated
skillio list                                # list skills in local skills-lock.json
skillio list --global                       # list from ~/.agents/.skill-lock.json
skillio remove brainstorming               # remove skill from lock
skillio remove brainstorming writing-plans  # remove multiple skills
skillio remove --dry-run brainstorming     # preview removal
```

## What it does

- **Audit skill usage** — parse agent session logs and count which skills were invoked, when, and how often
- **Manage a skills lock** — list and remove skills from a local or global lock file

## Options

### `skillio` / `skillio audit`

Audits skill usage from agent session logs. `audit` is the default subcommand when the first argument is an audit flag.

```sh
skillio --agent claude --period 7d
skillio audit --agent codex --mode activations
```

| Flag | Default | Description |
|------|---------|-------------|
| `-a, --agent` | required | `claude-code`/`claude`, `codex`, comma- or space-separated |
| `-p, --period` | `7d` | `7d`, `2w`, `1m`, `1y` |
| `--since` | — | `yyyy-mm-dd`, overrides `--period` |
| `--mode` | `attributed` | `attributed` \| `activations` \| `mentions` |
| `--format` | `text` | `text` \| `json` |
| `--root` | — | Override agent sessions directory |
| `--scan-all-files` | — | Ignore file mtime, read everything |

### Modes

- **`attributed`** — entries with an `attributionSkill` field set by Claude Code. This is the default and most reliable Claude mode.
- **`activations`** — explicit `Skill` tool invocations found anywhere in the entry tree (Claude) or `exec_command_end` events / `<skill>` XML (Codex). This is the default and most reliable Codex mode.
- **`mentions`** — skill paths (`foo/SKILL.md`) or `superpowers:name` strings found in any string value. This is a broad search mode and can include examples from prompts, specs, or documentation.

### `skillio list` / `ls`

```sh
skillio list            # local skills-lock.json
skillio list --global   # ~/.agents/.skill-lock.json
```

### `skillio remove` / `rm`

```sh
skillio remove <skill-name>
skillio remove <skill-one> <skill-two>
skillio remove --global <skill-name>
skillio remove --dry-run <skill-name>
```

## Requirements

- Node.js ≥ 20
