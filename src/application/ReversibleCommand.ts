import type { Session } from './Session.js';

export interface ReversibleCommand {
  undo(session: Session): string[];
  redo(session: Session): string[];
}
