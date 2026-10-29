import { Session } from '../../src/application/Session.js';
import { CommandRunner } from '../../src/application/CommandRunner.js';
import { LineProcessor } from '../../src/cli/LineProcessor.js';
import type { DocumentStore } from '../../src/application/DocumentStore.js';
import type { SvgDocument } from '../../src/domain/SvgDocument.js';
import { MemoryDocumentStore } from './MemoryDocumentStore.js';

export class EditorHarness {
  private readonly session: Session;
  private readonly processor: LineProcessor;
  constructor(store: DocumentStore = new MemoryDocumentStore()) {
    this.session = new Session(store);
    this.processor = new LineProcessor(new CommandRunner(this.session));
  }
  run(line: string): string[] { return this.processor.process(line); }
  document(): SvgDocument { return this.session.current(); }
  setup(lines: readonly string[]): void {
    for (const line of lines) {
      const result = this.run(line);
      if (result.some(message => message.startsWith('error:'))) throw new Error(`${line}: ${result.join('\n')}`);
    }
  }
  snapshot(): string {
    const document = this.document();
    return JSON.stringify({ width: document.width, height: document.height, root: [...document.rootMetadata()], shapes: document.allShapes().map(shape => ({ id: shape.id, tag: shape.tag, parent: document.isTopLevel(shape) ? null : shape.parent!.id, attrs: [...shape.attributes()], text: shape.textContent(), children: shape.children().map(child => child.id) })) });
  }
}
