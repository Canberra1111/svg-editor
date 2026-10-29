import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class ScaleCommand extends EditCommand {
  override readonly name = 'scale';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(2, 2, 'scale <id> <factor>');
    const factor = this.args.number(1, 'scale factor');
    return [`${document.scale(this.args.at(0), factor).label()} scaled by ${factor}`];
  }
}
