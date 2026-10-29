import { EditorError } from './EditorError.js';

export class Values {
  static number(value: string | number, name: string): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new EditorError(`invalid number for ${name}: ${value}`);
    }
    const result = Number(value);
    if (!Number.isFinite(result)) throw new EditorError(`invalid number for ${name}: ${value}`);
    return Object.is(result, -0) ? 0 : result;
  }

  static positive(value: string | number, name: string): number {
    const result = this.number(value, name);
    if (result <= 0) throw new EditorError(`${name} must be positive`);
    return result;
  }

  static nonnegative(value: string | number, name: string): number {
    const result = this.number(value, name);
    if (result < 0) throw new EditorError(`${name} must be non-negative`);
    return result;
  }

  static id(value: string): string {
    if (!value || /\s/.test(value) || /[<>"'&\u0000-\u001f]/u.test(value)) {
      throw new EditorError(`invalid id: ${value}`);
    }
    return value;
  }

  static format(value: number): string { return String(Object.is(value, -0) ? 0 : value); }
}
