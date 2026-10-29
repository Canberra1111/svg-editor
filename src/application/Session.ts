import { EditorError } from '../domain/EditorError.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { History } from './History.js';
import type { DocumentStore } from './DocumentStore.js';
import type { ReversibleCommand } from './ReversibleCommand.js';

export class Session {
  private documentValue: SvgDocument | null = null;
  private pathValue: string | null = null;
  private readonly history = new History();
  constructor(private readonly storage: DocumentStore) {}
  current(): SvgDocument {
    if (!this.documentValue) throw new EditorError("no document. use 'init' or 'read' first");
    return this.documentValue;
  }
  load(path: string): string[] {
    const result = this.storage.read(path);
    this.install(result.document, path);
    return [...result.warnings, `read ${path} (${result.document.allShapes().length} elements)`];
  }
  save(path?: string): string[] {
    const document = this.current();
    const target = path ?? this.pathValue;
    if (!target) throw new EditorError('no file path. use save <file.svg>');
    this.storage.write(target, document);
    this.pathValue = target;
    this.history.lock();
    return [`saved to ${target} (${document.allShapes().length} elements)`];
  }
  install(document: SvgDocument, path: string | null = null): void {
    this.documentValue = document;
    this.pathValue = path;
    this.history.lock();
  }
  resize(width: number, height: number): void {
    const document = this.current().clone();
    document.resize(width, height);
    this.documentValue = document;
    this.history.lock();
  }
  commitEdit(document: SvgDocument, command: ReversibleCommand): void {
    this.documentValue = document;
    this.history.record(command);
  }
  restore(document: SvgDocument): void { this.documentValue = document.clone(); }
  undo(): string[] { this.current(); return this.history.undo(this); }
  redo(): string[] { this.current(); return this.history.redo(this); }
}
