import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class SetCommand extends EditCommand {
  override readonly name = 'set';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(3, 3, 'set <id> <attr> <value>');
    const shape = document.set(this.args.at(0), this.args.at(1), this.args.at(2));
    return [`${shape.label()} ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`];
  }
}
