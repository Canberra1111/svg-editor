import type { Session } from './Session.js';
import { CommandRegistry } from './CommandRegistry.js';

export class CommandRunner {
  constructor(private readonly session: Session, private readonly registry = new CommandRegistry()) {}
  execute(tokens: readonly string[]): string[] {
    const name = tokens[0];
    if (name === undefined) return [];
    return this.registry.create(name, tokens.slice(1)).execute(this.session);
  }
}
