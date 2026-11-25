import { fromMixed } from '../../../js/core/fraction.js';
import {
  makeItem,
  frac,
  mixed,
  text,
  randInt,
  coprimeBelow,
  valueResult,
  multiplyResult,
  fracWithNumeratorFactor,
  levelOf,
} from './helpers.js';

/**
 * Parametry úrovní 1–5:
 * 1 = dva malé vlastní zlomky,
 * 2 = dva zlomky se zaručeným křížovým krácením,
 * 3 = zlomek · celé číslo (v obou pořadích) nebo dva větší zlomky s křížovým krácením,
 * 4 = smíšené číslo · zlomek (v obou pořadích) nebo tři menší zlomky,
 * 5 = dvě smíšená čísla nebo tři zlomky s křížovým krácením.
 */
const LEVELS = [
  { mode: 'basic', maxD: 9 },
  { mode: 'cross', maxD: 15, maxK: 5 },
  { mode: 'whole-or-cross', maxD: 20, maxK: 6, maxWhole: 12 },
  { mode: 'mixed-or-triple', maxD: 8, maxWhole: 4, tripleMaxD: 7 },
  { mode: 'two-mixed-or-triple-cross', maxD: 9, maxWhole: 4, tripleCrossMaxD: 12, tripleCrossMaxK: 4 },
];

function randomProper(rng, maxD) {
  const d = randInt(rng, 2, maxD);
  return { n: coprimeBelow(rng, d), d };
}

function randomMixed(rng, maxWhole, maxD) {
  const w = randInt(rng, 1, maxWhole);
  const d = randInt(rng, 2, maxD);
  return { w, n: coprimeBelow(rng, d), d };
}

/** Dvojice vlastních zlomků v základním tvaru se zaručeným křížovým krácením. */
function crossCancelPair(rng, maxD, maxK) {
  const k = randInt(rng, 2, maxK);
  const a = fracWithNumeratorFactor(rng, k, maxD);
  const d2 = k * randInt(rng, 2, Math.floor(maxD / k));
  const b = { n: coprimeBelow(rng, d2), d: d2 };
  return rng() < 0.5 ? [a, b] : [b, a];
}

function makePair(id, answerType, a, b) {
  const { expected, answer, steps } = multiplyResult(a, b);
  return makeItem(id, answerType, expected, [frac(a.n, a.d), text('·'), frac(b.n, b.d), text('=')], answer, steps);
}

function makeTriple(id, answerType, list) {
  const num = list[0].n * list[1].n * list[2].n;
  const den = list[0].d * list[1].d * list[2].d;
  const { expected, answer, steps } = valueResult(num, den);
  return makeItem(
    id,
    answerType,
    expected,
    [frac(list[0].n, list[0].d), text('·'), frac(list[1].n, list[1].d), text('·'), frac(list[2].n, list[2].d), text('=')],
    answer,
    [
      `(${list[0].n} · ${list[1].n} · ${list[2].n})/(${list[0].d} · ${list[1].d} · ${list[2].d}) = ${num}/${den}`,
      ...steps,
    ],
  );
}

export default {
  id: 'multiply',
  title: 'Násobení zlomků',
  task: 'Vynásob zlomky',
  answerType: 'value',
  hint: {
    rule: 'Vynásobíme čitatele s čitatelem a jmenovatele se jmenovatelem. Před násobením můžeme krátit křížem; smíšená čísla nejdřív převedeme na zlomky.',
    example: [frac(2, 3), text('·'), frac(3, 5), text('='), frac(2, 5)],
  },

  generate(rng, level = 1) {
    const params = levelOf(LEVELS, level);
    if (params.mode === 'basic') {
      return makePair(this.id, this.answerType, randomProper(rng, params.maxD), randomProper(rng, params.maxD));
    }
    if (params.mode === 'cross') {
      const [a, b] = crossCancelPair(rng, params.maxD, params.maxK);
      return makePair(this.id, this.answerType, a, b);
    }
    if (params.mode === 'whole-or-cross') {
      if (rng() < 0.5) {
        const f = randomProper(rng, 15);
        const w = randInt(rng, 2, params.maxWhole);
        const fracFirst = rng() < 0.5;
        const whole = { n: w, d: 1 };
        const [a, b] = fracFirst ? [f, whole] : [whole, f];
        const { expected, answer, steps } = multiplyResult(a, b);
        const prompt = fracFirst
          ? [frac(f.n, f.d), text('·'), text(String(w)), text('=')]
          : [text(String(w)), text('·'), frac(f.n, f.d), text('=')];
        const intro = fracFirst
          ? `${f.n}/${f.d} · ${w} = ${f.n}/${f.d} · ${w}/1`
          : `${w} · ${f.n}/${f.d} = ${w}/1 · ${f.n}/${f.d}`;
        return makeItem(this.id, this.answerType, expected, prompt, answer, [intro, ...steps]);
      }
      const [a, b] = crossCancelPair(rng, params.maxD, params.maxK);
      return makePair(this.id, this.answerType, a, b);
    }
    if (params.mode === 'mixed-or-triple') {
      if (rng() < 0.5) {
        const m = randomMixed(rng, params.maxWhole, params.maxD);
        const f = randomProper(rng, 9);
        const im = fromMixed(m);
        const mixedFirst = rng() < 0.5;
        const [a, b] = mixedFirst ? [im, f] : [f, im];
        const { expected, answer, steps } = multiplyResult(a, b);
        const prompt = mixedFirst
          ? [mixed(m.w, m.n, m.d), text('·'), frac(f.n, f.d), text('=')]
          : [frac(f.n, f.d), text('·'), mixed(m.w, m.n, m.d), text('=')];
        const intro = mixedFirst
          ? `${m.w} ${m.n}/${m.d} · ${f.n}/${f.d} = ${im.n}/${im.d} · ${f.n}/${f.d}`
          : `${f.n}/${f.d} · ${m.w} ${m.n}/${m.d} = ${f.n}/${f.d} · ${im.n}/${im.d}`;
        return makeItem(this.id, this.answerType, expected, prompt, answer, [intro, ...steps]);
      }
      return makeTriple(this.id, this.answerType, [
        randomProper(rng, params.tripleMaxD),
        randomProper(rng, params.tripleMaxD),
        randomProper(rng, params.tripleMaxD),
      ]);
    }
    // Úroveň 5: dvě smíšená čísla nebo tři zlomky s křížovým krácením.
    if (rng() < 0.5) {
      const m1 = randomMixed(rng, params.maxWhole, params.maxD);
      const m2 = randomMixed(rng, params.maxWhole, params.maxD);
      const im1 = fromMixed(m1);
      const im2 = fromMixed(m2);
      const { expected, answer, steps } = multiplyResult(im1, im2);
      return makeItem(
        this.id,
        this.answerType,
        expected,
        [mixed(m1.w, m1.n, m1.d), text('·'), mixed(m2.w, m2.n, m2.d), text('=')],
        answer,
        [`${m1.w} ${m1.n}/${m1.d} · ${m2.w} ${m2.n}/${m2.d} = ${im1.n}/${im1.d} · ${im2.n}/${im2.d}`, ...steps],
      );
    }
    const [a, b] = crossCancelPair(rng, params.tripleCrossMaxD, params.tripleCrossMaxK);
    const list = [a, b];
    list.splice(randInt(rng, 0, 2), 0, randomProper(rng, 9));
    return makeTriple(this.id, this.answerType, list);
  },
};
