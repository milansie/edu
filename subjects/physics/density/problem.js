import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { materials } from '../materials.js';
import {
  UNITS, Rejected, MAX_DECIMALS, convert, toBase, mul, div, fmt, fmtStep, withUnit, conversionStep,
} from '../units.js';
import { LEVELS } from './levels.js';
import { randomDensity, randomVolume } from './amounts.js';

const MAX_ATTEMPTS = 1000;
/** Podíl úloh zadaných slovně (s příběhem Sira Isaaca a u hmotnosti/objemu s materiálem z tabulky). */
const TEMPLATE_SHARE = 0.5;

/** Jistá úloha (10 g, 5 cm³, 2 g/cm³), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = {
  m: { value: { n: 10, d: 1 }, unit: 'g' },
  v: { value: { n: 5, d: 1 }, unit: 'cm³' },
  rho: { value: { n: 2, d: 1 }, unit: 'g/cm³' },
};

const show = ({ value, unit }) => withUnit(value, unit);

/** Zadání: „Hustotu zapiš v …“ podle hledané veličiny. */
const ASK = { rho: 'Hustotu', m: 'Hmotnost', v: 'Objem' };

/** Věty zadání bez příběhu podle hledané veličiny. */
const PLAIN = {
  rho: (q) => `Těleso má hmotnost ${show(q.m)} a objem ${show(q.v)}.`,
  m: (q) => `Těleso má hustotu ρ = ${show(q.rho)} a objem ${show(q.v)}.`,
  v: (q) => `Těleso má hmotnost ${show(q.m)} a hustotu ρ = ${show(q.rho)}.`,
};

const SMALL_VOLUME = ['cm³', 'ml', 'dm³', 'l'];
const BUCKET_VOLUME = ['dm³', 'l'];
const MEASURED_VOLUME = ['cm³', 'ml', 'l'];
const LIGHT_MASS = ['g', 'kg'];
const ANY_MASS = ['g', 'kg', 't'];

/**
 * Slovní zadání: `{ mass, volume, text }`, kde `mass` a `volume` jsou jednotky, se kterými je příběh věcně
 * uvěřitelný (jablko nemá objem v m³, do kbelíku se nelije m³), a `text(q, material)` je věta.
 * U hmotnosti a objemu se vybírá podle skupenství materiálu (`solid` / `liquid`), u hustoty bez materiálu.
 */
const STORIES = {
  rho: [
    { mass: LIGHT_MASS, volume: SMALL_VOLUME, text: (q) => `Sir Isaac zvážil záhadný kámen: hmotnost ${show(q.m)}, objem ${show(q.v)}.` },
    { mass: ['g'], volume: ['cm³', 'ml'], text: (q) => `Jablko Sira Isaaca má hmotnost ${show(q.m)} a objem ${show(q.v)}.` },
    { mass: LIGHT_MASS, volume: SMALL_VOLUME, text: (q) => `Sir Isaac vyrobil kostku o hmotnosti ${show(q.m)} a objemu ${show(q.v)}.` },
  ],
  m: {
    solid: [
      { mass: LIGHT_MASS, volume: SMALL_VOLUME, text: (q, mat) => `Sir Isaac odlil kostku (materiál: ${mat.name}, ρ = ${show(q.rho)}) o objemu ${show(q.v)}.` },
      { mass: ANY_MASS, volume: [...SMALL_VOLUME, 'm³'], text: (q, mat) => `Sir Isaac našel kus materiálu ${mat.name} (ρ = ${show(q.rho)}) o objemu ${show(q.v)}.` },
    ],
    liquid: [
      { mass: LIGHT_MASS, volume: BUCKET_VOLUME, text: (q, mat) => `Sir Isaac nalil do kbelíku ${show(q.v)} kapaliny (materiál: ${mat.name}, ρ = ${show(q.rho)}).` },
      { mass: LIGHT_MASS, volume: MEASURED_VOLUME, text: (q, mat) => `Sir Isaac odměřil ${show(q.v)} kapaliny (materiál: ${mat.name}, ρ = ${show(q.rho)}).` },
    ],
  },
  v: {
    solid: [
      { mass: ANY_MASS, volume: [...SMALL_VOLUME, 'm³'], text: (q, mat) => `Sir Isaac má kus materiálu ${mat.name} (ρ = ${show(q.rho)}) o hmotnosti ${show(q.m)}.` },
      { mass: LIGHT_MASS, volume: SMALL_VOLUME, text: (q, mat) => `Sir Isaac odlil kostku (materiál: ${mat.name}, ρ = ${show(q.rho)}) o hmotnosti ${show(q.m)}.` },
    ],
    liquid: [
      { mass: LIGHT_MASS, volume: BUCKET_VOLUME, text: (q, mat) => `Sir Isaac nalil do kbelíku kapalinu o hmotnosti ${show(q.m)} (materiál: ${mat.name}, ρ = ${show(q.rho)}).` },
      { mass: LIGHT_MASS, volume: MEASURED_VOLUME, text: (q, mat) => `Sir Isaac zvážil ${show(q.m)} kapaliny (materiál: ${mat.name}, ρ = ${show(q.rho)}).` },
    ],
  },
};

