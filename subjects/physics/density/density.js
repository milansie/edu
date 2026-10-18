import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'density',
  title: 'Výpočet hustoty',
  task: 'Spočítej hustotu',
  answerType: 'decimal',
  hint: {
    rule: 'Hustota = hmotnost : objem, ρ = m / V. Nejdřív sjednoť jednotky (1 l = 1 dm³ = 1000 cm³, 1 m³ = 1000 l, 1 g/cm³ = 1000 kg/m³).',
    example: [text('ρ = 100 g : 50 cm³ = 2 g/cm³')],
  },

  /** Hmotnost a objem v různých jednotkách, hustota v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 'rho', rng, level);
  },
};
