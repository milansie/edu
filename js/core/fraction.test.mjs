import test from 'node:test';
import assert from 'node:assert/strict';
import { gcd, lcm, reduce, equalsValue, compare, toMixed, fromMixed, parseDecimal, formatDecimal } from './fraction.js';

test('gcd a reduce', () => {
  assert.equal(gcd(12, 42), 6);
  assert.equal(gcd(7, 5), 1);
  assert.deepEqual(reduce({ n: 12, d: 42 }), { n: 2, d: 7 });
  assert.deepEqual(reduce({ n: 72, d: 8 }), { n: 9, d: 1 });
});

test('lcm', () => {
  assert.equal(lcm(4, 6), 12);
  assert.equal(lcm(3, 5), 15);
  assert.equal(lcm(6, 6), 6);
  assert.equal(lcm(2, 12), 12);
});

test('equalsValue a compare porovnávají hodnoty', () => {
  assert.ok(equalsValue({ n: 3, d: 4 }, { n: 12, d: 16 }));
  assert.ok(!equalsValue({ n: 3, d: 4 }, { n: 3, d: 5 }));
  assert.equal(compare({ n: 3, d: 7 }, { n: 5, d: 7 }), -1);
  assert.equal(compare({ n: 3, d: 5 }, { n: 3, d: 8 }), 1);
  assert.equal(compare({ n: 1, d: 2 }, { n: 2, d: 4 }), 0);
});

test('toMixed a fromMixed jsou navzájem inverzní', () => {
  assert.deepEqual(toMixed({ n: 17, d: 5 }), { w: 3, n: 2, d: 5 });
  assert.deepEqual(fromMixed({ w: 5, n: 1, d: 5 }), { n: 26, d: 5 });
  assert.deepEqual(toMixed(fromMixed({ w: 4, n: 3, d: 7 })), { w: 4, n: 3, d: 7 });
});

test('parseDecimal uznává čárku i tečku', () => {
  assert.deepEqual(parseDecimal('0,75'), { n: 75, d: 100 });
  assert.deepEqual(parseDecimal('0.75'), { n: 75, d: 100 });
  assert.deepEqual(parseDecimal(',5'), { n: 5, d: 10 });
  assert.deepEqual(parseDecimal('3'), { n: 3, d: 1 });
  assert.ok(equalsValue(parseDecimal('0,60'), parseDecimal('0,6')));
});

test('parseDecimal odmítne neplatný zápis', () => {
  for (const bad of ['', ',', 'a', '1,2,3', '-1', '1234567', '0,1234567']) assert.equal(parseDecimal(bad), null, bad);
});

test('formatDecimal vrací nejkratší zápis s čárkou', () => {
  assert.equal(formatDecimal({ n: 3, d: 4 }), '0,75');
  assert.equal(formatDecimal({ n: 11, d: 8 }), '1,375');
  assert.equal(formatDecimal({ n: 39, d: 100 }), '0,39');
  assert.equal(formatDecimal({ n: 6, d: 10 }), '0,6');
  assert.equal(formatDecimal({ n: 4, d: 2 }), '2');
  assert.equal(formatDecimal({ n: 1, d: 100 }), '0,01');
  assert.throws(() => formatDecimal({ n: 1, d: 3 }));
});
