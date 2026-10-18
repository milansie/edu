import { reduce, formatDecimal } from '../../js/core/fraction.js';

/** Nejvíc desetinných míst, která smí mít zobrazená hodnota v zadání a odpovědi. */
export const MAX_DECIMALS = 1;
/** Nejvíc desetinných míst v mezivýsledcích postupu řešení. */
const MAX_STEP_DECIMALS = 4;
/** Nejdelší zápis čísla v zadání a odpovědi (včetně čárky); delší se do políčka odpovědi nevejde. */
const MAX_CHARS = 7;
/** Nejvíc číslic celé části; víc `parseDecimal` odmítne. */
const MAX_WHOLE_DIGITS = 6;
/** Nejdelší zápis mezivýsledku postupu. */
const MAX_STEP_CHARS = 12;

/**
 * Jednotky: `quantity` je veličina, `factor` zlomek `{ n, d }` = kolik základních jednotek veličiny je v jedné
 * jednotce (základ: objem cm³, hmotnost g, hustota g/cm³). Hustota nese i `mass` a `volume`, ze kterých se skládá.
 */
export const UNITS = {
  'cm³': { quantity: 'volume', factor: { n: 1, d: 1 } },
  ml: { quantity: 'volume', factor: { n: 1, d: 1 } },
  l: { quantity: 'volume', factor: { n: 1000, d: 1 } },
  'dm³': { quantity: 'volume', factor: { n: 1000, d: 1 } },
  'm³': { quantity: 'volume', factor: { n: 1000000, d: 1 } },
  g: { quantity: 'mass', factor: { n: 1, d: 1 } },
  kg: { quantity: 'mass', factor: { n: 1000, d: 1 } },
  t: { quantity: 'mass', factor: { n: 1000000, d: 1 } },
  'g/cm³': { quantity: 'density', factor: { n: 1, d: 1 }, mass: 'g', volume: 'cm³' },
  'kg/l': { quantity: 'density', factor: { n: 1, d: 1 }, mass: 'kg', volume: 'l' },
  'kg/dm³': { quantity: 'density', factor: { n: 1, d: 1 }, mass: 'kg', volume: 'dm³' },
  'kg/m³': { quantity: 'density', factor: { n: 1, d: 1000 }, mass: 'kg', volume: 'm³' },
};

/** Chyba „hodnota se nehodí do zadání“; generátor takový pokus zahodí a zkusí jiný. */
export class Rejected extends Error {}

/** Součin zlomků v základním tvaru. */
export const mul = (a, b) => reduce({ n: a.n * b.n, d: a.d * b.d });

/** Podíl zlomků v základním tvaru (`b` nesmí být nula). */
export const div = (a, b) => reduce({ n: a.n * b.d, d: a.d * b.n });

/** Zlomek `{ n, d }` z desetin: `tenths(25)` = 2,5. */
export const tenths = (n) => reduce({ n, d: 10 });

/** Převede hodnotu `value` (zlomek) z jednotky `from` na jednotku `to` stejné veličiny. */
export function convert(value, from, to) {
  if (UNITS[from].quantity !== UNITS[to].quantity) throw new Error(`Nelze převést ${from} na ${to}.`);
  return div(mul(value, UNITS[from].factor), UNITS[to].factor);
}

/** Hodnota v základní jednotce své veličiny. */
export const toBase = (value, unit) => mul(value, UNITS[unit].factor);

/** Počet desetinných míst zlomku, nebo `Infinity`, když je rozvoj delší než 6 míst. */
export function decimalPlaces({ n, d }) {
  for (let k = 0; k <= 6; k++) if ((n * 10 ** k) % d === 0) return k;
  return Infinity;
}

/** Zápis kladného zlomku s desetinnou čárkou; víc než `maxDecimals` míst je chyba `Rejected`. */
function format(value, maxDecimals) {
  if (value.n <= 0 || decimalPlaces(value) > maxDecimals) throw new Rejected(`Nevhodná hodnota ${value.n}/${value.d}.`);
  return formatDecimal(value);
}

/**
 * Zápis hodnoty zadání nebo odpovědi: nejvýš `maxDecimals` desetinných míst, celá část nejvýš 6 číslic a celý
 * zápis nejvýš 7 znaků (vejde se do políčka odpovědi a projde `parseDecimal`). Jinak vyhodí `Rejected`
 * (generátor takovou hodnotu zahodí a zkusí jinou).
 */
export function fmt(value, maxDecimals = MAX_DECIMALS) {
  const text = format(value, maxDecimals);
  if (text.length > MAX_CHARS || text.split(',')[0].length > MAX_WHOLE_DIGITS) throw new Rejected(`Příliš dlouhé číslo ${text}.`);
  return text;
}

/** Zápis mezivýsledku postupu: až 4 desetinná místa, nejvýš 12 znaků. */
export function fmtStep(value) {
  const text = format(value, MAX_STEP_DECIMALS);
  if (text.length > MAX_STEP_CHARS) throw new Rejected(`Příliš dlouhé číslo ${text}.`);
  return text;
}

/** Zápis hodnoty s jednotkou: `50 cm³`. */
export const withUnit = (value, unit) => `${fmt(value)} ${unit}`;

/**
 * Věta o převodním vztahu jednotek stejné veličiny pro postup řešení („1 l = 1000 ml“); vždy vyjadřuje
 * větší jednotku v menších.
 */
export function relation(from, to) {
  const ratio = div(UNITS[from].factor, UNITS[to].factor);
  if (ratio.n >= ratio.d) return `1 ${from} = ${fmtStep(ratio)} ${to}`;
  return `1 ${to} = ${fmtStep(div({ n: 1, d: 1 }, ratio))} ${from}`;
}

/**
 * Krok „převod“ postupu: `5 l = 5000 cm³ (1 l = 1000 cm³)` — hodnotu `value` v jednotce `from` vyjádří v jednotce `to`.
 */
export function conversionStep(label, value, from, to) {
  const result = convert(value, from, to);
  return `${label}: ${fmtStep(value)} ${from} = ${fmtStep(result)} ${to} (${relation(from, to)})`;
}
