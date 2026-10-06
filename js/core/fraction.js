/**
 * Aritmetika zlomků nad celými čísly. Zlomek je `{ n, d }` (čitatel, jmenovatel, d > 0),
 * smíšené číslo `{ w, n, d }` (celá část, čitatel, jmenovatel).
 */

const MAX_DECIMAL_DIGITS = 6;

/** Největší společný dělitel (nezáporný). */
export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Nejmenší společný násobek kladných čísel. */
export function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

/** Zlomek v základním tvaru (celé číslo má jmenovatel 1). */
export function reduce({ n, d }) {
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

/** Mají zlomky stejnou hodnotu (bez ohledu na tvar)? */
export function equalsValue(a, b) {
  return a.n * b.d === b.n * a.d;
}

/** Porovná hodnoty zlomků: -1 (a < b), 0, 1 (a > b). */
export function compare(a, b) {
  return Math.sign(a.n * b.d - b.n * a.d);
}

/** Zlomek → smíšené číslo (zlomková část může být 0). */
export function toMixed({ n, d }) {
  return { w: Math.floor(n / d), n: n % d, d };
}

/** Smíšené číslo → nezkrácený zlomek. */
export function fromMixed({ w, n, d }) {
  return { n: w * d + n, d };
}

/**
 * Převede zápis desetinného čísla ("0,75", "0.75", ",5", "3") na zlomek s jmenovatelem 10^k.
 * Vrací null pro neplatný zápis nebo více než 6 číslic v jedné části.
 */
export function parseDecimal(text) {
  const match = /^(\d*)(?:[.,](\d*))?$/.exec(String(text).trim());
  if (!match) return null;
  const [, whole = '', fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  if (whole.length > MAX_DECIMAL_DIGITS || fraction.length > MAX_DECIMAL_DIGITS) return null;
  return { n: Number(`${whole}${fraction}`), d: 10 ** fraction.length };
}

/** Zlomek s konečným desetinným rozvojem → text s desetinnou čárkou, bez nadbytečných nul ("0,75"). */
export function formatDecimal({ n, d }) {
  for (let k = 0; k <= MAX_DECIMAL_DIGITS; k++) {
    const scaled = n * 10 ** k;
    if (scaled % d !== 0) continue;
    const digits = String(scaled / d).padStart(k + 1, '0');
    return k === 0 ? digits : `${digits.slice(0, -k)},${digits.slice(-k)}`;
  }
  throw new Error(`Zlomek ${n}/${d} nemá konečný desetinný rozvoj do ${MAX_DECIMAL_DIGITS} míst.`);
}
