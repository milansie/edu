import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, isComplete } from './check.js';

const frac = (n, d) => ({ n: String(n), d: String(d) });
const status = (...args) => evaluate(...args).status;

test('reduced: hodnota musí sedět a zlomek být v základním tvaru', () => {
  const expected = { n: 2, d: 7 };
  assert.equal(status('reduced', expected, frac(2, 7)), 'correct');
  assert.equal(status('reduced', expected, frac(3, 7)), 'wrong');
  assert.deepEqual(evaluate('reduced', expected, frac(4, 14)), { status: 'wrong', message: 'Správně, ale ještě zkrať' });
});

test('reduced: celé číslo se zapisuje bez jmenovatele', () => {
  const expected = { n: 9, d: 1 };
  assert.equal(status('reduced', expected, { n: '9', d: '' }), 'correct');
  assert.deepEqual(evaluate('reduced', expected, frac(9, 1)), { status: 'wrong', message: 'Zapiš jako celé číslo' });
  assert.deepEqual(evaluate('reduced', expected, frac(18, 2)), { status: 'wrong', message: 'Zapiš jako celé číslo' });
  assert.equal(status('reduced', expected, { n: '8', d: '' }), 'wrong');
});

test('reduced: nulový jmenovatel a prázdný čitatel', () => {
  assert.equal(evaluate('reduced', { n: 1, d: 2 }, frac(1, 0)).message, 'Jmenovatel nesmí být nula');
  assert.equal(status('reduced', { n: 1, d: 2 }, { n: '', d: '2' }), 'wrong');
});

test('mixed: celá část + vlastní zlomek v základním tvaru', () => {
  const expected = { w: 3, n: 2, d: 5 };
  assert.equal(status('mixed', expected, { w: '3', n: '2', d: '5' }), 'correct');
  assert.equal(status('mixed', expected, { w: '3', n: '3', d: '5' }), 'wrong');
  assert.equal(evaluate('mixed', expected, { w: '2', n: '7', d: '5' }).message, 'Zlomková část musí být menší než 1');
  assert.equal(evaluate('mixed', { w: 1, n: 1, d: 2 }, { w: '1', n: '2', d: '4' }).message, 'Správně, ale ještě zkrať');
});

test('fraction-exact: přesně čitatel i jmenovatel', () => {
  const expected = { n: 12, d: 16 };
  assert.equal(status('fraction-exact', expected, frac(12, 16)), 'correct');
  assert.equal(status('fraction-exact', expected, frac(3, 4)), 'wrong');
  assert.ok(evaluate('fraction-exact', expected, frac(3, 4)).message);
  assert.equal(status('fraction-exact', expected, frac(12, 15)), 'wrong');
});

test('fraction: hodnota a základní tvar', () => {
  const expected = { n: 26, d: 5 };
  assert.equal(status('fraction', expected, frac(26, 5)), 'correct');
  assert.equal(status('fraction', expected, frac(25, 5)), 'wrong');
  assert.equal(evaluate('fraction', { n: 26, d: 5 }, frac(52, 10)).message, 'Správně, ale ještě zkrať');
});

test('relation, integer, decimal', () => {
  assert.equal(status('relation', '<', '<'), 'correct');
  assert.equal(status('relation', '<', '>'), 'wrong');
  assert.equal(status('integer', 72, { v: '72' }), 'correct');
  assert.equal(status('integer', 72, { v: '27' }), 'wrong');
  assert.equal(status('decimal', { n: 3, d: 5 }, { v: '0,6' }), 'correct');
  assert.equal(status('decimal', { n: 3, d: 5 }, { v: '0.60' }), 'correct');
  assert.equal(status('decimal', { n: 3, d: 5 }, { v: '0,7' }), 'wrong');
  assert.equal(status('decimal', { n: 3, d: 5 }, { v: ',' }), 'wrong');
});

