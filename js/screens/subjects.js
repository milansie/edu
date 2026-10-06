import { h } from '../ui/dom.js';

/** Výběr předmětu: dlaždice podle registru; připravované předměty (bez `load`) jsou neaktivní. */
export function render(container, { subjects, onPick }) {
  container.append(
    h('h2', { class: 'hero' }, 'edu'),
    h('p', { class: 'hero-sub' }, 'Co si dnes procvičíme?'),
    h(
      'div',
      { class: 'tile-grid' },
      subjects.map((subject) =>
        h(
          'button',
          subject.load
            ? { type: 'button', class: 'btn btn-orange tile-stack', onclick: () => onPick(subject.id) }
            : { type: 'button', class: 'btn btn-orange tile-stack', disabled: '' },
          h('span', { class: 'tile-icon' }, subject.icon),
          subject.title,
          subject.load ? null : h('span', { class: 'tile-note' }, 'Už brzy'),
        ),
      ),
    ),
  );
}
