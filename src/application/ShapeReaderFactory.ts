import type { Shape } from '../domain/Shape.js';

export interface ShapeReaderFactory {
  empty(type: string, id: string): Shape;
}
