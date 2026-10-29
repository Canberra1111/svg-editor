import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  constructor(id: string, cx = 0, cy = 0, rx = 0, ry = 0) { super('ellipse', id, { cx, cy, rx, ry }, ['rx', 'ry']); }
  override move(dx: number, dy: number): void { this.shift('cx', dx); this.shift('cy', dy); }
  override scale(factor: number): void { this.scaleGeometry(factor); }
  override summary(): string { return [this.geometrySummary(['cx', 'cy', 'rx', 'ry']), this.styleSummary()].filter(Boolean).join(' '); }
  override clone(): Ellipse { return this.copyTo(new Ellipse(this.id)); }
}
