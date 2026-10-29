import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { ShapeFactory } from '../src/application/ShapeFactory.js';
import { EditorHarness } from './support/EditorHarness.js';

test('assignment external SVG imports seven elements and assigns the missing rect id with warning', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const result = codec.decode(readFileSync('examples/other.svg', 'utf8'));
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(result.document.width, 400); assert.equal(result.document.height, 300);
  assert.equal(result.document.allShapes().length, 7);
  assert.deepEqual(result.document.children().map(s => s.id), ['rect1', 't1', 'c1', 'g1', 'e1']);
  assert.deepEqual(result.document.require('g1').children().map(s => s.id), ['r2', 'c2']);
});

test('auto ids reserve all explicit ids before allocation, including ids appearing later', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const { document, warnings } = codec.decode('<svg><rect/><g><rect/><rect id="rect1"/></g><circle/><circle id="circle1"/></svg>');
  assert.deepEqual(warnings, ['warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g1 to unnamed <g>', 'warning: assigned id rect3 to unnamed <rect>', 'warning: assigned id circle2 to unnamed <circle>']);
  assert.equal(new Set(document.allShapes().map(s => s.id)).size, 6);
});

test('SVG round trip preserves nesting, geometry, styles, literal text, CDATA and XML escapes', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const source = '<svg width="400px" height="200" viewBox="-10 -20 400 200"><g id="g" fill="red"><text id="t" x="1.5px" y="2" text-anchor="middle" font-size="16">  007 &amp; 世界 <![CDATA[<tag>]]> &quot;x&quot;  </text><line id="l" x2="3" y2="4" stroke="black"/></g></svg>';
  const first = codec.decode(source).document;
  const encoded = codec.encode(first);
  const second = codec.decode(encoded).document;
  assert.equal(second.require('t').textContent(), '  007 & 世界 <tag> "x"  ');
  assert.equal(second.rootMetadata().get('viewBox'), '-10 -20 400 200');
  assert.equal(second.require('t').attributes().get('text-anchor'), 'middle');
  assert.equal(second.require('t').attributes().get('font-size'), '16');
  assert.equal(second.require('t').attributes().get('x'), '1.5');
  assert.equal(second.require('l').attributes().has('fill'), false);
  assert.equal(codec.encode(second), encoded);
  assert.match(encoded, /&amp;/); assert.match(encoded, /&lt;tag&gt;/);
});

test('translate and uniform scale normalize in SVG order across nested groups', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const document = codec.decode('<svg><g id="diagram" transform="translate(60,40)"><rect id="a" width="120" height="60"/><g id="nodeB" transform="translate(200,0) scale(0.8)"><rect id="b" width="120" height="60"/><text id="t" x="60" y="38" font-size="16">End</text></g></g></svg>').document;
  assert.equal(document.require('a').attributes().get('x'), '60');
  assert.equal(document.require('b').attributes().get('x'), '260');
  assert.equal(document.require('b').attributes().get('width'), '96');
  assert.equal(document.require('t').attributes().get('x'), '308');
  assert.equal(document.require('t').attributes().get('y'), '70.4');
  assert.equal(document.require('t').attributes().get('font-size'), '12.8');
  assert.equal(codec.encode(document).includes('transform='), false);
});

test('malformed SVG, unsupported elements/transforms, duplicate ids and invalid geometry are rejected', () => {
  const codec = new SvgCodec(new ShapeFactory());
  for (const source of ['<svg><g></svg>', '<html/>', '<svg/><svg/>', '<!DOCTYPE svg><svg/>', '<svg><path id="p" d="M0 0"/></svg>', '<svg><rect id="r"/><circle id="r"/></svg>', '<svg><rect width="-1"/></svg>', '<svg><rect x="10%"/></svg>', '<svg><g transform="rotate(20)"/></svg>', '<svg><g transform="scale(2,3)"/></svg>', '<svg><text><tspan>hello</tspan></text></svg>', '<svg viewBox="0 0 -1 2"/>']) {
    assert.throws(() => codec.decode(source), Error, source);
  }
});

test('set style attributes overrides imported inline style without losing other declarations', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const document = codec.decode('<svg><rect id="r" fill="green" style="fill:red;opacity:0.5" width="10" height="10"/></svg>').document;
  document.set('r', 'fill', 'blue');
  assert.equal(document.require('r').attributes().get('fill'), 'blue');
  assert.equal(document.require('r').attributes().get('style'), 'opacity:0.5');
  assert.match(codec.encode(document), /fill="blue"/);
});

test('undeclared entities and invalid character references are rejected instead of silently changing text', () => {
  const codec = new SvgCodec(new ShapeFactory());
  for (const entity of ['&unknown;', '&#0;', '&#xD800;', '&#x110000;', '&amp', '&']) {
    assert.throws(() => codec.decode(`<svg><text>${entity}</text></svg>`), /invalid/);
  }
  const result = codec.decode('<svg><!-- &unknown; --><text><![CDATA[&unknown;]]> &#x1F600;</text></svg>');
  assert.equal(result.document.children()[0]!.textContent(), '&unknown; 😀');
});

test('root SVG id participates in uniqueness and auto id allocation', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const result = codec.decode('<svg id="rect1"><rect/></svg>');
  assert.equal(result.document.children()[0]!.id, 'rect2');
  assert.throws(() => result.document.add(new ShapeFactory().empty('rect', 'rect1')), /id already exists: rect1/);
});

test('real file read/save is atomic, remembers paths, and malformed reads preserve redo and document', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  try {
    const path = join(directory, 'space name.svg');
    const invalid = join(directory, 'invalid.svg');
    const codec = new SvgCodec(new ShapeFactory());
    const h = new EditorHarness(new FileDocumentStore(codec));
    h.setup(['init 400 200', 'create rect r 1 2 3 4 blue', `save "${path}"`, 'move r 10 20', 'undo']);
    const before = h.snapshot();
    writeFileSync(invalid, '<svg><rect/><g></svg>');
    assert.match(h.run(`read "${invalid}"`)[0]!, /^error: invalid SVG/);
    assert.equal(h.snapshot(), before);
    const existingDirectory = join(directory, 'existing-dir');
    // A rename failure after writing the temporary file must clean up that file.
    mkdirSync(existingDirectory);
    assert.match(h.run(`save "${existingDirectory}"`)[0]!, /^error: cannot write file:/);
    assert.equal(h.snapshot(), before);
    assert.equal(h.run(`read "${join(directory, 'missing.svg')}"`)[0], `error: cannot read file: ${join(directory, 'missing.svg')}`);
    assert.match(h.run(`save "${join(directory, 'absent', 'out.svg')}"`)[0]!, /^error: cannot write file:/);
    assert.equal(h.snapshot(), before);
    h.setup(['redo', 'save']);
    assert.equal(codec.decode(readFileSync(path, 'utf8')).document.require('r').attributes().get('x'), '11');
    assert.deepEqual(readdirSync(directory).sort(), ['existing-dir', 'invalid.svg', 'space name.svg']);
    h.setup([`read "${path}"`]);
    assert.equal(h.document().require('r').attributes().get('x'), '11');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
