import { makeItem, frac, mixed, text, randInt, coprimeBelow } from './helpers.js';

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
  generate(rng) {
    const d = randInt(rng, 2, 12);
    const w = randInt(rng, 1, 9);
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
