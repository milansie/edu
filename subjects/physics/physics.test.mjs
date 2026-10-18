import test from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../js/core/testutil.mjs';
import { equalsValue, formatDecimal } from '../../js/core/fraction.js';
import { evaluate } from '../math/check.js';
import { categories } from './density/index.js';
import { subject } from './subject.js';
import { materials } from './materials.js';
import { UNITS, convert, decimalPlaces, toBase, mul } from './units.js';

const ITERATIONS = 300;
const LEVELS = [1, 2, 3, 4, 5];
const MAX_CHARS = 7;
const category = (id) => categories.find((c) => c.id === id);

/** Zavolá `fn(item, level)` pro položky všech úrovní 1–5 kategorie `id`. */
function forEachItem(id, seed, fn) {
  for (const level of LEVELS) {
    const rng = seeded(seed + level * 1000);
    const cat = category(id);
    for (let i = 0; i < ITERATIONS; i++) fn(cat.generate(rng, level), level);
  }
}

const shown = (value) => formatDecimal(value);
const assertShown = (value, label) => {
  assert.ok(value.n > 0, `${label}: kladné číslo`);
  assert.ok(decimalPlaces(value) <= 1, `${label}: nejvýš 1 desetinné místo (${value.n}/${value.d})`);
  assert.ok(shown(value).length <= MAX_CHARS, `${label}: vejde se do políčka`);
  assert.ok(shown(value).split(',')[0].length <= 6, `${label}: celá část nejvýš 6 číslic`);
};

test('tabulka materiálů: jedinečné hustoty a id, hustoty s nejvýš 1 desetinným místem', () => {
  const densities = materials.map((m) => m.density.n / m.density.d);
  assert.equal(new Set(densities).size, materials.length);
  assert.equal(new Set(materials.map((m) => m.id)).size, materials.length);
  for (const m of materials) {
    assert.ok(decimalPlaces(m.density) <= 1, m.id);
    assert.ok(['solid', 'liquid'].includes(m.state));
  }
});

test('převody jednotek: základní vztahy', () => {
  assert.ok(equalsValue(convert({ n: 2, d: 1 }, 'l', 'cm³'), { n: 2000, d: 1 }));
  assert.ok(equalsValue(convert({ n: 1, d: 1 }, 'm³', 'l'), { n: 1000, d: 1 }));
  assert.ok(equalsValue(convert({ n: 1, d: 1 }, 'g/cm³', 'kg/m³'), { n: 1000, d: 1 }));
  assert.ok(equalsValue(convert({ n: 2500, d: 1 }, 'g', 'kg'), { n: 5, d: 2 }));
  assert.ok(equalsValue(convert({ n: 1, d: 1 }, 't', 'g'), { n: 1000000, d: 1 }));
  assert.throws(() => convert({ n: 1, d: 1 }, 'g', 'l'));
});

test('kategorie: typ odpovědi, postup a zápisy čísel', () => {
  for (const cat of categories) {
    forEachItem(cat.id, 10, (item) => {
      assert.equal(item.category, cat.id);
      assert.equal(item.answerType, cat.answerType);
      assert.ok(item.display.steps.length > 0);
      assert.ok(item.display.prompt.length > 0 && item.display.answer.length > 0);
      assert.ok(cat.hint.rule.length > 0 && cat.hint.example.length > 0);
    });
  }
});

test('převody jednotek: správná odpověď projde, zadání i výsledek mají nejvýš 1 desetinné místo', () => {
  forEachItem('units', 20, (item, level) => {
    const { value, from, to } = item.conversion;
    assertShown(value, item.id);
    if (level === 1) assert.equal(decimalPlaces(value), 0);
    assertShown(item.expected, item.id);
    assert.ok(equalsValue(item.expected, convert(value, from, to)));
    assert.equal(evaluate('decimal', item.expected, { v: formatDecimal(item.expected) }).status, 'correct');
  });
});

for (const [id, unknown] of [['density', 'rho'], ['mass', 'm'], ['volume', 'v']]) {
  test(`${id}: hodnoty mají nejvýš 1 desetinné místo a platí ρ · V = m`, () => {
    forEachItem(id, 30, (item, level) => {
      const { m, v, rho } = item.quantities;
      assert.equal(item.unknown, unknown);
      for (const [key, quantity] of Object.entries({ m, v, rho })) {
        assertShown(quantity.value, `${item.id} ${key}`);
        if (level === 1 && key !== unknown && key !== 'rho') assert.equal(decimalPlaces(quantity.value), 0, item.id);
      }
      const product = mul(toBase(rho.value, rho.unit), toBase(v.value, v.unit));
      assert.ok(equalsValue(product, toBase(m.value, m.unit)), item.id);
      assert.ok(equalsValue(item.expected, item.quantities[unknown].value), item.id);
      assert.equal(evaluate('decimal', item.expected, { v: formatDecimal(item.expected) }).status, 'correct');
      assert.equal(UNITS[rho.unit].quantity, 'density');
    });
  });
}

