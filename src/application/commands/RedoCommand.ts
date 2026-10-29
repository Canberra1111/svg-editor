import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class RedoCommand extends Command {
  override readonly name = 'redo';
  override execute(session: Session): string[] { this.args.count(0, 0, 'redo'); return session.redo(); }
}
