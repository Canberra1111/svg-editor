import { Shape } from './Shape.js';

export class Line extends Shape {
  constructor(id: string, x1 = 0, y1 = 0, x2 = 0, y2 = 0) { super('line', id, { x1, y1, x2, y2 }); }
  override move(dx: number, dy: number): void {
    this.shift('x1', dx); this.shift('y1', dy); this.shift('x2', dx); this.shift('y2', dy);
  }
  override scale(factor: number): void { this.scaleGeometry(factor); }
  override summary(): string {
    return [this.geometrySummary(['x1', 'y1', 'x2', 'y2']), this.styleSummary()].filter(Boolean).join(' ');
  }
  override clone(): Line { return this.copyTo(new Line(this.id)); }
}
