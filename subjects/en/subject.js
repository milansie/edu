import { normalize } from '../../js/core/normalize.js';
import { parseVocab } from './parse.js';

const FILE_PATTERN = /^[\w.-]+\.txt$/;
const itemCache = new Map();
let categoriesPromise = null;

async function fetchText(relativePath) {
  const response = await fetch(new URL(relativePath, import.meta.url));
  if (!response.ok) throw new Error(`Nepodařilo se načíst ${relativePath} (${response.status}).`);
  return response;
}

function loadCategoryList() {
  categoriesPromise ??= fetchText('./data/index.json').then((r) => r.json());
  return categoriesPromise;
}

async function loadCategoryItems(category) {
  if (!FILE_PATTERN.test(category.file)) throw new Error(`Neplatný název souboru: ${category.file}`);
  if (!itemCache.has(category.id)) {
    const promise = fetchText(`./data/${category.file}`)
      .then((r) => r.text())
      .then((text) => {
        const { items, errors } = parseVocab(text);
        for (const error of errors) console.warn(`${category.file}:${error.line} — ${error.message}`);
        return items.map(({ a, b }) => ({ id: `${category.id}:${normalize(a[0])}`, category: category.id, a, b }));
      });
    itemCache.set(category.id, promise);
    promise.catch(() => itemCache.delete(category.id));
  }
  return itemCache.get(category.id);
}

/** Adaptér předmětu angličtina: `a` = anglické tvary, `b` = české. */
export const subject = {
  id: 'en',
  title: 'Angličtina',
  sides: { a: 'EN', b: 'CZ' },
  games: ['flashcards', 'choice'],

  /** Vrací `[{ id, title, group }]` podle `data/index.json`. */
  async loadCategories() {
    const list = await loadCategoryList();
    return list.map(({ id, title, group }) => ({ id, title, group }));
  },

  /** Vrací položky zadaných kategorií v pořadí `categoryIds`. */
  async loadItems(categoryIds) {
    const list = await loadCategoryList();
    const chosen = categoryIds.map((id) => list.find((c) => c.id === id)).filter(Boolean);
    const perCategory = await Promise.all(chosen.map(loadCategoryItems));
    return perCategory.flat();
  },
};
