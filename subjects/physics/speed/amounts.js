import { randInt } from '../../math/fractions/helpers.js';
import { reduce } from '../../../js/core/fraction.js';
import { Rejected, convert, tenths } from '../units.js';

/** Rozsah celých hodnot rychlosti v dané jednotce. */
export const SPEED_RANGE = { 'm/s': [1, 40], 'km/h': [2, 150], 'm/min': [10, 600] };

/** Rozsah celých hodnot času v dané jednotce. */
export const TIME_RANGE = { s: [2, 120], min: [2, 90], h: [1, 8] };

/**
 * Náhodná hodnota z intervalu `[lo, hi]`: celé číslo, při `decimals` > 0 asi v polovině případů
 * s jedním desetinným místem.
 */
export function randomValue(rng, [lo, hi], decimals) {
  if (decimals > 0 && rng() < 0.5) return tenths(randInt(rng, lo * 10, hi * 10));
  return reduce({ n: randInt(rng, lo, hi), d: 1 });
}

/**
 * Rozsah celých hodnot rychlosti v jednotce `unit` odpovídající rozsahu `kmh` v km/h (nejméně 1);
 * když se do něj žádné celé číslo nevejde, vyhodí `Rejected`.
 */
export function speedBounds(unit, [lo, hi]) {
  const low = convert({ n: lo, d: 1 }, 'km/h', unit);
  const high = convert({ n: hi, d: 1 }, 'km/h', unit);
  const bounds = [Math.max(1, Math.ceil(low.n / low.d)), Math.floor(high.n / high.d)];
  if (bounds[1] < bounds[0]) throw new Rejected(`Rozsah rychlosti se nevejde do ${unit}.`);
  return bounds;
}

/** Náhodná rychlost pro převod jednotek: v jednotce `unit`, při `decimals` > 0 asi v polovině případů v desetinách. */
export const randomSpeed = (rng, unit, decimals) => randomValue(rng, SPEED_RANGE[unit], decimals);

/** Relativní rozdíl dvou kladných zlomků vzhledem k většímu z nich (0 = stejné hodnoty). */
export function relativeGap(a, b) {
  const x = a.n * b.d;
  const y = b.n * a.d;
  return Math.abs(x - y) / Math.max(x, y);
}
