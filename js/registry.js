/**
 * Jediné místo registrace předmětů a typů her.
 * Předmět: `{ id, title, icon, load() → subject }`, kde subject má tvar
 * `{ id, title, sides, langs?, games, loadTopics(), loadCategories(), loadItems(categoryIds) }`. Předmět s generovanými
 * příklady místo `loadItems` nabízí `generate(categoryIds, count)` a `makeQuestion(item)`; volitelně
 * `hintFor(categoryId)`, `limits`, `defaultLimit`, `allLabel`; bez `sides` se nenabízí směr.
 * Předmět bez `load` je připravovaný: zobrazí se jako neaktivní dlaždice a nejde otevřít.
 * Hra: `{ id, title, icon, load() → { mount(container, round, options) → unmount } }`.
 */
export const subjects = [
  {
    id: 'en',
    title: 'Angličtina',
    icon: 'EN',
    load: () => import('../subjects/en/subject.js').then((m) => m.subject),
  },
  {
    id: 'math',
    title: 'Matematika',
    icon: '1+1',
    load: () => import('../subjects/math/subject.js').then((m) => m.subject),
  },
];

export const games = [
  { id: 'flashcards', title: 'Kartičky', icon: '🃏', load: () => import('./games/flashcards.js') },
  { id: 'choice', title: 'Výběr ze 4', icon: '🎯', load: () => import('./games/choice.js') },
  { id: 'typing', title: 'Psaní', icon: '⌨️', load: () => import('./games/typing.js') },
  { id: 'write', title: 'Zápis', icon: '✏️', load: () => import('./games/write.js') },
];

export const getSubject = (id) => subjects.find((s) => s.id === id);
export const getGame = (id) => games.find((g) => g.id === id);
