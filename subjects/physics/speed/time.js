import { text } from '../../math/fractions/helpers.js';
import { generateProblem } from './problem.js';

export default {
  id: 'speed-t',
  title: 'Výpočet času',
  task: 'Spočítej čas',
  answerType: 'decimal',
  hint: {
    rule: 'Čas = dráha : rychlost, t = s / v. Nejdřív sjednoť jednotky (1 km = 1000 m, 1 h = 60 min = 3600 s, 1 m/s = 3,6 km/h).',
    example: [text('90 km : 60 km/h = 1,5 h')],
  },

  /** Dráha a rychlost v různých jednotkách, čas v zadané jednotce (nejvýš 1 desetinné místo). */
  generate(rng, level = 1) {
    return generateProblem(this.id, 't', rng, level);
  },
};
