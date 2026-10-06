import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './normalize.js';

test('normalize: malá písmena, trim a sloučení mezer', () => {
  assert.equal(normalize('  Get   A  Good\tGrade '), 'get a good grade');
});

test('normalize: null a undefined dají prázdný řetězec', () => {
  assert.equal(normalize(null), '');
  assert.equal(normalize(undefined), '');
});
