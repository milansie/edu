import { h } from './ui/dom.js';
import { subjects, getSubject, getGame } from './registry.js';
import { createRound } from './core/round.js';
import { render as renderSubjects } from './screens/subjects.js';
import { render as renderSetup } from './screens/setup.js';
import { render as renderResult } from './screens/result.js';

const DIRECTIONS = { ab: ['ab'], ba: ['ba'], both: ['ab', 'ba'] };

const appEl = document.getElementById('app');
const loadedSubjects = new Map();
/** Stav sezení v paměti: nastavení per předmět, rozehrané kolo a jeho výsledek. */
const state = { settings: {}, play: null, result: null };
let cleanup = null;
let renderToken = 0;

function loadSubject(id) {
  if (!loadedSubjects.has(id)) loadedSubjects.set(id, getSubject(id).load());
  return loadedSubjects.get(id);
}

function navigate(hash) {
  location.hash = hash;
}

/** Přesměrování bez nového záznamu v historii (tlačítko Zpět se nezacyklí). */
function redirect(hash) {
  location.replace(hash);
}

function parseHash() {
  const [subjectId = null, screen = 'setup'] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { subjectId, screen };
}

/** Postaví rám obrazovky (header + obsah) a vrátí odkazy na jeho části. */
function buildShell({ title, backHash }) {
  const fill = h('div', { class: 'progress-fill' });
  const progress = h(
    'div',
    { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', hidden: true },
    fill,
  );
  const header = h(
    'header',
    { class: 'app-header' },
    backHash
      ? h('button', { type: 'button', class: 'btn btn-orange btn-icon', 'aria-label': 'Zpět', onclick: () => navigate(backHash) }, '←')
      : null,
    h('h1', { class: 'app-title' }, title),
    progress,
  );
  const screen = h('div', { class: 'screen' });
  appEl.replaceChildren(header, screen);

  const setProgress = ({ done, total }) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progress.hidden = false;
    fill.style.width = `${pct}%`;
    progress.setAttribute('aria-valuenow', String(pct));
  };
  return { screen, setProgress };
}

function showError(error) {
  console.error(error);
  const { screen } = buildShell({ title: 'edu', backHash: '#/' });
  screen.append(h('div', { class: 'message-panel' }, 'Něco se nepovedlo. Zkus to prosím znovu.'));
}

function defaultSettings(subject) {
  return { categoryIds: [], direction: 'both', gameId: subject.games[0], limit: subject.defaultLimit ?? 0 };
}

/** Nápověda kategorie, je-li vybraná právě jedna a předmět nápovědy nabízí. */
function hintFor(subject, settings) {
  return settings.categoryIds.length === 1 ? (subject.hintFor?.(settings.categoryIds[0]) ?? null) : null;
}

/** Sestaví kolo: generované příklady (matematika), nebo načtené položky vybraných kategorií, a přejde do hry. */
async function startRound(subject, settings) {
  if (subject.generate) {
    state.play = {
      subjectId: subject.id,
      settings: { ...settings },
      pool: null,
      hint: hintFor(subject, settings),
      round: createRound(subject.generate(settings.categoryIds, settings.limit), {
        limit: settings.limit,
        makeQuestion: subject.makeQuestion,
      }),
    };
    state.result = null;
    navigate(`#/${subject.id}/play`);
    return;
  }
  const [categories, selected] = await Promise.all([
    subject.loadCategories(),
    subject.loadItems(settings.categoryIds),
  ]);
  const all = await subject.loadItems(categories.map((c) => c.id));
  state.play = {
    subjectId: subject.id,
    settings: { ...settings },
    pool: { selected, all },
    hint: null,
    round: createRound(selected, { directions: DIRECTIONS[settings.direction], limit: settings.limit }),
  };
  state.result = null;
  navigate(`#/${subject.id}/play`);
}

function repeatWrong(subject) {
  const { settings } = state.play;
  const items = state.result.wrong.map((q) => q.item);
  state.play.round = createRound(items, {
    directions: DIRECTIONS[settings.direction],
    makeQuestion: subject.makeQuestion,
  });
  state.result = null;
  navigate(`#/${subject.id}/play`);
}

async function route() {
  const token = ++renderToken;
  cleanup?.();
  cleanup = null;

  try {
    const { subjectId, screen } = parseHash();

    if (!subjectId) {
      const shell = buildShell({ title: 'edu', backHash: null });
      renderSubjects(shell.screen, { subjects, onPick: (id) => navigate(`#/${id}/setup`) });
      return;
    }
    if (!getSubject(subjectId)?.load) {
      redirect('#/');
      return;
    }

    const subject = await loadSubject(subjectId);
    if (token !== renderToken) return;
    const setupHash = `#/${subjectId}/setup`;

    if (screen === 'play') {
      if (state.play?.subjectId !== subjectId || state.play.round.isDone()) {
        redirect(state.result ? `#/${subjectId}/result` : setupHash);
        return;
      }
      const game = await getGame(state.play.settings.gameId).load();
      if (token !== renderToken) return;
      const shell = buildShell({ title: subject.title, backHash: setupHash });
      const { round, pool, hint } = state.play;
      cleanup = game.mount(shell.screen, round, {
        sides: subject.sides,
        pool,
        hint,
        onProgress: shell.setProgress,
        onDone: () => {
          state.result = round.summary();
          navigate(`#/${subjectId}/result`);
        },
      });
      return;
    }

    if (screen === 'result') {
      if (!state.result) {
        redirect(setupHash);
        return;
      }
      const shell = buildShell({ title: 'Výsledek', backHash: setupHash });
      renderResult(shell.screen, {
        summary: state.result,
        onRepeatWrong: () => repeatWrong(subject),
        onNewRound: () => navigate(setupHash),
      });
      return;
    }

    const categories = await subject.loadCategories();
    if (token !== renderToken) return;
    state.settings[subjectId] ??= defaultSettings(subject);
    const settings = state.settings[subjectId];
    const shell = buildShell({ title: subject.title, backHash: '#/' });
    renderSetup(shell.screen, {
      subject,
      categories,
      games: subject.games.map(getGame),
      settings,
      onStart: () => startRound(subject, settings).catch(showError),
    });
  } catch (error) {
    if (token === renderToken) showError(error);
  }
}

window.addEventListener('hashchange', route);
route();
