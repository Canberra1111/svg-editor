import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve, relative } from 'node:path';
import ts from 'typescript';

test('source files keep one class per matching filename and obey layer dependency rules', () => {
  const root = resolve('src');
  const allowed: Record<string, readonly string[]> = {
    domain: ['domain'], application: ['application', 'domain'],
    cli: ['cli', 'application'], infrastructure: ['infrastructure', 'domain', 'application'],
  };
  for (const name of readdirSync(root, { recursive: true }) as string[]) {
    if (!name.endsWith('.ts')) continue;
    const path = resolve(root, name), layer = name.split('/')[0]!;
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const classes = source.statements.filter(ts.isClassDeclaration);
    assert.ok(classes.length <= 1, `${name}: more than one class`);
    if (classes.length) assert.equal(classes[0]!.name?.text, basename(name, '.ts'), name);
    assert.equal(source.statements.some(ts.isFunctionDeclaration), false, `${name}: free-standing production function`);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const dependency = statement.moduleSpecifier.text;
      if (dependency.startsWith('.')) {
        const destination = relative(root, resolve(dirname(path), dependency)).split('/')[0]!;
        if (allowed[layer]) assert.ok(allowed[layer]!.includes(destination), `${name} -> ${dependency}`);
        if (layer === 'infrastructure' && destination === 'application') {
          assert.equal(statement.importClause?.isTypeOnly, true, `${name}: infrastructure may only import application ports as types`);
        }
      } else if (layer === 'domain' || layer === 'application') {
        assert.fail(`${name}: forbidden external dependency ${dependency}`);
      }
    }
  }
});
