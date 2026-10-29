import { Command } from './Command.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditorError } from '../domain/EditorError.js';
import type { Session } from './Session.js';
import type { ReversibleCommand } from './ReversibleCommand.js';

export abstract class EditCommand extends Command implements ReversibleCommand {
  private before: SvgDocument | null = null;
  private after: SvgDocument | null = null;
  override execute(session: Session): string[] {
    const before = session.current().clone();
    const working = before.clone();
    const output = this.edit(working);
    const after = working.clone();
    this.before = before; this.after = after;
    session.commitEdit(working, this);
    return output;
  }
  undo(session: Session): string[] {
    if (!this.before) throw new EditorError('command has not executed');
    session.restore(this.before);
    return [`undone: ${this.name} ${this.args.describe()}`.trim()];
  }
  redo(session: Session): string[] {
    if (!this.after) throw new EditorError('command has not executed');
    session.restore(this.after);
    return [`redone: ${this.name} ${this.args.describe()}`.trim()];
  }
  protected abstract edit(document: SvgDocument): string[];
}
