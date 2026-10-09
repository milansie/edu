import { makeItem, frac, text, randInt, levelOf } from './helpers.js';

/** Parametry úrovní 1–5: největší jmenovatel, největší násobek (celek = jmenovatel · násobek) a podíl nepravých zlomků. */
const LEVELS = [
  { maxD: 10, maxMultiple: 25, improperShare: 0 },
  { maxD: 10, maxMultiple: 40, improperShare: 0 },
  { maxD: 12, maxMultiple: 60, improperShare: 0 },
  { maxD: 12, maxMultiple: 80, improperShare: 0.25 },
  { maxD: 15, maxMultiple: 100, improperShare: 0.25 },
];

export default {
  id: 'of-whole',
  title: 'Část z celku',
  task: 'Vypočítej část z celku',
  answerType: 'integer',
  hint: {
    rule: 'Celek vydělíme jmenovatelem a výsledek vynásobíme čitatelem.',
    example: [frac(3, 5), text('z 120 = 72')],
  },

  /**
   * Celek je násobek jmenovatele, výsledek je tedy vždy celé číslo. Od úrovně 4 je část příkladů s nepravým zlomkem
   * (5/4 z 36); jeho násobek je poloviční, aby výsledek zůstal dobře spočitatelný.
   */
  generate(rng, level = 1) {
    const { maxD, maxMultiple, improperShare } = levelOf(LEVELS, level);
    const d = randInt(rng, 2, maxD);
    const improper = improperShare > 0 && rng() < improperShare;
    const n = improper ? randInt(rng, d + 1, 2 * d - 1) : randInt(rng, 1, d - 1);
    const q = randInt(rng, 3, improper ? Math.floor(maxMultiple / 2) : maxMultiple);
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
