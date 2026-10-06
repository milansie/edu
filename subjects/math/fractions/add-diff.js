import { lcm } from '../../../js/core/fraction.js';
import { makeItem, frac, text, pick, coprimeBelow, valueResult } from './helpers.js';

const MIN_DENOMINATOR = 2;
const MAX_DENOMINATOR = 12;
const MAX_COMMON = 36;

/** Uspořádané dvojice různých jmenovatelů, jejichž společný jmenovatel nepřesahuje 36. */
const DENOMINATOR_PAIRS = [];
for (let a = MIN_DENOMINATOR; a <= MAX_DENOMINATOR; a++) {
  for (let b = MIN_DENOMINATOR; b <= MAX_DENOMINATOR; b++) {
    if (a !== b && lcm(a, b) <= MAX_COMMON) DENOMINATOR_PAIRS.push([a, b]);
  }
}

export default {
  id: 'add-diff',
  title: 'Sčítání – různý jmenovatel',
  task: 'Sečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Převedeme na společný jmenovatel, pak sečteme čitatele a výsledek zkrátíme.',
    example: [frac(1, 4), text('+'), frac(1, 6), text('='), frac(5, 12)],
  },

  /** Sčítance jsou vlastní zlomky v základním tvaru s různými jmenovateli (soudělnými i nesoudělnými). */
  generate(rng) {
    const [d1, d2] = pick(rng, DENOMINATOR_PAIRS);
    const a = coprimeBelow(rng, d1);
    const b = coprimeBelow(rng, d2);
    const common = lcm(d1, d2);
    const x = (a * common) / d1;
    const y = (b * common) / d2;
    const { expected, answer, steps } = valueResult(x + y, common);
    return makeItem(
      this.id,
      this.answerType,
      expected,
      [frac(a, d1), text('+'), frac(b, d2), text('=')],
      answer,
      [
        `Společný jmenovatel ${common}`,
        `${a}/${d1} = ${x}/${common}, ${b}/${d2} = ${y}/${common}`,
        `${x}/${common} + ${y}/${common} = ${x + y}/${common}`,
        ...steps,
      ],
    );
  },
};
