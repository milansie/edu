import { makeItem, frac, text, randInt, valueResult, levelOf } from './helpers.js';

/** Parametry úrovní 1–5: největší jmenovatel a podíl příkladů se dvěma odečítanými zlomky. */
const LEVELS = [
  { maxD: 12, tripleShare: 0 },
  { maxD: 15, tripleShare: 0 },
  { maxD: 20, tripleShare: 0 },
  { maxD: 20, tripleShare: 0.3 },
  { maxD: 25, tripleShare: 0.5 },
];

export default {
  id: 'sub-same',
  title: 'Odčítání – stejný jmenovatel',
  task: 'Odečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Odečteme čitatele, jmenovatel opíšeme. Výsledek zkrátíme.',
    example: [frac(5, 7), text('−'), frac(2, 7), text('='), frac(3, 7)],
  },

  /**
   * Všechny zlomky jsou vlastní (jeden odečítaný, od úrovně 4 občas dva); rozdíl je vždy kladný,
   * může být nezkrácený, nikdy není větší než 1 ani celé číslo.
   */
  generate(rng, level = 1) {
    const { maxD, tripleShare } = levelOf(LEVELS, level);
    const triple = tripleShare > 0 && rng() < tripleShare;
    const d = randInt(rng, triple ? 4 : 3, maxD);
    const minuend = randInt(rng, triple ? 3 : 2, d - 1);
    const subtrahends = [randInt(rng, 1, minuend - (triple ? 2 : 1))];
    if (triple) subtrahends.push(randInt(rng, 1, minuend - subtrahends[0] - 1));
    const diff = subtrahends.reduce((rest, s) => rest - s, minuend);
    const { expected, answer, steps } = valueResult(diff, d);
    return makeItem(
      this.id,
      this.answerType,
      expected,
      [frac(minuend, d), ...subtrahends.flatMap((s) => [text('−'), frac(s, d)]), text('=')],
      answer,
      [
        `${minuend}/${d} ${subtrahends.map((s) => `− ${s}/${d}`).join(' ')} = (${minuend} ${subtrahends.map((s) => `− ${s}`).join(' ')})/${d} = ${diff}/${d}`,
        ...steps,
      ],
    );
  },
};
