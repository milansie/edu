import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'volume',
  title: 'Výpočet objemu',
  task: 'Spočítej objem',
  answerType: 'decimal',
  hint: {
    rule: 'Objem = hmotnost : hustota, V = m / ρ. Nejdřív sjednoť jednotky (1 l = 1 dm³ = 1000 cm³, 1 m³ = 1000 l, 1 g/cm³ = 1000 kg/m³).',
    example: [text('V = 100 g : 2 g/cm³ = 50 cm³')],
  },

  /** Hmotnost a hustota v různých jednotkách, objem v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 'v', rng, level);
  },
};
