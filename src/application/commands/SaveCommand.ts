import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class SaveCommand extends Command {
  override readonly name = 'save';
  override execute(session: Session): string[] {
    this.args.count(0, 1, 'save [file.svg]');
    return session.save(this.args.optional(0));
  }
}
