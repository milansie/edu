import { h } from '../ui/dom.js';

/** Počet kategorií česky s ohledem na skloňování. */
function categoryCount(n) {
  if (n === 1) return '1 kategorie';
  return n >= 2 && n <= 4 ? `${n} kategorie` : `${n} kategorií`;
}

/** Výběr tématu předmětu: dlaždice s názvem, volitelným podtitulem a počtem kategorií. */
export function render(container, { topics, categories, onPick }) {
  container.append(
    h('h2', { class: 'hero' }, 'Téma'),
    h(
      'div',
      { class: 'tile-grid' },
      topics.map((topic) =>
        h(
          'button',
          { type: 'button', class: 'btn btn-orange tile-stack', onclick: () => onPick(topic.id) },
          topic.title,
          topic.subtitle ? h('span', { class: 'tile-note' }, topic.subtitle) : null,
          h('span', { class: 'tile-note' }, categoryCount(categories.filter((c) => c.topic === topic.id).length)),
        ),
      ),
    ),
  );
}
