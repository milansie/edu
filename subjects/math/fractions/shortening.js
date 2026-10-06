import { makeItem, frac, text, randInt, coprimeBelow } from './helpers.js';

const INTEGER_SHARE = 0.2;

export default {
  id: 'shortening',
  title: 'Krácení',
  task: 'Zkrať na základní tvar',
  answerType: 'reduced',
  hint: {
    rule: 'Čitatele i jmenovatele vydělíme stejným číslem. Zkrať na základní tvar (výsledek může být i celé číslo).',
    example: [frac(15, 3), text('= 5')],
  },

  /** Zadání je vždy krátitelné; zhruba pětina příkladů vychází jako celé číslo (72/8). */
  generate(rng) {
    if (rng() < INTEGER_SHARE) {
      const d = randInt(rng, 2, 12);
      const q = randInt(rng, 2, 9);
      const n = q * d;
      return makeItem(
        this.id,
        this.answerType,
        { n: q, d: 1 },
        [frac(n, d), text('=')],
        [text(String(q))],
        [`${n} : ${d} = ${q}`],
      );
    }
    const d = randInt(rng, 2, 12);
    const n = coprimeBelow(rng, d);
    const g = randInt(rng, 2, 9);
    return makeItem(
      this.id,
      this.answerType,
      { n, d },
      [frac(n * g, d * g), text('=')],
      [frac(n, d)],
      [`Dělíme čitatele i jmenovatele číslem ${g}:`, `${n * g} : ${g} = ${n}, ${d * g} : ${g} = ${d}`],
    );
  },
};
