import { h } from '../ui/dom.js';

const SWIPE_THRESHOLD = 80;
const LONG_TEXT_LENGTH = 60;
const TAP_TOLERANCE = 10;

/**
 * Kartičky: tap/mezerník otočí, pak „Umím" / „Neumím" (tlačítka, swipe, šipky).
 * `options`: `{ sides?, onDone, onProgress }`. Vrací `unmount()`.
 */
export function mount(container, round, { sides, onDone, onProgress }) {
  let flipped = false;
  let card = null;
  let knowButton = null;
  let dontKnowButton = null;
  let hint = null;

  /** Text karty; dlouhý text dostane menší písmo. */
  function textEl(text) {
    return h('span', { class: text.length > LONG_TEXT_LENGTH ? 'card-text card-text--long' : 'card-text' }, text);
  }

  function render() {
    const question = round.current();
    flipped = false;
    onProgress?.(round.progress());

    const [from, to] = [...question.direction];
    card = h(
      'div',
      { class: 'card-wrap', role: 'button', tabindex: '0', 'aria-label': 'Otočit kartu' },
      h(
        'div',
        { class: 'card-inner' },
        h(
          'div',
          { class: 'card-face card-front' },
          h('span', { class: 'card-side' }, sides?.[from] ?? 'Otázka'),
          textEl(question.prompt),
        ),
        h(
          'div',
          { class: 'card-face card-back' },
          h('span', { class: 'card-side' }, sides?.[to] ?? 'Odpověď'),
          textEl(question.answers.join(' / ')),
        ),
      ),
    );
    attachPointer(card);

    hint = h('p', { class: 'hint' }, 'Klepni na kartu');
    dontKnowButton = h(
      'button',
      { type: 'button', class: 'btn btn-red', disabled: true, onclick: () => answer(false) },
      'Neumím',
    );
    knowButton = h(
      'button',
      { type: 'button', class: 'btn btn-green', disabled: true, onclick: () => answer(true) },
      'Umím',
    );

    container.replaceChildren(
      h('div', { class: 'game' }, card, hint, h('div', { class: 'action-row' }, dontKnowButton, knowButton)),
    );
  }

  function flip() {
    if (flipped) return;
    flipped = true;
    card.classList.add('is-flipped');
    knowButton.disabled = false;
    dontKnowButton.disabled = false;
    hint.textContent = 'Swipe vpravo = umím, vlevo = neumím';
  }

  function answer(correct) {
    if (!flipped || round.isDone()) return;
    round.answer(correct);
    if (round.isDone()) onDone();
    else render();
  }

  function attachPointer(el) {
    let startX = null;
    let dx = 0;

    const reset = () => {
      el.classList.remove('is-dragging');
      el.classList.add('is-returning');
      el.style.transform = '';
    };

    el.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      dx = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.remove('is-returning');
    });
    el.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      if (flipped && Math.abs(dx) > TAP_TOLERANCE) {
        el.classList.add('is-dragging');
        el.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
      }
    });
    el.addEventListener('pointerup', () => {
      if (startX === null) return;
      const distance = dx;
      startX = null;
      if (Math.abs(distance) <= TAP_TOLERANCE) {
        flip();
      } else if (flipped && Math.abs(distance) >= SWIPE_THRESHOLD) {
        answer(distance > 0);
        return;
      }
      reset();
    });
    el.addEventListener('pointercancel', () => {
      startX = null;
      reset();
    });
  }

  function onKeydown(e) {
    const onButton = e.target instanceof Element && e.target.closest('button');
    if ((e.key === ' ' || e.key === 'Enter') && !onButton) {
      e.preventDefault();
      flip();
    } else if (e.key === 'ArrowRight') {
      answer(true);
    } else if (e.key === 'ArrowLeft') {
      answer(false);
    }
  }

  document.addEventListener('keydown', onKeydown);
  render();

  return () => {
    document.removeEventListener('keydown', onKeydown);
    container.replaceChildren();
  };
}
