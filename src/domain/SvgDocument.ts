import { EditorError } from './EditorError.js';
import { Group } from './Group.js';
import type { Shape } from './Shape.js';
import { Values } from './Values.js';

export class SvgDocument {
  private widthValue: number;
  private heightValue: number;
  private readonly root = new Group('__internal_canvas__');
  private readonly rootAttributes = new Map<string, string>();

  constructor(width = 800, height = 600) {
    this.widthValue = Values.positive(width, 'canvas width');
    this.heightValue = Values.positive(height, 'canvas height');
    this.rootAttributes.set('viewBox', `0 0 ${width} ${height}`);
  }
  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }
  children(): readonly Shape[] { return this.root.children(); }
  isTopLevel(shape: Shape): boolean { return shape.parent === this.root; }
  rootMetadata(): ReadonlyMap<string, string> { return new Map(this.rootAttributes); }
  setRootMetadata(name: string, value: string): void { this.rootAttributes.set(name, value); }
  resize(width: number, height: number): void {
    const w = Values.positive(width, 'canvas width');
    const h = Values.positive(height, 'canvas height');
    this.widthValue = w; this.heightValue = h;
    this.rootAttributes.set('viewBox', `0 0 ${w} ${h}`);
  }
  find(id: string): Shape | null {
    for (const shape of this.root.children()) { const result = shape.find(id); if (result) return result; }
    return null;
  }
  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new EditorError(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new EditorError(`no such container: ${id}`);
    return shape.asGroup();
  }
  assertAvailable(id: string): void {
    Values.id(id);
    if (this.find(id) || this.rootAttributes.get('id') === id) throw new EditorError(`id already exists: ${id}`);
  }
  add(shape: Shape, containerId?: string): void {
    const parent = containerId === undefined ? this.root : this.container(containerId);
    const ids = new Set<string>();
    for (const node of this.walk(shape)) {
      this.assertAvailable(node.id);
      if (ids.has(node.id)) throw new EditorError(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    parent.insert(shape);
  }
  delete(id: string): Shape {
    const shape = this.require(id);
    shape.parent!.remove(shape);
    return shape;
  }
  move(id: string, dx: number, dy: number): Shape { const shape = this.require(id); shape.move(dx, dy); return shape; }
  scale(id: string, factor: number): Shape { const shape = this.require(id); shape.scale(factor); return shape; }
  set(id: string, name: string, value: string): Shape { const shape = this.require(id); shape.setAttribute(name, value); return shape; }
  addTo(groupId: string, id: string): Shape {
    const group = this.container(groupId);
    const shape = this.require(id);
    group.insert(shape);
    return shape;
  }
  group(id: string, ids: readonly string[]): Group {
    this.assertAvailable(id);
    if (!ids.length) throw new EditorError('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new EditorError('duplicate shape in group');
    const selected = ids.map(item => this.require(item));
    for (const a of selected) for (const b of selected) {
      if (a !== b && a.contains(b)) throw new EditorError(`cannot group a container into its own descendant: ${a.id}`);
    }
    const order = this.allShapes();
    selected.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    let parent = selected[0]!.parent!;
    while (!selected.every(shape => parent.contains(shape))) parent = parent.parent!;
    const indices = selected.map(shape => {
      let branch = shape;
      while (branch.parent !== parent) branch = branch.parent!;
      return parent.children().indexOf(branch);
    });
    const insertion = Math.min(...indices);
    const group = new Group(id);
    for (const shape of selected) group.insert(shape);
    parent.insert(group, insertion);
    return group;
  }
  ungroup(id: string): number {
    const group = this.require(id).asGroup();
    if (this.isTopLevel(group)) throw new EditorError(`cannot ungroup top-level container: ${id}`);
    const parent = group.parent!;
    const index = parent.remove(group);
    const children = group.children();
    children.forEach((shape, offset) => parent.insert(shape, index + offset));
    return children.length;
  }
  reorder(id: string, front: boolean): Shape {
    const shape = this.require(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.insert(shape, front ? parent.children().length : 0);
    return shape;
  }
  allShapes(): Shape[] { return this.root.children().flatMap(shape => this.walk(shape)); }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const [name, value] of this.rootAttributes) copy.rootAttributes.set(name, value);
    for (const shape of this.children()) copy.root.insert(shape.clone());
    return copy;
  }
  private walk(shape: Shape): Shape[] { return [shape, ...shape.children().flatMap(child => this.walk(child))]; }
}
