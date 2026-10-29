import { Command } from '../Command.js';
import type { Session } from '../Session.js';

export class ShowCommand extends Command {
  override readonly name = 'show';
  override execute(session: Session): string[] {
    this.args.count(1, 1, 'show <id>');
    const document = session.current(), shape = document.require(this.args.at(0));
    return [
      `${shape.label()}  parent=${document.isTopLevel(shape) ? 'svg' : shape.parent!.label()}`,
      ...[...shape.attributes()].filter(([key]) => key !== 'id').map(([key, value]) => `  ${key}=${value}`),
      ...(shape.textContent() === null ? [] : [`  text=${JSON.stringify(shape.textContent())}`]),
      ...(shape.isContainer() ? [`  children=${shape.children().map(child => child.id).join(',')}`] : []),
    ];
  }
}
