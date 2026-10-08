import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { parseCards } from '../history/parse.js';

const dataDir = new URL('./data/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', dataDir), 'utf8'));

test('geo: index.json odkazuje jen na existující soubory a známá témata', () => {
  const topicIds = new Set(index.topics.map((t) => t.id));
  for (const category of index.categories) {
    assert.ok(existsSync(new URL(category.file, dataDir)), `chybí soubor ${category.file}`);
    assert.ok(topicIds.has(category.topic), `neznámé téma ${category.topic}`);
  }
});

test('geo: každé CSV v data se naparsuje bez chyb a není prázdné', () => {
  const files = readdirSync(dataDir).filter((f) => f.endsWith('.csv'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const { items, errors } = parseCards(readFileSync(new URL(file, dataDir), 'utf8'));
    assert.deepEqual(errors, [], `${file}: chyby parsování`);
    assert.ok(items.length > 0, `${file}: žádné kartičky`);
  }
});
