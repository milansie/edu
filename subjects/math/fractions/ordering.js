import { gcd } from '../../../js/core/fraction.js';
import { makeItem, frac, text, randInt, pick } from './helpers.js';

const MAX_DENOMINATOR = 16;
const COUNT = 4;
const COMMON_DENOMINATORS = [6, 8, 10, 12, 15, 16, 18, 20, 24];

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

/** Zlomky `{ n, d }` pro jednu ze tří variant; vždy `COUNT` hodnotově různých vlastních zlomků. */
function pickFractions(rng) {
  const variant = Math.floor(rng() * 3);
  if (variant === 0) {
    const d = randInt(rng, 5, MAX_DENOMINATOR);
    const numerators = Array.from({ length: d - 1 }, (_, i) => i + 1);
    return { variant, common: d, list: sample(rng, numerators).map((n) => ({ n, d })) };
  }
  if (variant === 1) {
    const n = randInt(rng, 1, 9);
    const denominators = Array.from({ length: MAX_DENOMINATOR - n }, (_, i) => n + 1 + i);
    return { variant, common: n, list: sample(rng, denominators).map((d) => ({ n, d })) };
  }
  const common = pick(rng, COMMON_DENOMINATORS);
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
   * Čtyři zlomky v zamíchaném pořadí (stejný jmenovatel / stejný čitatel / různí jmenovatelé).
   * `expected` je pole indexů do zadání ve vzestupném pořadí hodnot.
   */
  generate(rng) {
    const { variant, common, list } = pickFractions(rng);
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
