import { makeItem, frac, mixed, text, randInt, coprimeBelow } from './helpers.js';

export default {
  id: 'to-mixed',
  title: 'Na smíšené číslo',
  task: 'Převeď na smíšené číslo',
  answerType: 'mixed',
  hint: {
    rule: 'Čitatele vydělíme jmenovatelem: podíl je celá část, zbytek je čitatel zlomkové části.',
    example: [frac(17, 5), text('='), mixed(3, 2, 5)],
  },

  /** Zbytek je nesoudělný se jmenovatelem, takže zlomková část je vždy v základním tvaru. */
  generate(rng) {
    const d = randInt(rng, 2, 12);
    const w = randInt(rng, 1, 9);
    const r = coprimeBelow(rng, d);
    const n = w * d + r;
    return makeItem(
      this.id,
      this.answerType,
      { w, n: r, d },
      [frac(n, d), text('=')],
      [mixed(w, r, d)],
      [`${n} : ${d} = ${w}, zbytek ${r}`, `Celá část ${w}, zlomek ${r}/${d}`],
    );
  },
};
