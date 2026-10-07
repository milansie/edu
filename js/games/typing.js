import { h } from '../ui/dom.js';
import { sidesOf } from '../core/round.js';
import { normalize } from '../core/normalize.js';
import { acceptedAnswers, checkTyped, diffMarks, normalizeAnswer } from '../core/answer.js';

const AUTO_NEXT_MS = 800;
const AUTO_NEXT_NOTE_MS = 1500;

/**
 * Psaní: odpověď se píše do políčka, Enter nebo „Zkontrolovat“ potvrdí, po chybě Enter = dál.
 * Tolerance (velikost písmen, a/an/to, závorky, diakritika v češtině, synonyma) řeší `core/answer.js`;
 * překlep o 1 znak je chyba s hláškou „Skoro!“ a zvýrazněnými písmeny.
 * `options`: `{ sides, langs, pool: { selected, all }, onDone, onProgress }`, kde `langs` je jazyk každé strany
 * (`{ a: 'en', b: 'cs' }`). Vrací `unmount()`.
 */
export function mount(container, round, { langs = {}, pool, onDone, onProgress, sides }) {
  let locked = false;
  let pendingNext = false;
  let timer = null;
  let input = null;
  let checkButton = null;
  let feedback = null;
  let solution = null;
  let nextButton = null;

  function render() {
    const question = round.current();
    const { source, target } = sidesOf(question.direction);
    locked = false;
    pendingNext = false;
    onProgress?.(round.progress());

    input = h('input', {
      type: 'text',
      class: 'typing-input',
      lang: langs[target],
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: 'done',
      'aria-label': `Odpověď (${sides?.[target] ?? ''})`,
    });
    checkButton = h('button', { type: 'button', class: 'btn btn-green', onclick: () => submit() }, 'Zkontrolovat');
    feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
    solution = h('div', { class: 'solution', hidden: true });
    nextButton = h('button', { type: 'button', class: 'btn btn-gold', hidden: true, onclick: () => next() }, 'Dál');

    container.replaceChildren(
      h(
        'div',
        { class: 'game game-typing' },
        h(
          'div',
          { class: 'prompt-card' },
          h('span', { class: 'card-side' }, sides?.[source] ?? ''),
          h('span', { class: 'card-text' }, question.prompt),
        ),
        input,
        checkButton,
        feedback,
        solution,
        nextButton,
      ),
    );
    input.focus();
  }

  function showSolution(question, result, typed, lang) {
    const label = h('span', { class: 'solution-label' }, 'Správně je:');
    const closest = result.closest;
    const lower = closest.toLowerCase();
    const original = Array.from(closest);
    const highlightable =
      result.near && Array.from(lower).length === original.length && normalizeAnswer(closest, lang) === lower.trim();
    if (highlightable) {
      const marks = diffMarks(typed, lower).map((m, i) => (m.wrong ? h('mark', {}, original[i]) : original[i]));
      solution.replaceChildren(label, ' ', h('span', { class: 'solution-text' }, marks));
    } else {
      const text = result.near ? closest : question.answers.join(' / ');
      solution.replaceChildren(label, ' ', h('span', { class: 'solution-text' }, text));
    }
    solution.hidden = false;
  }

  function submit() {
    if (locked || !normalize(input.value)) return;
    locked = true;
    const question = round.current();
    const lang = langs[sidesOf(question.direction).target];
    const result = checkTyped(input.value, acceptedAnswers(question, pool?.all), lang);
    const correct = result.status === 'correct';
    round.answer(correct);

    input.readOnly = true;
    input.classList.add(correct ? 'is-correct' : 'is-wrong');
    checkButton.hidden = true;
    pendingNext = true;

    if (correct) {
      const note = result.note === 'diacritics';
      feedback.textContent = note ? `Správně! Pozor na háčky a čárky: ${result.closest}` : 'Správně!';
      timer = setTimeout(next, note ? AUTO_NEXT_NOTE_MS : AUTO_NEXT_MS);
    } else {
      feedback.textContent = result.near ? 'Skoro!' : 'Tohle ne.';
      showSolution(question, result, normalizeAnswer(input.value, lang), lang);
      nextButton.hidden = false;
      nextButton.focus();
    }
  }

  function next() {
    if (!pendingNext) return;
    pendingNext = false;
    clearTimeout(timer);
    if (round.isDone()) onDone();
    else render();
  }

  function onKeydown(e) {
    if (e.key !== 'Enter' || e.repeat || e.isComposing) return;
    if (e.target !== input && e.target !== nextButton && e.target !== document.body) return;
    e.preventDefault();
    if (locked) next();
    else submit();
  }

  document.addEventListener('keydown', onKeydown);
  render();

  return () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKeydown);
    container.replaceChildren();
  };
}
