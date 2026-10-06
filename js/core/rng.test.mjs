import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle } from './rng.js';
import { seeded } from './testutil.mjs';

test('shuffle: zachová prvky a nemění vstup', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const out = shuffle(input, seeded(1));
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
});

test('shuffle: stejný seed dá stejné pořadí', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(shuffle(input, seeded(7)), shuffle(input, seeded(7)));
});
