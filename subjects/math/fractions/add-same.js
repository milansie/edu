import { makeItem, frac, text, randInt, valueResult, levelOf } from './helpers.js';

/** Parametry úrovní 1–5: největší jmenovatel a podíl příkladů se třemi sčítanci. */
const LEVELS = [
  { maxD: 12, tripleShare: 0 },
  { maxD: 15, tripleShare: 0 },
  { maxD: 20, tripleShare: 0 },
  { maxD: 20, tripleShare: 0.3 },
  { maxD: 25, tripleShare: 0.5 },
];

export default {
  id: 'add-same',
  title: 'Sčítání – stejný jmenovatel',
  task: 'Sečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Sečteme čitatele, jmenovatel opíšeme. Výsledek zkrátíme.',
    example: [frac(2, 7), text('+'), frac(3, 7), text('='), frac(5, 7)],
  },

  /**
   * Sčítance jsou vlastní zlomky (dva, od úrovně 4 občas tři); součet může být nezkrácený, větší než 1 i celé číslo.
   */
  generate(rng, level = 1) {
    const { maxD, tripleShare } = levelOf(LEVELS, level);
    const d = randInt(rng, 3, maxD);
    const triple = tripleShare > 0 && rng() < tripleShare;
    const addends = Array.from({ length: triple ? 3 : 2 }, () => randInt(rng, 1, d - 1));
    const sum = addends.reduce((total, a) => total + a, 0);
    const { expected, answer, steps } = valueResult(sum, d);
    return makeItem(
      this.id,
      this.answerType,
      expected,
      [...addends.flatMap((a, i) => (i === 0 ? [frac(a, d)] : [text('+'), frac(a, d)])), text('=')],
      answer,
      [
        `${addends.map((a) => `${a}/${d}`).join(' + ')} = (${addends.join(' + ')})/${d} = ${sum}/${d}`,
        ...steps,
      ],
    );
  },
};
