export class Tokenizer {
  tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let value = '', quoted = false, active = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index]!;
      if (quoted && character === '\\' && (line[index + 1] === '"' || line[index + 1] === '\\')) {
        value += line[++index]; active = true;
      } else if (character === '"') {
        quoted = !quoted; active = true;
      } else if (!quoted && /\s/.test(character)) {
        if (active) { tokens.push(value); value = ''; active = false; }
      } else { value += character; active = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (active) tokens.push(value);
    return tokens;
  }
}
