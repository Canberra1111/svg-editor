import type { CommandRunner } from '../application/CommandRunner.js';
import { Tokenizer } from './Tokenizer.js';

export class LineProcessor {
  constructor(private readonly runner: CommandRunner, private readonly tokenizer = new Tokenizer()) {}
  process(line: string): string[] {
    try { return this.runner.execute(this.tokenizer.tokenize(line)); }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
