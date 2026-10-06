import { shuffle } from '../../js/core/rng.js';
import { categories } from './fractions/index.js';
import { plainText } from './fractions/helpers.js';

const TOPIC = 'fractions';
const TOPICS = [{ id: TOPIC, title: 'Zlomky' }];
const DEFAULT_COUNT = 10;
const MAX_DUPLICATE_RETRIES = 20;

const byId = new Map(categories.map((c) => [c.id, c]));

/**
 * Adaptér předmětu matematika: příklady se generují při každém kole (`generate`), nečtou se ze souboru.
 * Předmět nemá směry (`sides` chybí).
 */
export const subject = {
  id: 'math',
  title: 'Matematika',
  games: ['write'],
  limits: [10, 20],
  defaultLimit: DEFAULT_COUNT,
  allLabel: 'Náhodně',

  /** Vrací `[{ id, title, subtitle? }]` témat předmětu. */
  async loadTopics() {
    return TOPICS;
  },

  /** Vrací `[{ id, title, topic }]` v pořadí pracovního listu. */
  async loadCategories() {
    return categories.map(({ id, title }) => ({ id, title, topic: TOPIC }));
  },

  /** Nápověda kategorie `{ rule, example }` (vzor jako `parts`) nebo null pro neznámé id. */
  hintFor(categoryId) {
    return byId.get(categoryId)?.hint ?? null;
  },

  /**
   * Vygeneruje `count` příkladů (výchozí 10) z vybraných kategorií: kategorie se střídají
   * rovnoměrně a v náhodném pořadí, duplicitní zadání se přegenerují (nejvýš 20×).
   */
  generate(categoryIds, count, rng = Math.random) {
    const chosen = categoryIds.map((id) => byId.get(id)).filter(Boolean);
    if (chosen.length === 0) return [];
    const total = count > 0 ? count : DEFAULT_COUNT;
    const order = shuffle(Array.from({ length: total }, (_, i) => chosen[i % chosen.length]), rng);
    const seen = new Set();
    return order.map((category) => {
      let item = category.generate(rng);
      for (let retry = 0; seen.has(item.id) && retry < MAX_DUPLICATE_RETRIES; retry++) item = category.generate(rng);
      seen.add(item.id);
      return item;
    });
  },

  /**
   * Převede vygenerovanou položku na otázku kola
   * `{ item, task, prompt, answers, display, answerType, expected }`; `task` je pokyn kategorie („Zkrať na základní tvar").
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
