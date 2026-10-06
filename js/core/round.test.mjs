import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, starsFor } from './round.js';
import { seeded, item } from './testutil.mjs';

const items = [
  item('x', ['cat'], ['kočka']),
  item('x', ['dog'], ['pes']),
  item('x', ['fish'], ['ryba']),
  item('x', ['bird'], ['pták']),
];

test('createRound: limit omezí počet položek', () => {
  const round = createRound(items, { limit: 2, rng: seeded(3) });
  assert.equal(round.summary().total, 2);
  assert.equal(round.progress().total, 2);
});

test('createRound: směr ab / ba určuje prompt a odpovědi', () => {
  const ab = createRound([items[0]], { directions: ['ab'] }).current();
  assert.equal(ab.prompt, 'cat');
  assert.deepEqual(ab.answers, ['kočka']);
  const ba = createRound([items[0]], { directions: ['ba'] }).current();
  assert.equal(ba.prompt, 'kočka');
  assert.deepEqual(ba.answers, ['cat']);
});

test('createRound: u obou směrů se použijí oba', () => {
  const round = createRound(items, { directions: ['ab', 'ba'], rng: seeded(11) });
  const seen = new Set();
  while (!round.isDone()) {
    seen.add(round.current().direction);
    round.answer(true);
  }
  assert.deepEqual([...seen].sort(), ['ab', 'ba']);
});

test('round: chyba se jednou vrátí na konec a skóre počítá první pokus', () => {
  const round = createRound(items.slice(0, 2), { rng: seeded(5) });
  const first = round.current().item;
  round.answer(false);
  assert.equal(round.progress().total, 3);
  round.answer(true);
  assert.equal(round.isDone(), false);
  assert.equal(round.current().item, first);
  round.answer(false);
  assert.equal(round.isDone(), true);
  const summary = round.summary();
  assert.equal(summary.total, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.wrong.length, 1);
  assert.equal(summary.wrong[0].item, first);
});

test('round: answer po dokončení vyhodí chybu', () => {
  const round = createRound([items[0]]);
  round.answer(true);
  assert.throws(() => round.answer(true));
});

test('starsFor: hranice 60 % a 90 %', () => {
  assert.equal(starsFor(9, 10), 3);
  assert.equal(starsFor(8, 10), 2);
  assert.equal(starsFor(6, 10), 2);
  assert.equal(starsFor(5, 10), 1);
  assert.equal(starsFor(0, 0), 1);
});
