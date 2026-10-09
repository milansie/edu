import { lcm } from '../../../js/core/fraction.js';
import { makeItem, frac, text, randInt, pick, coprimeBelow, levelOf, denominatorPairs } from './helpers.js';

/**
 * Parametry úrovní 1–5: `maxD` největší jmenovatel variant se stejným jmenovatelem / čitatelem, `shares` kumulativní
 * hranice výběru varianty [stejný jmenovatel, stejný čitatel, různí jmenovatelé] (zbytek do 1 jsou „těsné“ dvojice),
 * `diffD` největší jmenovatel a `diffCommon` největší společný jmenovatel u variant s různými jmenovateli.
 */
const LEVELS = [
  { maxD: 16, shares: [0.5, 1, 1], diffD: 0, diffCommon: 0 },
  { maxD: 20, shares: [0.5, 1, 1], diffD: 0, diffCommon: 0 },
  { maxD: 20, shares: [1 / 3, 2 / 3, 1], diffD: 12, diffCommon: 60 },
  { maxD: 20, shares: [0.25, 0.5, 1], diffD: 20, diffCommon: 120 },
  { maxD: 25, shares: [0.15, 0.3, 0.65], diffD: 25, diffCommon: 150 },
];

/** Zlomky s různými jmenovateli (základní tvar, hodnoty jsou díky tomu vždy různé); postup přes společného jmenovatele. */
function differentDenominators(rng, { diffD, diffCommon }) {
  const [d1, d2] = pick(rng, denominatorPairs(diffD, diffCommon));
  const left = frac(coprimeBelow(rng, d1), d1);
  const right = frac(coprimeBelow(rng, d2), d2);
  const common = lcm(d1, d2);
  const x = (left.n * common) / d1;
  const y = (right.n * common) / d2;
  const rule = `Společný jmenovatel ${common}: ${left.n}/${d1} = ${x}/${common}, ${right.n}/${d2} = ${y}/${common} (${x} ${x < y ? '<' : '>'} ${y}).`;
  return { left, right, rule };
}

/** Těsná dvojice sousedních zlomků k/(k+1) a (k+1)/(k+2) v náhodném pořadí; rozhoduje se křížovým násobením. */
function tightPair(rng, { diffD }) {
  const k = randInt(rng, 3, diffD - 2);
  const lower = frac(k, k + 1);
  const upper = frac(k + 1, k + 2);
  const [left, right] = rng() < 0.5 ? [lower, upper] : [upper, lower];
  const rule = `Křížem: ${left.n} · ${right.d} = ${left.n * right.d} a ${right.n} · ${left.d} = ${right.n * left.d} (${left.n * right.d} ${left.n * right.d < right.n * left.d ? '<' : '>'} ${right.n * left.d}).`;
  return { left, right, rule };
}

export default {
  id: 'comparing',
  title: 'Porovnávání',
  task: 'Doplň znaménko < nebo >',
  answerType: 'relation',
  hint: {
    rule: 'Stejný jmenovatel: větší je zlomek s větším čitatelem. Stejný čitatel: větší je zlomek s menším jmenovatelem.',
    example: [frac(3, 7), text('<'), frac(5, 7)],
  },

  /**
   * Úroveň 1–2: polovina příkladů má stejný jmenovatel, polovina stejný čitatel. Od úrovně 3 přibývají zlomky
   * s různými jmenovateli (přes společného jmenovatele), na úrovni 5 i těsné dvojice (7/8 a 8/9). Hodnoty jsou vždy různé.
   */
  generate(rng, level = 1) {
    const params = levelOf(LEVELS, level);
    const { maxD, shares } = params;
    const roll = rng();
    let left;
    let right;
    let rule;
    if (roll < shares[0]) {
      const d = randInt(rng, 5, maxD);
      const a = randInt(rng, 1, d - 1);
      let b = randInt(rng, 1, d - 2);
      if (b >= a) b++;
      left = frac(a, d);
      right = frac(b, d);
      rule = `Stejný jmenovatel: větší je zlomek s větším čitatelem (${a} ${a < b ? '<' : '>'} ${b}).`;
    } else if (roll < shares[1]) {
      const n = randInt(rng, 1, 9);
      const a = randInt(rng, n + 1, maxD);
      let b = randInt(rng, n + 1, maxD - 1);
      if (b >= a) b++;
      left = frac(n, a);
      right = frac(n, b);
      rule = `Stejný čitatel: větší je zlomek s menším jmenovatelem (${a} ${a > b ? '>' : '<'} ${b}).`;
    } else {
      ({ left, right, rule } = roll < shares[2] ? differentDenominators(rng, params) : tightPair(rng, params));
    }
    const less = left.n * right.d < right.n * left.d;
    const sign = less ? '<' : '>';
    return makeItem(this.id, this.answerType, sign, [left, text('?'), right], [left, text(sign), right], [rule]);
  },
};
