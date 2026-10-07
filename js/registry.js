/**
 * Jediné místo registrace předmětů a typů her.
 * Předmět: `{ id, title, icon, image?, nickname?, load() → subject }` (`image` = `{ src, alt }` postavy, `alt` je jméno postavy (metadata, jako alt textu se nepoužívá, protože obrázky jsou dekorativní); bez něj se zobrazí textová `icon`;
 * `nickname` = pole částí přezdívky: řetězec, nebo `{ wrong, fix }` pro přeškrtnutý překlep s opravou; bez něj se zobrazí `title`), kde subject má tvar
 * `{ id, title, sides, langs?, games, loadTopics(), loadCategories(), loadItems(categoryIds) }`. Předmět s generovanými
 * příklady místo `loadItems` nabízí `generate(categoryIds, count)` a `makeQuestion(item)`; volitelně
 * `hintFor(categoryId)`, `limits`, `defaultLimit`, `allLabel`; bez `sides` se nenabízí směr
 * a kola mají směr 'ab'; předmět s jedinou hrou v `games` nenabízí volbu hry.
 * Předmět bez `load` je připravovaný: zobrazí se jako neaktivní dlaždice a nejde otevřít.
 * Hra: `{ id, title, icon, load() → { mount(container, round, options) → unmount } }`.
 */
export const subjects = [
  {
    id: 'en',
    title: 'Angličtina',
    nickname: ['Engliš'],
    icon: 'EN',
    image: { src: 'assets/tea-rex.svg', alt: 'Tea Rex' },
    load: () => import('../subjects/en/subject.js').then((m) => m.subject),
  },
  {
    id: 'math',
    title: 'Matematika',
    nickname: ['Mat', { wrong: 'y', fix: 'i' }, 'ka'],
    icon: '1+1',
    image: { src: 'assets/kalkulatoro.svg', alt: 'Kalkulátoro Zlomkini' },
    load: () => import('../subjects/math/subject.js').then((m) => m.subject),
  },
  {
    id: 'history',
    title: 'Dějepis',
    nickname: ['Děják'],
    icon: 'DĚJ',
    image: { src: 'assets/pizzarius.svg', alt: 'Pizzarius Maximus' },
    load: () => import('../subjects/history/subject.js').then((m) => m.subject),
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
