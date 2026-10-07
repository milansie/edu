import { normalize } from '../../js/core/normalize.js';
import { parseVocab } from './parse.js';

const FILE_PATTERN = /^[\w.-]+\.txt$/;
const itemCache = new Map();
let indexPromise = null;

async function fetchText(relativePath) {
  const response = await fetch(new URL(relativePath, import.meta.url));
  if (!response.ok) throw new Error(`Nepodařilo se načíst ${relativePath} (${response.status}).`);
  return response;
}

/** Načte `data/index.json` jednou; kategorie odkazující na neexistující téma přeskočí s varováním. */
function loadIndex() {
  indexPromise ??= fetchText('./data/index.json')
    .then((r) => r.json())
    .then(({ topics = [], categories = [] }) => {
      const topicIds = new Set(topics.map((t) => t.id));
      const valid = categories.filter((c) => {
        if (topicIds.has(c.topic)) return true;
        console.warn(`Kategorie ${c.id}: neznámé téma "${c.topic}".`);
        return false;
      });
      return { topics, categories: valid };
    });
  indexPromise.catch(() => {
    indexPromise = null;
  });
  return indexPromise;
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
  langs: { a: 'en', b: 'cs' },
  games: ['flashcards', 'choice', 'typing'],

  /** Vrací `[{ id, title, subtitle? }]` podle `data/index.json`. */
  async loadTopics() {
    const { topics } = await loadIndex();
    return topics.map(({ id, title, subtitle }) => ({ id, title, subtitle }));
  },

  /** Vrací `[{ id, title, topic }]` podle `data/index.json`. */
  async loadCategories() {
    const { categories } = await loadIndex();
    return categories.map(({ id, title, topic }) => ({ id, title, topic }));
  },

  /** Vrací položky zadaných kategorií v pořadí `categoryIds`. */
  async loadItems(categoryIds) {
    const { categories: list } = await loadIndex();
    const chosen = categoryIds.map((id) => list.find((c) => c.id === id)).filter(Boolean);
    const perCategory = await Promise.all(chosen.map(loadCategoryItems));
    return perCategory.flat();
  },
};
