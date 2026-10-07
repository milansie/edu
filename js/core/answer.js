import { normalize } from './normalize.js';
import { sidesOf } from './round.js';

/** Nejmenší délka přijatelné odpovědi, od které se překlep o 1 znak hlásí jako „skoro“. */
const NEAR_MIN_LENGTH = 4;

/** Odstraní diakritiku (háčky, čárky): `kočka` → `kocka`. */
export function stripDiacritics(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Normalizace odpovědi pro porovnání: malá písmena, oříznuté a sloučené mezery, bez textu v závorce
 * a koncového `…`/`...`, pomlčka = mezera; pro `lang === 'en'` bez úvodního `a ` / `an ` / `to `.
 */
export function normalizeAnswer(text, lang) {
  const cleaned = String(text ?? '')
    .normalize('NFC')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/(…|\.{3})\s*$/, '')
    .replace(/-/g, ' ');
  const base = normalize(cleaned);
  return lang === 'en' ? base.replace(/^(a|an|to) (?=\S)/, '') : base;
}

function distanceTable(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows;
}

/** Levenshteinova vzdálenost (vložení, smazání, záměna) dvou řetězců. */
export function levenshtein(a, b) {
  const x = Array.from(a);
  const y = Array.from(b);
  return distanceTable(x, y)[x.length][y.length];
}

/**
 * Znaky řetězce `expected` s příznakem, zda se liší od zadání `input`:
 * `[{ char, wrong }]`. Chybějící a zaměněné znaky mají `wrong: true`, přebývající znaky v `input` se neukazují.
 */
export function diffMarks(input, expected) {
  const x = Array.from(input);
  const y = Array.from(expected);
  const rows = distanceTable(x, y);
  const marks = [];
  let i = x.length;
  let j = y.length;
  while (j > 0) {
    if (i > 0 && x[i - 1] === y[j - 1] && rows[i][j] === rows[i - 1][j - 1]) {
      marks.push({ char: y[j - 1], wrong: false });
      i--;
      j--;
    } else if (i > 0 && rows[i][j] === rows[i - 1][j - 1] + 1) {
      marks.push({ char: y[j - 1], wrong: true });
      i--;
      j--;
    } else if (rows[i][j] === rows[i][j - 1] + 1) {
      marks.push({ char: y[j - 1], wrong: true });
      j--;
    } else {
      i--;
    }
  }
  return marks.reverse();
}

/**
 * Vyhodnotí napsanou odpověď proti přijatelným odpovědím jazyka `lang`.
 * Vrací `{ status: 'correct' | 'wrong', note?: 'diacritics', near?: true, closest }`:
 * `note: 'diacritics'` – česká odpověď bez diakritiky (uznává se); `near` – chyba o jediný znak
 * u odpovědi od 4 znaků; `closest` – nejbližší přijatelná odpověď v původním tvaru (u `correct` ta, která se shodla).
 */
export function checkTyped(input, accepted, lang) {
  const typed = normalizeAnswer(input, lang);
  const candidates = accepted.map((text) => ({ text, norm: normalizeAnswer(text, lang) })).filter((c) => c.norm);

  const exact = candidates.find((c) => c.norm === typed);
  if (exact) return { status: 'correct', closest: exact.text };

  if (lang === 'cs') {
    const bare = stripDiacritics(typed);
    const loose = candidates.find((c) => stripDiacritics(c.norm) === bare);
    if (loose) return { status: 'correct', note: 'diacritics', closest: loose.text };
  }

  let closest = null;
  let best = Infinity;
  const fold = lang === 'cs' ? stripDiacritics : (text) => text;
  for (const candidate of candidates) {
    const distance = levenshtein(fold(typed), fold(candidate.norm));
    if (distance < best) {
      best = distance;
      closest = candidate;
    }
  }
  const result = { status: 'wrong', closest: closest?.text ?? '' };
  if (closest && best === 1 && closest.norm.length >= NEAR_MIN_LENGTH) result.near = true;
  return result;
}

/**
 * Všechny uznávané odpovědi na otázku: tvary cílové strany položky + tvary cílové strany jiných položek
 * z `poolItems`, jejichž zdrojový tvar se po normalizaci shoduje se zadáním (synonyma).
 */
export function acceptedAnswers(question, poolItems = []) {
  const { source, target } = sidesOf(question.direction);
  const prompt = normalizeAnswer(question.prompt);
  const accepted = [...question.item[target]];
  for (const other of poolItems) {
    if (other.id === question.item.id) continue;
    if (other[source].some((form) => normalizeAnswer(form) === prompt)) accepted.push(...other[target]);
  }
  return [...new Set(accepted)];
}
