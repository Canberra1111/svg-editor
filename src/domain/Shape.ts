import type { Group } from './Group.js';
import { EditorError } from './EditorError.js';
import { Values } from './Values.js';

export abstract class Shape {
  private readonly idValue: string;
  private parentValue: Group | null = null;
  private readonly geometry = new Map<string, number>();
  private readonly nonnegative: ReadonlySet<string>;
  private readonly presentation = new Map<string, string>();
  private readonly imported = new Map<string, string>();

  protected constructor(private readonly tagValue: string, id: string, geometry: Record<string, number>, nonnegative: readonly string[] = []) {
    this.idValue = Values.id(id);
    this.nonnegative = new Set(nonnegative);
    for (const [key, value] of Object.entries(geometry)) this.geometry.set(key, this.validateGeometry(key, value));
  }

  get id(): string { return this.idValue; }
  get tag(): string { return this.tagValue; }
  get parent(): Group | null { return this.parentValue; }
  label(): string { return `${this.tag}#${this.id}`; }
  attach(parent: Group | null): void { this.parentValue = parent; }
  children(): readonly Shape[] { return []; }
  textContent(): string | null { return null; }
  isContainer(): boolean { return false; }
  asGroup(): Group { throw new EditorError(`not a container: ${this.id}`); }
  find(id: string): Shape | null { return this.id === id ? this : null; }
  contains(shape: Shape): boolean { return this === shape; }

  attributes(): ReadonlyMap<string, string> {
    return new Map([
      ['id', this.id],
      ...[...this.geometry].map(([key, value]): [string, string] => [key, Values.format(value)]),
      ...this.imported,
      ...this.presentation,
    ]);
  }

  setAttribute(name: string, value: string): void {
    if (this.geometry.has(name)) {
      this.geometry.set(name, this.validateGeometry(name, value));
      return;
    }
    if (['fill', 'stroke', 'stroke-width'].includes(name)) {
      if (name === 'stroke-width') Values.nonnegative(value, name);
      if (!value) throw new EditorError(`empty value for ${name}`);
      this.presentation.set(name, value);
      return;
    }
    throw new EditorError(`unknown attribute: ${name}`);
  }

  importAttribute(name: string, value: string): void {
    if (name === 'id') return;
    if (this.geometry.has(name) || ['fill', 'stroke', 'stroke-width'].includes(name)) this.setAttribute(name, value);
    else this.imported.set(name, value);
  }

  protected coordinate(name: string): number {
    const value = this.geometry.get(name);
    if (value === undefined) throw new EditorError(`unknown geometry attribute: ${name}`);
    return value;
  }

  protected shift(name: string, delta: number): void {
    this.geometry.set(name, this.validateGeometry(name, this.coordinate(name) + Values.number(delta, name)));
  }

  protected scaleGeometry(factor: number): void {
    Values.positive(factor, 'scale factor');
    for (const [name, value] of this.geometry) this.geometry.set(name, this.validateGeometry(name, value * factor));
  }

  protected geometrySummary(names: readonly string[], labels: readonly string[] = names): string {
    return names.map((name, i) => `${labels[i]}=${Values.format(this.coordinate(name))}`).join(' ');
  }

  protected copyTo<T extends Shape>(target: T): T {
    for (const [name, value] of this.geometry) target.geometry.set(name, value);
    for (const [name, value] of this.presentation) target.presentation.set(name, value);
    for (const [name, value] of this.imported) target.imported.set(name, value);
    return target;
  }

  protected styleSummary(): string {
    return [...this.presentation].map(([name, value]) => `${name}=${value}`).join(' ');
  }

  private validateGeometry(name: string, value: string | number): number {
    return this.nonnegative.has(name) ? Values.nonnegative(value, name) : Values.number(value, name);
  }

  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract summary(): string;
  abstract clone(): Shape;
}
