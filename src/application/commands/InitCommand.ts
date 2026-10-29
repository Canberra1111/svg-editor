import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { SvgDocument } from '../../domain/SvgDocument.js';

export class InitCommand extends Command {
  override readonly name = 'init';
  override execute(session: Session): string[] {
    this.args.count(0, 2, 'init [w] [h]');
    const width = this.args.length > 0 ? this.args.number(0, 'canvas width') : 800;
    const height = this.args.length > 1 ? this.args.number(1, 'canvas height') : 600;
    const document = new SvgDocument(width, height);
    session.install(document);
    return [`canvas ${document.width}x${document.height} created`];
  }
}
