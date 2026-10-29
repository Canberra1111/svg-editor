import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class MoveCommand extends EditCommand {
  override readonly name = 'move';
  protected override edit(document: SvgDocument): string[] {
    this.args.count(3, 3, 'move <id> <dx> <dy>');
    const dx = this.args.number(1, 'dx'), dy = this.args.number(2, 'dy');
    return [document.move(this.args.at(0), dx, dy).moveFeedback(dx, dy)];
  }
}
