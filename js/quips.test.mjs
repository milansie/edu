import test from 'node:test';
import assert from 'node:assert/strict';
import { pickResultQuip, resultQuips, RESULT_BANDS } from './quips.js';

test('pickResultQuip: pásmo podle poměru', () => {
  assert.ok(resultQuips.great.includes(pickResultQuip(1, () => 0)));
  assert.ok(resultQuips.great.includes(pickResultQuip(RESULT_BANDS.great, () => 0)));
  assert.ok(resultQuips.ok.includes(pickResultQuip(0.89, () => 0)));
  assert.ok(resultQuips.ok.includes(pickResultQuip(RESULT_BANDS.ok, () => 0)));
  assert.ok(resultQuips.low.includes(pickResultQuip(0.49, () => 0)));
  assert.ok(resultQuips.low.includes(pickResultQuip(0, () => 0)));
});

test('pickResultQuip: neplatný poměr spadne do slabého pásma', () => {
  assert.ok(resultQuips.low.includes(pickResultQuip(NaN, () => 0)));
});

test('pickResultQuip: random vybírá první a poslední hlášku', () => {
  assert.equal(pickResultQuip(1, () => 0), resultQuips.great[0]);
  assert.equal(pickResultQuip(1, () => 0.999), resultQuips.great.at(-1));
});
