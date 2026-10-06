import test from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../../js/core/testutil.mjs';
import { gcd, equalsValue, formatDecimal } from '../../../js/core/fraction.js';
import { evaluate } from '../check.js';
import { categories } from './index.js';
import { subject } from '../subject.js';

const ITERATIONS = 1000;
const category = (id) => categories.find((c) => c.id === id);

/** Vstup, který odpovídá správné odpovědi dané položky. */
function correctInput(item) {
  const { expected } = item;
  switch (item.answerType) {
    case 'reduced':
      return expected.d === 1 ? { n: String(expected.n), d: '' } : { n: String(expected.n), d: String(expected.d) };
    case 'mixed':
      return { w: String(expected.w), n: String(expected.n), d: String(expected.d) };
    case 'fraction-exact':
    case 'fraction':
      return { n: String(expected.n), d: String(expected.d) };
    case 'relation':
      return expected;
    case 'integer':
      return { v: String(expected) };
    case 'decimal':
      return { v: formatDecimal(expected) };
    default:
      throw new Error(item.answerType);
  }
}

function forEachItem(id, seed, fn) {
  const rng = seeded(seed);
  const cat = category(id);
  for (let i = 0; i < ITERATIONS; i++) fn(cat.generate(rng));
}

test('všechny kategorie: správná odpověď projde, postup je neprázdný, typ odpovídá kategorii', () => {
  categories.forEach((cat, index) => {
    forEachItem(cat.id, 100 + index, (item) => {
      assert.equal(item.category, cat.id);
      assert.equal(item.answerType, cat.answerType);
      assert.equal(evaluate(item.answerType, item.expected, correctInput(item)).status, 'correct', item.id);
      assert.ok(item.display.steps.length > 0);
      assert.ok(item.display.prompt.length > 0 && item.display.answer.length > 0);
    });
  });
});

test('kategorie mají nápovědu s pravidlem a vzorem', () => {
  for (const cat of categories) {
    assert.ok(cat.hint.rule.length > 0);
    assert.ok(cat.hint.example.length > 0);
  }
});

test('krácení: zadání je vždy krátitelné, výsledek v základním tvaru, občas celé číslo', () => {
  let integers = 0;
  forEachItem('shortening', 1, (item) => {
    const { n, d } = item.display.prompt[0];
    assert.ok(gcd(n, d) > 1);
    assert.deepEqual(item.expected, { n: n / gcd(n, d), d: d / gcd(n, d) });
    if (item.expected.d === 1) integers++;
  });
  assert.ok(integers > 0 && integers < ITERATIONS / 2);
});

test('na smíšené a zpět: zbytek nesoudělný se jmenovatelem, celá část 1–9', () => {
  forEachItem('to-mixed', 2, (item) => {
    const { w, n, d } = item.expected;
    assert.ok(w >= 1 && w <= 9 && n >= 1 && n < d && gcd(n, d) === 1);
    const prompt = item.display.prompt[0];
    assert.equal(prompt.n, w * d + n);
  });
  forEachItem('from-mixed', 3, (item) => {
    const { w, n, d } = item.display.prompt[0];
    assert.equal(gcd(n, d), 1);
    assert.deepEqual(item.expected, { n: w * d + n, d });
  });
});

test('rozšiřování: výsledek je přesně násobek zadání', () => {
  forEachItem('expanding', 4, (item) => {
    const { n, d } = item.display.prompt[0];
    const k = Number(/\(· (\d+)\)/.exec(item.display.prompt[1].v)[1]);
    assert.ok(k >= 2 && k <= 9 && n < d);
    assert.deepEqual(item.expected, { n: n * k, d: d * k });
  });
});

test('porovnávání: hodnoty jsou vždy různé a stejný jmenovatel nebo čitatel', () => {
  const kinds = new Set();
  forEachItem('comparing', 5, (item) => {
    const [a, , b] = item.display.prompt;
    assert.ok(!equalsValue(a, b));
    assert.ok(a.d === b.d || a.n === b.n);
    kinds.add(a.d === b.d ? 'den' : 'num');
    assert.equal(item.expected, a.n * b.d < b.n * a.d ? '<' : '>');
  });
  assert.equal(kinds.size, 2);
});

test('část z celku: výsledek je celé číslo', () => {
  forEachItem('of-whole', 6, (item) => {
    const { n, d } = item.display.prompt[0];
    const whole = Number(/z (\d+) =/.exec(item.display.prompt[1].v)[1]);
    assert.equal(whole % d, 0);
    assert.equal(item.expected, (whole / d) * n);
  });
});

test('na desetinné: konečný rozvoj do 3 míst, občas větší než 1, nikdy celé číslo', () => {
  let improper = 0;
  forEachItem('to-decimal', 7, (item) => {
    const { n, d } = item.expected;
    assert.ok([2, 4, 5, 8, 10, 20, 25, 50, 100].includes(d));
    assert.notEqual(n % d, 0);
    const text = formatDecimal(item.expected);
    assert.ok((text.split(',')[1] ?? '').length <= 3);
    if (n > d) improper++;
  });
  assert.ok(improper > 0);
});

test('subject.generate: počet, rozložení kategorií a prázdný výběr', () => {
  const rng = seeded(8);
  const ids = ['shortening', 'comparing'];
  const items = subject.generate(ids, 20, rng);
  assert.equal(items.length, 20);
  assert.equal(items.filter((i) => i.category === 'shortening').length, 10);
  assert.equal(subject.generate([], 10, rng).length, 0);
  assert.equal(subject.generate(ids, 0, rng).length, 10);
});

test('subject.makeQuestion: prostý text a display', () => {
  const item = category('shortening').generate(seeded(9));
  const q = subject.makeQuestion(item);
  assert.equal(q.item, item);
  assert.equal(typeof q.prompt, 'string');
  assert.equal(q.answers.length, 1);
  assert.equal(q.display, item.display);
  assert.equal(q.answerType, 'reduced');
  assert.equal(subject.hintFor('shortening'), category('shortening').hint);
  assert.equal(subject.hintFor('nope'), null);
});
