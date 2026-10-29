import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Group } from '../src/domain/Group.js';
import { Rect } from '../src/domain/Rect.js';
import { Circle } from '../src/domain/Circle.js';
import { Ellipse } from '../src/domain/Ellipse.js';
import { Line } from '../src/domain/Line.js';
import { Text } from '../src/domain/Text.js';

test('nested containers move and scale every descendant geometry', () => {
  const doc = new SvgDocument();
  const outer = new Group('outer');
  const inner = new Group('inner');
  inner.insert(new Rect('r', 10, 20, 30, 40));
  inner.insert(new Circle('c', 1, 2, 3));
  inner.insert(new Ellipse('e', 4, 5, 6, 7));
  inner.insert(new Line('l', 1, 2, 3, 4));
  inner.insert(new Text('t', 5, 6, '开始'));
  outer.insert(inner);
  doc.add(outer);
  doc.move('outer', 2, 3);
  doc.scale('outer', 2);
  assert.equal(doc.require('r').attributes().get('x'), '24');
  assert.equal(doc.require('r').attributes().get('height'), '80');
  assert.equal(doc.require('c').attributes().get('r'), '6');
  assert.equal(doc.require('e').attributes().get('ry'), '14');
  assert.equal(doc.require('l').attributes().get('x2'), '10');
  assert.equal(doc.require('l').attributes().get('y2'), '14');
  assert.equal(doc.require('t').attributes().get('y'), '18');
  assert.equal(doc.require('t').textContent(), '开始');
});

test('deep snapshots preserve fields and do not share child or presentation state', () => {
  const doc = new SvgDocument();
  doc.add(new Group('g'));
  doc.add(new Rect('r', 1, 2, 3, 4), 'g');
  doc.set('g', 'fill', 'red');
  const copy = doc.clone();
  copy.move('g', 10, 20);
  copy.set('g', 'fill', 'blue');
  copy.delete('r');
  assert.equal(doc.require('r').attributes().get('x'), '1');
  assert.equal(doc.require('g').attributes().get('fill'), 'red');
  assert.equal(doc.require('r').parent, doc.require('g'));
});

test('grouping uses original document order and ungrouping preserves its nested position', () => {
  const doc = new SvgDocument();
  doc.add(new Group('scene'));
  for (const id of ['a', 'b', 'c', 'd']) doc.add(new Rect(id), 'scene');
  doc.group('pair', ['c', 'a']);
  assert.deepEqual(doc.require('scene').children().map(s => s.id), ['pair', 'b', 'd']);
  assert.deepEqual(doc.require('pair').children().map(s => s.id), ['a', 'c']);
  doc.ungroup('pair');
  assert.deepEqual(doc.require('scene').children().map(s => s.id), ['a', 'c', 'b', 'd']);
  assert.throws(() => doc.ungroup('scene'), /cannot ungroup top-level container: scene/);
});

test('cross-container grouping picks common parent, rejects cycles and duplicate selections', () => {
  const doc = new SvgDocument();
  doc.add(new Group('a')); doc.add(new Group('b'));
  doc.add(new Rect('r1'), 'a'); doc.add(new Rect('r2'), 'b');
  doc.group('joined', ['r2', 'r1']);
  assert.deepEqual(doc.require('joined').children().map(s => s.id), ['r1', 'r2']);
  assert.equal(doc.isTopLevel(doc.require('joined')), true);
  assert.throws(() => doc.addTo('joined', 'joined'), /own descendant: joined/);
  assert.throws(() => doc.group('bad', ['joined', 'r1']), /own descendant: joined/);
  assert.throws(() => doc.group('bad', ['r1', 'r1']), /duplicate shape/);
});

test('ids are unique and case sensitive; geometry and set whitelist are enforced', () => {
  const doc = new SvgDocument();
  doc.add(new Rect('R')); doc.add(new Rect('r'));
  assert.throws(() => doc.add(new Circle('r')), /id already exists: r/);
  assert.throws(() => doc.set('r', 'id', 'new'), /unknown attribute: id/);
  assert.throws(() => doc.set('r', 'width', '-1'), /non-negative/);
  assert.throws(() => doc.scale('r', 0), /scale factor must be positive/);
  assert.throws(() => doc.move('r', NaN, 0), /invalid number/);
  assert.equal(doc.require('r').attributes().has('fill'), false);
  assert.equal(doc.require('r').attributes().has('stroke'), false);
});
