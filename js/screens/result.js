import { h } from '../ui/dom.js';
import { starsFor } from '../core/round.js';
import { renderParts } from '../ui/math.js';
import { pickResultQuip } from '../quips.js';

const VERDICTS = {
  3: 'Výborně, takhle se to dělá.',
  2: 'Dobrá práce, chyby si ještě projdi.',
  1: 'Procvičování se vyplácí, zkus to ještě jednou.',
};
const CONFETTI_COLORS = ['--color-gold', '--color-green', '--color-red', '--color-purple', '--color-orange'];
const CONFETTI_COUNT = 28;

function confetti() {
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = h('i');
    piece.style.setProperty('--x', `${Math.round(Math.random() * 100)}%`);
    piece.style.setProperty('--c', `var(${CONFETTI_COLORS[i % CONFETTI_COLORS.length]})`);
    piece.style.setProperty('--d', `${(2 + Math.random() * 2).toFixed(2)}s`);
    piece.style.setProperty('--delay', `${(Math.random() * 0.8).toFixed(2)}s`);
    layer.append(piece);
  }
  return layer;
}

function wrongTextItem(q) {
  return h(
    'li',
    {},
    h('span', { class: 'wrong-prompt' }, q.prompt),
    h('span', { class: 'wrong-answer' }, q.answers.join(' / ')),
  );
}

/** Chybný generovaný příklad: pokyn, zadání, správná odpověď a postup řešení. */
function wrongMathItem(q) {
  return h(
    'li',
    { class: 'wrong-math' },
    q.task ? h('span', { class: 'wrong-task' }, q.task) : null,
    h('span', { class: 'wrong-prompt' }, renderParts(q.display.prompt)),
    h('span', { class: 'wrong-answer' }, renderParts(q.display.answer)),
    h('ul', { class: 'steps' }, q.display.steps.map((step) => h('li', {}, step))),
  );
}

/** Výsledek kola: skóre, hvězdy, chybná slova a akce. `summary` pochází z `round.summary()`. */
export function render(container, { summary, onRepeatWrong, onNewRound }) {
  const stars = starsFor(summary.correct, summary.total);
  const hasWrong = summary.wrong.length > 0;

  const children = [
    h(
      'div',
      { class: 'result-head' },
      h(
        'div',
        { class: 'stars', role: 'img', 'aria-label': `${stars} z 3 hvězd` },
        [1, 2, 3].map((n) => h('span', { class: n <= stars ? 'star' : 'star is-off' }, '★')),
      ),
      h('p', { class: 'score' }, `${summary.correct} / ${summary.total}`),
      h('p', { class: 'verdict' }, VERDICTS[stars]),
    ),
    h(
      'div',
      { class: 'mascot' },
      h('img', { class: 'mascot-image', src: 'assets/brajnik.svg', alt: 'Brajník', width: 16, height: 15 }),
      h('p', { class: 'speech-bubble' }, pickResultQuip(summary.total > 0 ? summary.correct / summary.total : 0)),
    ),
  ];

  if (hasWrong) {
    children.push(
      h(
        'section',
        { class: 'wrong-panel' },
        h('h3', { class: 'section-title' }, 'K procvičení'),
        h(
          'ul',
          { class: 'wrong-list' },
          summary.wrong.map((q) => (q.display ? wrongMathItem(q) : wrongTextItem(q))),
        ),
      ),
    );
  } else {
    children.push(h('div', { class: 'message-panel' }, 'Žádná chyba, všechno napoprvé.'));
  }

  children.push(
    h(
      'div',
      { class: 'result-actions' },
      hasWrong
        ? h('button', { type: 'button', class: 'btn btn-orange', onclick: () => onRepeatWrong() }, 'Zopakovat chybná')
        : null,
      h('button', { type: 'button', class: 'btn btn-green', onclick: () => onNewRound() }, 'Nové kolo'),
    ),
  );

  container.append(h('div', { class: 'result' }, stars === 3 ? confetti() : null, children));
}
