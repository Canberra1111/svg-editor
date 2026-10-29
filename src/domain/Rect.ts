import { Shape } from './Shape.js';

export class Rect extends Shape {
  constructor(id: string, x = 0, y = 0, width = 0, height = 0) {
    super('rect', id, { x, y, width, height }, ['width', 'height']);
  }
  override move(dx: number, dy: number): void { this.shift('x', dx); this.shift('y', dy); }
  override scale(factor: number): void { this.scaleGeometry(factor); }
  override summary(): string {
    return [this.geometrySummary(['x', 'y', 'width', 'height'], ['x', 'y', 'w', 'h']), this.styleSummary()].filter(Boolean).join(' ');
  }
  override clone(): Rect { return this.copyTo(new Rect(this.id)); }
}
