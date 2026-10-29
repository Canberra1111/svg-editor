import type { Shape } from '../domain/Shape.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class TreeFormatter {
  format(document: SvgDocument, id?: string): string[] {
    if (id !== undefined) {
      const shape = document.require(id);
      return [this.line(shape), ...this.branches(shape.children(), '')];
    }
    return [`svg (${document.width}x${document.height})`, ...this.branches(document.children(), '')];
  }
  private line(shape: Shape): string { return [shape.label(), shape.summary()].filter(Boolean).join('  '); }
  private branches(children: readonly Shape[], prefix: string): string[] {
    return children.flatMap((shape, index) => {
      const last = index === children.length - 1;
      return [`${prefix}${last ? '└── ' : '├── '}${this.line(shape)}`, ...this.branches(shape.children(), prefix + (last ? '    ' : '│   '))];
    });
  }
}
