import { shuffle } from '../../js/core/rng.js';
import { plainText } from '../math/fractions/helpers.js';
import { categories } from './density/index.js';

const TOPIC = 'density';
const TOPICS = [{ id: TOPIC, title: 'Hustota' }];
const DEFAULT_COUNT = 10;
const MAX_DUPLICATE_RETRIES = 20;

const byId = new Map(categories.map((c) => [c.id, c]));

/**
 * Adaptér předmětu fyzika: příklady se generují při každém kole (`generate`), nečtou se ze souboru.
 * Předmět nemá směry (`sides` chybí); odpovědi jsou čísla (`decimal`) a název materiálu (`text`).
 */
export const subject = {
  id: 'physics',
  title: 'Fyzika',
  games: ['write'],
  limits: [10, 20],
  defaultLimit: DEFAULT_COUNT,
  allLabel: 'Náhodně',
  levels: 5,
  defaultLevel: 1,

  /** Vrací `[{ id, title, subtitle? }]` témat předmětu. */
  async loadTopics() {
    return TOPICS;
  },

  /** Vrací `[{ id, title, topic }]` kategorií v pořadí nabídky. */
  async loadCategories() {
    return categories.map(({ id, title }) => ({ id, title, topic: TOPIC }));
  },

  /** Nápověda kategorie `{ rule, example }` nebo null pro neznámé id. */
  hintFor(categoryId) {
    return byId.get(categoryId)?.hint ?? null;
  },

  /**
   * Vygeneruje `count` příkladů (výchozí 10) z vybraných kategorií: kategorie se střídají
   * rovnoměrně a v náhodném pořadí, duplicitní zadání se přegenerují (nejvýš 20×). `level` je obtížnost 1–5
   * (mimo rozsah se ořízne, neplatná hodnota = 1), `rng` zdroj náhody (pro testy).
   */
  generate(categoryIds, count, { rng = Math.random, level = 1 } = {}) {
    const chosen = categoryIds.map((id) => byId.get(id)).filter(Boolean);
    if (chosen.length === 0) return [];
    const total = count > 0 ? count : DEFAULT_COUNT;
    const order = shuffle(Array.from({ length: total }, (_, i) => chosen[i % chosen.length]), rng);
    const seen = new Set();
    return order.map((category) => {
      let item = category.generate(rng, level);
      for (let retry = 0; seen.has(item.id) && retry < MAX_DUPLICATE_RETRIES; retry++) item = category.generate(rng, level);
      seen.add(item.id);
      return item;
    });
  },

  /**
   * Převede vygenerovanou položku na otázku kola
   * `{ item, task, prompt, answers, display, answerType, expected }`; `task` je pokyn kategorie („Spočítej hustotu“).
   */
  makeQuestion(item) {
    return {
      item,
      task: byId.get(item.category)?.task ?? '',
      prompt: plainText(item.display.prompt),
      answers: [plainText(item.display.answer)],
      display: item.display,
      answerType: item.answerType,
      expected: item.expected,
    };
  },
};
