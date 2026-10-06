import { gcd, equalsValue, fromMixed, parseDecimal } from '../../js/core/fraction.js';

/**
 * Políčka odpovědi podle typu: `{ key, label, optional? }`. Typ `relation` nemá políčka
 * (odpovědí je znak `<` / `>`). U `reduced` lze vynechat jmenovatele = celé číslo.
 */
export const ANSWER_SLOTS = {
  reduced: [{ key: 'n', label: 'Čitatel' }, { key: 'd', label: 'Jmenovatel', optional: true }],
  mixed: [{ key: 'w', label: 'Celá část' }, { key: 'n', label: 'Čitatel' }, { key: 'd', label: 'Jmenovatel' }],
  'fraction-exact': [{ key: 'n', label: 'Čitatel' }, { key: 'd', label: 'Jmenovatel' }],
  fraction: [{ key: 'n', label: 'Čitatel' }, { key: 'd', label: 'Jmenovatel' }],
  integer: [{ key: 'v', label: 'Výsledek' }],
  decimal: [{ key: 'v', label: 'Výsledek' }],
  relation: [],
};

const WRONG = { status: 'wrong' };
const CORRECT = { status: 'correct' };
const wrong = (message) => ({ status: 'wrong', message });

const MSG_REDUCE = 'Správně, ale ještě zkrať';
const MSG_INTEGER = 'Zapiš jako celé číslo';
const MSG_PROPER = 'Zlomková část musí být menší než 1';
const MSG_ZERO = 'Jmenovatel nesmí být nula';

/** Přirozené číslo z řetězce číslic, jinak null (prázdný vstup, nečíselný znak). */
function num(text) {
  return /^\d+$/.test(String(text ?? '')) ? Number(text) : null;
}

/** Jsou vyplněna všechna povinná políčka (resp. je vybrán znak u `relation`)? */
export function isComplete(answerType, input) {
  if (answerType === 'relation') return input === '<' || input === '>';
  return (ANSWER_SLOTS[answerType] ?? []).every((s) => s.optional || String(input?.[s.key] ?? '') !== '');
}

/**
 * Vyhodnotí odpověď podle hodnoty, ne textu. `expected` a `input` mají tvar podle typu:
 * `reduced`/`fraction`/`fraction-exact` `{ n, d }` (u `input` řetězce), `mixed` `{ w, n, d }`,
 * `relation` znak, `integer` číslo (u `input` `{ v }`), `decimal` zlomek `{ n, d }` (u `input` `{ v }`).
 * Vrací `{ status: 'correct' | 'wrong', message? }`; `message` vysvětluje, proč hodnotově správná odpověď neprošla.
 */
export function evaluate(answerType, expected, input) {
  switch (answerType) {
    case 'reduced':
      return evalReduced(expected, input);
    case 'mixed':
      return evalMixed(expected, input);
    case 'fraction-exact':
      return evalExact(expected, input);
    case 'fraction':
      return evalFraction(expected, input);
    case 'relation':
      return input === expected ? CORRECT : WRONG;
    case 'integer':
      return num(input?.v) === expected ? CORRECT : WRONG;
    case 'decimal': {
      const value = parseDecimal(input?.v ?? '');
      return value && equalsValue(value, expected) ? CORRECT : WRONG;
    }
    default:
      throw new Error(`Neznámý typ odpovědi: ${answerType}`);
  }
}

function evalReduced(expected, input) {
  const n = num(input?.n);
  if (n === null) return WRONG;
  const d = String(input?.d ?? '') === '' ? 1 : num(input.d);
  if (d === null) return WRONG;
  if (d === 0) return wrong(MSG_ZERO);
  if (!equalsValue({ n, d }, expected)) return WRONG;
  if (expected.d === 1) return d === 1 && String(input?.d ?? '') === '' ? CORRECT : wrong(MSG_INTEGER);
  return gcd(n, d) === 1 ? CORRECT : wrong(MSG_REDUCE);
}

function evalMixed(expected, input) {
  const w = num(input?.w);
  const n = num(input?.n);
  const d = num(input?.d);
  if (w === null || n === null || d === null) return WRONG;
  if (d === 0) return wrong(MSG_ZERO);
  if (!equalsValue(fromMixed({ w, n, d }), fromMixed(expected))) return WRONG;
  if (n >= d) return wrong(MSG_PROPER);
  return gcd(n, d) === 1 ? CORRECT : wrong(MSG_REDUCE);
}

function evalExact(expected, input) {
  const n = num(input?.n);
  const d = num(input?.d);
  if (n === null || d === null) return WRONG;
  if (d === 0) return wrong(MSG_ZERO);
  if (n === expected.n && d === expected.d) return CORRECT;
  return equalsValue({ n, d }, expected) ? wrong('Rozšiř přesně zadaným číslem') : WRONG;
}

function evalFraction(expected, input) {
  const n = num(input?.n);
  const d = num(input?.d);
  if (n === null || d === null) return WRONG;
  if (d === 0) return wrong(MSG_ZERO);
  if (!equalsValue({ n, d }, expected)) return WRONG;
  return gcd(n, d) === 1 ? CORRECT : wrong(MSG_REDUCE);
}
