import { Shape } from './Shape.js';
import { EditorError } from './EditorError.js';
import { Values } from './Values.js';

export class Group extends Shape {
  private readonly items: Shape[] = [];
  constructor(id: string) { super('g', id, {}); }
  override isContainer(): boolean { return true; }
  override asGroup(): Group { return this; }
  override children(): readonly Shape[] { return [...this.items]; }
  override contains(shape: Shape): boolean { return this === shape || this.items.some(child => child.contains(shape)); }
  override find(id: string): Shape | null {
    if (this.id === id) return this;
    for (const child of this.items) { const found = child.find(id); if (found) return found; }
    return null;
  }
  insert(shape: Shape, index = this.items.length): void {
    if (shape.contains(this)) throw new EditorError(`cannot group a container into its own descendant: ${shape.id}`);
    shape.parent?.remove(shape);
    this.items.splice(Math.min(index, this.items.length), 0, shape);
    shape.attach(this);
  }
  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new EditorError(`shape is not in container: ${shape.id}`);
    this.items.splice(index, 1);
    shape.attach(null);
    return index;
  }
  override move(dx: number, dy: number): void {
    Values.number(dx, 'dx'); Values.number(dy, 'dy');
    for (const child of this.items) child.move(dx, dy);
  }
  override scale(factor: number): void {
    Values.positive(factor, 'scale factor');
    for (const child of this.items) child.scale(factor);
  }
  override summary(): string { return this.styleSummary(); }
  override clone(): Group {
    const copy = this.copyTo(new Group(this.id));
    for (const child of this.items) copy.insert(child.clone());
    return copy;
  }
}
