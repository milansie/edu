import { fromMixed } from '../../../js/core/fraction.js';
import {
  makeItem,
  frac,
  mixed,
  text,
  randInt,
  coprimeBelow,
  multiplyResult,
  fracWithNumeratorFactor,
  levelOf,
} from './helpers.js';

/**
 * Parametry úrovní 1–5:
 * 1 = dva malé vlastní zlomky,
 * 2 = dva zlomky se zaručeným křížovým krácením po převrácení dělitele,
 * 3 = dělení zlomku celým číslem a celého čísla zlomkem,
 * 4 = smíšené číslo : zlomek a zlomek : smíšené číslo,
 * 5 = dvě smíšená čísla.
 */
const LEVELS = [
  { mode: 'basic', maxD: 9 },
  { mode: 'cross', maxD: 15, maxK: 5 },
  { mode: 'whole', maxD: 12, maxWhole: 12 },
  { mode: 'mixed', maxD: 8, maxWhole: 4 },
  { mode: 'two-mixed', maxD: 9, maxWhole: 4 },
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

/** Dvojice vlastních zlomků v základním tvaru, která se po převrácení dělitele zaručeně krátí křížem. */
function crossCancelDivPair(rng, maxD, maxK) {
  const k = randInt(rng, 2, maxK);
  if (rng() < 0.5) {
    const maxQ = Math.floor(maxD / k);
    const d1 = k * randInt(rng, 2, maxQ);
    const d2 = k * randInt(rng, 2, maxQ);
    return [{ n: coprimeBelow(rng, d1), d: d1 }, { n: coprimeBelow(rng, d2), d: d2 }];
  }
  return [fracWithNumeratorFactor(rng, k, maxD), fracWithNumeratorFactor(rng, k, maxD)];
}

function divideFractions(id, answerType, a, b, prompt, prefixSteps = []) {
  const flipped = { n: b.d, d: b.n };
  const { expected, answer, steps } = multiplyResult(a, flipped);
  const flipStep = `${a.n}/${a.d} : ${b.n}/${b.d} = ${a.n}/${a.d} · ${flipped.n}/${flipped.d}`;
  return makeItem(id, answerType, expected, prompt, answer, [...prefixSteps, flipStep, ...steps]);
}

export default {
  id: 'divide',
  title: 'Dělení zlomků',
  task: 'Vyděl zlomky',
  answerType: 'value',
  hint: {
    rule: 'Dělení zlomkem převedeme na násobení převráceným zlomkem. Celé číslo zapíšeme se jmenovatelem 1, smíšené číslo nejdřív převedeme na zlomek.',
    example: [frac(2, 3), text(':'), frac(4, 5), text('='), frac(5, 6)],
  },

  generate(rng, level = 1) {
    const params = levelOf(LEVELS, level);
    if (params.mode === 'basic') {
      const a = randomProper(rng, params.maxD);
      const b = randomProper(rng, params.maxD);
      return divideFractions(this.id, this.answerType, a, b, [frac(a.n, a.d), text(':'), frac(b.n, b.d), text('=')]);
    }
    if (params.mode === 'cross') {
      const [a, b] = crossCancelDivPair(rng, params.maxD, params.maxK);
      return divideFractions(this.id, this.answerType, a, b, [frac(a.n, a.d), text(':'), frac(b.n, b.d), text('=')]);
    }
    if (params.mode === 'whole') {
      const f = randomProper(rng, params.maxD);
      const w = randInt(rng, 2, params.maxWhole);
      if (rng() < 0.5) {
        const { expected, answer, steps } = multiplyResult(f, { n: 1, d: w });
        return makeItem(
          this.id,
          this.answerType,
          expected,
          [frac(f.n, f.d), text(':'), text(String(w)), text('=')],
          answer,
          [`${f.n}/${f.d} : ${w} = ${f.n}/${f.d} · 1/${w}`, ...steps],
        );
      }
      const { expected, answer, steps } = multiplyResult({ n: w, d: 1 }, { n: f.d, d: f.n });
      return makeItem(
        this.id,
        this.answerType,
        expected,
        [text(String(w)), text(':'), frac(f.n, f.d), text('=')],
        answer,
        [`${w} : ${f.n}/${f.d} = ${w}/1 · ${f.d}/${f.n}`, ...steps],
      );
    }
    if (params.mode === 'mixed') {
      const m = randomMixed(rng, params.maxWhole, params.maxD);
      const f = randomProper(rng, 9);
      const im = fromMixed(m);
      if (rng() < 0.5) {
        return divideFractions(
          this.id,
          this.answerType,
          im,
          f,
          [mixed(m.w, m.n, m.d), text(':'), frac(f.n, f.d), text('=')],
          [`${m.w} ${m.n}/${m.d} : ${f.n}/${f.d} = ${im.n}/${im.d} : ${f.n}/${f.d}`],
        );
      }
      return divideFractions(
        this.id,
        this.answerType,
        f,
        im,
        [frac(f.n, f.d), text(':'), mixed(m.w, m.n, m.d), text('=')],
        [`${f.n}/${f.d} : ${m.w} ${m.n}/${m.d} = ${f.n}/${f.d} : ${im.n}/${im.d}`],
      );
    }
    // Úroveň 5: dvě smíšená čísla.
    const m1 = randomMixed(rng, params.maxWhole, params.maxD);
    const m2 = randomMixed(rng, params.maxWhole, params.maxD);
    const im1 = fromMixed(m1);
    const im2 = fromMixed(m2);
    return divideFractions(
      this.id,
      this.answerType,
      im1,
      im2,
      [mixed(m1.w, m1.n, m1.d), text(':'), mixed(m2.w, m2.n, m2.d), text('=')],
      [`${m1.w} ${m1.n}/${m1.d} : ${m2.w} ${m2.n}/${m2.d} = ${im1.n}/${im1.d} : ${im2.n}/${im2.d}`],
    );
  },
};
