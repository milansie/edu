import { gcd, lcm, reduce } from '../../../js/core/fraction.js';

/**
 * Pomocné funkce generátorů. Části zápisu (`parts`) popisují vykreslitelný výraz:
 * `{ t: 'frac', n, d } | { t: 'mixed', w, n, d } | { t: 'compound', n, d } | { t: 'text', v }`.
 */
export const frac = (n, d) => ({ t: 'frac', n, d });
export const mixed = (w, n, d) => ({ t: 'mixed', w, n, d });
export const compound = (n, d) => ({ t: 'compound', n, d });
export const text = (v) => ({ t: 'text', v });

/** Zápis jako prostý text ("3/4 (· 4) ="), pro `aria-label` a výpis chyb bez rendereru. */
export function plainText(parts) {
  return parts
    .map((p) => {
      if (p.t === 'frac') return `${p.n}/${p.d}`;
      if (p.t === 'mixed') return `${p.w} ${p.n}/${p.d}`;
      if (p.t === 'compound') return `(${plainText(p.n)})/(${plainText(p.d)})`;
      return p.v;
    })
    .join(' ');
}

/** Celé číslo z uzavřeného intervalu <lo, hi>. */
export function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Číslo z <1, d − 1> nesoudělné s `d` (pro d ≥ 2 vždy existuje, protože 1 je nesoudělná). */
export function coprimeBelow(rng, d) {
  const candidates = [];
  for (let n = 1; n < d; n++) if (gcd(n, d) === 1) candidates.push(n);
  return pick(rng, candidates);
}

/** Sestaví vygenerovanou položku. `prompt`/`answer` jsou `parts`, `steps` pole vět postupu. */
export function makeItem(category, answerType, expected, prompt, answer, steps) {
  return { id: `${category}:${plainText(prompt)}`, category, answerType, expected, display: { prompt, answer, steps } };
}

/**
 * Výsledek součtu `n/d` pro odpověď typu `value`: `expected` je zlomek v základním tvaru, `answer` zápis
 * pro zobrazení (celé číslo; zlomek; nepravý zlomek s ekvivalentním smíšeným číslem) a `steps` kroky
 * krácení a převodu na smíšené číslo (prázdné, když není co upravovat).
 */
export function valueResult(n, d) {
  const expected = reduce({ n, d });
  const steps = [];
  if (expected.n !== n) steps.push(`${n}/${d} = ${expected.n}${expected.d === 1 ? '' : `/${expected.d}`}`);
  let answer;
  if (expected.d === 1) {
    answer = [text(String(expected.n))];
  } else if (expected.n > expected.d) {
    const w = Math.floor(expected.n / expected.d);
    const r = expected.n % expected.d;
    steps.push(`${expected.n}/${expected.d} = ${w} ${r}/${expected.d}`);
    answer = [frac(expected.n, expected.d), text('='), mixed(w, r, expected.d)];
  } else {
    answer = [frac(expected.n, expected.d)];
  }
  return { expected, answer, steps };
}

/**
 * Výsledek a kroky násobení dvou kladných zlomků `a · b` (s křížovým krácením, když jde krátit).
 * Vrací `{ expected, answer, steps }` připravené pro `makeItem`.
 */
export function multiplyResult(a, b) {
  const g1 = gcd(a.n, b.d);
  const g2 = gcd(b.n, a.d);
  const a1 = a.n / g1;
  const d1 = b.d / g1;
  const b1 = b.n / g2;
  const c1 = a.d / g2;
  const num = a1 * b1;
  const den = c1 * d1;
  const res = valueResult(num, den);
  const steps = [];
  if (g1 > 1 || g2 > 1) {
    steps.push(`Krátíme křížem: ${a.n}/${a.d} · ${b.n}/${b.d} = ${a1}/${c1} · ${b1}/${d1}`);
  }
  const prod = den === 1 ? String(num) : `${num}/${den}`;
  steps.push(`(${a1} · ${b1})/(${c1} · ${d1}) = ${prod}`);
  steps.push(...res.steps);
  return { expected: res.expected, answer: res.answer, steps };
}

/** Vlastní zlomek v základním tvaru se jmenovatelem ≤ `maxD`, jehož čitatel je násobkem `k` (k ≥ 2, maxD > k). */
export function fracWithNumeratorFactor(rng, k, maxD) {
  const denominators = [];
  for (let d = k + 1; d <= maxD; d++) if (gcd(d, k) === 1) denominators.push(d);
  const d = pick(rng, denominators);
  const multiples = [];
  for (let p = 1; p * k < d; p++) if (gcd(p, d) === 1) multiples.push(p * k);
  return { n: pick(rng, multiples), d };
}

/**
 * Řádek tabulky parametrů pro úroveň obtížnosti 1–5 (`table[0]` = úroveň 1). Úroveň mimo rozsah se ořízne
 * do 1–5, nečíselná hodnota (undefined, NaN, text) znamená úroveň 1.
 */
export function levelOf(table, level) {
  const n = Math.trunc(Number(level));
  return table[(Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 1) - 1];
}

const pairCache = new Map();

/**
 * Uspořádané dvojice různých jmenovatelů z <2, maxD>, jejichž společný jmenovatel nepřesahuje `maxCommon`
 * (s `coprimeOnly` jen nesoudělné dvojice). Výsledek je pro stejné argumenty sdílený, nemodifikuj ho.
 */
export function denominatorPairs(maxD, maxCommon, coprimeOnly = false) {
  const key = `${maxD}/${maxCommon}/${coprimeOnly}`;
  if (!pairCache.has(key)) {
    const pairs = [];
    for (let a = 2; a <= maxD; a++) {
      for (let b = 2; b <= maxD; b++) {
        if (a !== b && lcm(a, b) <= maxCommon && (!coprimeOnly || gcd(a, b) === 1)) pairs.push([a, b]);
      }
    }
    pairCache.set(key, pairs);
  }
  return pairCache.get(key);
}
