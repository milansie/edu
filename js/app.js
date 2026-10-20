import { h } from './ui/dom.js';
import { renderSubjectName } from './ui/nickname.js';
import { subjects, getSubject, getGame } from './registry.js';
import { createRound } from './core/round.js';
import { render as renderSubjects } from './screens/subjects.js';
import { render as renderTopics } from './screens/topics.js';
import { render as renderSetup } from './screens/setup.js';
import { render as renderResult } from './screens/result.js';
import { render as renderParent } from './screens/parent.js';
import { createParental } from './core/parental.js';

const DIRECTIONS = { ab: ['ab'], ba: ['ba'], both: ['ab', 'ba'] };

/** Úložiště pro rodičovskou kontrolu; i samotný přístup k `localStorage` může vyhodit výjimku. */
function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem() {
        throw new Error('localStorage není dostupný');
      },
      setItem() {
        throw new Error('localStorage není dostupný');
      },
      removeItem() {
        throw new Error('localStorage není dostupný');
      },
    };
  }
}

const parental = createParental({ storage: safeStorage(), crypto: window.crypto });

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
  const parentalActive = backHash !== null && parental.status().active && parseHash().subjectId !== 'parent';
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
    parentalActive
      ? h(
          'button',
          { type: 'button', class: 'parent-indicator', 'aria-label': 'Rodičovská kontrola', title: 'Rodičovská kontrola', onclick: openParentOverlay },
          '🔒',
        )
      : null,
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

/** Zavře překryv rodičovské kontroly (je-li otevřený): úklid obrazovky, odpojení klávesové ochrany, návrat fokusu. */
let closeParentOverlay = null;

/**
 * Otevře rodičovskou obrazovku jako překryv nad aktuální obrazovkou. Hash ani DOM obrazovky pod ním se nemění,
 * takže rozehrané kolo běží dál (obrazovka pod ním je `inert`). PIN se ptá při každém otevření. Dokud je překryv otevřený, klávesy nedosáhnou
 * na herní posluchače na `document`; Escape překryv zavře.
 */
function openParentOverlay() {
  if (closeParentOverlay) return;
  const opener = document.activeElement;
  const screen = h('div', { class: 'screen' });
  const closeButton = h('button', { type: 'button', class: 'btn btn-orange btn-icon', 'aria-label': 'Zavřít', onclick: () => closeParentOverlay?.() }, '✕');
  const overlay = h(
    'div',
    { class: 'parent-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Rodičovská kontrola', tabindex: '-1' },
    h('div', { class: 'parent-overlay-inner' }, h('header', { class: 'app-header' }, closeButton, h('h1', { class: 'app-title' }, 'Rodič')), screen),
  );

  let cleanupScreen = null;
  const close = () => {
    closeParentOverlay = null;
    cleanupScreen?.();
    document.removeEventListener('keydown', onKeydownCapture, true);
    overlay.remove();
    appEl.inert = false;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  };
  // Zachytí klávesy mimo překryv (fokus na body), aby je nedostaly hry; Escape zavírá.
  const onKeydownCapture = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (!overlay.contains(e.target)) {
      e.stopPropagation();
    }
  };
  overlay.addEventListener('keydown', (e) => e.stopPropagation());
  closeParentOverlay = close;
  document.addEventListener('keydown', onKeydownCapture, true);
  document.body.append(overlay);
  // Hra pod překryvem nesmí přebírat fokus (auto-next timery) ani reagovat na Tab/Enter.
  appEl.inert = true;

  const end = () => {
    appEl.querySelector('.parent-indicator')?.remove();
    close();
  };
  cleanupScreen = renderParent(screen, { parental, onStarted: close, onContinue: close, onEnded: end });
  if (!screen.querySelector('input')) overlay.focus();
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

