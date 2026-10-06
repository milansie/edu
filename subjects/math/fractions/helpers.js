import { gcd } from '../../../js/core/fraction.js';

/**
 * Pomocné funkce generátorů. Části zápisu (`parts`) popisují vykreslitelný výraz:
 * `{ t: 'frac', n, d } | { t: 'mixed', w, n, d } | { t: 'text', v }`.
 */
export const frac = (n, d) => ({ t: 'frac', n, d });
export const mixed = (w, n, d) => ({ t: 'mixed', w, n, d });
export const text = (v) => ({ t: 'text', v });

/** Zápis jako prostý text ("3/4 (· 4) ="), pro `aria-label` a výpis chyb bez rendereru. */
export function plainText(parts) {
  return parts
    .map((p) => {
      if (p.t === 'frac') return `${p.n}/${p.d}`;
      if (p.t === 'mixed') return `${p.w} ${p.n}/${p.d}`;
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
