import shortening from './shortening.js';
import toMixed from './to-mixed.js';
import fromMixed from './from-mixed.js';
import expanding from './expanding.js';
import comparing from './comparing.js';
import ofWhole from './of-whole.js';
import toDecimal from './to-decimal.js';

/**
 * Kategorie zlomků v pořadí pracovního listu. Kategorie:
 * `{ id, title, answerType, hint: { rule, example }, generate(rng) → položka }`.
 */
export const categories = [shortening, toMixed, fromMixed, expanding, comparing, ofWhole, toDecimal];
