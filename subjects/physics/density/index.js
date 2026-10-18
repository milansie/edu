import convertUnits from './convert-units.js';
import density from './density.js';
import mass from './mass.js';
import volume from './volume.js';
import identify from './identify.js';

/**
 * Kategorie tématu Hustota. Kategorie:
 * `{ id, title, task, answerType, hint: { rule, example }, generate(rng, level = 1) → položka }`.
 */
export const categories = [convertUnits, density, mass, volume, identify];
