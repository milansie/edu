import { lcm } from '../../../js/core/fraction.js';
import { makeItem, frac, text, pick, coprimeBelow, valueResult, levelOf, denominatorPairs } from './helpers.js';

/**
 * Parametry úrovní 1–5: největší jmenovatel zlomku, největší společný jmenovatel a podíl příkladů,
 * které mají nesoudělné jmenovatele (u ostatních jsou jmenovatele soudělní i nesoudělní).
 */
const LEVELS = [
  { maxD: 12, maxCommon: 36, coprimeShare: 0 },
  { maxD: 15, maxCommon: 48, coprimeShare: 0 },
  { maxD: 20, maxCommon: 60, coprimeShare: 0 },
  { maxD: 24, maxCommon: 90, coprimeShare: 0 },
  { maxD: 30, maxCommon: 120, coprimeShare: 0.7 },
];

export default {
  id: 'sub-diff',
  title: 'Odčítání – různý jmenovatel',
  task: 'Odečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Převedeme na společný jmenovatel, pak odečteme čitatele a výsledek zkrátíme.',
    example: [frac(5, 6), text('−'), frac(1, 4), text('='), frac(7, 12)],
  },

  /**
   * Menšenec i menšitel jsou vlastní zlomky v základním tvaru s různými jmenovateli (soudělnými
   * i nesoudělnými); menšenec je vždy větší, rozdíl je tedy kladný.
   */
  generate(rng, level = 1) {
    const { maxD, maxCommon, coprimeShare } = levelOf(LEVELS, level);
    const coprime = coprimeShare > 0 && rng() < coprimeShare;
    const [d1, d2] = pick(rng, denominatorPairs(maxD, maxCommon, coprime));
    const common = lcm(d1, d2);
    const a = coprimeBelow(rng, d1);
    const b = coprimeBelow(rng, d2);
    let x = (a * common) / d1;
    let y = (b * common) / d2;
    // zlomky v základním tvaru s různými jmenovateli se nikdy nerovnají, x !== y
    const swap = x < y;
    const [n1, den1, n2, den2] = swap ? [b, d2, a, d1] : [a, d1, b, d2];
    if (swap) [x, y] = [y, x];
    const { expected, answer, steps } = valueResult(x - y, common);
    return makeItem(
      this.id,
      this.answerType,
      expected,
      [frac(n1, den1), text('−'), frac(n2, den2), text('=')],
      answer,
      [
        `Společný jmenovatel ${common}`,
        `${n1}/${den1} = ${x}/${common}, ${n2}/${den2} = ${y}/${common}`,
        `${x}/${common} − ${y}/${common} = ${x - y}/${common}`,
        ...steps,
      ],
    );
  },
};
