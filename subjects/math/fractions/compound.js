import { lcm, reduce, fromMixed } from '../../../js/core/fraction.js';
import {
  makeItem,
  frac,
  mixed,
  compound,
  text,
  randInt,
  pick,
  coprimeBelow,
  valueResult,
  multiplyResult,
  fracWithNumeratorFactor,
  levelOf,
  denominatorPairs,
} from './helpers.js';

/**
 * Parametry úrovní 1–5:
 * 1 = zlomek / celé číslo nebo celé číslo / zlomek (malá čísla),
 * 2 = zlomek / zlomek s malými čísly,
 * 3 = zlomek / zlomek se zaručeným krácením nebo smíšeným číslem nahoře/dole,
 * 4 = součet/rozdíl se stejným jmenovatelem (nebo celé ± zlomek) v čitateli nebo jmenovateli,
 * 5 = součet/rozdíl s různým malým jmenovatelem v čitateli i/nebo jmenovateli.
 */
const LEVELS = [
  { mode: 'whole', maxD: 8, maxWhole: 8 },
  { mode: 'fracs', maxD: 9 },
  { mode: 'cross-or-mixed', maxD: 15, maxK: 5, mixedMaxD: 8, mixedMaxWhole: 3 },
  { mode: 'single-op', sameMaxD: 9, wholeMax: 3, wholeMaxD: 6, otherMaxD: 8, otherMaxWhole: 6 },
  { mode: 'diff-op', diffMaxD: 6, diffMaxCommon: 12, sameMaxD: 6, wholeMax: 2, wholeMaxD: 5, otherMaxD: 8 },
];

function fmt(f) {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}

function randomProper(rng, maxD) {
  const d = randInt(rng, 2, maxD);
  return { n: coprimeBelow(rng, d), d };
}

function simpleFracSide(f) {
  return { parts: [frac(f.n, f.d)], value: f, step: null };
}

function wholeSide(w) {
  return { parts: [text(String(w))], value: { n: w, d: 1 }, step: null };
}

function mixedSide(rng, maxWhole, maxD) {
  const w = randInt(rng, 1, maxWhole);
  const d = randInt(rng, 2, maxD);
  const n = coprimeBelow(rng, d);
  const im = fromMixed({ w, n, d });
  return { parts: [mixed(w, n, d)], value: im, step: `${w} ${n}/${d} = ${im.n}/${im.d}` };
}

/** Dvojice vlastních zlomků, které se po přepisu na dělení a převrácení dělitele krátí křížem. */
function crossCancelDivPair(rng, maxD, maxK) {
  const k = randInt(rng, 2, maxK);
  if (rng() < 0.5) {
    const maxQ = Math.floor(maxD / k);
    const d1 = k * randInt(rng, 2, maxQ);
    const d2 = k * randInt(rng, 2, maxQ);
    return [{ n: coprimeBelow(rng, d1), d: d1 }, { n: coprimeBelow(rng, d2), d: d2 }];
  }
  return [fracWithNumeratorFactor(rng, k, maxD), fracWithNumeratorFactor(rng, k, maxD)];
}

/** Součet nebo kladný rozdíl dvou vlastních zlomků se stejným jmenovatelem. */
function sameDenomOpSide(rng, maxD) {
  const d = randInt(rng, 3, maxD);
  if (rng() < 0.5) {
    const a = randInt(rng, 1, d - 1);
    const b = randInt(rng, 1, d - 1);
    const sum = a + b;
    const value = reduce({ n: sum, d });
    return {
      parts: [frac(a, d), text('+'), frac(b, d)],
      value,
      step: `${a}/${d} + ${b}/${d} = ${sum}/${d}${value.n !== sum ? ` = ${fmt(value)}` : ''}`,
    };
  }
  const a = randInt(rng, 2, d - 1);
  const b = randInt(rng, 1, a - 1);
  const diff = a - b;
  const value = reduce({ n: diff, d });
  return {
    parts: [frac(a, d), text('−'), frac(b, d)],
    value,
    step: `${a}/${d} − ${b}/${d} = ${diff}/${d}${value.n !== diff ? ` = ${fmt(value)}` : ''}`,
  };
}

/** Součet nebo kladný rozdíl celého čísla a vlastního zlomku (w ≥ 1, takže rozdíl je vždy kladný). */
function wholeOpSide(rng, maxWhole, maxD) {
  const w = randInt(rng, 1, maxWhole);
  const d = randInt(rng, 2, maxD);
  const n = coprimeBelow(rng, d);
  if (rng() < 0.5) {
    const num = w * d + n;
    return {
      parts: [text(String(w)), text('+'), frac(n, d)],
      value: { n: num, d },
      step: `${w} + ${n}/${d} = ${w * d}/${d} + ${n}/${d} = ${num}/${d}`,
    };
  }
  const num = w * d - n;
  return {
    parts: [text(String(w)), text('−'), frac(n, d)],
    value: { n: num, d },
    step: `${w} − ${n}/${d} = ${w * d}/${d} − ${n}/${d} = ${num}/${d}`,
  };
}

