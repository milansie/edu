import { h } from '../ui/dom.js';

const DEFAULT_LIMITS = [
  { value: 0, label: 'Vše' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
];

/**
 * Nastavení kola pro kategorie jednoho tématu (`categories`). Předmět může volitelně dodat `limits` (počty otázek), `allLabel` (text dlaždice „Vše“)
 * a vynechat `sides` (pak se nenabízí směr). Má-li předmět `levels`, nabídne se posuvník obtížnosti 1–`levels`. `settings` (`{ categoryIds, direction, gameId, limit, level? }`) se mění přímo,
 * takže při návratu na obrazovku zůstane výběr zachován.
 */
export function render(container, { subject, categories, games, settings, onStart }) {
  const bindings = [];
  const bind = (el, isOn) => {
    bindings.push({ el, isOn });
    return el;
  };
  const refresh = () => {
    for (const { el, isOn } of bindings) {
      const on = isOn();
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', String(on));
    }
    startButton.disabled = settings.categoryIds.length === 0;
  };
  const tile = (label, isOn, onToggle, extraClass = '') =>
    bind(
      h(
        'button',
        {
          type: 'button',
          class: `btn btn-stone tile ${extraClass}`.trim(),
          onclick: () => {
            onToggle();
            refresh();
          },
        },
        label,
      ),
      isOn,
    );

  const allIds = categories.map((c) => c.id);
  const allSelected = () => allIds.every((id) => settings.categoryIds.includes(id));
  const toggleCategory = (id) => {
    const set = new Set(settings.categoryIds);
    if (!set.delete(id)) set.add(id);
    settings.categoryIds = allIds.filter((cid) => set.has(cid));
  };

  const categorySection = h(
    'section',
    {},
    h('h3', { class: 'section-title' }, 'Kategorie'),
    h(
      'div',
      { class: 'tile-grid' },
      tile(subject.allLabel ?? 'Vše', allSelected, () => {
        settings.categoryIds = allSelected() ? [] : [...allIds];
      }),
    ),
    h(
      'div',
      { class: 'tile-grid' },
      categories.map((c) =>
        tile(
          c.title,
          () => settings.categoryIds.includes(c.id),
          () => toggleCategory(c.id),
        ),
      ),
    ),
  );

  const limits = subject.limits ? subject.limits.map((n) => ({ value: n, label: String(n) })) : DEFAULT_LIMITS;
  const directions = subject.sides
    ? [
        { value: 'ab', label: `${subject.sides.a} → ${subject.sides.b}` },
        { value: 'ba', label: `${subject.sides.b} → ${subject.sides.a}` },
        { value: 'both', label: 'Oba' },
      ]
    : [];
  const directionSection = h(
    'section',
    {},
    h('h3', { class: 'section-title' }, 'Směr'),
    h(
      'div',
      { class: 'tile-grid cols-3' },
      directions.map((d) =>
        tile(
          d.label,
          () => settings.direction === d.value,
          () => {
            settings.direction = d.value;
          },
        ),
      ),
    ),
  );

  const gameSection = h(
    'section',
    {},
    h('h3', { class: 'section-title' }, 'Hra'),
    h(
      'div',
      { class: 'tile-grid' },
      games.map((g) =>
        bind(
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-stone tile tile-stack',
              onclick: () => {
                settings.gameId = g.id;
                refresh();
              },
            },
            h('span', { class: 'tile-icon' }, g.icon),
            g.title,
          ),
          () => settings.gameId === g.id,
        ),
      ),
    ),
  );

  const limitSection = h(
    'section',
    {},
    h('h3', { class: 'section-title' }, 'Počet otázek'),
    h(
      'div',
      { class: 'tile-grid cols-3' },
      limits.map((l) =>
        tile(
          l.label,
          () => settings.limit === l.value,
          () => {
            settings.limit = l.value;
          },
        ),
      ),
    ),
  );

  const levelSlider = h('input', {
    type: 'range',
    class: 'level-slider',
    min: 1,
    max: subject.levels,
    step: 1,
    value: settings.level,
    'aria-label': 'Obtížnost',
    oninput: (e) => {
      settings.level = Number(e.target.value);
      refreshLevel();
    },
  });
  const levelTicks = Array.from({ length: subject.levels ?? 0 }, (_, i) => h('span', {}, String(i + 1)));
  const refreshLevel = () => {
    levelTicks.forEach((tick, i) => tick.classList.toggle('is-on', i + 1 === settings.level));
  };
  const levelSection = h(
    'section',
    {},
    h('h3', { class: 'section-title' }, 'Obtížnost'),
    h('div', { class: 'level-picker' }, levelSlider, h('div', { class: 'level-ticks', 'aria-hidden': 'true' }, levelTicks)),
  );

  const startButton = h(
    'button',
    { type: 'button', class: 'btn btn-green', onclick: () => onStart() },
    'Hrát',
  );

  container.append(
    h(
      'div',
      { class: 'scroll-area' },
      categorySection,
      subject.sides ? directionSection : null,
      games.length > 1 ? gameSection : null,
      subject.levels ? levelSection : null,
      limitSection,
    ),
    h('div', { class: 'screen-footer' }, startButton),
  );
  refresh();
  if (subject.levels) refreshLevel();
}
