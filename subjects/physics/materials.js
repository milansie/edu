import { tenths } from './units.js';

/**
 * Tabulka materiálů: `{ id, name, aliases, density, state }`, kde `density` je zlomek `{ n, d }` v g/cm³
 * (všechny hustoty jsou jedinečné a mají nejvýš 1 desetinné místo), `state` je `'solid'` nebo `'liquid'`
 * a `aliases` jsou další uznávané názvy odpovědi (porovnává se bez diakritiky a velikosti písmen).
 */
export const materials = [
  { id: 'cork', name: 'korek', aliases: [], density: tenths(2), state: 'solid' },
  { id: 'spruce', name: 'smrkové dřevo', aliases: ['smrk', 'dřevo'], density: tenths(5), state: 'solid' },
  { id: 'petrol', name: 'benzín', aliases: ['benzin'], density: tenths(7), state: 'liquid' },
  { id: 'ice', name: 'led', aliases: [], density: tenths(9), state: 'solid' },
  { id: 'water', name: 'voda', aliases: [], density: tenths(10), state: 'liquid' },
  { id: 'concrete', name: 'beton', aliases: [], density: tenths(23), state: 'solid' },
  { id: 'glass', name: 'sklo', aliases: [], density: tenths(25), state: 'solid' },
  { id: 'aluminium', name: 'hliník', aliases: [], density: tenths(27), state: 'solid' },
  { id: 'titanium', name: 'titan', aliases: [], density: tenths(45), state: 'solid' },
  { id: 'zinc', name: 'zinek', aliases: [], density: tenths(71), state: 'solid' },
  { id: 'tin', name: 'cín', aliases: [], density: tenths(73), state: 'solid' },
  { id: 'iron', name: 'železo', aliases: [], density: tenths(79), state: 'solid' },
  { id: 'copper', name: 'měď', aliases: [], density: tenths(89), state: 'solid' },
  { id: 'silver', name: 'stříbro', aliases: [], density: tenths(105), state: 'solid' },
  { id: 'lead', name: 'olovo', aliases: [], density: tenths(113), state: 'solid' },
  { id: 'mercury', name: 'rtuť', aliases: [], density: tenths(135), state: 'liquid' },
  { id: 'gold', name: 'zlato', aliases: [], density: tenths(193), state: 'solid' },
  { id: 'platinum', name: 'platina', aliases: [], density: tenths(214), state: 'solid' },
];

/** Všechny uznávané zápisy názvu materiálu (název + aliasy) pro odpověď typu `text`. */
export const acceptedNames = (material) => [material.name, ...material.aliases];
