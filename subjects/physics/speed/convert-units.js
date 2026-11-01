import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { Rejected, convert, fmt, withUnit, conversionStep } from '../units.js';
import { LEVELS } from './levels.js';
import { randomSpeed } from './amounts.js';

const MAX_ATTEMPTS = 1000;

/** Jistý převod (36 km/h = 10 m/s), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = { value: { n: 36, d: 1 }, from: 'km/h', to: 'm/s' };

function describe(category, { value, from, to }) {
  const result = convert(value, from, to);
  const prompt = `${withUnit(value, from)} = ? ${to}`;
  const item = makeItem(category, 'decimal', result, [text(prompt)], [text(withUnit(result, to))], [conversionStep('Převod', value, from, to)]);
  return { ...item, conversion: { value, from, to } };
}

export default {
  id: 'speed-units',
  title: 'Převody rychlosti',
  task: 'Převeď jednotky',
  answerType: 'decimal',
  hint: {
    rule: 'Z m/s na km/h násobíme 3,6, z km/h na m/s dělíme 3,6. Z m/s na m/min násobíme 60, z m/min na m/s dělíme 60.',
    example: [text('10 m/s = 36 km/h')],
  },

  /** Rychlost v jedné jednotce na jinou (od úrovně 5 i m/min); zadání i výsledek mají nejvýš 1 desetinné místo. */
  generate(rng, level = 1) {
    const { pairs, inputDecimals } = levelOf(LEVELS, level);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const [from, to] = pick(rng, pairs);
      const value = randomSpeed(rng, from, inputDecimals);
      try {
        fmt(value, inputDecimals);
        fmt(convert(value, from, to));
        return describe(this.id, { value, from, to });
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    return describe(this.id, FALLBACK);
  },
};