const storiesFor = (unknown, material) => (unknown === 'rho' ? STORIES.rho : STORIES[unknown][material.state]);

/**
 * Vyřeší úlohu: vrátí `{ expected, steps }`, kde `expected` je hledaná veličina ve své jednotce (zlomek)
 * a `steps` postup (převod jednotek, dosazení do vzorce, převod výsledku). Počítá se v jednotkách hustoty.
 */
function solve(unknown, q) {
  const { mass, volume } = UNITS[q.rho.unit];
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
  const rho = q.rho.value;
  if (unknown === 'rho') {
    const m = into('Hmotnost', q.m, mass);
    const v = into('Objem', q.v, volume);
    const result = div(m, v);
    steps.push(`ρ = m / V = ${fmtStep(m)} / ${fmtStep(v)} = ${fmtStep(result)} ${q.rho.unit}`);
    return { expected: result, steps };
  }
  if (unknown === 'm') {
    const v = into('Objem', q.v, volume);
    const result = mul(rho, v);
    steps.push(`m = ρ · V = ${fmtStep(rho)} · ${fmtStep(v)} = ${fmtStep(result)} ${mass}`);
    return { expected: finish(result, mass, q.m.unit), steps };
  }
  const m = into('Hmotnost', q.m, mass);
  const result = div(m, rho);
  steps.push(`V = m / ρ = ${fmtStep(m)} / ${fmtStep(rho)} = ${fmtStep(result)} ${volume}`);
  return { expected: finish(result, volume, q.v.unit), steps };
}

/** Sestaví položku z hodnot `q` (`{ m, v, rho }`, každé `{ value, unit }`); `story` je věta příběhu nebo null. */
function describe(category, unknown, q, story) {
  const { expected, steps } = solve(unknown, q);
  const unit = q[unknown].unit;
  const prompt = `${story ?? PLAIN[unknown](q)} ${ASK[unknown]} zapiš v ${unit}.`;
  const item = makeItem(category, 'decimal', expected, [text(prompt)], [text(withUnit(expected, unit))], steps);
  return { ...item, unknown, quantities: q };
}

/**
 * Hodnoty úlohy sestavené odzadu: zvolí se hustota (z tabulky materiálů, nebo náhodná) a objem,
 * hmotnost vyjde přesně ze zlomků. `story` (nebo null) omezuje jednotky na ty, které příběh povoluje. Zadané hodnoty smí mít nejvýš `inputDecimals` desetinných míst,
 * hledaná a hustota nejvýš 1; jinak vyhodí `Rejected`.
 */
function pickQuantities(rng, params, unknown, material, story) {
  const combos = story ? params.combos.filter(([m, v]) => story.mass.includes(m) && story.volume.includes(v)) : params.combos;
  if (combos.length === 0) throw new Rejected('Příběh se na této úrovni nehodí.');
  const [massUnit, volumeUnit, rhoUnit] = pick(rng, combos);
  const rhoBase = material ? material.density : randomDensity(rng);
  const v = randomVolume(rng, volumeUnit, params.inputDecimals);
  const m = convert(mul(rhoBase, toBase(v, volumeUnit)), 'g', massUnit);
  const q = {
    m: { value: m, unit: massUnit },
    v: { value: v, unit: volumeUnit },
    rho: { value: convert(rhoBase, 'g/cm³', rhoUnit), unit: rhoUnit },
  };
  for (const key of ['m', 'v']) fmt(q[key].value, key === unknown ? MAX_DECIMALS : params.inputDecimals);
  fmt(q.rho.value);
  return q;
}

/**
 * Vygeneruje úlohu kategorie `category` s hledanou veličinou `unknown` (`'rho'`, `'m'`, `'v'`) pro úroveň `level`.
 * Zhruba polovina zadání je slovní; u hmotnosti a objemu pak s materiálem z tabulky.
 */
export function generateProblem(category, unknown, rng, level) {
  const params = levelOf(LEVELS, level);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const useStory = rng() < TEMPLATE_SHARE;
    const material = useStory && unknown !== 'rho' ? pick(rng, materials) : null;
    const story = useStory ? pick(rng, storiesFor(unknown, material)) : null;
    try {
      const q = pickQuantities(rng, params, unknown, material, story);
      const sentence = story ? story.text(q, material) : null;
      return describe(category, unknown, q, sentence);
    } catch (error) {
      if (!(error instanceof Rejected)) throw error;
    }
  }
  return describe(category, unknown, FALLBACK, null);
}
