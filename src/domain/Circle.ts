import { Shape } from './Shape.js';

export class Circle extends Shape {
  constructor(id: string, cx = 0, cy = 0, r = 0) { super('circle', id, { cx, cy, r }, ['r']); }
  override move(dx: number, dy: number): void { this.shift('cx', dx); this.shift('cy', dy); }
  override scale(factor: number): void { this.scaleGeometry(factor); }
  override summary(): string { return [this.geometrySummary(['cx', 'cy', 'r']), this.styleSummary()].filter(Boolean).join(' '); }
  override clone(): Circle { return this.copyTo(new Circle(this.id)); }
}
