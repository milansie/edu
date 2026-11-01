import test from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../../js/core/testutil.mjs';
import { equalsValue, formatDecimal, compare } from '../../../js/core/fraction.js';
import { evaluate } from '../../math/check.js';
import { categories } from './index.js';
import { relativeGap } from './amounts.js';
import { UNITS, convert, decimalPlaces, toBase, mul, fmtApprox } from '../units.js';

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

const assertShown = (value, label) => {
  assert.ok(value.n > 0, `${label}: kladné číslo`);
  assert.ok(decimalPlaces(value) <= 1, `${label}: nejvýš 1 desetinné místo (${value.n}/${value.d})`);
  assert.ok(formatDecimal(value).length <= MAX_CHARS, `${label}: vejde se do políčka`);
  assert.ok(formatDecimal(value).split(',')[0].length <= 6, `${label}: celá část nejvýš 6 číslic`);
};

/** Čísla s jednotkou ze zadání, např. „72 km/h“ → `{ value, unit }` (hodnota jako zlomek). */
function parseShown(shown) {
  const [number, unit] = shown.split(' ');
  const [whole, fraction = ''] = number.split(',');
  return { value: { n: Number(whole + fraction), d: 10 ** fraction.length }, unit };
}

test('jednotky: délka, čas a rychlost se převádějí přesně', () => {
  assert.ok(equalsValue(convert({ n: 36, d: 1 }, 'km/h', 'm/s'), { n: 10, d: 1 }));
  assert.ok(equalsValue(convert({ n: 1, d: 1 }, 'm/s', 'km/h'), { n: 18, d: 5 }));
  assert.ok(equalsValue(convert({ n: 1, d: 1 }, 'm/s', 'm/min'), { n: 60, d: 1 }));
  assert.ok(equalsValue(convert({ n: 90, d: 1 }, 'min', 'h'), { n: 3, d: 2 }));
  assert.ok(equalsValue(convert({ n: 3200, d: 1 }, 'm', 'km'), { n: 16, d: 5 }));
  assert.throws(() => convert({ n: 1, d: 1 }, 'm', 's'));
});

test('kategorie: id s předponou speed-, typ odpovědi, postup a nápověda', () => {
  const answerTypes = { 'speed-compare': 'relation', 'speed-order': 'order', 'speed-segments': 'integer' };
  for (const cat of categories) {
    assert.ok(cat.id.startsWith('speed-'));
    forEachItem(cat.id, 10, (item) => {
      assert.equal(item.category, cat.id);
      assert.equal(item.answerType, cat.answerType);
      assert.equal(item.answerType, answerTypes[cat.id] ?? 'decimal');
      assert.ok(item.display.steps.length > 0);
      assert.ok(item.display.prompt.length > 0 && item.display.answer.length > 0);
      assert.ok(cat.hint.rule.length > 0 && cat.hint.example.length > 0);
    });
  }
});

test('speed-units: správná odpověď projde, zadání i výsledek mají nejvýš 1 desetinné místo', () => {
  forEachItem('speed-units', 20, (item, level) => {
    const { value, from, to } = item.conversion;
    assertShown(value, item.id);
    if (level < 3) assert.equal(decimalPlaces(value), 0);
    if (level < 5) assert.ok(!from.includes('min') && !to.includes('min'));
    assertShown(item.expected, item.id);
    assert.ok(equalsValue(item.expected, convert(value, from, to)));
    assert.equal(evaluate('decimal', item.expected, { v: formatDecimal(item.expected) }).status, 'correct');
  });
});

