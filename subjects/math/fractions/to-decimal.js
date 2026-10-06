import { formatDecimal } from '../../../js/core/fraction.js';
import { makeItem, frac, text, randInt, pick } from './helpers.js';

/** Jmenovatele s konečným desetinným rozvojem (dělí 10, 100 nebo 1000). */
const DENOMINATORS = [2, 4, 5, 8, 10, 20, 25, 50, 100];
const IMPROPER_SHARE = 0.25;

export default {
  id: 'to-decimal',
  title: 'Na desetinné číslo',
  task: 'Převeď na desetinné číslo',
  answerType: 'decimal',
  hint: {
    rule: 'Čitatele vydělíme jmenovatelem, nebo zlomek rozšíříme na jmenovatele 10, 100, …',
    example: [frac(3, 4), text('= 0,75')],
  },

  /** Výsledek má nejvýš 3 desetinná místa, není celé číslo a občas je větší než 1 (11/8). */
  generate(rng) {
    const d = pick(rng, DENOMINATORS);
    let n;
    if (rng() < IMPROPER_SHARE) {
      n = randInt(rng, d + 1, 2 * d - 1);
    } else {
      n = randInt(rng, 1, d - 1);
    }
    const power = [10, 100, 1000].find((p) => p % d === 0);
    const scaled = (n * power) / d;
    const value = formatDecimal({ n, d });
    const steps = d === power
      ? [`${n}/${d} = ${value}`]
      : [`Rozšíříme na jmenovatele ${power}: ${n}/${d} = ${scaled}/${power}`, `${scaled}/${power} = ${value}`];
    return makeItem(this.id, this.answerType, { n, d }, [frac(n, d), text('=')], [text(value)], steps);
  },
};
