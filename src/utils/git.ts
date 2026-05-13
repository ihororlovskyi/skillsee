import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

export function isTrackedByGit(path: string): boolean {
  const abs = resolve(path);
  const cwd = dirname(abs);
  const r = spawnSync('git', ['ls-files', '--error-unmatch', abs], {
    cwd,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return r.status === 0;
}
