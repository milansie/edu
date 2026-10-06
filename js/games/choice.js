import { h } from '../ui/dom.js';
import { shuffle } from '../core/rng.js';
import { pickDistractors } from '../core/distractors.js';

const AUTO_NEXT_MS = 800;
const OPTION_COUNT = 4;

/**
 * Výběr ze 4: správná odpověď + až 3 distraktory, klávesy 1–4, Enter = dál.
 * `options`: `{ sides, pool: { selected, all }, onDone, onProgress }`. Vrací `unmount()`.
 */
export function mount(container, round, { sides, pool, onDone, onProgress }) {
  let locked = false;
  let pendingNext = false;
  let timer = null;
  let optionButtons = [];
  let choices = [];
  let feedback = null;
  let nextButton = null;

  function render() {
    const question = round.current();
    locked = false;
    pendingNext = false;
    onProgress?.(round.progress());

    const distractors = pickDistractors(
      question,
      {
        sameCategory: pool.all.filter((i) => i.category === question.item.category),
        selected: pool.selected,
        all: pool.all,
      },
      OPTION_COUNT - 1,
    );
    choices = shuffle([
      { text: question.answers[0], correct: true },
      ...distractors.map((text) => ({ text, correct: false })),
    ]);

    optionButtons = choices.map((choice, index) =>
      h(
        'button',
        { type: 'button', class: 'btn btn-stone option', onclick: () => choose(index) },
        h('span', { class: 'option-key' }, String(index + 1)),
        h('span', {}, choice.text),
      ),
    );
    feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
    nextButton = h('button', { type: 'button', class: 'btn btn-gold', hidden: true, onclick: () => next() }, 'Dál');

    container.replaceChildren(
      h(
        'div',
        { class: 'game' },
        h(
          'div',
          { class: 'prompt-card' },
          h('span', { class: 'card-side' }, sides[question.direction[0]]),
          h('span', { class: 'card-text' }, question.prompt),
        ),
        h('div', { class: 'options' }, optionButtons),
        feedback,
        nextButton,
      ),
    );
  }

  function choose(index) {
    if (locked || !choices[index]) return;
    locked = true;
    const question = round.current();
    const choice = choices[index];
    round.answer(choice.correct);

    optionButtons.forEach((button, i) => {
      button.classList.add('is-locked');
      if (choices[i].correct) button.classList.add('is-correct');
      else if (i === index) button.classList.add('is-wrong');
    });

    pendingNext = true;
    if (choice.correct) {
      feedback.textContent = 'Správně!';
      timer = setTimeout(next, AUTO_NEXT_MS);
    } else {
      feedback.textContent = `Správně: ${question.answers.join(' / ')}`;
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
    if (e.key === 'Enter' && locked) {
      e.preventDefault();
      next();
    } else if (/^[1-4]$/.test(e.key)) {
      choose(Number(e.key) - 1);
    }
  }

  document.addEventListener('keydown', onKeydown);
  render();

  return () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKeydown);
    container.replaceChildren();
  };
}
