import { makeItem, frac, text, randInt } from './helpers.js';

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
  generate(rng) {
    const d = randInt(rng, 2, 12);
    const n = randInt(rng, 1, d - 1);
    const k = randInt(rng, 2, 9);
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
