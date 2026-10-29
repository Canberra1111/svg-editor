import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class GroupCommand extends EditCommand {
  override readonly name = 'group';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(2, Infinity, 'group <newGid> <id1> <id2>...');
    const group = document.group(this.args.at(0), this.args.all().slice(1));
    return [`${group.label()} created with ${group.children().length} children`];
  }
}
