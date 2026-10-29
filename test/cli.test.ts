import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { ShapeFactory } from '../src/application/ShapeFactory.js';

test('real CLI executes assignment flowchart, saves browser-readable SVG, and reads it back', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-cli-'));
  try {
    const path = join(directory, 'flow chart.svg');
    const input = readFileSync('examples/flowchart.cli', 'utf8').replace('save flowchart.svg', `save "${path}"`) + `\nread "${path}"\nshow process-label\n`;
    const result = spawnSync(process.execPath, ['dist/src/main.js'], { input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/);
    assert.match(result.stdout, /line#arrow1/);
    assert.match(result.stdout, /text="处理数据 v2"/);
    const document = new SvgCodec(new ShapeFactory()).decode(readFileSync(path, 'utf8')).document;
    assert.equal(document.allShapes().length, 8);
    assert.equal(document.require('process').attributes().get('y'), '100');
    assert.equal(document.require('process-label').textContent(), '处理数据 v2');
    assert.equal(document.require('process-label').parent!.id, 'node2');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('real CLI continues after errors, emits each error on one stderr line, and reports script failure', () => {
  const result = spawnSync(process.execPath, ['dist/src/main.js'], {
    input: '# comment\ninit\ncreate rect r 1 2 3 4\nmove absent 1 2\nscale r 0\nshow r\nundo\nredo\n', encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.deepEqual(result.stderr.trim().split('\n'), ['error: no such shape: absent', 'error: scale factor must be positive']);
  assert.match(result.stdout, /rect#r  parent=svg/);
  assert.match(result.stdout, /undone: create/);
  assert.match(result.stdout, /redone: create/);
});
