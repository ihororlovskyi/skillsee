import { spawnSync } from 'node:child_process';
import { select } from '../utils/prompt';

export interface PickerArgs {
  global: boolean;
}

export async function runPicker(args: PickerArgs): Promise<number> {
  const choice = await select({
    title: 'skillio — pick a command',
    options: [
      { value: 'usage', label: 'usage  — count of skill invocations' },
      { value: 'cost', label: 'cost   — per-skill ambient tokens' },
      { value: 'list', label: 'list   — installed skills per source' },
      { value: 'quit', label: 'quit' },
    ],
  });

  if (choice === null || choice === 'quit') return 0;

  const cliPath = process.argv[1];
  if (!cliPath) {
    console.error('skillio: cannot resolve CLI path (process.argv[1] missing)');
    return 1;
  }

  const argv = [choice];
  if (args.global) argv.push('-g');

  const r = spawnSync(process.execPath, [cliPath, ...argv], {
    stdio: 'inherit',
    env: process.env,
  });
  return r.status ?? 0;
}
