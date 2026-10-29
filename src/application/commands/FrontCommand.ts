import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class FrontCommand extends EditCommand {
  override readonly name = 'front';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(1, 1, 'front <id>');
    return [`${document.reorder(this.args.at(0), true).label()} moved to front`];
  }
}