for (const [id, unknown] of [['speed-v', 'v'], ['speed-s', 's'], ['speed-t', 't']]) {
  test(`${id}: hodnoty mají nejvýš 1 desetinné místo a platí s = v · t`, () => {
    forEachItem(id, 30, (item, level) => {
      const { s, t, v } = item.quantities;
      assert.equal(item.unknown, unknown);
      for (const [key, quantity] of Object.entries({ s, t, v })) {
        assertShown(quantity.value, `${item.id} ${key}`);
        if (level < 3 && key !== unknown) assert.equal(decimalPlaces(quantity.value), 0, item.id);
      }
      assert.equal(UNITS[v.unit].quantity, 'speed');
      assert.equal(UNITS[s.unit].quantity, 'length');
      assert.equal(UNITS[t.unit].quantity, 'time');
      assert.ok(equalsValue(mul(toBase(v.value, v.unit), toBase(t.value, t.unit)), toBase(s.value, s.unit)), item.id);
      assert.ok(equalsValue(item.expected, item.quantities[unknown].value), item.id);
      assert.equal(evaluate('decimal', item.expected, { v: formatDecimal(item.expected) }).status, 'correct');
      assert.ok(item.display.prompt[0].v.includes(`zapiš v ${item.quantities[unknown].unit}`), item.id);
    });
  });
}

test('speed-compare: dvě různé rychlosti v různých jednotkách, správné znaménko', () => {
  forEachItem('speed-compare', 40, (item) => {
    const [left, mark, right] = item.display.prompt.map((p) => p.v);
    assert.equal(mark, '?');
    const a = parseShown(left);
    const b = parseShown(right);
    assertShown(a.value, item.id);
    assertShown(b.value, item.id);
    assert.notEqual(a.unit, b.unit);
    const order = compare(toBase(a.value, a.unit), toBase(b.value, b.unit));
    assert.notEqual(order, 0, `${item.id}: rovnost`);
    assert.equal(item.expected, order < 0 ? '<' : '>');
    assert.ok(['<', '>'].includes(item.expected));
    assert.equal(evaluate('relation', item.expected, item.expected).status, 'correct');
  });
});

test('speed-order: 4 různé rychlosti, správné pořadí indexů', () => {
  forEachItem('speed-order', 50, (item) => {
    const values = item.display.prompt.map((p) => {
      const { value, unit } = parseShown(p.v);
      assertShown(value, item.id);
      return toBase(value, unit);
    });
    assert.equal(values.length, 4);
    assert.equal(item.expected.length, 4);
    assert.equal(new Set(item.expected).size, 4);
    for (let i = 0; i < 3; i++) assert.equal(compare(values[item.expected[i]], values[item.expected[i + 1]]), -1, item.id);
    assert.equal(evaluate('order', item.expected, [...item.expected]).status, 'correct');
  });
});

test('speed-timetable: časy odpovídají vzdálenosti a rychlosti', () => {
  forEachItem('speed-timetable', 60, (item) => {
    const { depart, arrive, distance, speed } = item.timetable;
    assert.ok(arrive > depart && arrive < 1440);
    assertShown(distance, item.id);
    assertShown(speed, item.id);
    assert.ok(equalsValue(mul(speed, { n: arrive - depart, d: 60 }), distance), item.id);
    assert.ok(equalsValue(item.expected, speed));
    const prompt = item.display.prompt[0].v;
    const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    assert.ok(prompt.includes(`v ${clock(depart)} `) && prompt.includes(`v ${clock(arrive)} `), prompt);
    assert.equal(evaluate('decimal', item.expected, { v: formatDecimal(item.expected) }).status, 'correct');
  });
});

