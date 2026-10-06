import { normalize } from './normalize.js';
import { shuffle } from './rng.js';
import { sidesOf } from './round.js';

/**
 * Vybere až `n` textů špatných odpovědí pro otázku výběru ze 4.
 * Zdroje v pořadí: `sameCategory` → `selected` → `all` (pole položek).
 * Vyřadí položky, jejichž cílový text je správnou odpovědí, položky se shodným zdrojovým
 * textem (synonyma: stejný překlad) a duplicity. Vrací pole řetězců (první tvar cílové strany).
 */
export function pickDistractors(question, { sameCategory = [], selected = [], all = [] }, n = 3, rng = Math.random) {
  const { source, target } = sidesOf(question.direction);
  const correct = new Set(question.answers.map(normalize));
  const sourceForms = new Set(question.item[source].map(normalize));
  const used = new Set();
  const out = [];

  for (const pool of [sameCategory, selected, all]) {
    for (const candidate of shuffle(pool, rng)) {
      if (out.length >= n) return out;
      if (candidate === question.item) continue;
      const forms = candidate[target].map(normalize);
      if (forms.some((f) => correct.has(f) || used.has(f))) continue;
      if (candidate[source].some((f) => sourceForms.has(normalize(f)))) continue;
      used.add(forms[0]);
      out.push(candidate[target][0]);
    }
  }
  return out;
}
