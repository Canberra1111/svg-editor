import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class CanvasCommand extends Command {
  override readonly name = 'canvas';
  override execute(session: Session): string[] {
    this.args.count(0, 2, 'canvas [w] [h]');
    const document = session.current();
    if (!this.args.length) return [`canvas ${document.width}x${document.height}`];
    session.resize(this.args.number(0, 'canvas width'), this.args.length > 1 ? this.args.number(1, 'canvas height') : document.height);
    return [`canvas ${session.current().width}x${session.current().height}`];
  }
}
