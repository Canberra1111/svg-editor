import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class DeleteCommand extends EditCommand {
  override readonly name = 'delete';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(1, 1, 'delete <id>');
    return [`${document.delete(this.args.at(0)).label()} deleted`];
  }
}
