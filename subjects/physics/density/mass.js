import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'mass',
  title: 'Výpočet hmotnosti',
  task: 'Spočítej hmotnost',
  answerType: 'decimal',
  hint: {
    rule: 'Hmotnost = hustota · objem, m = ρ · V. Nejdřív sjednoť jednotky (1 l = 1 dm³ = 1000 cm³, 1 m³ = 1000 l, 1 g/cm³ = 1000 kg/m³).',
    example: [text('m = 2 g/cm³ · 50 cm³ = 100 g')],
  },

  /** Hustota a objem v různých jednotkách, hmotnost v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 'm', rng, level);
  },
};
