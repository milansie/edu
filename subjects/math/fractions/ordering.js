import { gcd } from '../../../js/core/fraction.js';
import { makeItem, frac, text, randInt, pick, coprimeBelow, levelOf } from './helpers.js';

const COUNT = 4;
const COMMON_DENOMINATORS = [6, 8, 10, 12, 15, 16, 18, 20, 24];

/**
 * Parametry úrovní 1–5: `maxD` největší jmenovatel variant se stejným jmenovatelem / čitatelem, `diffShare` podíl
 * příkladů s různými jmenovateli (`null` = třetina jako jedna ze tří variant), `commons` možní společní jmenovatelé
 * variant s různými jmenovateli, `distinct` = všechny jmenovatele navzájem různí, `close` = hodnoty blízko sebe.
 */
const LEVELS = [
  { maxD: 16, diffShare: null, commons: COMMON_DENOMINATORS, distinct: false, close: false },
  { maxD: 20, diffShare: null, commons: COMMON_DENOMINATORS, distinct: false, close: false },
  { maxD: 20, diffShare: 0.5, commons: COMMON_DENOMINATORS, distinct: false, close: false },
  { maxD: 20, diffShare: 1, commons: [12, 18, 20, 24, 28, 30, 36], distinct: true, close: false },
  { maxD: 20, diffShare: 1, commons: [24, 30, 36, 40, 42, 48, 60], distinct: true, close: true },
];

/** Vybere variantu: 0 = stejný jmenovatel, 1 = stejný čitatel, 2 = různí jmenovatelé. */
function pickVariant(rng, { diffShare }) {
  const roll = rng();
  if (diffShare === null) return Math.floor(roll * 3);
  if (roll >= 1 - diffShare) return 2;
  return Math.floor((roll / (1 - diffShare)) * 2);
}

/** Dělitelé `common` větší než 1. */
function divisorsOf(common) {
  return Array.from({ length: common - 1 }, (_, i) => i + 2).filter((d) => common % d === 0);
}

const MAX_CLOSE_SPREAD = 0.3;
const MAX_CLOSE_ATTEMPTS = 50;

/** Jeden pokus o `COUNT` zlomků v základním tvaru s různými jmenovateli dělícími `common` (s `target` co nejblíž této hodnotě). */
function distinctOnce(rng, common, target) {
  return sample(rng, divisorsOf(common)).map((d) => {
    if (target === null) return { n: coprimeBelow(rng, d), d };
    const centre = Math.round(target * d);
    for (let offset = 0; offset < d; offset++) {
      for (const n of [centre - offset, centre + offset]) if (n >= 1 && n < d && gcd(n, d) === 1) return { n, d };
    }
    throw new Error(`Jmenovatel ${d} nemá vlastní zlomek v základním tvaru.`);
  });
}

/**
 * `COUNT` zlomků v základním tvaru s navzájem různými jmenovateli dělícími `common` (hodnoty jsou různé, protože
 * jmenovatele jsou různé). S `close` se losuje, dokud hodnoty neleží v rozpětí `MAX_CLOSE_SPREAD` (nejvýš
 * `MAX_CLOSE_ATTEMPTS` pokusů, pak se vrátí poslední).
 */
function distinctDenominators(rng, common, close) {
  if (!close) return distinctOnce(rng, common, null);
  let list;
  for (let attempt = 0; attempt < MAX_CLOSE_ATTEMPTS; attempt++) {
    list = distinctOnce(rng, common, 0.3 + rng() * 0.4);
    const values = list.map((f) => f.n / f.d);
    if (Math.max(...values) - Math.min(...values) <= MAX_CLOSE_SPREAD) break;
  }
  return list;
}

