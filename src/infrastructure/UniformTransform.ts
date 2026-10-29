import { EditorError } from '../domain/EditorError.js';
import type { Shape } from '../domain/Shape.js';
import { Values } from '../domain/Values.js';

export class UniformTransform {
  private factor = 1;
  private dx = 0;
  private dy = 0;
  constructor(source: string) {
    const grammar = /(?:translate\s*\(([^)]*)\))|(?:scale\s*\(([^)]*)\))/gy;
    let position = 0;
    while (position < source.length) {
      const separators = /^[\s,]*/.exec(source.slice(position))![0];
      position += separators.length;
      if (position === source.length) break;
      grammar.lastIndex = position;
      const match = grammar.exec(source);
      if (!match) throw new EditorError(`unsupported transform: ${source}`);
      const values = (match[1] ?? match[2]!).trim().split(/[\s,]+/).filter(Boolean).map(value => Values.number(value, 'transform'));
      if (values.length < 1 || values.length > 2) throw new EditorError(`invalid transform: ${source}`);
      if (match[1] !== undefined) {
        this.dx = Values.number(this.dx + this.factor * values[0]!, 'transform x');
        this.dy = Values.number(this.dy + this.factor * (values[1] ?? 0), 'transform y');
      } else {
        const scale = Values.positive(values[0]!, 'transform scale');
        if (values[1] !== undefined && values[1] !== scale) throw new EditorError(`unsupported non-uniform scale: ${source}`);
        this.factor = Values.positive(this.factor * scale, 'transform scale');
      }
      position = grammar.lastIndex;
    }
  }
  apply(shape: Shape): void {
    shape.scale(this.factor);
    shape.move(this.dx, this.dy);
    this.scaleExplicitPresentation(shape);
  }
  private scaleExplicitPresentation(shape: Shape): void {
    if (this.factor !== 1) {
      for (const name of ['stroke-width', 'font-size']) {
        const value = shape.attributes().get(name);
        if (value !== undefined && /^[\d.eE+-]+(?:px)?$/.test(value)) {
          shape.importAttribute(name, Values.format(Values.nonnegative(value.replace(/px$/, ''), name) * this.factor));
        }
      }
    }
    for (const child of shape.children()) this.scaleExplicitPresentation(child);
  }
}
