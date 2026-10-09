import { h } from './ui/dom.js';
import { renderSubjectName } from './ui/nickname.js';
import { subjects, getSubject, getGame } from './registry.js';
import { createRound } from './core/round.js';
import { render as renderSubjects } from './screens/subjects.js';
import { render as renderTopics } from './screens/topics.js';
import { render as renderSetup } from './screens/setup.js';
import { render as renderResult } from './screens/result.js';

const DIRECTIONS = { ab: ['ab'], ba: ['ba'], both: ['ab', 'ba'] };

const appEl = document.getElementById('app');
const loadedSubjects = new Map();
/** Stav sezení v paměti: nastavení per předmět a téma (klíč `předmět/téma`), rozehrané kolo a jeho výsledek. */
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
  const [subjectId = null, topicId = null, screen = 'setup'] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { subjectId, topicId, screen };
}

/**
 * Postaví rám obrazovky (header + obsah) a vrátí odkazy na jeho části. `title` je text nebo uzly nadpisu; `null` nadpis vynechá.
 * `image` (`{ src }` z registru) přidá k nadpisu dekorativní postavu předmětu.
 */
function buildShell({ title, backHash, image = null }) {
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
    title === null
      ? null
      : h(
          'h1',
          { class: 'app-title' },
          image ? h('img', { class: 'app-title-image', src: image.src, alt: '' }) : null,
          title,
        ),
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
  const { screen } = buildShell({ title: 'Brajnkraft', backHash: '#/' });
  screen.append(h('div', { class: 'message-panel' }, 'Něco se nepovedlo. Zkus to prosím znovu.'));
}

function defaultSettings(subject) {
  const settings = { categoryIds: [], direction: subject.sides ? 'both' : 'ab', gameId: subject.games[0], limit: subject.defaultLimit ?? 0 };
  if (subject.levels) settings.level = subject.defaultLevel ?? 1;
  return settings;
}

/** Nápověda kategorie, je-li vybraná právě jedna a předmět nápovědy nabízí. */
function hintFor(subject, settings) {
  return settings.categoryIds.length === 1 ? (subject.hintFor?.(settings.categoryIds[0]) ?? null) : null;
}

/** Sestaví kolo: generované příklady (matematika), nebo načtené položky vybraných kategorií, a přejde do hry. */
async function startRound(subject, topicId, settings) {
  if (subject.generate) {
    state.play = {
      subjectId: subject.id,
      topicId,
      settings: { ...settings },
      pool: null,
      hint: hintFor(subject, settings),
      round: createRound(subject.generate(settings.categoryIds, settings.limit, { level: settings.level }), {
        limit: settings.limit,
        makeQuestion: subject.makeQuestion,
      }),
    };
    state.result = null;
    navigate(`#/${subject.id}/${topicId}/play`);
    return;
  }
  const [categories, selected] = await Promise.all([
    subject.loadCategories(),
    subject.loadItems(settings.categoryIds),
  ]);
  const all = await subject.loadItems(categories.map((c) => c.id));
  state.play = {
    subjectId: subject.id,
    topicId,
    settings: { ...settings },
    pool: { selected, all },
    hint: null,
    round: createRound(selected, { directions: DIRECTIONS[settings.direction], limit: settings.limit }),
  };
  state.result = null;
  navigate(`#/${subject.id}/${topicId}/play`);
}

function repeatWrong(subject) {
  const { settings, topicId } = state.play;
  const direction = subject.sides ? settings.direction : 'ab';
  const items = state.result.summary.wrong.map((q) => q.item);
  state.play.round = createRound(items, {
    directions: DIRECTIONS[direction],
    makeQuestion: subject.makeQuestion,
  });
  state.result = null;
  navigate(`#/${subject.id}/${topicId}/play`);
}

async function route() {
  const token = ++renderToken;
  cleanup?.();
  cleanup = null;

  try {
    const { subjectId, topicId, screen } = parseHash();

    if (!subjectId) {
      const shell = buildShell({ title: null, backHash: null });
      renderSubjects(shell.screen, { subjects, onPick: (id) => navigate(`#/${id}`) });
      return;
    }
    if (!getSubject(subjectId)?.load) {
      redirect('#/');
      return;
    }

    const subject = await loadSubject(subjectId);
    if (token !== renderToken) return;
    const entry = getSubject(subjectId);
    const subjectImage = entry.image ?? null;
    const topicsHash = `#/${subjectId}`;

    if (!topicId) {
      const [topics, categories] = await Promise.all([subject.loadTopics(), subject.loadCategories()]);
      if (token !== renderToken) return;
      const shell = buildShell({ title: renderSubjectName(entry), backHash: '#/', image: subjectImage });
      renderTopics(shell.screen, { topics, categories, image: subjectImage, onPick: (id) => navigate(`#/${subjectId}/${id}/setup`) });
      return;
    }

    const topics = await subject.loadTopics();
    if (token !== renderToken) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) {
      redirect(topicsHash);
      return;
    }
    const setupHash = `#/${subjectId}/${topicId}/setup`;
    const hasResult = state.result?.subjectId === subjectId && state.result.topicId === topicId;

    if (screen === 'play') {
      if (state.play?.subjectId !== subjectId || state.play.topicId !== topicId || state.play.round.isDone()) {
        redirect(hasResult ? `#/${subjectId}/${topicId}/result` : setupHash);
        return;
      }
      const game = await getGame(state.play.settings.gameId).load();
      if (token !== renderToken) return;
      const shell = buildShell({ title: renderSubjectName(entry), backHash: setupHash, image: subjectImage });
      const { round, pool, hint } = state.play;
      cleanup = game.mount(shell.screen, round, {
        sides: subject.sides,
        langs: subject.langs,
        pool,
        hint,
        image: subjectImage,
        onProgress: shell.setProgress,
        onDone: () => {
          state.result = { subjectId, topicId, summary: round.summary() };
          navigate(`#/${subjectId}/${topicId}/result`);
        },
      });
      return;
    }

    if (screen === 'result') {
      if (!hasResult) {
        redirect(setupHash);
        return;
      }
      const shell = buildShell({ title: 'Výsledek', backHash: setupHash, image: subjectImage });
      renderResult(shell.screen, {
        summary: state.result.summary,
        onRepeatWrong: () => repeatWrong(subject),
        onNewRound: () => navigate(setupHash),
      });
      return;
    }

    const categories = (await subject.loadCategories()).filter((c) => c.topic === topicId);
    if (token !== renderToken) return;
    const settingsKey = `${subjectId}/${topicId}`;
    state.settings[settingsKey] ??= defaultSettings(subject);
    const settings = state.settings[settingsKey];
    const shell = buildShell({ title: topic.title, backHash: topicsHash, image: subjectImage });
    renderSetup(shell.screen, {
      subject,
      categories,
      games: subject.games.map(getGame),
      settings,
      onStart: () => startRound(subject, topicId, settings).catch(showError),
    });
  } catch (error) {
    if (token === renderToken) showError(error);
  }
}

window.addEventListener('hashchange', route);
route();
