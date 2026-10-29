import type { SvgDocument } from '../domain/SvgDocument.js';

export interface DocumentReadResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export interface DocumentStore {
  read(path: string): DocumentReadResult;
  write(path: string, document: SvgDocument): void;
}
