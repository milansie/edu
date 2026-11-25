import { h } from './dom.js';

/**
 * Zlomek s čitatelem nad jmenovatelem. `numerator` a `denominator` jsou libovolné děti
 * (text, číslo nebo Node, např. políčko odpovědi).
 */
export function fractionNode(numerator, denominator) {
  return h(
    'span',
    { class: 'frac' },
    h('span', { class: 'frac-n' }, numerator),
    h('span', { class: 'frac-d' }, denominator),
  );
}

function renderPart(part) {
  if (part.t === 'frac') return fractionNode(part.n, part.d);
  if (part.t === 'mixed') return h('span', { class: 'mixed' }, h('span', { class: 'mixed-w' }, part.w), fractionNode(part.n, part.d));
  if (part.t === 'compound') {
    const node = fractionNode(part.n.map(renderPart), part.d.map(renderPart));
    node.classList.add('frac-compound');
    return node;
  }
  return h('span', { class: 'math-text' }, part.v);
}

/**
 * Vykreslí výraz z částí `{ t: 'frac', n, d } | { t: 'mixed', w, n, d } | { t: 'compound', n, d } | { t: 'text', v }`
 * do jednoho řádkového prvku; zlomky jsou pod sebou, smíšené číslo má celou část vlevo.
 */
export function renderParts(parts) {
  return h('span', { class: 'math-expr' }, parts.map(renderPart));
}
