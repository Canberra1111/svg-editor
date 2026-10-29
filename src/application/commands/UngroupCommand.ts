import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class UngroupCommand extends EditCommand {
  override readonly name = 'ungroup';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(1, 1, 'ungroup <gid>');
    const count = document.ungroup(this.args.at(0));
    return [`g#${this.args.at(0)} ungrouped (${count} children promoted)`];
  }
}
