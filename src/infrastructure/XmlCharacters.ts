import { EditorError } from '../domain/EditorError.js';

export class XmlCharacters {
  static validateText(value: string): void {
    for (const character of value) {
      if (!this.allowed(character.codePointAt(0)!)) throw new EditorError('invalid XML character');
    }
  }
  static validateSource(source: string): void {
    this.validateText(source);
    // References inside comments and CDATA are literal text, not XML entities.
    const tokens = source.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|&[^\s<>&;]*;?/g);
    for (const [token] of tokens) {
      if (!token.startsWith('&')) continue;
      if (/^&(amp|lt|gt|quot|apos);$/.test(token)) continue;
      const numeric = /^&#(?:(\d+)|x([0-9a-fA-F]+));$/.exec(token);
      if (numeric) {
        const point = Number.parseInt(numeric[1] ?? numeric[2]!, numeric[1] === undefined ? 16 : 10);
        if (this.allowed(point)) continue;
      }
      throw new EditorError(`invalid SVG: invalid entity reference: ${token}`);
    }
  }
  private static allowed(point: number): boolean {
    return point === 0x9 || point === 0xa || point === 0xd
      || (point >= 0x20 && point <= 0xd7ff)
      || (point >= 0xe000 && point <= 0xfffd)
      || (point >= 0x10000 && point <= 0x10ffff);
  }
}
