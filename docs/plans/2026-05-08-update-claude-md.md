# Update CLAUDE.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести CLAUDE.md у відповідність до поточного стану коду після рефакторингу в цій сесії.

**Architecture:** Один файл — `CLAUDE.md`. Всі зміни — точкові текстові правки, жодного нового коду.

**Tech Stack:** Markdown

---

## Що змінилось у коді (контекст)

| Що | Було | Стало |
|----|------|-------|
| Канонічне ім'я агента | `claude` | `claude-code` |
| Backup-шлях | `<file>.bak` поруч | `.tmp/<file>.bak` |
| `remove` | один скіл | один або кілька через пробіл |
| Preprocessing argv | мержив space-separated agents (`VALID_AGENTS`) | прибрано, залишилось тільки ін'єкція `audit` |
| `src/lock/file.ts` exports | `removeSkillFromLock` | + `getBackupPath`, `backupLock` |

---

### Task 1: Оновити CLI-приклади

**Files:**
- Modify: `CLAUDE.md` (секція `## Commands`)

- [ ] **Step 1: Замінити `--agent claude` → `--agent claude-code` і додати multi-remove приклад**

Знайти блок:
```sh
node dist/cli.js --agent claude --period 7d
node dist/cli.js --agent codex --mode activations
node dist/cli.js list
node dist/cli.js remove brainstorming --dry-run
```

Замінити на:
```sh
node dist/cli.js --agent claude-code --period 7d
node dist/cli.js --agent codex --mode activations
node dist/cli.js list
node dist/cli.js remove brainstorming --dry-run
node dist/cli.js remove brainstorming writing-plans   # multi-remove
```

- [ ] **Step 2: Перевірити що більше немає `--agent claude` без `-code` у CLAUDE.md**

```sh
grep -n "\-\-agent claude[^-]" CLAUDE.md
```
Очікувано: порожньо.

---

### Task 2: Оновити опис `src/lock/file.ts`

**Files:**
- Modify: `CLAUDE.md` (секція `## Architecture`)

- [ ] **Step 1: Оновити рядок про lock/file.ts**

Знайти:
```
**`src/lock/file.ts`** — read/write `skills-lock.json` (local) or `~/.agents/.skill-lock.json` (global); atomic writes via temp file + `.bak` backup
```

Замінити на:
```
**`src/lock/file.ts`** — read/write `skills-lock.json` (local) or `~/.agents/.skill-lock.json` (global); atomic writes via temp file; backups go to `.tmp/<filename>.bak` (`getBackupPath`, `backupLock` exports)
```

- [ ] **Step 2: Перевірити**

```sh
grep -n "\.bak" CLAUDE.md
```
Очікувано: рядок містить `.tmp/<filename>.bak`, без старого формату `+ \`.bak\` backup`.

---

### Task 3: Оновити опис `src/commands/`

**Files:**
- Modify: `CLAUDE.md` (секція `## Architecture`)

- [ ] **Step 1: Додати згадку multi-remove до команд**

Знайти:
```
**`src/commands/`** — citty command definitions: `audit.ts`, `list.ts`, `remove.ts`
```

Замінити на:
```
**`src/commands/`** — citty command definitions: `audit.ts`, `list.ts`, `remove.ts`; `remove` accepts one or more space-separated skill names via `process.argv` parsing
```

---

### Task 4: Прибрати застарілий gotcha про space-separated agents

**Files:**
- Modify: `CLAUDE.md` (секція `## Gotchas`)

- [ ] **Step 1: Видалити gotcha**

Знайти і видалити весь рядок:
```
- **space-separated agents**: `-a claude codex` works by merging adjacent valid agent tokens into a comma-separated value before citty parses argv (`src/cli.ts`).
```

Цей механізм прибрано з `cli.ts` — тепер тільки comma-separated (`-a claude-code,codex`).

- [ ] **Step 2: Перевірити**

```sh
grep -n "space-separated" CLAUDE.md
```
Очікувано: або порожньо, або лише згадка в `src/commands/` (Task 3) — але не у Gotchas.

---

### Task 5: Фінальна перевірка і коміт

- [ ] **Step 1: Переконатись що в CLAUDE.md немає старих артефактів**

```sh
grep -n "skillsee\|\.bak backup\|VALID_AGENTS\|space-separated agents" CLAUDE.md
```
Очікувано: порожньо.

- [ ] **Step 2: Коміт**

```sh
git add CLAUDE.md
git commit -m "docs: sync CLAUDE.md with current codebase state"
```
