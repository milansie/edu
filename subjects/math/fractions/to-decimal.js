import { formatDecimal } from '../../../js/core/fraction.js';
import { makeItem, frac, text, randInt, pick, levelOf } from './helpers.js';

/** Základní jmenovatele s konečným desetinným rozvojem (dělí 10, 100 nebo 1000). */
const DENOMINATORS = [2, 4, 5, 8, 10, 20, 25, 50, 100];
/** Jmenovatele navíc od úrovně 4 (dělí 1000, jmenovatel 16 až 10000; výsledek má nejvýš 4 desetinná místa). */
const HARD_DENOMINATORS = [...DENOMINATORS, 16, 40, 125, 200];
const POWERS = [10, 100, 1000, 10000];

/** Parametry úrovní 1–5: podíl nepravých zlomků a nabídka jmenovatelů. */
const LEVELS = [
  { improperShare: 0.25, denominators: DENOMINATORS },
  { improperShare: 0.35, denominators: DENOMINATORS },
  { improperShare: 0.5, denominators: DENOMINATORS },
  { improperShare: 0.5, denominators: HARD_DENOMINATORS },
  { improperShare: 0.6, denominators: HARD_DENOMINATORS },
];

export default {
  id: 'to-decimal',
  title: 'Na desetinné číslo',
  task: 'Převeď na desetinné číslo',
  answerType: 'decimal',
  hint: {
    rule: 'Čitatele vydělíme jmenovatelem, nebo zlomek rozšíříme na jmenovatele 10, 100, …',
    example: [frac(3, 4), text('= 0,75')],
  },

  /** Výsledek má nejvýš 3 desetinná místa (od úrovně 4 až 4), není celé číslo a občas je větší než 1 (11/8). */
  generate(rng, level = 1) {
    const { improperShare, denominators } = levelOf(LEVELS, level);
    const d = pick(rng, denominators);
    let n;
    if (rng() < improperShare) {
      n = randInt(rng, d + 1, 2 * d - 1);
    } else {
      n = randInt(rng, 1, d - 1);
    }
    const power = POWERS.find((p) => p % d === 0);
    const scaled = (n * power) / d;
    const value = formatDecimal({ n, d });
    const steps = d === power
      ? [`${n}/${d} = ${value}`]
      : [`Rozšíříme na jmenovatele ${power}: ${n}/${d} = ${scaled}/${power}`, `${scaled}/${power} = ${value}`];
    return makeItem(this.id, this.answerType, { n, d }, [frac(n, d), text('=')], [text(value)], steps);
  },
};
