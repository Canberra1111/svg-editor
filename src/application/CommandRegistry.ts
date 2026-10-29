import { EditorError } from '../domain/EditorError.js';
import { ArgumentList } from './ArgumentList.js';
import type { Command } from './Command.js';
import { ShapeFactory } from './ShapeFactory.js';
import { InitCommand } from './commands/InitCommand.js';
import { ReadCommand } from './commands/ReadCommand.js';
import { SaveCommand } from './commands/SaveCommand.js';
import { CanvasCommand } from './commands/CanvasCommand.js';
import { CreateCommand } from './commands/CreateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { MoveCommand } from './commands/MoveCommand.js';
import { ScaleCommand } from './commands/ScaleCommand.js';
import { SetCommand } from './commands/SetCommand.js';
import { GroupCommand } from './commands/GroupCommand.js';
import { UngroupCommand } from './commands/UngroupCommand.js';
import { AddToCommand } from './commands/AddToCommand.js';
import { FrontCommand } from './commands/FrontCommand.js';
import { BackCommand } from './commands/BackCommand.js';
import { TreeCommand } from './commands/TreeCommand.js';
import { ShowCommand } from './commands/ShowCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';
import { UndoCommand } from './commands/UndoCommand.js';
import { RedoCommand } from './commands/RedoCommand.js';

export class CommandRegistry {
  // Command-name dispatch 1/2. TODO (plugin phase): move registrations to providers.
  private readonly builders: ReadonlyMap<string, (args: ArgumentList) => Command>;
  constructor(factory = new ShapeFactory()) {
    this.builders = new Map<string, (args: ArgumentList) => Command>([
      ['init', a => new InitCommand(a)], ['read', a => new ReadCommand(a)],
      ['save', a => new SaveCommand(a)], ['canvas', a => new CanvasCommand(a)],
      ['create', a => new CreateCommand(a, factory)], ['delete', a => new DeleteCommand(a)],
      ['move', a => new MoveCommand(a)], ['scale', a => new ScaleCommand(a)],
      ['set', a => new SetCommand(a)], ['group', a => new GroupCommand(a)],
      ['ungroup', a => new UngroupCommand(a)], ['addto', a => new AddToCommand(a)],
      ['front', a => new FrontCommand(a)], ['back', a => new BackCommand(a)],
      ['tree', a => new TreeCommand(a)], ['show', a => new ShowCommand(a)],
      ['help', a => new HelpCommand(a)], ['undo', a => new UndoCommand(a)], ['redo', a => new RedoCommand(a)],
    ]);
  }
  create(name: string, values: readonly string[]): Command {
    const builder = this.builders.get(name);
    if (!builder) throw new EditorError(`unknown command: ${name}`);
    return builder(new ArgumentList(values));
  }
}
