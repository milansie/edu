import { makeItem, frac, text, randInt } from './helpers.js';

export default {
  id: 'of-whole',
  title: 'Část z celku',
  answerType: 'integer',
  hint: {
    rule: 'Celek vydělíme jmenovatelem a výsledek vynásobíme čitatelem.',
    example: [frac(3, 5), text('z 120 = 72')],
  },

  /** Celek je násobek jmenovatele, výsledek je tedy vždy celé číslo. */
  generate(rng) {
    const d = randInt(rng, 2, 10);
    const n = randInt(rng, 1, d - 1);
    const q = randInt(rng, 3, 25);
    const whole = d * q;
    const result = q * n;
    return makeItem(
      this.id,
      this.answerType,
      result,
      [frac(n, d), text(`z ${whole} =`)],
      [frac(n, d), text(`z ${whole} = ${result}`)],
      [`${whole} : ${d} = ${q}`, `${q} · ${n} = ${result}`],
    );
  },
};
