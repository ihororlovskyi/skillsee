import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { defineCommand } from 'citty';
import { getLockPath, readLock, removeSkillFromLock } from '../lock/file';
import { cyan, red } from '../utils/ansi';
import { confirm } from '../utils/confirm';
import { rmSkillDir } from '../utils/fs-rm';
import { isTrackedByGit } from '../utils/git';

interface SkillTarget {
  name: string;
  inLock: boolean;
  claudeDir?: string;
  agentsDir?: string;
}

interface DeletePlan {
  target: SkillTarget;
  claudeFileCount?: number;
  agentsFileCount?: number;
}

const q = (name: string) => `"${cyan(name)}"`;

function buildTarget(name: string, isGlobal: boolean, lockPath: string): SkillTarget {
  const lock = readLock(lockPath);
  const inLock = Object.hasOwn(lock.skills, name);
  const baseClaude = isGlobal
    ? join(homedir(), '.claude', 'skills')
    : join(dirname(resolve(lockPath)), '.claude', 'skills');
  const baseAgents = isGlobal
    ? join(homedir(), '.agents', 'skills')
    : join(dirname(resolve(lockPath)), '.agents', 'skills');
  const claudeDir = existsSync(join(baseClaude, name)) ? join(baseClaude, name) : undefined;
  const agentsDir = existsSync(join(baseAgents, name)) ? join(baseAgents, name) : undefined;
  return { name, inLock, claudeDir, agentsDir };
}

function fileCount(dir: string): number {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  let n = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const stat = statSync(cur);
    if (stat.isFile()) n++;
    else if (stat.isDirectory()) for (const e of readdirSync(cur)) stack.push(join(cur, e));
  }
  return n;
}

function printPlan(plan: DeletePlan, lockTracked: boolean): void {
  const { target } = plan;
  console.log(`Will remove ${q(target.name)}:`);
  if (target.inLock) {
    if (lockTracked) console.log('  - skills-lock.json (skipped: git-tracked; use --force-lock)');
    else console.log('  - skills-lock.json');
  } else {
    console.log('  - skills-lock.json (not in lock)');
  }
  if (target.claudeDir)
    console.log(`  - .claude/skills/${target.name}/  (${plan.claudeFileCount} files)`);
  else console.log('  - .claude/skills/  (not found)');
  if (target.agentsDir)
    console.log(`  - .agents/skills/${target.name}/  (${plan.agentsFileCount} files)`);
  else console.log('  - .agents/skills/  (not found)');
}

export const removeCommand = defineCommand({
  meta: { description: 'Remove one or more skills from lock and delete their on-disk directories' },
  args: {
    global: { type: 'boolean', alias: 'g', default: false, description: 'Use global scope' },
    'dry-run': { type: 'boolean', default: false, description: 'Print plan, do not delete' },
    yes: { type: 'boolean', alias: 'y', default: false, description: 'Skip confirmation prompt' },
    'force-lock': {
      type: 'boolean',
      default: false,
      description: 'Modify skills-lock.json even if it is git-tracked',
    },
  },
  async run({ args }) {
    const { global: isGlobal, 'dry-run': dryRun, yes, 'force-lock': forceLock } = args;

    const subcmdIdx = process.argv.findIndex((a) => a === 'remove' || a === 'rm');
    const names = process.argv.slice(subcmdIdx + 1).filter((a) => !a.startsWith('-'));

    if (names.length === 0) {
      console.error('No skill names provided');
      process.exit(1);
    }

    const lockPath = getLockPath(isGlobal);
    const targets = names.map((n) => buildTarget(n, isGlobal, lockPath));

    const orphan = targets.filter((t) => !t.inLock && !t.claudeDir && !t.agentsDir);
    if (orphan.length) {
      for (const o of orphan) console.log(`${q(o.name)} is not in lock or on disk`);
      process.exit(1);
    }

    const plans: DeletePlan[] = targets.map((t) => ({
      target: t,
      claudeFileCount: t.claudeDir ? fileCount(t.claudeDir) : undefined,
      agentsFileCount: t.agentsDir ? fileCount(t.agentsDir) : undefined,
    }));

    const lockTracked = !forceLock && isTrackedByGit(lockPath);

    for (const p of plans) {
      printPlan(p, lockTracked);
      console.log('');
    }

    if (lockTracked && plans.some((p) => p.target.inLock)) {
      console.error(
        red('Skipping skills-lock.json (tracked by git; pass --force-lock to override)'),
      );
    }

    if (dryRun) return;

    if (!yes) {
      const ok = await confirm('Proceed?');
      if (!ok) {
        console.log('Aborted');
        process.exit(1);
      }
    }

    const allowedRoots = [isGlobal ? homedir() : dirname(resolve(lockPath)), homedir()];

    for (const { target } of plans) {
      if (target.inLock) {
        if (lockTracked) {
          console.log(`Skipped skills-lock.json (git-tracked) for ${q(target.name)}`);
        } else {
          const r = removeSkillFromLock(lockPath, target.name);
          if (r.removed) console.log(`Removed ${q(target.name)} from skills-lock.json`);
        }
      } else {
        console.log(`Skipped skills-lock.json (not in lock)`);
      }
      if (target.claudeDir) {
        const r = rmSkillDir(target.claudeDir, { allowedRoots });
        console.log(`Removed ${q(target.name)} from .claude/skills (${r.fileCount} files)`);
      } else {
        console.log('Skipped .claude/skills (not found)');
      }
      if (target.agentsDir) {
        const r = rmSkillDir(target.agentsDir, { allowedRoots });
        console.log(`Removed ${q(target.name)} from .agents/skills (${r.fileCount} files)`);
      } else {
        console.log('Skipped .agents/skills (not found)');
      }
    }
  },
});
