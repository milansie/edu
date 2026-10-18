import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { Rejected, convert, fmt, withUnit, conversionStep } from '../units.js';
import { LEVELS } from './levels.js';
import { randomAmount } from './amounts.js';

const MAX_ATTEMPTS = 1000;

/** Jistý převod (2 kg = 2000 g), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = { value: { n: 2, d: 1 }, from: 'kg', to: 'g' };

function describe(category, { value, from, to }) {
  const result = convert(value, from, to);
  const prompt = `${withUnit(value, from)} = ? ${to}`;
  const item = makeItem(category, 'decimal', result, [text(prompt)], [text(withUnit(result, to))], [conversionStep('Převod', value, from, to)]);
  return { ...item, conversion: { value, from, to } };
}

export default {
  id: 'units',
  title: 'Převody jednotek',
  task: 'Převeď jednotky',
  answerType: 'decimal',
  hint: {
    rule: 'Z větší jednotky na menší násobíme, z menší na větší dělíme: 1 kg = 1000 g, 1 t = 1000 kg, 1 l = 1 dm³ = 1000 cm³ = 1000 ml, 1 m³ = 1000 l, 1 g/cm³ = 1000 kg/m³.',
    example: [text('2,5 l = 2500 ml')],
  },

  /** Hmotnost, objem (od úrovně 4 i hustota) v jedné jednotce na jinou; zadání i výsledek mají nejvýš 1 desetinné místo. */
  generate(rng, level = 1) {
    const { pairs, inputDecimals } = levelOf(LEVELS, level);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const [from, to] = pick(rng, pairs);
      const value = randomAmount(rng, inputDecimals);
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
