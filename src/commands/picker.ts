import { spawnSync } from 'node:child_process';
import { getLockPath } from '../lock/file';
import { red } from '../utils/ansi';
import { listRemovableTargets } from '../utils/list-removable';
import { select } from '../utils/prompt';

export interface PickerArgs {
  global: boolean;
}

const CANCEL = '__cancel__';

async function pickRemoveTarget(args: PickerArgs): Promise<string | null> {
  const lockPath = getLockPath(args.global);
  const { inLock, orphan } = listRemovableTargets({
    isGlobal: args.global,
    cwd: process.cwd(),
    lockPath,
  });

  if (inLock.length === 0 && orphan.length === 0) {
    console.log('No skills found in scope.');
    return null;
  }

  const options = [
    ...inLock.map((name) => ({ value: name, label: name })),
    ...orphan.map((name) => ({ value: name, label: `${name} ${red('(orphan)')}` })),
    { value: CANCEL, label: 'cancel' },
  ];

  const choice = await select({ title: 'skillio — pick a skill to remove', options });
  if (choice === null || choice === CANCEL) return null;
  return choice;
}

export async function runPicker(args: PickerArgs): Promise<number> {
  const choice = await select({
    title: 'skillio — pick a command',
    options: [
      { value: 'usage', label: 'usage  — count of skill invocations' },
      { value: 'cost', label: 'cost   — per-skill ambient tokens' },
      { value: 'list', label: 'list   — installed skills per source' },
      { value: 'remove', label: 'remove — delete a skill (disk-only; lock with --force-lock)' },
      { value: 'quit', label: 'quit' },
    ],
  });

  if (choice === null || choice === 'quit') return 0;

  const cliPath = process.argv[1];
  if (!cliPath) {
    console.error('skillio: cannot resolve CLI path (process.argv[1] missing)');
    return 1;
  }

  let argv: string[];
  if (choice === 'remove') {
    const target = await pickRemoveTarget(args);
    if (target === null) return 0;
    argv = ['rm', target];
  } else {
    argv = [choice];
  }
  if (args.global) argv.push('-g');

  const r = spawnSync(process.execPath, [cliPath, ...argv], {
    stdio: 'inherit',
    env: process.env,
  });
  return r.status ?? 0;
}
