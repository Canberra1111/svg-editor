import { EditorError } from '../domain/EditorError.js';
import type { ReversibleCommand } from './ReversibleCommand.js';
import type { Session } from './Session.js';

export class History {
  private readonly past: ReversibleCommand[] = [];
  private readonly future: ReversibleCommand[] = [];
  private locked = true;
  lock(): void { this.past.length = 0; this.future.length = 0; this.locked = true; }
  record(command: ReversibleCommand): void {
    this.past.push(command); this.future.length = 0; this.locked = false;
  }
  undo(session: Session): string[] {
    this.assertUnlocked();
    const command = this.past.at(-1);
    if (!command) throw new EditorError('nothing to undo');
    const output = command.undo(session);
    this.past.pop(); this.future.push(command);
    return output;
  }
  redo(session: Session): string[] {
    this.assertUnlocked();
    const command = this.future.at(-1);
    if (!command) throw new EditorError('nothing to redo');
    const output = command.redo(session);
    this.future.pop(); this.past.push(command);
    return output;
  }
  private assertUnlocked(): void {
    if (this.locked) throw new EditorError('undo not allowed after io command');
  }
}
