import { makeItem, frac, text, randInt, coprimeBelow, levelOf } from './helpers.js';

const INTEGER_SHARE = 0.2;

/** Parametry úrovní 1–5: největší jmenovatel základního tvaru a největší činitel krácení (u celočíselného výsledku největší podíl). */
const LEVELS = [
  { maxD: 12, maxFactor: 9 },
  { maxD: 15, maxFactor: 9 },
  { maxD: 20, maxFactor: 12 },
  { maxD: 25, maxFactor: 15 },
  { maxD: 30, maxFactor: 20 },
];

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
  generate(rng, level = 1) {
    const { maxD, maxFactor } = levelOf(LEVELS, level);
    if (rng() < INTEGER_SHARE) {
      const d = randInt(rng, 2, maxD);
      const q = randInt(rng, 2, maxFactor);
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
    const d = randInt(rng, 2, maxD);
    const n = coprimeBelow(rng, d);
    const g = randInt(rng, 2, maxFactor);
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
