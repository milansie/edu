import test from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../../js/core/testutil.mjs';
import { gcd, lcm, equalsValue, formatDecimal } from '../../../js/core/fraction.js';
import { evaluate } from '../check.js';
import { categories } from './index.js';
import { subject } from '../subject.js';
import { levelOf } from './helpers.js';

const ITERATIONS = 1000;
const LEVELS = [1, 2, 3, 4, 5];
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
    case 'value':
      return expected.d === 1 ? { w: '', n: String(expected.n), d: '' } : { w: '', n: String(expected.n), d: String(expected.d) };
    case 'relation':
    case 'order':
      return expected;
    case 'integer':
      return { v: String(expected) };
    case 'decimal':
      return { v: formatDecimal(expected) };
    default:
      throw new Error(item.answerType);
  }
}

function forEachItem(id, seed, fn, level = 1) {
  const rng = seeded(seed);
  const cat = category(id);
  for (let i = 0; i < ITERATIONS; i++) fn(cat.generate(rng, level), level);
}

/** Zavolá `fn(item, level)` pro položky všech úrovní 1–5. */
function forEachLevel(id, seed, fn) {
  for (const level of LEVELS) forEachItem(id, seed + level * 1000, fn, level);
}

/** Prvních 5 položek `[id, expected]` pro seed 777 vygenerovaných kódem před zavedením úrovní (úroveň 1 se nesmí změnit). */
const LEVEL_ONE_SNAPSHOT = {
  "shortening": [
    ["shortening:2/4 =",{"n":1,"d":2}],
    ["shortening:7/42 =",{"n":1,"d":6}],
    ["shortening:56/80 =",{"n":7,"d":10}],
    ["shortening:54/9 =",{"n":6,"d":1}],
    ["shortening:9/63 =",{"n":1,"d":7}],
  ],
  "to-mixed": [
    ["to-mixed:11/9 =",{"w":1,"n":2,"d":9}],
    ["to-mixed:19/3 =",{"w":6,"n":1,"d":3}],
    ["to-mixed:31/4 =",{"w":7,"n":3,"d":4}],
    ["to-mixed:79/10 =",{"w":7,"n":9,"d":10}],
    ["to-mixed:23/3 =",{"w":7,"n":2,"d":3}],
  ],
  "from-mixed": [
    ["from-mixed:1 2/9 =",{"n":11,"d":9}],
    ["from-mixed:6 1/3 =",{"n":19,"d":3}],
    ["from-mixed:7 3/4 =",{"n":31,"d":4}],
    ["from-mixed:7 9/10 =",{"n":79,"d":10}],
    ["from-mixed:7 2/3 =",{"n":23,"d":3}],
  ],
  "expanding": [
    ["expanding:1/9 (· 3) =",{"n":3,"d":27}],
    ["expanding:2/3 (· 5) =",{"n":10,"d":15}],
    ["expanding:3/4 (· 6) =",{"n":18,"d":24}],
    ["expanding:7/10 (· 8) =",{"n":56,"d":80}],
    ["expanding:2/3 (· 6) =",{"n":12,"d":18}],
  ],
  "comparing": [
    ["comparing:1/4 ? 1/3","<"],
    ["comparing:4/8 ? 4/14",">"],
    ["comparing:7/14 ? 7/15",">"],
    ["comparing:7/13 ? 12/13","<"],
    ["comparing:1/15 ? 1/12","<"],
  ],
  "of-whole": [
    ["of-whole:1/8 z 56 =",7],
    ["of-whole:2/3 z 33 =",22],
    ["of-whole:3/4 z 68 =",51],
    ["of-whole:5/8 z 176 =",110],
    ["of-whole:2/3 z 45 =",30],
  ],
  "to-decimal": [
    ["to-decimal:30/25 =",{"n":30,"d":25}],
    ["to-decimal:2/4 =",{"n":2,"d":4}],
    ["to-decimal:3/5 =",{"n":3,"d":5}],
    ["to-decimal:21/25 =",{"n":21,"d":25}],
    ["to-decimal:2/4 =",{"n":2,"d":4}],
  ],
  "ordering": [
    ["ordering:1/2 2/3 1/6 1/3",[2,3,0,1]],
    ["ordering:1/18 11/18 2/3 5/9",[0,3,1,2]],
    ["ordering:17/18 2/9 1/3 1/2",[1,2,3,0]],
    ["ordering:5/6 1/3 2/3 1/2",[1,3,2,0]],
    ["ordering:4/16 4/9 4/13 4/10",[0,2,3,1]],
  ],
  "add-same": [
    ["add-same:1/9 + 2/9 =",{"n":1,"d":3}],
    ["add-same:2/4 + 2/4 =",{"n":1,"d":1}],
    ["add-same:3/5 + 3/5 =",{"n":6,"d":5}],
    ["add-same:7/10 + 8/10 =",{"n":3,"d":2}],
    ["add-same:3/4 + 2/4 =",{"n":5,"d":4}],
  ],
  "add-diff": [
    ["add-diff:1/8 + 1/3 =",{"n":11,"d":24}],
    ["add-diff:1/2 + 4/11 =",{"n":19,"d":22}],
    ["add-diff:2/3 + 7/10 =",{"n":41,"d":30}],
    ["add-diff:7/9 + 3/4 =",{"n":55,"d":36}],
    ["add-diff:1/2 + 7/12 =",{"n":13,"d":12}],
  ],
};

