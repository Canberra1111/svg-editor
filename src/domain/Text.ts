import { Shape } from './Shape.js';
import { Values } from './Values.js';

export class Text extends Shape {
  private contentValue: string;
  constructor(id: string, x = 0, y = 0, content = '') {
    super('text', id, { x, y });
    this.contentValue = content;
  }
  override textContent(): string { return this.contentValue; }
  override setAttribute(name: string, value: string): void {
    if (name === 'text') this.contentValue = value;
    else super.setAttribute(name, value);
  }
  override move(dx: number, dy: number): void { this.shift('x', dx); this.shift('y', dy); }
  override scale(factor: number): void { this.scaleGeometry(factor); }
  override summary(): string {
    return [`(${Values.format(this.coordinate('x'))},${Values.format(this.coordinate('y'))})`, JSON.stringify(this.contentValue), this.styleSummary()].filter(Boolean).join(' ');
  }
  override clone(): Text { return this.copyTo(new Text(this.id, 0, 0, this.contentValue)); }
}
