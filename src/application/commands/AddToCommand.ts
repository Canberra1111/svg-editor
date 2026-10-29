import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class AddToCommand extends EditCommand {
  override readonly name = 'addto';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(2, 2, 'addto <gid> <id>');
    const shape = document.addTo(this.args.at(0), this.args.at(1));
    return [`${shape.label()} moved into g#${this.args.at(0)}`];
  }
}