test('všechny kategorie: správná odpověď projde, postup je neprázdný, typ odpovídá kategorii', () => {
  categories.forEach((cat, index) => {
    forEachLevel(cat.id, 100 + index, (item) => {
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

/** Součet dvou zlomků z promptu `[a, '+', b, '=']` jako nezkrácený zlomek. */
function promptSum(item) {
  const [a, , b] = item.display.prompt;
  return { a, b, sum: { n: a.n * b.d + b.n * a.d, d: a.d * b.d } };
}

test('add-same: stejný jmenovatel, vlastní sčítance, součet v základním tvaru, oba zápisy projdou', () => {
  let improper = 0;
  let whole = 0;
  forEachItem('add-same', 40, (item) => {
    const { a, b, sum } = promptSum(item);
    assert.equal(a.d, b.d);
    assert.ok(a.d >= 3 && a.d <= 12);
    assert.ok(a.n >= 1 && a.n < a.d && b.n >= 1 && b.n < b.d);
    assert.ok(equalsValue(sum, item.expected));
    assert.equal(gcd(item.expected.n, item.expected.d), 1);
    assert.ok(item.display.steps.length > 0);
    const e = item.expected;
    if (e.d === 1) {
      whole++;
      assert.equal(evaluate('value', e, { w: String(e.n), n: '', d: '' }).status, 'correct');
      assert.equal(evaluate('value', e, { w: '', n: String(e.n), d: '' }).status, 'correct');
    } else {
      assert.equal(evaluate('value', e, { w: '', n: String(e.n), d: String(e.d) }).status, 'correct');
      if (e.n > e.d) {
        improper++;
        const w = Math.floor(e.n / e.d);
        assert.equal(evaluate('value', e, { w: String(w), n: String(e.n % e.d), d: String(e.d) }).status, 'correct');
      }
    }
  });
  assert.ok(improper > 0 && whole > 0);
});

test('add-diff: různé jmenovatele, lcm <= 36, vlastní sčítance v základním tvaru, oba zápisy projdou', () => {
  let improper = 0;
  forEachItem('add-diff', 41, (item) => {
    const { a, b, sum } = promptSum(item);
    assert.notEqual(a.d, b.d);
    assert.ok(a.d >= 2 && a.d <= 12 && b.d >= 2 && b.d <= 12);
    assert.ok(lcm(a.d, b.d) <= 36);
    assert.ok(a.n >= 1 && a.n < a.d && gcd(a.n, a.d) === 1);
    assert.ok(b.n >= 1 && b.n < b.d && gcd(b.n, b.d) === 1);
    assert.ok(equalsValue(sum, item.expected));
    assert.equal(gcd(item.expected.n, item.expected.d), 1);
    assert.ok(item.display.steps.length > 0);
    const e = item.expected;
    assert.ok(e.d > 1);
    assert.equal(evaluate('value', e, { w: '', n: String(e.n), d: String(e.d) }).status, 'correct');
    if (e.n > e.d) {
      improper++;
      const w = Math.floor(e.n / e.d);
      assert.equal(evaluate('value', e, { w: String(w), n: String(e.n % e.d), d: String(e.d) }).status, 'correct');
    }
  });
  assert.ok(improper > 0);
});

test('subject.generate: počet, rozložení kategorií a prázdný výběr', () => {
  const rng = seeded(8);
  const ids = ['shortening', 'comparing'];
  const items = subject.generate(ids, 20, { rng });
  assert.equal(items.length, 20);
  assert.equal(items.filter((i) => i.category === 'shortening').length, 10);
  assert.equal(subject.generate([], 10, { rng }).length, 0);
  assert.equal(subject.generate(ids, 0, { rng }).length, 10);
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

test('ordering: 4 různé vlastní zlomky, expected řadí vzestupně, vyskytují se všechny varianty', () => {
  const variants = new Set();
  forEachItem('ordering', 31, (item) => {
    const fr = item.display.prompt;
    assert.equal(fr.length, 4);
    assert.ok(fr.every((f) => f.t === 'frac' && f.n >= 1 && f.n < f.d));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(!equalsValue(fr[i], fr[j]));
    assert.deepEqual([...item.expected].sort(), [0, 1, 2, 3]);
    for (let i = 0; i < 3; i++) {
      const a = fr[item.expected[i]];
      const b = fr[item.expected[i + 1]];
      assert.ok(a.n * b.d < b.n * a.d);
    }
    const sameD = fr.every((f) => f.d === fr[0].d);
    const sameN = fr.every((f) => f.n === fr[0].n);
    variants.add(sameD ? 'd' : sameN ? 'n' : 'mix');
  });
  assert.equal(variants.size, 3);
});

test('úroveň 1: generate(rng) i generate(rng, 1) dávají přesně výstup před zavedením úrovní', () => {
  for (const cat of categories) {
    for (const call of [(rng) => cat.generate(rng), (rng) => cat.generate(rng, 1)]) {
      const rng = seeded(777);
      const actual = Array.from({ length: 5 }, () => {
        const item = call(rng);
        return [item.id, item.expected];
      });
      assert.deepEqual(actual, LEVEL_ONE_SNAPSHOT[cat.id], cat.id);
    }
  }
});

test('neplatná úroveň: ořez do 1–5, nečíselná hodnota = úroveň 1', () => {
  const table = [1, 2, 3, 4, 5];
  assert.equal(levelOf(table, 0), 1);
  assert.equal(levelOf(table, -3), 1);
  assert.equal(levelOf(table, 9), 5);
  assert.equal(levelOf(table, 3), 3);
  assert.equal(levelOf(table, 2.7), 2);
  assert.equal(levelOf(table, undefined), 1);
  assert.equal(levelOf(table, 'abc'), 1);
  assert.equal(levelOf(table, NaN), 1);
  const ids = (level) => {
    const rng = seeded(5);
    return categories.flatMap((cat) => Array.from({ length: 50 }, () => cat.generate(rng, level).id));
  };
  assert.deepEqual(ids(undefined), ids(1));
  assert.deepEqual(ids('abc'), ids(1));
  assert.deepEqual(ids(0), ids(1));
  assert.deepEqual(ids(9), ids(5));
});

test('krácení, smíšená čísla, rozšiřování: rozsahy podle úrovně', () => {
  const maxD = { shortening: [12, 15, 20, 25, 30], 'to-mixed': [12, 12, 15, 20, 25], 'from-mixed': [12, 12, 15, 20, 25], expanding: [12, 15, 20, 25, 30] };
  const maxWhole = [9, 12, 15, 20, 30];
  const maxFactor = { shortening: [9, 9, 12, 15, 20], expanding: [9, 10, 12, 15, 20] };
  forEachLevel('shortening', 200, (item, level) => {
    const { n, d } = item.display.prompt[0];
    const g = gcd(n, d);
    const base = item.expected.d === 1 ? n / g : item.expected.d;
    assert.ok(item.expected.d === 1 ? g <= maxD.shortening[level - 1] && n / g <= maxFactor.shortening[level - 1] : base <= maxD.shortening[level - 1] && g <= maxFactor.shortening[level - 1]);
    assert.ok(gcd(n, d) > 1);
  });
  forEachLevel('to-mixed', 210, (item, level) => {
    const { w, d } = item.expected;
    assert.ok(d <= maxD['to-mixed'][level - 1] && w <= maxWhole[level - 1]);
  });
  forEachLevel('from-mixed', 220, (item, level) => {
    const { w, d } = item.display.prompt[0];
    assert.ok(d <= maxD['from-mixed'][level - 1] && w <= maxWhole[level - 1]);
  });
  forEachLevel('expanding', 230, (item, level) => {
    const { n, d } = item.display.prompt[0];
    const k = item.expected.d / d;
    assert.ok(d <= maxD.expanding[level - 1] && k >= 2 && k <= maxFactor.expanding[level - 1] && n < d);
  });
});

test('porovnávání: od úrovně 3 různí jmenovatele, na úrovni 5 těsné dvojice, hodnoty vždy různé', () => {
  const maxD = [16, 20, 20, 20, 25];
  forEachLevel('comparing', 240, (item, level) => {
    const [a, , b] = item.display.prompt;
    assert.ok(!equalsValue(a, b));
    assert.equal(item.expected, a.n * b.d < b.n * a.d ? '<' : '>');
    assert.ok(a.d <= maxD[level - 1] && b.d <= maxD[level - 1]);
    if (level < 3) assert.ok(a.d === b.d || a.n === b.n);
  });
  for (const level of LEVELS) {
    let different = 0;
    let tight = 0;
    forEachItem('comparing', 250, (item) => {
      const [a, , b] = item.display.prompt;
      if (a.d !== b.d && a.n !== b.n) {
        different++;
        if (a.d >= 4 && b.d >= 4 && Math.abs(a.n * b.d - b.n * a.d) === 1 && Math.abs(a.d - b.d) === 1) tight++;
        if (level === 3) assert.ok(a.d <= 12 && b.d <= 12);
      }
    }, level);
    assert.equal(different > 0, level >= 3, `různí jmenovatelé na úrovni ${level}`);
    assert.ok(level === 5 ? tight / ITERATIONS > 0.2 : tight / ITERATIONS < 0.05, `těsné dvojice na úrovni ${level}: ${tight}`);
  }
});

test('řazení: úrovně 4–5 mají čtyři různé jmenovatele, úroveň 5 blízké hodnoty, úroveň 3 smíšené varianty', () => {
  const maxCommon = [24, 24, 24, 36, 60];
  forEachLevel('ordering', 260, (item, level) => {
    const fr = item.display.prompt;
    assert.equal(fr.length, 4);
    assert.ok(fr.every((f) => f.n >= 1 && f.n < f.d));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(!equalsValue(fr[i], fr[j]));
    const sameD = fr.every((f) => f.d === fr[0].d);
    const sameN = fr.every((f) => f.n === fr[0].n);
    if (level >= 4) {
      assert.equal(new Set(fr.map((f) => f.d)).size, 4);
      assert.ok(fr.every((f) => gcd(f.n, f.d) === 1));
      assert.ok(fr.map((f) => f.d).reduce(lcm) <= maxCommon[level - 1]);
    } else if (level < 3) {
      assert.ok(sameD || sameN || fr.map((f) => f.d).reduce(lcm) <= 24);
    }
    if (level === 5) {
      const values = fr.map((f) => f.n / f.d);
      assert.ok(Math.max(...values) - Math.min(...values) <= 0.3);
    }
  });
  for (const level of [1, 2, 3]) {
    let mixed = 0;
    forEachItem('ordering', 270, (item) => {
      const fr = item.display.prompt;
      if (!fr.every((f) => f.d === fr[0].d) && !fr.every((f) => f.n === fr[0].n)) mixed++;
    }, level);
    const share = mixed / ITERATIONS;
    assert.ok(level === 3 ? share > 0.4 && share < 0.6 : share > 0.25 && share < 0.42, `podíl smíšených na úrovni ${level}: ${share}`);
  }
});

test('část z celku: rozsahy podle úrovně, nepravé zlomky od úrovně 4', () => {
  const maxD = [10, 10, 12, 12, 15];
  const maxMultiple = [25, 40, 60, 80, 100];
  for (const level of LEVELS) {
    let improper = 0;
    forEachItem('of-whole', 280, (item) => {
      const { n, d } = item.display.prompt[0];
      const whole = Number(/z (\d+) =/.exec(item.display.prompt[1].v)[1]);
      assert.ok(d <= maxD[level - 1] && whole % d === 0 && whole / d >= 3 && whole / d <= maxMultiple[level - 1]);
      assert.equal(item.expected, (whole / d) * n);
      if (n > d) improper++;
    }, level);
    assert.equal(improper > 0, level >= 4, `nepravé zlomky na úrovni ${level}`);
  }
});

test('na desetinné: podíl nepravých roste, těžší jmenovatele od úrovně 4, nejvýš 4 desetinná místa', () => {
  const share = [0.25, 0.35, 0.5, 0.5, 0.6];
  for (const level of LEVELS) {
    let improper = 0;
    const denominators = new Set();
    forEachItem('to-decimal', 290, (item) => {
      const { n, d } = item.expected;
      denominators.add(d);
      assert.notEqual(n % d, 0);
      assert.ok((formatDecimal(item.expected).split(',')[1] ?? '').length <= 4);
      if (n > d) improper++;
    }, level);
    assert.ok(Math.abs(improper / ITERATIONS - share[level - 1]) < 0.06, `podíl nepravých na úrovni ${level}`);
    assert.equal([16, 40, 125, 200].every((d) => denominators.has(d)), level >= 4);
    assert.equal([16, 40, 125, 200].some((d) => denominators.has(d)), level >= 4);
  }
});

test('add-same: jmenovatel podle úrovně, tři sčítance od úrovně 4', () => {
  const maxD = [12, 15, 20, 20, 25];
  const share = [0, 0, 0, 0.3, 0.5];
  for (const level of LEVELS) {
    let triples = 0;
    forEachItem('add-same', 300, (item) => {
      const addends = item.display.prompt.filter((p) => p.t === 'frac');
      assert.ok(addends.length === 2 || addends.length === 3);
      assert.ok(addends.every((a) => a.d === addends[0].d && a.n >= 1 && a.n < a.d));
      assert.ok(addends[0].d >= 3 && addends[0].d <= maxD[level - 1]);
      assert.ok(equalsValue({ n: addends.reduce((t, a) => t + a.n, 0), d: addends[0].d }, item.expected));
      assert.equal(item.display.prompt.at(-1).v, '=');
      if (addends.length === 3) triples++;
    }, level);
    assert.ok(Math.abs(triples / ITERATIONS - share[level - 1]) < 0.06, `podíl tří sčítanců na úrovni ${level}`);
  }
});

test('add-diff: jmenovatele a společný jmenovatel podle úrovně, úroveň 5 preferuje nesoudělné', () => {
  const maxD = [12, 15, 20, 24, 30];
  const maxCommon = [36, 48, 60, 90, 120];
  for (const level of LEVELS) {
    let coprime = 0;
    forEachItem('add-diff', 310, (item) => {
      const { a, b } = promptSum(item);
      assert.notEqual(a.d, b.d);
      assert.ok(a.d <= maxD[level - 1] && b.d <= maxD[level - 1]);
      assert.ok(lcm(a.d, b.d) <= maxCommon[level - 1]);
      if (gcd(a.d, b.d) === 1) coprime++;
    }, level);
    if (level === 5) assert.ok(coprime / ITERATIONS > 0.7);
  }
});

test('subject.generate: úroveň se předá kategoriím, deklaruje 5 úrovní', () => {
  assert.equal(subject.levels, 5);
  assert.equal(subject.defaultLevel, 1);
  const ids = ['add-same'];
  const triple = (level) =>
    subject.generate(ids, 200, { rng: seeded(11), level }).filter((i) => i.display.prompt.filter((p) => p.t === 'frac').length === 3).length;
  assert.equal(triple(1), 0);
  assert.ok(triple(5) > 0);
  const defaults = subject.generate(['shortening'], 10, { rng: seeded(12) }).map((i) => i.id);
  assert.deepEqual(defaults, subject.generate(['shortening'], 10, { rng: seeded(12), level: 1 }).map((i) => i.id));
});
