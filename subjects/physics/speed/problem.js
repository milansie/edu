import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import {
  UNITS, Rejected, MAX_DECIMALS, convert, toBase, mul, div, fmt, fmtStep, withUnit, conversionStep,
} from '../units.js';
import { LEVELS } from './levels.js';
import { STORIES } from './stories.js';
import { SPEED_RANGE, TIME_RANGE, randomValue, speedBounds } from './amounts.js';

const MAX_ATTEMPTS = 1000;
/** Podíl úloh zadaných slovně (s hrdinou příběhu). */
const STORY_SHARE = 0.5;

/** Jistá úloha (100 km, 2 h, 50 km/h), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = {
  s: { value: { n: 100, d: 1 }, unit: 'km' },
  t: { value: { n: 2, d: 1 }, unit: 'h' },
  v: { value: { n: 50, d: 1 }, unit: 'km/h' },
};

const show = ({ value, unit }) => withUnit(value, unit);

/** Zadání: „Rychlost zapiš v …“ podle hledané veličiny. */
const ASK = { v: 'Rychlost', s: 'Dráhu', t: 'Dobu' };

/** Věty zadání bez příběhu podle hledané veličiny. */
const PLAIN = {
  v: (q) => `Těleso urazilo dráhu ${show(q.s)} za ${show(q.t)}.`,
  s: (q) => `Těleso se pohybuje rychlostí ${show(q.v)} po dobu ${show(q.t)}.`,
  t: (q) => `Těleso urazilo dráhu ${show(q.s)} rychlostí ${show(q.v)}.`,
};

/** Věty zadání s příběhem `story` podle hledané veličiny. */
const TELL = {
  v: (story, q) => `${story.name} ${story.moved} ${show(q.s)} za ${show(q.t)}.`,
  s: (story, q) => `${story.name} ${story.go} rychlostí ${show(q.v)} po dobu ${show(q.t)}.`,
  t: (story, q) => `${story.name} ${story.moved} ${show(q.s)} rychlostí ${show(q.v)}.`,
};

/**
 * Vyřeší úlohu: vrátí `{ expected, steps }`, kde `expected` je hledaná veličina ve své jednotce (zlomek)
 * a `steps` postup (převod jednotek, dosazení do vzorce, převod výsledku). Počítá se v jednotkách rychlosti.
 */
function solve(unknown, q) {
  const { length, time } = UNITS[q.v.unit];
  const steps = [];
  const into = (label, amount, target) => {
    if (amount.unit === target) return amount.value;
    steps.push(conversionStep(label, amount.value, amount.unit, target));
    return convert(amount.value, amount.unit, target);
  };
  const finish = (result, unit, own) => {
    if (unit === own) return result;
    steps.push(conversionStep('Převod výsledku', result, unit, own));
    return convert(result, unit, own);
  };
  const v = q.v.value;
  if (unknown === 'v') {
    const s = into('Dráha', q.s, length);
    const t = into('Čas', q.t, time);
    const result = div(s, t);
    steps.push(`v = s / t = ${fmtStep(s)} / ${fmtStep(t)} = ${fmtStep(result)} ${q.v.unit}`);
    return { expected: result, steps };
  }
  if (unknown === 's') {
    const t = into('Čas', q.t, time);
    const result = mul(v, t);
    steps.push(`s = v · t = ${fmtStep(v)} · ${fmtStep(t)} = ${fmtStep(result)} ${length}`);
    return { expected: finish(result, length, q.s.unit), steps };
  }
  const s = into('Dráha', q.s, length);
  const result = div(s, v);
  steps.push(`t = s / v = ${fmtStep(s)} / ${fmtStep(v)} = ${fmtStep(result)} ${time}`);
  return { expected: finish(result, time, q.t.unit), steps };
}

/** Sestaví položku z hodnot `q` (`{ s, t, v }`, každé `{ value, unit }`); `sentence` je věta zadání nebo null. */
function describe(category, unknown, q, sentence) {
  const { expected, steps } = solve(unknown, q);
  const unit = q[unknown].unit;
  const prompt = `${sentence ?? PLAIN[unknown](q)} ${ASK[unknown]} zapiš v ${unit}.`;
  const item = makeItem(category, 'decimal', expected, [text(prompt)], [text(withUnit(expected, unit))], steps);
  return { ...item, unknown, quantities: q };
}

/**
 * Hodnoty úlohy sestavené odzadu: zvolí se rychlost a čas, dráha vyjde přesně ze zlomků. `story` (nebo null)
 * omezuje jednotky, rozsah rychlosti a dobu pohybu na uvěřitelné. Zadané hodnoty smí mít nejvýš `inputDecimals`
 * desetinných míst, hledaná nejvýš 1; jinak vyhodí `Rejected`.
 */
function pickQuantities(rng, params, unknown, story) {
  const combos = story ? params.combos.filter(([l, t]) => story.lengths.includes(l) && story.times.includes(t)) : params.combos;
  if (combos.length === 0) throw new Rejected('Příběh se na této úrovni nehodí.');
  const [lengthUnit, timeUnit, speedUnit] = pick(rng, combos);
  const speedRange = story ? speedBounds(speedUnit, story.kmh) : SPEED_RANGE[speedUnit];
  const v = randomValue(rng, speedRange, params.inputDecimals);
  const t = randomValue(rng, TIME_RANGE[timeUnit], params.inputDecimals);
  const seconds = toBase(t, timeUnit);
  if (story && seconds.n > story.maxTime * seconds.d) throw new Rejected('Příliš dlouhá doba pohybu.');
  const s = convert(mul(toBase(v, speedUnit), seconds), 'm', lengthUnit);
  const q = { s: { value: s, unit: lengthUnit }, t: { value: t, unit: timeUnit }, v: { value: v, unit: speedUnit } };
  for (const key of ['s', 't', 'v']) fmt(q[key].value, key === unknown ? MAX_DECIMALS : params.inputDecimals);
  return q;
}

/**
 * Vygeneruje úlohu kategorie `category` s hledanou veličinou `unknown` (`'v'`, `'s'`, `'t'`) pro úroveň `level`.
 * Zhruba polovina zadání je slovní.
 */
export function generateProblem(category, unknown, rng, level) {
  const params = levelOf(LEVELS, level);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const story = rng() < STORY_SHARE ? pick(rng, STORIES) : null;
    try {
      const q = pickQuantities(rng, params, unknown, story);
      return describe(category, unknown, q, story ? TELL[unknown](story, q) : null);
    } catch (error) {
      if (!(error instanceof Rejected)) throw error;
    }
  }
  return describe(category, unknown, FALLBACK, null);
}
