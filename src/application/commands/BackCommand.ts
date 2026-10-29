import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class BackCommand extends EditCommand {
  override readonly name = 'back';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(1, 1, 'back <id>');
    return [`${document.reorder(this.args.at(0), false).label()} moved to back`];
  }
}
