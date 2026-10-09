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
  id: 'to-mixed',
  title: 'Na smíšené číslo',
  task: 'Převeď na smíšené číslo',
  answerType: 'mixed',
  hint: {
    rule: 'Čitatele vydělíme jmenovatelem: podíl je celá část, zbytek je čitatel zlomkové části.',
    example: [frac(17, 5), text('='), mixed(3, 2, 5)],
  },

  /** Zbytek je nesoudělný se jmenovatelem, takže zlomková část je vždy v základním tvaru. */
  generate(rng, level = 1) {
    const { maxD, maxWhole } = levelOf(LEVELS, level);
    const d = randInt(rng, 2, maxD);
    const w = randInt(rng, 1, maxWhole);
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
