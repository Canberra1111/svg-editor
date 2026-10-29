import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class ReadCommand extends Command {
  override readonly name = 'read';
  override execute(session: Session): string[] {
    this.args.count(1, 1, 'read <file.svg>');
    return session.load(this.args.at(0));
  }
}