/** Součet nebo kladný rozdíl dvou vlastních zlomků s různými malými jmenovateli. */
function diffDenomOpSide(rng, maxD, maxCommon) {
  const [d1, d2] = pick(rng, denominatorPairs(maxD, maxCommon));
  const a = coprimeBelow(rng, d1);
  const b = coprimeBelow(rng, d2);
  const common = lcm(d1, d2);
  let x = (a * common) / d1;
  let y = (b * common) / d2;
  if (rng() < 0.5) {
    const sum = x + y;
    const value = reduce({ n: sum, d: common });
    return {
      parts: [frac(a, d1), text('+'), frac(b, d2)],
      value,
      step: `${a}/${d1} + ${b}/${d2} = ${x}/${common} + ${y}/${common} = ${sum}/${common}${value.n !== sum ? ` = ${fmt(value)}` : ''}`,
    };
  }
  const swap = x < y;
  const [n1, den1, n2, den2] = swap ? [b, d2, a, d1] : [a, d1, b, d2];
  if (swap) [x, y] = [y, x];
  const diff = x - y;
  const value = reduce({ n: diff, d: common });
  return {
    parts: [frac(n1, den1), text('−'), frac(n2, den2)],
    value,
    step: `${n1}/${den1} − ${n2}/${den2} = ${x}/${common} − ${y}/${common} = ${diff}/${common}${value.n !== diff ? ` = ${fmt(value)}` : ''}`,
  };
}

function buildCompound(id, answerType, top, bottom) {
  const steps = [];
  if (top.step) steps.push(`Čitatel: ${top.step}`);
  if (bottom.step) steps.push(`Jmenovatel: ${bottom.step}`);
  const a = top.value;
  const b = bottom.value;
  let res;
  if (a.d === 1 && b.d === 1) {
    res = valueResult(a.n, b.n);
    const raw = b.n === 1 ? String(a.n) : `${a.n}/${b.n}`;
    steps.push(`${a.n} : ${b.n} = ${raw}`);
    steps.push(...res.steps);
  } else if (b.d === 1) {
    steps.push(`${a.n}/${a.d} : ${b.n} = ${a.n}/${a.d} · 1/${b.n}`);
    res = multiplyResult(a, { n: 1, d: b.n });
    steps.push(...res.steps);
  } else if (a.d === 1) {
    steps.push(`${a.n} : ${b.n}/${b.d} = ${a.n}/1 · ${b.d}/${b.n}`);
    res = multiplyResult({ n: a.n, d: 1 }, { n: b.d, d: b.n });
    steps.push(...res.steps);
  } else {
    steps.push(`${a.n}/${a.d} : ${b.n}/${b.d} = ${a.n}/${a.d} · ${b.d}/${b.n}`);
    res = multiplyResult(a, { n: b.d, d: b.n });
    steps.push(...res.steps);
  }
  return makeItem(id, answerType, res.expected, [compound(top.parts, bottom.parts), text('=')], res.answer, steps);
}

export default {
  id: 'compound',
  title: 'Složené zlomky',
  task: 'Vypočítej složený zlomek',
  answerType: 'value',
  hint: {
    rule: 'Hlavní zlomková čára znamená dělení. Nejdřív spočítáme čitatel i jmenovatel zvlášť, pak čitatel vydělíme jmenovatelem.',
    example: [compound([frac(2, 3)], [frac(4, 5)]), text('='), frac(5, 6)],
  },

  generate(rng, level = 1) {
    const params = levelOf(LEVELS, level);
    if (params.mode === 'whole') {
      const f = randomProper(rng, params.maxD);
      const w = randInt(rng, 2, params.maxWhole);
      const fracOnTop = rng() < 0.5;
      return buildCompound(
        this.id,
        this.answerType,
        fracOnTop ? simpleFracSide(f) : wholeSide(w),
        fracOnTop ? wholeSide(w) : simpleFracSide(f),
      );
    }
    if (params.mode === 'fracs') {
      return buildCompound(
        this.id,
        this.answerType,
        simpleFracSide(randomProper(rng, params.maxD)),
        simpleFracSide(randomProper(rng, params.maxD)),
      );
    }
    if (params.mode === 'cross-or-mixed') {
      if (rng() < 0.5) {
        const [a, b] = crossCancelDivPair(rng, params.maxD, params.maxK);
        return buildCompound(this.id, this.answerType, simpleFracSide(a), simpleFracSide(b));
      }
      const m = mixedSide(rng, params.mixedMaxWhole, params.mixedMaxD);
      const f = simpleFracSide(randomProper(rng, 9));
      const mixedOnTop = rng() < 0.5;
      return buildCompound(this.id, this.answerType, mixedOnTop ? m : f, mixedOnTop ? f : m);
    }
    if (params.mode === 'single-op') {
      const op = rng() < 2 / 3 ? sameDenomOpSide(rng, params.sameMaxD) : wholeOpSide(rng, params.wholeMax, params.wholeMaxD);
      const other = rng() < 0.5 ? simpleFracSide(randomProper(rng, params.otherMaxD)) : wholeSide(randInt(rng, 2, params.otherMaxWhole));
      const opOnTop = rng() < 0.5;
      return buildCompound(this.id, this.answerType, opOnTop ? op : other, opOnTop ? other : op);
    }
    // Úroveň 5: součet/rozdíl s různým malým jmenovatelem na jedné nebo obou stranách.
    const diffOp = diffDenomOpSide(rng, params.diffMaxD, params.diffMaxCommon);
    if (rng() < 0.5) {
      const other = simpleFracSide(randomProper(rng, params.otherMaxD));
      const opOnTop = rng() < 0.5;
      return buildCompound(this.id, this.answerType, opOnTop ? diffOp : other, opOnTop ? other : diffOp);
    }
    const roll = rng();
    const secondOp = roll < 1 / 3
      ? diffDenomOpSide(rng, params.diffMaxD, params.diffMaxCommon)
      : roll < 2 / 3
        ? sameDenomOpSide(rng, params.sameMaxD)
        : wholeOpSide(rng, params.wholeMax, params.wholeMaxD);
    const diffOnTop = rng() < 0.5;
    return buildCompound(this.id, this.answerType, diffOnTop ? diffOp : secondOp, diffOnTop ? secondOp : diffOp);
  },
};
