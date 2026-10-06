import test from 'node:test';
import assert from 'node:assert/strict';
import { pickDistractors } from './distractors.js';
import { seeded, item } from './testutil.mjs';

const big = item('a', ['big'], ['velký']);
const large = item('a', ['large'], ['velký']);
const small = item('a', ['small'], ['malý']);
const tiny = item('a', ['tiny'], ['drobný']);
const red = item('a', ['red'], ['červený']);
const dog = item('b', ['dog'], ['pes']);
const cat = item('b', ['cat'], ['kočka']);

const q = (it, direction = 'ab') => ({
  item: it,
  direction,
  prompt: direction === 'ab' ? it.a[0] : it.b[0],
  answers: direction === 'ab' ? [...it.b] : [...it.a],
});

test('distraktory: přednost má stejná kategorie', () => {
  const sameCategory = [big, small, tiny, red];
  const all = [...sameCategory, dog, cat];
  const out = pickDistractors(q(big), { sameCategory, selected: all, all }, 3, seeded(1));
  assert.equal(out.length, 3);
  for (const text of out) assert.ok(['malý', 'drobný', 'červený'].includes(text));
});

test('distraktory: synonymum (stejný překlad) se nenabídne, CZ→EN i EN→CZ', () => {
  const pool = [big, large, small, tiny, red, dog];
  for (const direction of ['ab', 'ba']) {
    const out = pickDistractors(q(big, direction), { sameCategory: pool, selected: pool, all: pool }, 5, seeded(2));
    assert.ok(!out.includes('velký') && !out.includes('large'), `směr ${direction}: ${out}`);
  }
});

test('distraktory: fallback na vybrané a celý předmět', () => {
  const sameCategory = [big, small];
  const selected = [big, small, dog];
  const all = [big, small, dog, cat, red];
  const out = pickDistractors(q(big), { sameCategory, selected, all }, 3, seeded(4));
  assert.equal(out.length, 3);
  assert.equal(out[0], 'malý');
  assert.equal(new Set(out).size, 3);
});

test('distraktory: když není dost kandidátů, vrátí méně; bez duplicit', () => {
  const dup = item('a', ['little'], ['malý']);
  const pool = [big, small, dup];
  const out = pickDistractors(q(big), { sameCategory: pool, selected: pool, all: pool }, 3, seeded(6));
  assert.deepEqual(out, [out[0]]);
  assert.equal(out[0], 'malý');
});
