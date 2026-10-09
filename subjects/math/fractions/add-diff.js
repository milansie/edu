import { lcm } from '../../../js/core/fraction.js';
import { makeItem, frac, text, pick, coprimeBelow, valueResult, levelOf, denominatorPairs } from './helpers.js';

/**
 * Parametry úrovní 1–5: největší jmenovatel sčítance, největší společný jmenovatel a podíl příkladů,
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
  id: 'add-diff',
  title: 'Sčítání – různý jmenovatel',
  task: 'Sečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Převedeme na společný jmenovatel, pak sečteme čitatele a výsledek zkrátíme.',
    example: [frac(1, 4), text('+'), frac(1, 6), text('='), frac(5, 12)],
  },

  /** Sčítance jsou vlastní zlomky v základním tvaru s různými jmenovateli (soudělnými i nesoudělnými). */
  generate(rng, level = 1) {
    const { maxD, maxCommon, coprimeShare } = levelOf(LEVELS, level);
    const coprime = coprimeShare > 0 && rng() < coprimeShare;
    const [d1, d2] = pick(rng, denominatorPairs(maxD, maxCommon, coprime));
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
