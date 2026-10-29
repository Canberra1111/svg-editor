import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore, DocumentReadResult } from '../application/DocumentStore.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditorError } from '../domain/EditorError.js';
import type { SvgCodec } from './SvgCodec.js';

export class FileDocumentStore implements DocumentStore {
  constructor(private readonly codec: SvgCodec) {}
  read(path: string): DocumentReadResult {
    let source: string;
    try { source = readFileSync(path, 'utf8'); }
    catch { throw new EditorError(`cannot read file: ${path}`); }
    return this.codec.decode(source);
  }
  write(path: string, document: SvgDocument): void {
    const content = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    } finally {
      try { unlinkSync(temporary); } catch { /* Renamed or never created. */ }
    }
  }
}
