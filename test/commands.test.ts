import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorHarness } from './support/EditorHarness.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';

test('tokenizer handles quoted content, escapes, empty strings, hex colors and whole-line comments', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # comment'), []);
  assert.deepEqual(tokenizer.tokenize('create rect r 1 2 3 4 #4a90d9'), ['create', 'rect', 'r', '1', '2', '3', '4', '#4a90d9']);
  assert.deepEqual(tokenizer.tokenize('create text t 0 0 "hello \\"SVG\\" 世界"'), ['create', 'text', 't', '0', '0', 'hello "SVG" 世界']);
  assert.deepEqual(tokenizer.tokenize('set t text ""'), ['set', 't', 'text', '']);
  assert.throws(() => tokenizer.tokenize('set t text "bad'), /unterminated/);
});

test('all six create types and in clause build the specified tree with default styles omitted', () => {
  const h = new EditorHarness();
  h.setup(['init 400 200', 'create g scene', 'create g node in scene', 'create rect r -1.5 .25 20 30 in node', 'create circle c 1 2 3 red in scene', 'create ellipse e 4 5 6 7', 'create line l 0 0 1 2 black', 'create text t 10 20 "Hello 世界" in node']);
  assert.deepEqual(h.document().require('scene').children().map(s => s.id), ['node', 'c']);
  assert.equal(h.document().require('r').attributes().get('x'), '-1.5');
  assert.equal(h.document().require('r').attributes().has('fill'), false);
  assert.equal(h.document().require('c').attributes().get('fill'), 'red');
  assert.equal(h.document().require('l').attributes().get('stroke'), 'black');
  assert.equal(h.document().require('t').textContent(), 'Hello 世界');
  assert.match(h.run('create box b 0 0 1 2 "label"')[0]!, /^error: unknown shape type: box/);
  assert.equal(h.run('create rect nope 0 0 1 1 in absent')[0], 'error: no such container: absent');
  assert.equal(h.run('create g bad in r')[0], 'error: not a container: r');
});

test('every edit is one undo unit, snapshots restore whole trees, and a new edit clears redo', () => {
  const h = new EditorHarness();
  h.setup(['init', 'create rect a 1 2 3 4', 'create circle b 10 20 5']);
  const beforeGroup = h.snapshot();
  h.setup(['group pair a b']);
  const grouped = h.snapshot();
  h.setup(['undo']); assert.equal(h.snapshot(), beforeGroup);
  h.setup(['redo']); assert.equal(h.snapshot(), grouped);
  h.setup(['move pair 10 20', 'scale pair 2', 'set pair fill red']);
  const beforeDelete = h.snapshot();
  h.setup(['delete pair']); assert.equal(h.document().allShapes().length, 0);
  h.setup(['undo']); assert.equal(h.snapshot(), beforeDelete);
  h.setup(['undo', 'set a width 99']);
  assert.equal(h.run('redo')[0], 'error: nothing to redo');
});

test('errors do not change document, saved path or redo history, including partial recursive overflow', () => {
  const h = new EditorHarness();
  h.setup(['init', 'create g g', 'create rect small 1 2 3 4 in g', 'create rect big 1e308 0 1 1 in g', 'move small 1 1', 'undo']);
  const before = h.snapshot();
  for (const command of ['scale g 2', 'move absent 1 2', 'set small width -1', 'set small text bad', 'group bad g small', 'addto small g', 'save unwritable/out.svg', 'read missing.svg', 'canvas -1 100', 'init 0 20', 'create rect small 0 0 1 1', 'create rect extra 0 0 1 1 red ignored', 'set small fill "bad']) {
    assert.match(h.run(command)[0]!, /^error:/, command);
    assert.equal(h.snapshot(), before, command);
  }
  h.setup(['redo']);
  assert.equal(h.document().require('small').attributes().get('x'), '2');
  assert.equal(h.run('save')[0], 'error: no file path. use save <file.svg>');
});

test('init, read, save and canvas mutation lock both histories; canvas query and display do not', () => {
  const h = new EditorHarness();
  assert.equal(h.run('tree')[0], "error: no document. use 'init' or 'read' first");
  assert.ok(h.run('help').includes('undo'));
  h.setup(['init', 'create rect r 1 2 3 4', 'save "sample file.svg"']);
  assert.equal(h.run('undo')[0], 'error: undo not allowed after io command');
  assert.equal(h.run('redo')[0], 'error: undo not allowed after io command');
  h.setup(['move r 1 1', 'canvas', 'tree', 'show r', 'help', 'undo']);
  assert.equal(h.document().require('r').attributes().get('x'), '1');
  h.setup(['redo', 'canvas 400 300']);
  assert.equal(h.run('undo')[0], 'error: undo not allowed after io command');
  h.setup(['move r 10 10', 'read "sample file.svg"']);
  assert.equal(h.document().width, 800);
  assert.equal(h.document().require('r').attributes().get('x'), '1');
  assert.equal(h.run('undo')[0], 'error: undo not allowed after io command');
  h.setup(['move r 5 5', 'save']);
  assert.equal(h.run('undo')[0], 'error: undo not allowed after io command');
  h.setup(['init 250']);
  assert.equal(h.document().width, 250); assert.equal(h.document().height, 600);
  assert.equal(h.document().allShapes().length, 0);
  assert.equal(h.run('save')[0], 'error: no file path. use save <file.svg>');
});

test('addto, front/back and nested ungroup preserve sibling order and are reversible', () => {
  const h = new EditorHarness();
  h.setup(['init', 'create g scene', 'create g nested in scene', 'create rect a 1 2 3 4 in nested', 'create rect b 1 2 3 4 in scene', 'create rect c 1 2 3 4 in scene', 'addto nested b']);
  assert.deepEqual(h.document().require('nested').children().map(s => s.id), ['a', 'b']);
  h.setup(['back b']); assert.deepEqual(h.document().require('nested').children().map(s => s.id), ['b', 'a']);
  h.setup(['front b']); assert.deepEqual(h.document().require('nested').children().map(s => s.id), ['a', 'b']);
  const before = h.snapshot();
  h.setup(['ungroup nested']);
  assert.deepEqual(h.document().require('scene').children().map(s => s.id), ['a', 'b', 'c']);
  h.setup(['undo']); assert.equal(h.snapshot(), before);
  assert.equal(h.run('ungroup scene')[0], 'error: cannot ungroup top-level container: scene');
  assert.equal(h.run('addto nested scene')[0], 'error: cannot group a container into its own descendant: scene');
});

test('tree includes inline geometry; subtree and show identify parents and text', () => {
  const h = new EditorHarness();
  h.setup(['init 400 200', 'create g node', 'create rect r 1 2 3 4 blue in node', 'create text t 5 6 "hello world" in node']);
  assert.deepEqual(h.run('tree'), ['svg (400x200)', '└── g#node', '    ├── rect#r  x=1 y=2 w=3 h=4 fill=blue', '    └── text#t  (5,6) "hello world"']);
  assert.match(h.run('tree node')[0]!, /^g#node$/);
  assert.equal(h.run('show t')[0], 'text#t  parent=g#node');
  assert.ok(h.run('show t').includes('  text="hello world"'));
});
