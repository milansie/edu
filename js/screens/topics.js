import { h } from '../ui/dom.js';

/** Počet kategorií česky s ohledem na skloňování. */
function categoryCount(n) {
  if (n === 1) return '1 kategorie';
  return n >= 2 && n <= 4 ? `${n} kategorie` : `${n} kategorií`;
}

/** Výběr tématu předmětu: dlaždice s názvem, volitelným podtitulem a počtem kategorií; `image` (`{ src, alt }`) je postava předmětu vedle nadpisu: obrázek je dekorativní, jméno postavy (`alt`) se zobrazí pod ním jako text. */
export function render(container, { topics, categories, onPick, image = null }) {
  container.append(
    h(
      'div',
      { class: 'topic-head' },
      h('h2', { class: 'hero' }, 'Téma'),
      image
        ? h(
            'div',
            { class: 'topic-figure' },
            h('img', { class: 'topic-image', src: image.src, alt: '' }),
            image.alt ? h('span', { class: 'topic-image-name' }, image.alt) : null,
          )
        : null,
    ),
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