test('value: nepravý zlomek i smíšené číslo, zkrácené', () => {
  const expected = { n: 9, d: 7 };
  const input = (w, n, d) => ({ w: String(w), n: String(n), d: String(d) });
  assert.equal(status('value', expected, input('', 9, 7)), 'correct');
  assert.equal(status('value', expected, input(1, 2, 7)), 'correct');
  assert.equal(status('value', expected, input('', 10, 7)), 'wrong');
  assert.equal(status('value', expected, input(1, 3, 7)), 'wrong');
  assert.equal(evaluate('value', expected, input('', 18, 14)).message, 'Správně, ale ještě zkrať');
  assert.equal(evaluate('value', expected, input(1, 4, 14)).message, 'Správně, ale ještě zkrať');
  assert.equal(evaluate('value', expected, input(0, 9, 7)).message, 'Zlomková část musí být menší než 1');
  assert.equal(evaluate('value', expected, input(0, 9, 0)).message, 'Jmenovatel nesmí být nula');
  assert.equal(status('value', expected, { w: '1', n: '', d: '' }), 'wrong');
});

test('value: zlomek menší než 1 a zlomková část musí být vlastní', () => {
  const expected = { n: 5, d: 12 };
  assert.equal(status('value', expected, { w: '', n: '5', d: '12' }), 'correct');
  assert.equal(status('value', expected, { w: '0', n: '5', d: '12' }), 'correct');
  assert.equal(status('value', expected, { w: '', n: '5', d: '' }), 'wrong');
  assert.equal(evaluate('value', { n: 1, d: 2 }, { w: '0', n: '3', d: '6' }).message, 'Správně, ale ještě zkrať');
  assert.equal(evaluate('value', { n: 3, d: 2 }, { w: '0', n: '3', d: '2' }).message, 'Zlomková část musí být menší než 1');
});

test('value: celý výsledek jen jako celé číslo', () => {
  const expected = { n: 2, d: 1 };
  assert.equal(status('value', expected, { w: '2', n: '', d: '' }), 'correct');
  assert.equal(status('value', expected, { w: '', n: '2', d: '' }), 'correct');
  assert.equal(evaluate('value', expected, { w: '', n: '2', d: '1' }).message, 'Zapiš jako celé číslo');
  assert.equal(evaluate('value', expected, { w: '', n: '2', d: '2' }).status, 'wrong');
  assert.equal(evaluate('value', expected, { w: '', n: '4', d: '2' }).message, 'Zapiš jako celé číslo');
  assert.equal(evaluate('value', expected, { w: '1', n: '2', d: '2' }).message, 'Zapiš jako celé číslo');
  assert.equal(status('value', expected, { w: '3', n: '', d: '' }), 'wrong');
  assert.equal(status('value', { n: 0, d: 1 }, { w: '0', n: '', d: '' }), 'correct');
});

test('isComplete: value', () => {
  assert.ok(isComplete('value', { w: '1', n: '', d: '' }));
  assert.ok(isComplete('value', { w: '', n: '5', d: '' }));
  assert.ok(isComplete('value', { w: '', n: '5', d: '7' }));
  assert.ok(isComplete('value', { w: '1', n: '5', d: '7' }));
  assert.ok(!isComplete('value', { w: '', n: '', d: '' }));
  assert.ok(!isComplete('value', { w: '1', n: '5', d: '' }));
  assert.ok(!isComplete('value', { w: '', n: '', d: '7' }));
  assert.ok(!isComplete('value', { w: '1', n: '', d: '7' }));
});

test('isComplete: povinná políčka', () => {
  assert.ok(!isComplete('mixed', { w: '1', n: '', d: '2' }));
  assert.ok(isComplete('mixed', { w: '1', n: '1', d: '2' }));
  assert.ok(isComplete('reduced', { n: '5', d: '' }));
  assert.ok(!isComplete('reduced', { n: '', d: '2' }));
  assert.ok(isComplete('relation', '>'));
  assert.ok(!isComplete('relation', ''));
  assert.ok(!isComplete('decimal', { v: '' }));
});
