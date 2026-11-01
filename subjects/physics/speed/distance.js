import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'speed-s',
  title: 'Výpočet dráhy',
  task: 'Spočítej dráhu',
  answerType: 'decimal',
  hint: {
    rule: 'Dráha = rychlost · čas, s = v · t. Nejdřív sjednoť jednotky (1 km = 1000 m, 1 h = 60 min = 3600 s, 1 m/s = 3,6 km/h).',
    example: [text('40 km/h · 3 h = 120 km')],
  },

  /** Rychlost a čas v různých jednotkách, dráha v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 's', rng, level);
  },
};
