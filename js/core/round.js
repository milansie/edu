import { shuffle } from './rng.js';

/** Zdrojová a cílová strana položky podle směru: 'ab' = a → b, 'ba' = b → a. */
export function sidesOf(direction) {
  return direction === 'ba' ? { source: 'b', target: 'a' } : { source: 'a', target: 'b' };
}

function makeQuestion(item, directions, rng) {
  const direction = directions[Math.floor(rng() * directions.length)];
  const { source, target } = sidesOf(direction);
  return { item, direction, prompt: item[source][0], answers: [...item[target]] };
}

/**
 * Sestaví kolo z položek `{ id, category, a: string[], b: string[] }`.
 * `directions` – povolené směry ('ab', 'ba'), při více se losuje per otázka;
 * `limit` – maximální počet položek (0 = všechny), výběr je náhodný.
 * Chybně zodpovězená otázka se jednou vrátí na konec fronty; skóre počítá první pokus.
 */
export function createRound(items, { directions = ['ab'], limit = 0, rng = Math.random } = {}) {
  const dirs = directions.length > 0 ? directions : ['ab'];
  const shuffled = shuffle(items, rng);
  const chosen = limit > 0 ? shuffled.slice(0, limit) : shuffled;
  const queue = chosen.map((item) => makeQuestion(item, dirs, rng));
  const initialCount = queue.length;
  const results = [];
  let requeued = 0;
  let answered = 0;

  return {
    /** Aktuální otázka `{ item, direction, prompt, answers }` nebo null, když je kolo hotové. */
    current() {
      return queue[0] ?? null;
    },

    /** Zapíše výsledek aktuální otázky a posune frontu. */
    answer(correct) {
      const question = queue.shift();
      if (!question) throw new Error('Kolo je dokončené.');
      answered++;
      if (!question.retry) {
        results.push({ question, correct });
        if (!correct) {
          queue.push({ ...question, retry: true });
          requeued++;
        }
      }
    },

    isDone() {
      return queue.length === 0;
    },

    /** Průběh pro progress bar: počet zodpovězených otázek z celkového počtu včetně opakování. */
    progress() {
      return { done: answered, total: initialCount + requeued };
    },

    /** Skóre z prvních pokusů: `{ total, correct, wrong }`, `wrong` = otázky zodpovězené poprvé chybně. */
    summary() {
      return {
        total: initialCount,
        correct: results.filter((r) => r.correct).length,
        wrong: results.filter((r) => !r.correct).map((r) => r.question),
      };
    },
  };
}

/** Počet hvězdiček 1–3 podle úspěšnosti (≥ 90 % → 3, ≥ 60 % → 2, jinak 1). */
export function starsFor(correct, total) {
  if (total <= 0) return 1;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}
