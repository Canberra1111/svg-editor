import type { DocumentStore, DocumentReadResult } from '../../src/application/DocumentStore.js';
import type { SvgDocument } from '../../src/domain/SvgDocument.js';
import { EditorError } from '../../src/domain/EditorError.js';

export class MemoryDocumentStore implements DocumentStore {
  private readonly files = new Map<string, SvgDocument>();
  read(path: string): DocumentReadResult {
    const document = this.files.get(path);
    if (!document) throw new EditorError(`cannot read file: ${path}`);
    return { document: document.clone(), warnings: [] };
  }
  write(path: string, document: SvgDocument): void {
    if (path.startsWith('unwritable/')) throw new EditorError(`cannot write file: ${path}`);
    this.files.set(path, document.clone());
  }
}
