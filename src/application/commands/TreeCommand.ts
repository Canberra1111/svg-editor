import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { TreeFormatter } from '../TreeFormatter.js';

export class TreeCommand extends Command {
  override readonly name = 'tree';
  override execute(session: Session): string[] {
    this.args.count(0, 1, 'tree [id]');
    return new TreeFormatter().format(session.current(), this.args.optional(0));
  }
}