test('identify: kandidáti jsou jedineční, od sebe aspoň o 0,5 g/cm³, správný je mezi nimi', () => {
  forEachItem('identify', 40, (item) => {
    assert.equal(item.candidates.length, 4);
    assert.equal(new Set(item.candidates).size, 4);
    assert.ok(item.candidates.includes(item.material));
    const densities = item.candidates.map((id) => materials.find((m) => m.id === id).density);
    for (const a of densities) {
      for (const b of densities) {
        if (a !== b) assert.ok(2 * Math.abs(a.n * b.d - b.n * a.d) >= a.d * b.d, item.id);
      }
    }
    const { m, v } = item.quantities;
    assertShown(m.value, item.id);
    assertShown(v.value, item.id);
    const material = materials.find((x) => x.id === item.material);
    const rho = mul(toBase(m.value, m.unit), { n: v.value.d * UNITS[v.unit].factor.d, d: v.value.n * UNITS[v.unit].factor.n });
    assert.ok(equalsValue(rho, material.density), item.id);
    assert.equal(evaluate('text', item.expected, { v: material.name }).status, 'correct');
  });
});

test('odpověď typu text: bez diakritiky a velikosti písmen, jiný materiál ne', () => {
  const iron = materials.find((m) => m.id === 'iron');
  const names = [iron.name, ...iron.aliases];
  for (const typed of ['železo', 'Železo', 'zelezo', ' ZELEZO ']) {
    assert.equal(evaluate('text', names, { v: typed }).status, 'correct', typed);
  }
  for (const typed of ['zinek', '', 'železa']) assert.equal(evaluate('text', names, { v: typed }).status, 'wrong', typed);
  const spruce = materials.find((m) => m.id === 'spruce');
  assert.equal(evaluate('text', [spruce.name, ...spruce.aliases], { v: 'smrkove drevo' }).status, 'correct');
  assert.equal(evaluate('text', [spruce.name, ...spruce.aliases], { v: 'smrk' }).status, 'correct');
});

test('subject: generate a makeQuestion pro všechny kategorie a úrovně', async () => {
  const ids = (await subject.loadCategories()).map((c) => c.id);
  assert.deepEqual(ids, categories.map((c) => c.id));
  for (const level of LEVELS) {
    const items = subject.generate(ids, 20, { rng: seeded(level), level });
    assert.equal(items.length, 20);
    for (const item of items) {
      const question = subject.makeQuestion(item);
      assert.equal(question.answerType, item.answerType);
      assert.ok(question.prompt.length > 0 && question.task.length > 0);
    }
  }
  assert.ok(subject.hintFor('identify'));
  assert.equal(subject.hintFor('nope'), null);
});

test('úroveň 5 vyžaduje u hustoty, hmotnosti a objemu dva převody', () => {
  for (const id of ['density', 'mass', 'volume']) {
    const rng = seeded(50);
    for (let i = 0; i < ITERATIONS; i++) {
      const { m, v, rho } = category(id).generate(rng, 5).quantities;
      if (rho.value.n === 2 && rho.unit === 'g/cm³' && m.unit === 'g') continue;
      assert.notEqual(m.unit, UNITS[rho.unit].mass, id);
      assert.notEqual(v.unit, UNITS[rho.unit].volume, id);
    }
  }
});

test('slovní úlohy: jednotky odpovídají příběhu', () => {
  const rules = [
    ['kbelíku', ['dm³', 'l']],
    ['Jablko', ['cm³', 'ml']],
    ['odměřil', ['cm³', 'ml', 'l']],
    ['kámen', ['cm³', 'ml', 'dm³', 'l']],
  ];
  let checked = 0;
  for (const id of ['density', 'mass', 'volume']) {
    forEachItem(id, 60, (item) => {
      for (const [word, volumes] of rules) {
        if (!item.display.prompt[0].v.includes(word)) continue;
        checked++;
        assert.ok(volumes.includes(item.quantities.v.unit), item.id);
        assert.ok(['g', 'kg'].includes(item.quantities.m.unit), item.id);
      }
    });
  }
  assert.ok(checked > 100);
});
