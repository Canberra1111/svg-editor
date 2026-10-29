import type { Session } from './Session.js';
import type { ArgumentList } from './ArgumentList.js';

export abstract class Command {
  constructor(protected readonly args: ArgumentList) {}
  abstract readonly name: string;
  abstract execute(session: Session): string[];
}
