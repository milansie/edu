import { h } from '../ui/dom.js';
import { isValidPin } from '../core/parental.js';

/** Pole pro PIN: čtyři číslice, na mobilu číselná klávesnice, znaky mimo číslice se zahazují. */
function pinField(label) {
  const input = h('input', {
    type: 'password',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    maxlength: '4',
    autocomplete: 'off',
    class: 'parent-pin',
    'aria-label': label,
    placeholder: label,
  });
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
  });
  return input;
}

function statsView(summary, { onContinue, onEnd }) {
  const actions = h('div', { class: 'parent-actions' });
  const confirmEnd = () => {
    const error = h('p', { class: 'parent-error', role: 'alert' });
    actions.replaceChildren(
      h('p', { class: 'parent-note' }, 'Opravdu ukončit kontrolu? Statistika se smaže.'),
      error,
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-red',
          onclick: () => {
            if (!onEnd()) error.textContent = 'Kontrolu se nepodařilo ukončit.';
          },
        },
        'Ano, ukončit',
      ),
      h('button', { type: 'button', class: 'btn btn-stone', onclick: showButtons }, 'Zrušit'),
    );
  };
  const showButtons = () =>
    actions.replaceChildren(
      h('button', { type: 'button', class: 'btn btn-green', onclick: onContinue }, 'Pokračovat'),
      h('button', { type: 'button', class: 'btn btn-red', onclick: confirmEnd }, 'Ukončit kontrolu'),
    );
  showButtons();

  const cell = (text, className) => h('td', { class: className }, text);
  return h(
    'div',
    { class: 'parent-stats' },
    h(
      'div',
      { class: 'message-panel parent-summary' },
      h('p', { class: 'parent-note' }, `Kontrola běží od ${new Date(summary.startedAt).toLocaleString('cs-CZ')}`),
      h('p', { class: 'parent-total' }, `${summary.percent} %`),
      h('p', { class: 'parent-note' }, `Příkladů: ${summary.total} · dobře: ${summary.correct} · špatně: ${summary.wrong}`),
    ),
    summary.rows.length === 0
      ? h('p', { class: 'parent-note parent-empty' }, 'Zatím žádné vyřešené příklady.')
      : h(
          'div',
          { class: 'parent-table-wrap' },
          h(
            'table',
            { class: 'parent-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Kategorie'), h('th', {}, 'Celkem'), h('th', {}, 'Dobře'), h('th', {}, 'Špatně'))),
            h(
              'tbody',
              {},
              summary.rows.map((row) =>
                h(
                  'tr',
                  {},
                  h('td', {}, h('span', { class: 'parent-path' }, `${row.subject} › ${row.topic}`), h('span', { class: 'parent-category' }, row.category)),
                  cell(row.total, 'parent-num'),
                  cell(row.correct, 'parent-num parent-ok'),
                  cell(row.wrong, 'parent-num parent-bad'),
                ),
              ),
            ),
          ),
        ),
    actions,
  );
}

/**
 * Rodičovská obrazovka. Bez session: dvojí zadání PINu a zahájení kontroly (`onStarted`). Se session: ověření PINu
 * a statistika s volbou pokračovat (`onContinue`) / ukončit (`onEnded`). Ověření žije jen v tomto renderu,
 * po odchodu z obrazovky se PIN vyžádá znovu. Vrací úklidovou funkci (zastaví odpočet zámku).
 */
export function render(container, { parental, onStarted, onContinue, onEnded }) {
  let timer = null;
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };

  const error = h('p', { class: 'parent-error', role: 'alert' });
  const panel = h('div', { class: 'parent-panel' });
  container.append(panel);

  const showStats = () => {
    const summary = parental.summary();
    if (!summary) {
      onEnded();
      return;
    }
    const onEnd = () => {
      if (!parental.end()) return false;
      onEnded();
      return true;
    };
    panel.replaceChildren(statsView(summary, { onContinue, onEnd }));
  };

  const form = (fields, submitLabel, intro, onSubmit) => {
    const submit = h('button', { type: 'submit', class: 'btn btn-green' }, submitLabel);
    const el = h('form', { class: 'message-panel parent-form', novalidate: true }, h('p', { class: 'parent-note' }, intro), fields, error, submit);
    el.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      try {
        await onSubmit(submit);
      } finally {
        if (timer === null) submit.disabled = false;
      }
    });
    panel.replaceChildren(el);
    fields[0]?.focus();
  };

  if (!parental.status().active) {
    const pin = pinField('PIN (4 číslice)');
    const again = pinField('PIN znovu');
    form(
      [pin, again],
      'Zahájit kontrolu',
      'Zvol si čtyřmístný PIN. Dítě ho nesmí znát; bude ho potřeba k zobrazení statistiky.',
      async () => {
        error.textContent = '';
        if (!isValidPin(pin.value)) {
          error.textContent = 'PIN musí mít přesně 4 číslice.';
        } else if (pin.value !== again.value) {
          error.textContent = 'PINy se neshodují.';
        } else if (await parental.start(pin.value)) {
          onStarted();
        } else {
          error.textContent = 'Kontrolu se nepodařilo zahájit (úložiště prohlížeče není dostupné).';
        }
      },
    );
    return stopTimer;
  }

  const pin = pinField('PIN');
  const showLock = (submit, retryAfterMs) => {
    stopTimer();
    const until = Date.now() + retryAfterMs;
    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        stopTimer();
        error.textContent = '';
        submit.disabled = false;
        return;
      }
      error.textContent = `Příliš mnoho pokusů. Zkus to znovu za ${left} s.`;
    };
    submit.disabled = true;
    tick();
    timer = setInterval(tick, 500);
  };
  form([pin], 'Odemknout', 'Zadej PIN rodičovské kontroly.', async (submit) => {
    error.textContent = '';
    const result = await parental.verify(pin.value);
    if (result.ok) {
      showStats();
    } else if (result.locked) {
      showLock(submit, result.retryAfterMs);
    } else {
      pin.value = '';
      error.textContent = `Špatný PIN. Zbývá pokusů: ${result.attemptsLeft}.`;
    }
  });
  return stopTimer;
}
