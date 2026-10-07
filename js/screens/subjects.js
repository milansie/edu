import { h } from '../ui/dom.js';
import { pickQuip } from '../quips.js';
import { renderSubjectName } from '../ui/nickname.js';

/** Výběr předmětu: dlaždice podle registru; připravované předměty (bez `load`) jsou neaktivní. */
export function render(container, { subjects, onPick }) {
  container.append(
    h('img', { class: 'hero-logo', src: 'assets/logo-brain.svg', alt: '', width: 16, height: 13 }),
    h(
      'h1',
      { class: 'hero brand', 'aria-label': 'Brajnkraft' },
      h('span', { class: 'brand-brajn' }, 'Brajn'),
      h('span', { class: 'brand-kraft' }, 'kraft'),
    ),
    h(
      'div',
      { class: 'mascot' },
      h('img', { class: 'mascot-image', src: 'assets/brajnik.svg', alt: 'Brajník', width: 16, height: 15 }),
      h('p', { class: 'speech-bubble' }, pickQuip()),
    ),
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
          subject.image
            ? h('img', { class: 'tile-image', src: subject.image.src, alt: '' })
            : h('span', { class: 'tile-icon' }, subject.icon),
          renderSubjectName(subject),
          subject.load ? null : h('span', { class: 'tile-note' }, 'Už brzy'),
        ),
      ),
    ),
  );
}
