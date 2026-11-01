import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { compare } from '../../../js/core/fraction.js';
import { Rejected, convert, toBase, fmt, fmtStep, withUnit, conversionStep } from '../units.js';
import { LEVELS } from './levels.js';
import { randomSpeed, relativeGap } from './amounts.js';

const MAX_ATTEMPTS = 1000;
/** Počet řazených rychlostí; hra „Zápis“ počítá s přesně čtyřmi položkami. */
const COUNT = 4;

/** Jistá čtveřice (v km/h: 18 < 25,2 < 54 < 72), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = {
  base: 'm/s',
  common: 'km/h',
  items: [{ value: { n: 20, d: 1 }, unit: 'm/s' }, { value: { n: 18, d: 1 }, unit: 'km/h' }, { value: { n: 54, d: 1 }, unit: 'km/h' }, { value: { n: 7, d: 1 }, unit: 'm/s' }],
};

/** Položka ze čtveřice rychlostí `items` (`{ value, unit }`); hodnoty v jednotce `base` se v postupu převádějí na `common`. */
function describe(category, { base, common, items }) {
  const values = items.map(({ value, unit }) => (unit === base ? convert(value, base, common) : value));
  const order = values.map((_, i) => i).sort((i, j) => compare(values[i], values[j]));
  const steps = items
    .filter(({ unit }) => unit === base)
    .map(({ value }) => conversionStep('Převod', value, base, common));
  steps.push(`V ${common}: ${order.map((i) => fmtStep(values[i])).join(' < ')}`);
  const shown = items.map(({ value, unit }) => withUnit(value, unit));
  const answer = order.flatMap((i, k) => (k === 0 ? [text(shown[i])] : [text('<'), text(shown[i])]));
  return makeItem(category, 'order', order, shown.map((s) => text(s)), answer, steps);
}

export default {
  id: 'speed-order',
  title: 'Seřazení rychlostí',
  task: 'Seřaď od nejmenší po největší',
  answerType: 'order',
  hint: {
    rule: 'Rychlosti nejdřív převeď na stejnou jednotku (1 m/s = 3,6 km/h, 1 m/s = 60 m/min), potom je seřaď.',
    example: [text('18 km/h'), text('<'), text('6 m/s'), text('<'), text('36 km/h'), text('<'), text('15 m/s')],
  },

  /**
   * Čtyři různé rychlosti v zamíchaném pořadí, aspoň jedna v každé ze dvou jednotek; od vyšších úrovní
   * jsou si hodnoty blíž. `expected` je pole indexů do zadání ve vzestupném pořadí hodnot.
   */
  generate(rng, level = 1) {
    const { orderPairs, inputDecimals, gap } = levelOf(LEVELS, level);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const [base, common] = pick(rng, orderPairs);
      const items = Array.from({ length: COUNT }, () => {
        const unit = rng() < 0.5 ? base : common;
        return { value: randomSpeed(rng, unit, inputDecimals), unit };
      });
      if (new Set(items.map((x) => x.unit)).size < 2) continue;
      try {
        for (const { value } of items) fmt(value, inputDecimals);
        const values = items.map(({ value, unit }) => toBase(value, unit));
        const spaced = values.every((a, i) => values.every((b, j) => i === j || relativeGap(a, b) >= gap));
        if (!spaced) continue;
        const sorted = values.map((_, i) => i).sort((i, j) => compare(values[i], values[j]));
        if (sorted.every((v, i) => v === i)) continue;
        return describe(this.id, { base, common, items });
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    return describe(this.id, FALLBACK);
  },
};
