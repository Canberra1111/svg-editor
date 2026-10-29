import { createInterface } from 'node:readline';
import type { LineProcessor } from './LineProcessor.js';

export class Terminal {
  constructor(private readonly processor: LineProcessor) {}
  async start(): Promise<void> {
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
    process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
    input.setPrompt('svg> ');
    if (interactive) input.prompt();
    input.on('SIGINT', () => input.close());
    let failed = false;
    for await (const line of input) {
      for (const message of this.processor.process(line)) {
        const error = message.startsWith('error:');
        (error ? process.stderr : process.stdout).write(message + '\n');
        failed ||= error;
      }
      if (interactive) input.prompt();
    }
    if (!interactive && failed) process.exitCode = 1;
  }
}
