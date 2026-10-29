import { EditCommand } from '../EditCommand.js';
import type { ArgumentList } from '../ArgumentList.js';
import type { ShapeFactory } from '../ShapeFactory.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class CreateCommand extends EditCommand {
  override readonly name = 'create';
  constructor(args: ArgumentList, private readonly factory: ShapeFactory) { super(args); }
  protected override edit(document: SvgDocument): string[] {
    this.args.count(2, 9, 'create <type> <id> [params...] [in <containerId>]');
    const parameters = this.args.all().slice(2);
    let containerId: string | undefined;
    if (parameters.length >= 2 && parameters.at(-2) === 'in') {
      containerId = parameters.at(-1)!;
      parameters.splice(-2);
    }
    document.assertAvailable(this.args.at(1));
    const shape = this.factory.create(this.args.at(0), this.args.at(1), parameters);
    document.add(shape, containerId);
    return [`${shape.label()} created${containerId === undefined ? '' : ` in g#${containerId}`}`];
  }
}
