import { randInt } from '../../math/fractions/helpers.js';
import { reduce } from '../../../js/core/fraction.js';
import { tenths } from '../units.js';

/** Rozsah celých hodnot zadaného objemu v dané jednotce. */
const VOLUME_RANGE = { 'cm³': [2, 300], ml: [2, 300], l: [1, 30], 'dm³': [1, 30], 'm³': [1, 10] };

/** Náhodná hustota v g/cm³ v celých desetinách 0,3–21,5 (pro úlohy bez materiálu z tabulky). */
export const randomDensity = (rng) => tenths(randInt(rng, 3, 215));

/**
 * Náhodný objem v jednotce `unit`: celé číslo z rozsahu jednotky, při `decimals` > 0 asi v polovině případů
 * s jedním desetinným místem.
 */
export function randomVolume(rng, unit, decimals) {
  const [lo, hi] = VOLUME_RANGE[unit];
  if (decimals > 0 && rng() < 0.5) return tenths(randInt(rng, lo * 10, hi * 10));
  return reduce({ n: randInt(rng, lo, hi), d: 1 });
}

/** Náhodná hodnota pro převod jednotek: 1–99 krát 10^0 až 10^3, při `decimals` > 0 asi v polovině případů v desetinách. */
export function randomAmount(rng, decimals) {
  const n = randInt(rng, 1, 99) * 10 ** randInt(rng, 0, 3);
  return decimals > 0 && rng() < 0.5 ? tenths(n) : reduce({ n, d: 1 });
}
