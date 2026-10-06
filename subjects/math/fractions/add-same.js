import { makeItem, frac, text, randInt, valueResult } from './helpers.js';

export default {
  id: 'add-same',
  title: 'Sčítání – stejný jmenovatel',
  task: 'Sečti zlomky',
  answerType: 'value',
  hint: {
    rule: 'Sečteme čitatele, jmenovatel opíšeme. Výsledek zkrátíme.',
    example: [frac(2, 7), text('+'), frac(3, 7), text('='), frac(5, 7)],
  },

  /** Sčítance jsou vlastní zlomky; součet může být nezkrácený, větší než 1 i celé číslo. */
  generate(rng) {
    const d = randInt(rng, 3, 12);
    const a = randInt(rng, 1, d - 1);
    const b = randInt(rng, 1, d - 1);
    const sum = a + b;
    const { expected, answer, steps } = valueResult(sum, d);
    return makeItem(
      this.id,
      this.answerType,
      expected,
      [frac(a, d), text('+'), frac(b, d), text('=')],
      answer,
      [`${a}/${d} + ${b}/${d} = (${a} + ${b})/${d} = ${sum}/${d}`, ...steps],
    );
  },
};
