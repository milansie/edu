import { h } from './dom.js';

/**
 * Název předmětu pro zobrazení: vizuálně přezdívka (`subject.nickname`), pro čtečky formální `subject.title`.
 * Část přezdívky `{ wrong, fix }` se vykreslí jako přeškrtnutý překlep s opravou nad ním.
 * Bez přezdívky vrátí prostý `title`. Vrací pole uzlů/řetězců vhodné jako potomky `h()`.
 */
export function renderSubjectName(subject) {
  if (!subject.nickname) return [subject.title];
  const parts = subject.nickname.map((part) =>
    typeof part === 'string'
      ? part
      : h('span', { class: 'typo' }, h('span', { class: 'typo-wrong' }, part.wrong), h('span', { class: 'typo-fix' }, part.fix)),
  );
  return [h('span', { 'aria-hidden': 'true' }, parts), h('span', { class: 'visually-hidden' }, subject.title)];
}
