import { compare } from '../../../js/core/fraction.js';
import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { Rejected, convert, toBase, fmt, fmtStep, withUnit, conversionStep } from '../units.js';
import { LEVELS } from './levels.js';
import { randomSpeed, relativeGap } from './amounts.js';

const MAX_ATTEMPTS = 1000;

/** Jistá dvojice (72 km/h > 15 m/s), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = { a: { value: { n: 72, d: 1 }, unit: 'km/h' }, b: { value: { n: 15, d: 1 }, unit: 'm/s' } };

/** Položka z rychlostí `a` a `b` (každá `{ value, unit }`); `a` se v postupu převádí na jednotku `b`, `swap` je vymění v zadání. */
function describe(category, { a, b }, swap) {
  const converted = convert(a.value, a.unit, b.unit);
  const [left, right] = swap ? [b, a] : [a, b];
  const common = swap ? { left: b.value, right: converted } : { left: converted, right: b.value };
  const sign = compare(common.left, common.right) < 0 ? '<' : '>';
  const steps = [
    conversionStep('Převod', a.value, a.unit, b.unit),
    `V ${b.unit}: ${fmtStep(common.left)} ${sign} ${fmtStep(common.right)}`,
  ];
  const shownLeft = withUnit(left.value, left.unit);
  const shownRight = withUnit(right.value, right.unit);
  return makeItem(category, 'relation', sign, [text(shownLeft), text('?'), text(shownRight)], [text(shownLeft), text(sign), text(shownRight)], steps);
}

export default {
  id: 'speed-compare',
  title: 'Porovnání rychlostí',
  task: 'Doplň znaménko < nebo >',
  answerType: 'relation',
  hint: {
    rule: 'Rychlosti nejdřív převeď na stejnou jednotku (1 m/s = 3,6 km/h, 1 m/s = 60 m/min), potom je porovnej.',
    example: [text('72 km/h'), text('>'), text('15 m/s')],
  },

  /** Dvě různé rychlosti v různých jednotkách, nikdy stejně velké; od vyšších úrovní jsou si blíž. */
  generate(rng, level = 1) {
    const { comparePairs, inputDecimals, gap } = levelOf(LEVELS, level);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const [unitA, unitB] = pick(rng, comparePairs);
      const a = { value: randomSpeed(rng, unitA, inputDecimals), unit: unitA };
      const b = { value: randomSpeed(rng, unitB, inputDecimals), unit: unitB };
      try {
        fmt(a.value, inputDecimals);
        fmt(b.value, inputDecimals);
        if (relativeGap(toBase(a.value, unitA), toBase(b.value, unitB)) < gap) continue;
        return describe(this.id, { a, b }, rng() < 0.5);
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    return describe(this.id, FALLBACK, false);
  },
};
