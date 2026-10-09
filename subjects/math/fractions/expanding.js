import { makeItem, frac, text, randInt, levelOf } from './helpers.js';

/** Parametry úrovní 1–5: největší jmenovatel zadání a největší činitel rozšíření. */
const LEVELS = [
  { maxD: 12, maxFactor: 9 },
  { maxD: 15, maxFactor: 10 },
  { maxD: 20, maxFactor: 12 },
  { maxD: 25, maxFactor: 15 },
  { maxD: 30, maxFactor: 20 },
];

export default {
  id: 'expanding',
  title: 'Rozšiřování',
  task: 'Rozšiř zlomek číslem v závorce',
  answerType: 'fraction-exact',
  hint: {
    rule: 'Čitatele i jmenovatele vynásobíme stejným číslem – tím, které je v závorce.',
    example: [frac(3, 4), text('(· 4) ='), frac(12, 16)],
  },

  /** Zadání nemusí být v základním tvaru (5/10); odpověď se posuzuje přesně. */
  generate(rng, level = 1) {
    const { maxD, maxFactor } = levelOf(LEVELS, level);
    const d = randInt(rng, 2, maxD);
    const n = randInt(rng, 1, d - 1);
    const k = randInt(rng, 2, maxFactor);
    return makeItem(
      this.id,
      this.answerType,
      { n: n * k, d: d * k },
      [frac(n, d), text(`(· ${k}) =`)],
      [frac(n * k, d * k)],
      [`${n} · ${k} = ${n * k}, ${d} · ${k} = ${d * k}`],
    );
  },
};
