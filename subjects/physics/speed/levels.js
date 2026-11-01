const LENGTH = ['m', 'km'];
const TIME = ['s', 'min', 'h'];
const SPEED = ['m/s', 'km/h', 'm/min'];

/** Všechny trojice jednotek `[dráha, čas, rychlost]` kromě dráhy v m s časem v h (vycházejí z toho příliš dlouhé dráhy). */
const ALL_COMBOS = LENGTH.flatMap((l) => TIME.flatMap((t) => SPEED.map((v) => [l, t, v]))).filter(([l, t]) => !(l === 'm' && t === 'h'));

const BASE_PAIRS = [['km/h', 'm/s'], ['m/s', 'km/h']];
const MIN_PAIRS = [['m/s', 'm/min'], ['m/min', 'm/s']];

/**
 * Parametry úrovní 1–5 pro rychlost:
 * `inputDecimals` = nejvíc desetinných míst u zadaných hodnot (výsledek má vždy nejvýš 1),
 * `combos` = trojice jednotek `[dráha, čas, rychlost]` pro výpočty (rychlost je jednotka hledané/zadané rychlosti),
 * `pairs` = dvojice `[z, na]` pro převody rychlosti,
 * `comparePairs` = dvojice jednotek `[první, druhá]` pro porovnání (první se v postupu převádí na druhou),
 * `orderPairs` = dvojice `[základní, společná]` pro řazení (hodnoty v základní jednotce se převádí na společnou),
 * `gap` = nejmenší relativní rozdíl dvou porovnávaných nebo řazených rychlostí,
 * `timetable` = jízdní řád (`speedDecimals`, `distanceDecimals`, `departStep`, `durationStep`, `maxDuration` v minutách),
 * `segments` = úseky cesty (`decimals` = desetinná místa dráhy v km, `distanceUnits`, `timeUnits` s `hmin` = zápis „X h Y min“, `gap`).
 */
export const LEVELS = [
  {
    inputDecimals: 0,
    combos: [['km', 'h', 'km/h'], ['m', 's', 'm/s']],
    pairs: BASE_PAIRS,
    comparePairs: [['m/s', 'km/h']],
    orderPairs: [['m/s', 'km/h']],
    gap: 0.25,
    timetable: { speedDecimals: 0, distanceDecimals: 0, departStep: 30, durationStep: 30, maxDuration: 180 },
    segments: { decimals: 0, distanceUnits: ['km'], timeUnits: ['min'], gap: 0.25 },
  },
  {
    inputDecimals: 0,
    combos: [['km', 'h', 'km/h'], ['m', 's', 'm/s'], ['km', 'min', 'km/h']],
    pairs: BASE_PAIRS,
    comparePairs: [['m/s', 'km/h'], ['km/h', 'm/s']],
    orderPairs: [['m/s', 'km/h']],
    gap: 0.2,
    timetable: { speedDecimals: 0, distanceDecimals: 1, departStep: 15, durationStep: 15, maxDuration: 240 },
    segments: { decimals: 1, distanceUnits: ['km'], timeUnits: ['min', 'h'], gap: 0.2 },
  },
  {
    inputDecimals: 1,
    combos: [['km', 'h', 'km/h'], ['m', 's', 'm/s'], ['km', 'min', 'km/h'], ['km', 's', 'm/s'], ['m', 'min', 'm/s']],
    pairs: BASE_PAIRS,
    comparePairs: [['m/s', 'km/h'], ['km/h', 'm/s']],
    orderPairs: [['m/s', 'km/h']],
    gap: 0.12,
    timetable: { speedDecimals: 0, distanceDecimals: 1, departStep: 5, durationStep: 15, maxDuration: 240 },
    segments: { decimals: 1, distanceUnits: ['km', 'm'], timeUnits: ['min', 'h'], gap: 0.15 },
  },
  {
    inputDecimals: 1,
    combos: [['m', 'min', 'km/h'], ['km', 's', 'm/s'], ['km', 'min', 'm/s'], ['km', 'h', 'm/s'], ['m', 's', 'km/h']],
    pairs: BASE_PAIRS,
    comparePairs: [['m/s', 'km/h'], ['km/h', 'm/s']],
    orderPairs: [['m/s', 'km/h']],
    gap: 0.08,
    timetable: { speedDecimals: 0, distanceDecimals: 1, departStep: 5, durationStep: 6, maxDuration: 240 },
    segments: { decimals: 1, distanceUnits: ['km', 'm'], timeUnits: ['min', 'h', 'hmin'], gap: 0.1 },
  },
  {
    inputDecimals: 1,
    combos: ALL_COMBOS,
    pairs: [...BASE_PAIRS, ...MIN_PAIRS],
    comparePairs: [['m/s', 'km/h'], ['km/h', 'm/s'], ...MIN_PAIRS],
    orderPairs: [['m/s', 'km/h'], ['m/s', 'm/min']],
    gap: 0.05,
    timetable: { speedDecimals: 1, distanceDecimals: 1, departStep: 1, durationStep: 3, maxDuration: 300 },
    segments: { decimals: 1, distanceUnits: ['km', 'm'], timeUnits: ['s', 'min', 'h', 'hmin'], gap: 0.08 },
  },
];
