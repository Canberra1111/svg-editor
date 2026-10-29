import { EditorError } from '../domain/EditorError.js';
import { Values } from '../domain/Values.js';
import type { Shape } from '../domain/Shape.js';
import { Rect } from '../domain/Rect.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Line } from '../domain/Line.js';
import { Text } from '../domain/Text.js';
import { Group } from '../domain/Group.js';

interface ShapeDefinition {
  readonly parameters: readonly string[];
  readonly style?: string;
  readonly build: (id: string, values: readonly string[]) => Shape;
}

export class ShapeFactory {
  // Type-name dispatch 2/2. TODO (plugin phase): register ShapeProvider instances.
  private readonly definitions = new Map<string, ShapeDefinition>([
    ['rect', { parameters: ['x', 'y', 'w', 'h'], style: 'fill', build: (id, a) => new Rect(id, this.number(a, 0), this.number(a, 1), this.number(a, 2), this.number(a, 3)) }],
    ['circle', { parameters: ['cx', 'cy', 'r'], style: 'fill', build: (id, a) => new Circle(id, this.number(a, 0), this.number(a, 1), this.number(a, 2)) }],
    ['ellipse', { parameters: ['cx', 'cy', 'rx', 'ry'], style: 'fill', build: (id, a) => new Ellipse(id, this.number(a, 0), this.number(a, 1), this.number(a, 2), this.number(a, 3)) }],
    ['line', { parameters: ['x1', 'y1', 'x2', 'y2'], style: 'stroke', build: (id, a) => new Line(id, this.number(a, 0), this.number(a, 1), this.number(a, 2), this.number(a, 3)) }],
    ['text', { parameters: ['x', 'y', '"content"'], build: (id, a) => new Text(id, this.number(a, 0), this.number(a, 1), a[2] ?? '') }],
    ['g', { parameters: [], build: id => new Group(id) }],
  ]);
  create(type: string, id: string, values: readonly string[]): Shape {
    const definition = this.definition(type);
    const min = definition.parameters.length;
    const max = min + (definition.style ? 1 : 0);
    if (values.length < min || values.length > max) {
      throw new EditorError(`usage: create ${type} <id> ${definition.parameters.map(p => `<${p}>`).join(' ')}${definition.style ? ` [${definition.style}]` : ''} [in <containerId>]`);
    }
    const shape = definition.build(id, values);
    if (definition.style && values[min] !== undefined) shape.setAttribute(definition.style, values[min]);
    return shape;
  }
  empty(type: string, id: string): Shape { return this.definition(type).build(id, []); }
  private definition(type: string): ShapeDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  private number(values: readonly string[], index: number): number { return Values.number(values[index] ?? 0, `parameter ${index + 1}`); }
}