/** Náhodně vybere `COUNT` různých prvků ze `list` (list se nemění). */
function sample(rng, list) {
  const pool = [...list];
  const out = [];
  while (out.length < COUNT) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

/** Všechny vlastní zlomky v základním tvaru se jmenovatelem dělícím `common` (jmenovatel alespoň 2). */
function fractionsOver(common) {
  const out = [];
  for (let d = 2; d <= common; d++) {
    if (common % d !== 0) continue;
    for (let n = 1; n < d; n++) if (gcd(n, d) === 1) out.push({ n, d });
  }
  return out;
}

/** Zlomky `{ n, d }` pro jednu ze tří variant podle parametrů úrovně; vždy `COUNT` hodnotově různých vlastních zlomků. */
function pickFractions(rng, params) {
  const variant = pickVariant(rng, params);
  if (variant === 0) {
    const d = randInt(rng, 5, params.maxD);
    const numerators = Array.from({ length: d - 1 }, (_, i) => i + 1);
    return { variant, common: d, list: sample(rng, numerators).map((n) => ({ n, d })) };
  }
  if (variant === 1) {
    const n = randInt(rng, 1, 9);
    const denominators = Array.from({ length: params.maxD - n }, (_, i) => n + 1 + i);
    return { variant, common: n, list: sample(rng, denominators).map((d) => ({ n, d })) };
  }
  const common = pick(rng, params.commons);
  if (params.distinct) return { variant, common, list: distinctDenominators(rng, common, params.close) };
  const candidates = fractionsOver(common);
  let list;
  do list = sample(rng, candidates);
  while (new Set(list.map((f) => f.d)).size < 2);
  return { variant, common, list };
}

export default {
  id: 'ordering',
  title: 'Řazení',
  task: 'Seřaď od nejmenšího po největší',
  answerType: 'order',
  hint: {
    rule: 'Stejný jmenovatel: řaď podle čitatele. Stejný čitatel: čím větší jmenovatel, tím menší zlomek. Jinak zlomky převeď na společného jmenovatele.',
    example: [frac(1, 4), text('<'), frac(3, 8), text('<'), frac(1, 2), text('<'), frac(5, 8)],
  },

  /**
   * Čtyři zlomky v zamíchaném pořadí (stejný jmenovatel / stejný čitatel / různí jmenovatelé). Od úrovně 3 přibývají
   * různí jmenovatelé, od úrovně 4 jsou všichni čtyři jmenovatelé různí a na úrovni 5 jsou hodnoty blízko sebe.
   * `expected` je pole indexů do zadání ve vzestupném pořadí hodnot.
   */
  generate(rng, level = 1) {
    const { variant, common, list } = pickFractions(rng, levelOf(LEVELS, level));
    let shuffled;
    let order;
    do {
      shuffled = [...list];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      order = shuffled.map((_, i) => i).sort((a, b) => shuffled[a].n * shuffled[b].d - shuffled[b].n * shuffled[a].d);
    } while (order.every((v, i) => v === i));

    const sorted = order.map((i) => shuffled[i]);
    const answer = sorted.flatMap((f, i) => (i === 0 ? [frac(f.n, f.d)] : [text('<'), frac(f.n, f.d)]));
    const steps = [];
    if (variant === 0) {
      steps.push(`Stejný jmenovatel ${common}: řadíme podle čitatelů (${sorted.map((f) => f.n).join(' < ')}).`);
    } else if (variant === 1) {
      steps.push(`Stejný čitatel ${common}: čím větší jmenovatel, tím menší zlomek (${sorted.map((f) => f.d).join(' > ')}).`);
    } else {
      steps.push(`Převedeme na společného jmenovatele ${common}.`);
      for (const f of shuffled) if (f.d !== common) steps.push(`${f.n}/${f.d} = ${(f.n * common) / f.d}/${common}`);
      steps.push(`Řadíme podle čitatelů (${sorted.map((f) => (f.n * common) / f.d).join(' < ')}).`);
    }
    return makeItem(this.id, this.answerType, order, shuffled.map((f) => frac(f.n, f.d)), answer, steps);
  },
};
