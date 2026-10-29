import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class UndoCommand extends Command {
  override readonly name = 'undo';
  override execute(session: Session): string[] { this.args.count(0, 0, 'undo'); return session.undo(); }
}
