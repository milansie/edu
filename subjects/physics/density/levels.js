import { UNITS } from '../units.js';

const MASS = ['g', 'kg', 't'];
const VOLUME = ['cm³', 'ml', 'l', 'dm³', 'm³'];
const DENSITY = ['g/cm³', 'kg/l', 'kg/dm³', 'kg/m³'];

const L1_PAIRS = [['kg', 'g'], ['g', 'kg'], ['l', 'ml'], ['ml', 'l']];
const L2_PAIRS = [...L1_PAIRS, ['l', 'dm³'], ['dm³', 'l'], ['ml', 'cm³'], ['cm³', 'ml'], ['dm³', 'cm³'], ['cm³', 'dm³'], ['l', 'cm³'], ['cm³', 'l']];
const L3_PAIRS = [...L2_PAIRS, ['t', 'kg'], ['kg', 't'], ['m³', 'dm³'], ['dm³', 'm³']];
const L4_PAIRS = [...L3_PAIRS, ['m³', 'l'], ['l', 'm³'], ['g/cm³', 'kg/m³'], ['kg/m³', 'g/cm³']];

/** Všechny uspořádané dvojice různých jednotek téže veličiny. */
function allPairs() {
  const names = Object.keys(UNITS);
  return names.flatMap((a) => names.filter((b) => a !== b && UNITS[a].quantity === UNITS[b].quantity).map((b) => [a, b]));
}

/** Kombinace úrovně 5: hmotnost i objem jsou v jiné jednotce než hustota, takže úloha vyžaduje dva převody. */
const L5_COMBOS = MASS.flatMap((m) => VOLUME.flatMap((v) => DENSITY.map((r) => [m, v, r])))
  .filter(([m, v, r]) => m !== UNITS[r].mass && v !== UNITS[r].volume);

/**
 * Parametry úrovní 1–5 pro hustotu: `inputDecimals` = nejvíc desetinných míst u zadané hmotnosti a objemu,
 * `combos` = trojice jednotek `[hmotnost, objem, hustota]`, `pairs` = dvojice `[z, na]` pro převody jednotek.
 * Výsledek a hustota mají vždy nejvýš 1 desetinné místo.
 */
export const LEVELS = [
  { inputDecimals: 0, combos: [['g', 'cm³', 'g/cm³'], ['kg', 'dm³', 'kg/dm³']], pairs: L1_PAIRS },
  { inputDecimals: 1, combos: [['g', 'cm³', 'g/cm³'], ['g', 'ml', 'g/cm³'], ['kg', 'l', 'kg/l'], ['kg', 'dm³', 'kg/dm³']], pairs: L2_PAIRS },
  {
    inputDecimals: 1,
    combos: [
      ['kg', 'cm³', 'g/cm³'], ['g', 'l', 'g/cm³'], ['g', 'dm³', 'g/cm³'], ['g', 'l', 'kg/l'], ['kg', 'cm³', 'kg/l'], ['g', 'dm³', 'kg/dm³'],
    ],
    pairs: L3_PAIRS,
  },
  {
    inputDecimals: 1,
    combos: [
      ['kg', 'm³', 'kg/m³'], ['t', 'm³', 'kg/m³'], ['kg', 'l', 'kg/m³'], ['g', 'cm³', 'kg/m³'], ['kg', 'dm³', 'kg/m³'], ['t', 'm³', 'g/cm³'],
    ],
    pairs: L4_PAIRS,
  },
  { inputDecimals: 1, combos: L5_COMBOS, pairs: allPairs() },
];