/** Titulky předmětu a tématu a mapa titulků kategorií pro rodičovskou kontrolu; při chybě načtení zůstanou jen id. */
async function loadTrackingMeta(subject, topicId) {
  const meta = { subjectTitle: getSubject(subject.id).title, topicTitle: topicId, categoryTitles: new Map() };
  try {
    const [topics, categories] = await Promise.all([subject.loadTopics(), subject.loadCategories()]);
    meta.topicTitle = topics.find((t) => t.id === topicId)?.title ?? topicId;
    for (const c of categories) meta.categoryTitles.set(c.id, c.title);
  } catch (error) {
    console.error(error);
  }
  return meta;
}

/**
 * Obalí `round.answer`, aby se první pokusy zapisovaly do rodičovské kontroly (bez session je zápis no-op).
 * Kategorie neznámá předmětu se nahradí tématem. Chyba zápisu hru nikdy neshodí.
 */
function trackAnswers(round, { subjectId, topicId, meta }) {
  const answer = round.answer;
  round.answer = (correct) => {
    const question = round.current();
    answer(correct);
    if (!question || question.retry) return;
    try {
      const rawId = question.item?.category;
      const categoryTitle = rawId === undefined ? undefined : meta.categoryTitles.get(rawId);
      parental.record({
        subjectId,
        subjectTitle: meta.subjectTitle,
        topicId,
        topicTitle: meta.topicTitle,
        categoryId: categoryTitle === undefined ? topicId : rawId,
        categoryTitle: categoryTitle ?? meta.topicTitle,
        correct,
      });
    } catch (error) {
      console.error(error);
    }
  };
  return round;
}

/** Sestaví kolo: generované příklady (matematika), nebo načtené položky vybraných kategorií, a přejde do hry. */
async function startRound(subject, topicId, settings) {
  const meta = await loadTrackingMeta(subject, topicId);
  const track = (round) => trackAnswers(round, { subjectId: subject.id, topicId, meta });
  if (subject.generate) {
    state.play = {
      subjectId: subject.id,
      topicId,
      settings: { ...settings },
      pool: null,
      hint: hintFor(subject, settings),
      meta,
      round: track(
        createRound(subject.generate(settings.categoryIds, settings.limit, { level: settings.level }), {
          limit: settings.limit,
          makeQuestion: subject.makeQuestion,
        }),
      ),
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
    meta,
    round: track(createRound(selected, { directions: DIRECTIONS[settings.direction], limit: settings.limit })),
  };
  state.result = null;
  navigate(`#/${subject.id}/${topicId}/play`);
}

function repeatWrong(subject) {
  const { settings, topicId } = state.play;
  const direction = subject.sides ? settings.direction : 'ab';
  const items = state.result.summary.wrong.map((q) => q.item);
  state.play.round = trackAnswers(
    createRound(items, {
      directions: DIRECTIONS[direction],
      makeQuestion: subject.makeQuestion,
    }),
    { subjectId: subject.id, topicId, meta: state.play.meta },
  );
  state.result = null;
  navigate(`#/${subject.id}/${topicId}/play`);
}

async function route() {
  const token = ++renderToken;
  closeParentOverlay?.();
  cleanup?.();
  cleanup = null;

  try {
    const { subjectId, topicId, screen } = parseHash();

    if (!subjectId) {
      const shell = buildShell({ title: null, backHash: null });
      const { available, active } = parental.status();
      renderSubjects(shell.screen, {
        subjects,
        onPick: (id) => navigate(`#/${id}`),
        parental: { available, active, onOpen: () => navigate('#/parent') },
      });
      return;
    }
    if (subjectId === 'parent') {
      if (!parental.status().available) {
        redirect('#/');
        return;
      }
      const shell = buildShell({ title: 'Rodič', backHash: '#/' });
      cleanup = renderParent(shell.screen, {
        parental,
        onStarted: () => navigate('#/'),
        onContinue: () => navigate('#/'),
        onEnded: () => navigate('#/'),
      });
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
