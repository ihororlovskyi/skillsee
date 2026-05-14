import { emitKeypressEvents } from 'node:readline';

export interface ConfirmOptions {
  input?: NodeJS.ReadStream | NodeJS.ReadableStream;
  output?: NodeJS.WriteStream | NodeJS.WritableStream;
}

export async function confirm(question: string, opts: ConfirmOptions = {}): Promise<boolean> {
  const input = (opts.input ?? process.stdin) as NodeJS.ReadStream;
  const output = (opts.output ?? process.stdout) as NodeJS.WriteStream;

  if (!input.isTTY || !output.isTTY) {
    const { createInterface } = await import('node:readline/promises');
    const rl = createInterface({ input, output });
    try {
      const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
      return answer === 'y' || answer === 'yes';
    } finally {
      rl.close();
    }
  }

  output.write(`${question} [y/N] `);
  emitKeypressEvents(input);
  if (input.setRawMode) input.setRawMode(true);
  input.resume();

  return new Promise<boolean>((resolve) => {
    const onKey = (str: string, key: { name?: string; ctrl?: boolean }) => {
      const lower = (str ?? '').toLowerCase();
      if (key.ctrl && key.name === 'c') {
        cleanup();
        output.write('\n');
        resolve(false);
        return;
      }
      if (lower === 'y') {
        cleanup();
        output.write('y\n');
        resolve(true);
        return;
      }
      if (lower === 'n' || key.name === 'return' || key.name === 'escape' || lower === 'q') {
        cleanup();
        output.write(`${lower || 'n'}\n`);
        resolve(false);
        return;
      }
    };
    function onSigterm() {
      cleanup();
      output.write('\n');
      resolve(false);
    }
    function cleanup() {
      input.removeListener('keypress', onKey);
      process.removeListener('SIGTERM', onSigterm);
      if (input.setRawMode) input.setRawMode(false);
      input.pause();
    }
    process.once('SIGTERM', onSigterm);
    input.on('keypress', onKey);
  });
}
