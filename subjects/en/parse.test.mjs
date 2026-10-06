import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVocab } from './parse.js';

test('parseVocab: základní řádek, trim, více překladů i tvarů', () => {
  const { items, errors } = parseVocab('  3D printing = 3D tisk | 3D tiskárna \nTV | television=televize\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(items, [
    { a: ['3D printing'], b: ['3D tisk', '3D tiskárna'] },
    { a: ['TV', 'television'], b: ['televize'] },
  ]);
});

test('parseVocab: komentáře a prázdné řádky se ignorují, CRLF funguje', () => {
  const { items, errors } = parseVocab('# nadpis\r\n\r\ncat = kočka\r\n   \r\n');
  assert.equal(items.length, 1);
  assert.deepEqual(errors, []);
});

test('parseVocab: dělí na prvním "="', () => {
  const { items } = parseVocab('1 + 1 = 2 = dvě');
  assert.deepEqual(items, [{ a: ['1 + 1'], b: ['2 = dvě'] }]);
});

test('parseVocab: neplatné řádky skončí v errors s číslem řádku a nespadne', () => {
  const { items, errors } = parseVocab('bez rovnítka\ncat = kočka\n= nic\ndog = | ');
  assert.equal(items.length, 1);
  assert.deepEqual(errors.map((e) => e.line), [1, 3, 4]);
});

test('parseVocab: prázdný vstup', () => {
  assert.deepEqual(parseVocab(''), { items: [], errors: [] });
});
