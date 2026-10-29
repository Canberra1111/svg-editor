import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { DocumentReadResult } from '../application/DocumentStore.js';
import type { ShapeReaderFactory } from '../application/ShapeReaderFactory.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';
import { EditorError } from '../domain/EditorError.js';
import { Values } from '../domain/Values.js';
import { UniformTransform } from './UniformTransform.js';
import { XmlCharacters } from './XmlCharacters.js';

type XmlNode = Record<string, unknown>;

export class SvgCodec {
  private readonly parser = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: '', preserveOrder: true,
    trimValues: false, parseTagValue: false, parseAttributeValue: false,
    ignoreDeclaration: true, ignorePiTags: true, cdataPropName: '#cdata',
    // This version gates numeric XML references behind its legacy htmlEntities option.
    // XmlCharacters still rejects all non-XML named entities before parsing.
    htmlEntities: true,
  });
  constructor(private readonly factory: ShapeReaderFactory) {}

  decode(xml: string): DocumentReadResult {
    if (/<!DOCTYPE\b/i.test(xml)) throw new EditorError('invalid SVG: DOCTYPE is not supported');
    XmlCharacters.validateSource(xml);
    const validity = XMLValidator.validate(xml);
    if (validity !== true) throw new EditorError(`invalid SVG: ${validity.err.msg} (line ${validity.err.line})`);
    const nodes = this.nodes(this.parser.parse(xml) as unknown);
    const roots = nodes.filter(node => this.tag(node) !== undefined);
    if (roots.length !== 1 || this.tag(roots[0]!) !== 'svg') throw new EditorError('invalid SVG: expected one <svg> root');
    const root = roots[0]!, attrs = this.attributes(root);
    if (attrs.xmlns && attrs.xmlns !== 'http://www.w3.org/2000/svg') throw new EditorError('invalid SVG: unsupported namespace');
    const box = attrs.viewBox?.trim().split(/[\s,]+/).map(value => Values.number(value, 'viewBox'));
    if (box && (box.length !== 4 || box[2]! <= 0 || box[3]! <= 0)) throw new EditorError('invalid SVG: invalid viewBox');
    const document = new SvgDocument(
      attrs.width === undefined ? (box?.[2] ?? 800) : this.length(attrs.width, 'canvas width'),
      attrs.height === undefined ? (box?.[3] ?? 600) : this.length(attrs.height, 'canvas height'),
    );
    for (const [name, value] of Object.entries(attrs)) {
      if (!['width', 'height', 'xmlns', 'transform'].includes(name)) document.setRootMetadata(name, value);
    }
    const reserved = new Set<string>();
    this.reserveIds(root, reserved);
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    for (const node of this.nodes(root.svg)) {
      if (this.tag(node)) document.add(this.build(node, reserved, counters, warnings));
      else this.assertWhitespace(node);
    }
    if (attrs.transform) for (const shape of document.children()) new UniformTransform(attrs.transform).apply(shape);
    return { document, warnings };
  }

  encode(document: SvgDocument): string {
    const attrs = new Map<string, string>([
      ['xmlns', 'http://www.w3.org/2000/svg'],
      ['width', Values.format(document.width)], ['height', Values.format(document.height)],
      ...document.rootMetadata(),
    ]);
    return ['<?xml version="1.0" encoding="UTF-8"?>', `<svg${this.encodeAttributes(attrs)}>`, ...document.children().map(shape => this.encodeShape(shape, 1)), '</svg>', ''].join('\n');
  }

  private build(node: XmlNode, reserved: Set<string>, counters: Map<string, number>, warnings: string[]): Shape {
    const tag = this.tag(node)!;
    const attrs = this.attributes(node);
    let id = attrs.id;
    if (!id) {
      let sequence = counters.get(tag) ?? 0;
      do { id = `${tag}${++sequence}`; } while (reserved.has(id));
      counters.set(tag, sequence); reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
    }
    const shape = this.factory.empty(tag, id);
    for (const [name, value] of Object.entries(attrs)) {
      if (['id', 'transform', 'style'].includes(name)) continue;
      shape.importAttribute(name, shape.isGeometryAttribute(name) || name === 'stroke-width' ? Values.format(this.length(value, name)) : value);
    }
    // Inline style must retain its original precedence over presentation attributes.
    if (attrs.style !== undefined) shape.importAttribute('style', attrs.style);
    const children = this.nodes(node[tag]);
    if (shape.isContainer()) {
      for (const child of children) {
        if (this.tag(child)) shape.asGroup().insert(this.build(child, reserved, counters, warnings));
        else this.assertWhitespace(child);
      }
    } else if (shape.textContent() !== null) {
      shape.setAttribute('text', this.text(children));
    } else {
      for (const child of children) this.assertWhitespace(child);
    }
    if (attrs.transform) new UniformTransform(attrs.transform).apply(shape);
    return shape;
  }

  private reserveIds(node: XmlNode, reserved: Set<string>): void {
    const id = this.attributes(node).id;
    if (id) {
      Values.id(id);
      if (reserved.has(id)) throw new EditorError(`id already exists: ${id}`);
      reserved.add(id);
    }
    const tag = this.tag(node);
    if (tag) for (const child of this.nodes(node[tag])) if (this.tag(child)) this.reserveIds(child, reserved);
  }

  private encodeShape(shape: Shape, depth: number): string {
    const indent = '  '.repeat(depth), attributes = this.encodeAttributes(shape.attributes());
    if (shape.isContainer()) {
      if (!shape.children().length) return `${indent}<${shape.tag}${attributes}/>`;
      return [`${indent}<${shape.tag}${attributes}>`, ...shape.children().map(child => this.encodeShape(child, depth + 1)), `${indent}</${shape.tag}>`].join('\n');
    }
    const text = shape.textContent();
    return text === null ? `${indent}<${shape.tag}${attributes}/>` : `${indent}<${shape.tag}${attributes}>${this.escape(text)}</${shape.tag}>`;
  }

  private encodeAttributes(attributes: ReadonlyMap<string, string>): string {
    return [...attributes].map(([name, value]) => ` ${name}="${this.escape(value).replace(/\t/g, '&#9;').replace(/\n/g, '&#10;').replace(/\r/g, '&#13;')}"`).join('');
  }

  private escape(value: string): string {
    XmlCharacters.validateText(value);
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  private tag(node: XmlNode): string | undefined { return Object.keys(node).find(name => name !== ':@' && !name.startsWith('#') && !name.startsWith('?')); }
  private attributes(node: XmlNode): Record<string, string> {
    const value = node[':@'];
    if (value === undefined) return {};
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new EditorError('invalid SVG attributes');
    return Object.fromEntries(Object.entries(value).map(([key, attribute]) => [key, String(attribute)]));
  }
  private nodes(value: unknown): XmlNode[] {
    if (!Array.isArray(value)) throw new EditorError('invalid SVG node structure');
    for (const node of value) if (typeof node !== 'object' || node === null || Array.isArray(node)) throw new EditorError('invalid SVG node');
    return value as XmlNode[];
  }
  private text(nodes: readonly XmlNode[]): string {
    return nodes.map(node => {
      if (node['#text'] !== undefined) return String(node['#text']);
      if (node['#cdata'] !== undefined) return this.text(this.nodes(node['#cdata']));
      throw new EditorError('unsupported nested element inside text');
    }).join('');
  }
  private assertWhitespace(node: XmlNode): void {
    if (this.tag(node) || this.text([node]).trim()) throw new EditorError('invalid SVG: unexpected content');
  }
  private length(value: string, name: string): number { return Values.number(value.replace(/px$/, ''), name); }
}
