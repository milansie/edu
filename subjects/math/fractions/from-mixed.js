import { makeItem, frac, mixed, text, randInt, coprimeBelow, levelOf } from './helpers.js';

/** Parametry úrovní 1–5: největší jmenovatel a největší celá část. */
const LEVELS = [
  { maxD: 12, maxWhole: 9 },
  { maxD: 12, maxWhole: 12 },
  { maxD: 15, maxWhole: 15 },
  { maxD: 20, maxWhole: 20 },
  { maxD: 25, maxWhole: 30 },
];

export default {
  id: 'from-mixed',
  title: 'Smíšené číslo na zlomek',
  task: 'Převeď na zlomek',
  answerType: 'fraction',
  hint: {
    rule: 'Celou část vynásobíme jmenovatelem a přičteme čitatele (5 · 5 + 1 = 26); jmenovatel se nemění.',
    example: [mixed(5, 1, 5), text('='), frac(26, 5)],
  },

  /** Čitatel zlomkové části je nesoudělný se jmenovatelem, výsledek je tedy vždy v základním tvaru. */
  generate(rng, level = 1) {
    const { maxD, maxWhole } = levelOf(LEVELS, level);
    const d = randInt(rng, 2, maxD);
    const w = randInt(rng, 1, maxWhole);
    const r = coprimeBelow(rng, d);
    const n = w * d + r;
    return makeItem(
      this.id,
      this.answerType,
      { n, d },
      [mixed(w, r, d), text('=')],
      [frac(n, d)],
      [`${w} · ${d} + ${r} = ${n}`, `Jmenovatel zůstává ${d}`],
    );
  },
};