test('speed-segments: tři úseky, jednoznačná odpověď 1–3 z přesných rychlostí', () => {
  const minutesSeen = new Set();
  forEachItem('speed-segments', 70, (item) => {
    assert.equal(item.segments.length, 3);
    const speeds = item.segments.map((s) => s.speed);
    speeds.forEach((s, i) => {
      assert.ok(equalsValue(s, mul(item.segments[i].km, { n: 3600, d: item.segments[i].seconds })), item.id);
      if (item.segments[i].timeUnit === 'min') minutesSeen.add(item.segments[i].seconds / 60);
    });
    const value = (s) => s.n / s.d;
    const target = item.ask === 'slowest' ? Math.min(...speeds.map(value)) : Math.max(...speeds.map(value));
    const gaps = speeds.filter((s) => value(s) !== target).map((s) => relativeGap(s, speeds[item.expected - 1]));
    assert.equal(gaps.length, 2, item.id);
    assert.ok(gaps.every((g) => g >= 0.08), `${item.id}: odstup z přesných hodnot`);
    assert.ok([1, 2, 3].includes(item.expected));
    assert.equal(value(speeds[item.expected - 1]), target);
    assert.ok(item.display.prompt[0].v.includes(item.ask === 'slowest' ? 'nejpomaleji' : 'nejrychleji'));
    assert.equal(evaluate('integer', item.expected, { v: String(item.expected) }).status, 'correct');
    const steps = item.display.steps.join(' ');
    const rounded = speeds.map((s) => Math.round((s.n * 10) / s.d) / 10);
    speeds.forEach((s, i) => {
      const text = formatDecimal({ n: Math.round(rounded[i] * 10), d: 10 });
      assert.ok(steps.includes(`${decimalPlaces(s) <= 1 ? '=' : '≈'} ${text} km/h`), `${item.id}: ${text}`);
    });
    const targetRounded = rounded[item.expected - 1];
    assert.ok(rounded.every((r, i) => i === item.expected - 1 || r !== targetRounded), `${item.id}: zaokrouhlená rychlost hledaného úseku je jedinečná`);
    const meters = item.segments.filter((s) => s.distanceUnit === 'm').map((s) => mul(s.km, { n: 1000, d: 1 }).n);
    assert.ok(meters.every((m) => m <= 9999), `${item.id}: dráha v m má nejvýš 4 číslice`);
    assert.ok(item.segments.every((s) => s.distanceUnit !== 'm' || (s.timeUnit !== 'h' && s.timeUnit !== 'hmin')), `${item.id}: dráha v m s časem v h`);
    assert.ok(!steps.includes('/(') && !/\(\d+\/\d+\)/.test(steps), `${item.id}: zlomek v postupu`);
  });
  assert.ok([...minutesSeen].some((m) => m % 3 !== 0), 'časy v minutách nejsou jen násobky 3');
  assert.ok([...minutesSeen].some((m) => m % 6 !== 0));
});

test('fmtApprox: přesná hodnota „=“, zaokrouhlená „≈“ na desetiny', () => {
  assert.equal(fmtApprox({ n: 60, d: 1 }), '= 60');
  assert.equal(fmtApprox({ n: 213, d: 10 }), '= 21,3');
  assert.equal(fmtApprox({ n: 3, d: 2 }), '= 1,5');
  assert.equal(fmtApprox({ n: 161, d: 3 }), '≈ 53,7');
  assert.equal(fmtApprox({ n: 1, d: 3 }), '≈ 0,3');
  assert.equal(fmtApprox({ n: 1003, d: 100 }), '≈ 10');
  assert.equal(fmtApprox({ n: 1005, d: 100 }), '≈ 10,1');
  assert.equal(fmtApprox({ n: 1004, d: 100 }), '≈ 10');
});

test('speed-segments: postup bez zlomků a s převodem na minuty / sekundy', () => {
  const seen = new Set();
  forEachItem('speed-segments', 70, (item) => {
    const steps = item.display.steps.slice(0, 3).join(' ');
    assert.ok(!steps.includes('/ (') && !steps.includes('/('), item.id);
    item.segments.forEach((s, i) => {
      const step = item.display.steps[i];
      seen.add(s.timeUnit);
      if (s.timeUnit === 'h') assert.ok(!step.includes(' min') && !step.includes(' : '), step);
      if (s.timeUnit === 'min') assert.ok(step.includes('· 60 /'), step);
      if (s.timeUnit === 's') assert.ok(step.includes('· 3600 /'), step);
      if (s.timeUnit === 'hmin') assert.match(step, /\d+ h \d+ min = \d+ min/);
    });
  });
  assert.ok(seen.has('min') && seen.has('h'));
});
