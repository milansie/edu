import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'speed-v',
  title: 'Výpočet rychlosti',
  task: 'Spočítej rychlost',
  answerType: 'decimal',
  hint: {
    rule: 'Rychlost = dráha : čas, v = s / t. Nejdřív sjednoť jednotky (1 km = 1000 m, 1 h = 60 min = 3600 s, 1 m/s = 3,6 km/h).',
    example: [text('72 km : 2 h = 36 km/h')],
  },

  /** Dráha a čas v různých jednotkách, rychlost v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 'v', rng, level);
  },
};
