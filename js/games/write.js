import { h } from '../ui/dom.js';
import { fractionNode, renderParts } from '../ui/math.js';
import { ANSWER_SLOTS, evaluate, isComplete } from '../../subjects/math/check.js';

const AUTO_NEXT_MS = 800;
const MAX_LENGTH = 7;
const COMMA_TYPES = new Set(['decimal']);

/**
 * Hra „Zápis“: odpověď se zapisuje do políček podle typu odpovědi (celá část / čitatel / jmenovatel /
 * číslo) vlastní klávesnicí na obrazovce nebo fyzickou klávesnicí; u porovnávání dvěma tlačítky `<` `>`.
 * Otázka nese `answerType`, `expected` a `display` (viz subjects/math). `options`:
 * `{ hint, onDone, onProgress }`, kde `hint` je `{ rule, example }` nebo null. Vrací `unmount()`.
 */
export function mount(container, round, { hint, onDone, onProgress }) {
  let locked = false;
  let pendingNext = false;
  let timer = null;
  let question = null;
  let slots = [];
  let values = {};
  let active = null;
  let slotEls = new Map();
  let controls = null;
  let feedback = null;
  let solution = null;
  let nextButton = null;

  function render() {
    question = round.current();
    locked = false;
    pendingNext = false;
    onProgress?.(round.progress());

    slots = ANSWER_SLOTS[question.answerType] ?? [];
    values = Object.fromEntries(slots.map((s) => [s.key, '']));
    active = slots[0]?.key ?? null;
    slotEls = new Map(
      slots.map((s) => [
        s.key,
        h('div', {
          class: 'answer-slot',
          role: 'textbox',
          'aria-readonly': 'true',
          'aria-label': s.label,
          onclick: () => setActive(s.key),
        }),
      ]),
    );

    controls = question.answerType === 'relation' ? buildRelationPad() : buildKeypad();
    feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
    solution = h(
      'div',
      { class: 'solution', hidden: true },
      h('div', { class: 'solution-answer' }, h('span', { class: 'solution-label' }, 'Správně:'), renderParts(question.display.answer)),
      h('ul', { class: 'steps' }, question.display.steps.map((step) => h('li', {}, step))),
    );
    nextButton = h('button', { type: 'button', class: 'btn btn-gold', hidden: true, onclick: () => next() }, 'Dál');

    container.replaceChildren(
      h(
        'div',
        { class: 'game game-write' },
        hint ? buildHint() : null,
        h('div', { class: 'prompt-card', 'aria-label': question.prompt }, renderParts(question.display.prompt)),
        buildAnswerRow(),
        feedback,
        controls,
        solution,
        nextButton,
      ),
    );
    refreshSlots();
  }

  function buildHint() {
    return h(
      'div',
      { class: 'hint-card' },
      h('span', { class: 'hint-label' }, 'Vzor:'),
      renderParts(hint.example),
      h('p', { class: 'hint-rule' }, hint.rule),
    );
  }

  function buildAnswerRow() {
    const slot = (key) => slotEls.get(key);
    let content = [];
    switch (question.answerType) {
      case 'integer':
      case 'decimal':
        content = [slot('v')];
        break;
      case 'mixed':
        content = [slot('w'), fractionNode(slot('n'), slot('d'))];
        break;
      case 'relation':
        break;
      default:
        content = [fractionNode(slot('n'), slot('d'))];
    }
    return h('div', { class: 'answer-row' }, content);
  }

  function buildKeypad() {
    const key = (label, onclick, { cls = 'btn-stone', aria, disabled = false } = {}) =>
      h('button', { type: 'button', class: `btn ${cls} keypad-key`, 'aria-label': aria, disabled, onclick }, label);
    const digit = (d) => key(d, () => typeChar(d));
    return h(
      'div',
      { class: 'keypad' },
      digit('1'),
      digit('2'),
      digit('3'),
      key('⌫', backspace, { cls: 'btn-orange', aria: 'Smazat' }),
      digit('4'),
      digit('5'),
      digit('6'),
      key('⇄', () => moveSlot(1), { aria: 'Další políčko', disabled: slots.length < 2 }),
      digit('7'),
      digit('8'),
      digit('9'),
      key(',', () => typeChar(','), { aria: 'Desetinná čárka', disabled: !COMMA_TYPES.has(question.answerType) }),
      digit('0'),
      key('✓', submit, { cls: 'btn-green keypad-ok', aria: 'Potvrdit' }),
    );
  }

  function buildRelationPad() {
    return h(
      'div',
      { class: 'relation-pad' },
      ['<', '>'].map((sign) =>
        h('button', { type: 'button', class: 'btn btn-purple relation-key', onclick: () => submitRelation(sign) }, sign),
      ),
    );
  }

  function refreshSlots() {
    for (const [key, el] of slotEls) {
      el.textContent = values[key];
      el.classList.toggle('is-active', !locked && key === active);
    }
  }

  function setActive(key) {
    if (locked) return;
    active = key;
    refreshSlots();
  }

  function moveSlot(step) {
    if (locked || slots.length < 2) return;
    const index = slots.findIndex((s) => s.key === active);
    active = slots[(index + step + slots.length) % slots.length].key;
    refreshSlots();
  }

  function typeChar(ch) {
    if (locked || active === null) return;
    if (ch === ',' && (!COMMA_TYPES.has(question.answerType) || values[active].includes(','))) return;
    if (values[active].length >= MAX_LENGTH) return;
    values[active] += ch;
    refreshSlots();
  }

  function backspace() {
    if (locked || active === null) return;
    values[active] = values[active].slice(0, -1);
    refreshSlots();
  }

  function shake() {
    for (const el of slotEls.values()) {
      el.classList.remove('is-shake');
      void el.offsetWidth;
      el.classList.add('is-shake');
    }
  }

  function submit() {
    if (locked || slots.length === 0) return;
    if (!isComplete(question.answerType, values)) {
      shake();
      return;
    }
    finish(evaluate(question.answerType, question.expected, values));
  }

  function submitRelation(sign) {
    if (locked) return;
    finish(evaluate(question.answerType, question.expected, sign));
  }

  function finish(result) {
    locked = true;
    pendingNext = true;
    const correct = result.status === 'correct';
    round.answer(correct);
    for (const el of slotEls.values()) el.classList.add(correct ? 'is-correct' : 'is-wrong');
    refreshSlots();

    if (correct) {
      controls.classList.add('is-locked');
      feedback.textContent = 'Správně!';
      timer = setTimeout(next, AUTO_NEXT_MS);
    } else {
      controls.hidden = true;
      feedback.textContent = result.message ?? 'Tentokrát ne.';
      solution.hidden = false;
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
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (locked) next();
      else submit();
      return;
    }
    if (locked) return;
    if (/^\d$/.test(e.key)) {
      typeChar(e.key);
    } else if (e.key === ',' || e.key === '.') {
      typeChar(',');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
      if (slots.length < 2) return;
      e.preventDefault();
      const backwards = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey);
      moveSlot(backwards ? -1 : 1);
    } else if ((e.key === '<' || e.key === '>') && question.answerType === 'relation') {
      submitRelation(e.key);
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
