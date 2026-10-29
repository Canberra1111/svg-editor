import { EditorError } from '../domain/EditorError.js';
import { Values } from '../domain/Values.js';

export class ArgumentList {
  constructor(private readonly values: readonly string[]) {}
  get length(): number { return this.values.length; }
  all(): string[] { return [...this.values]; }
  at(index: number): string {
    const value = this.values[index];
    if (value === undefined) throw new EditorError('missing argument');
    return value;
  }
  optional(index: number): string | undefined { return this.values[index]; }
  number(index: number, name: string): number { return Values.number(this.at(index), name); }
  count(min: number, max: number, usage: string): void {
    if (this.length < min || this.length > max) throw new EditorError(`usage: ${usage}`);
  }
  describe(): string { return this.values.map(value => /\s/.test(value) ? JSON.stringify(value) : value).join(' '); }
}
