/** Klíč v úložišti, pod kterým leží stav rodičovské kontroly. */
export const STORAGE_KEY = 'brajnkraft.parental';

/** Počet chybných pokusů o PIN, po kterém se zadávání zamkne. */
export const MAX_FAILED = 5;

/** Délka zámku po překročení `MAX_FAILED` v milisekundách. */
export const LOCK_MS = 60_000;

const VERSION = 1;
const PIN_PATTERN = /^\d{4}$/;

/** Je `pin` platný PIN (přesně 4 číslice)? */
export function isValidPin(pin) {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** `SHA-256(salt + pin)` jako hex řetězec. */
async function hashPin(crypto, salt, pin) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pin));
  return toHex(new Uint8Array(digest));
}

const isCount = (n) => Number.isInteger(n) && n >= 0;

/** Ověří tvar uloženého stavu; vrací jeho čistou kopii, nebo null, když je poškozený či má neznámou verzi. */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== VERSION) return null;
  const { startedAt, salt, pinHash, failed, lockedUntil, stats } = raw;
  if (!Number.isFinite(startedAt) || typeof salt !== 'string' || typeof pinHash !== 'string') return null;
  if (!isCount(failed) || !Number.isFinite(lockedUntil) || !stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const cleanStats = {};
  for (const [key, entry] of Object.entries(stats)) {
    if (!entry || typeof entry !== 'object') return null;
    const { subject, topic, category, total, correct } = entry;
    if (typeof subject !== 'string' || typeof topic !== 'string' || typeof category !== 'string') return null;
    if (!isCount(total) || !isCount(correct) || correct > total) return null;
    cleanStats[key] = { subject, topic, category, total, correct };
  }
  return { version: VERSION, startedAt, salt, pinHash, failed, lockedUntil, stats: cleanStats };
}

/**
 * Rodičovská kontrola: session chráněná 4místným PINem, během které se sčítají výsledky prvních pokusů
 * po předmětu › tématu › kategorii. Stav leží v `storage` (rozhraní `localStorage`) pod `STORAGE_KEY`.
 * `crypto` je Web Crypto (`subtle`, `getRandomValues`), `now()` vrací čas v ms. Všechny přístupy k úložišti
 * jsou chráněné: chyba úložiště se chová jako „žádná session" a nikdy se nepropaguje z `status`, `record`, `summary`, `end`.
 */
export function createParental({ storage, crypto, now = Date.now }) {
  function load() {
    try {
      const text = storage.getItem(STORAGE_KEY);
      return text ? sanitize(JSON.parse(text)) : null;
    } catch {
      return null;
    }
  }

  function save(state) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  /** Je úložiště použitelné (čtení i zápis)? Bez něj se funkce nenabízí. */
  function isAvailable() {
    try {
      const probe = `${STORAGE_KEY}.probe`;
      storage.setItem(probe, '1');
      storage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  return {
    /** `{ available, active }`: úložiště je použitelné / běží session. */
    status() {
      return { available: isAvailable(), active: load() !== null };
    },

    /** Zahájí session s daným PINem (přepíše případná stará data). Vrací true, nebo false, když PIN není platný či zápis selhal. */
    async start(pin) {
      if (!isValidPin(pin)) return false;
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const pinHash = await hashPin(crypto, salt, pin);
      return save({ version: VERSION, startedAt: now(), salt, pinHash, failed: 0, lockedUntil: 0, stats: {} });
    },

    /**
     * Ověří PIN. Vrací `{ ok, locked, retryAfterMs, attemptsLeft }`; během zámku se PIN neověřuje.
     * Po `MAX_FAILED` chybách za sebou nastaví zámek na `LOCK_MS`; správný PIN čítač vynuluje.
     */
    async verify(pin) {
      const state = load();
      if (!state) return { ok: false, locked: false, retryAfterMs: 0, attemptsLeft: 0 };
      const current = now();
      if (state.lockedUntil > current) {
        return { ok: false, locked: true, retryAfterMs: state.lockedUntil - current, attemptsLeft: 0 };
      }
      const ok = isValidPin(pin) && (await hashPin(crypto, state.salt, pin)) === state.pinHash;
      if (ok) {
        if (state.failed !== 0 || state.lockedUntil !== 0) save({ ...state, failed: 0, lockedUntil: 0 });
        return { ok: true, locked: false, retryAfterMs: 0, attemptsLeft: MAX_FAILED };
      }
      const failed = state.failed + 1;
      if (failed >= MAX_FAILED) {
        save({ ...state, failed: 0, lockedUntil: current + LOCK_MS });
        return { ok: false, locked: true, retryAfterMs: LOCK_MS, attemptsLeft: 0 };
      }
      save({ ...state, failed });
      return { ok: false, locked: false, retryAfterMs: 0, attemptsLeft: MAX_FAILED - failed };
    },

    /**
     * Zapíše výsledek prvního pokusu: `{ subjectId, subjectTitle, topicId, topicTitle, categoryId, categoryTitle, correct }`.
     * Bez session nebo při chybě úložiště nedělá nic; nikdy nevyhazuje výjimku.
     */
    record({ subjectId, subjectTitle, topicId, topicTitle, categoryId, categoryTitle, correct }) {
      try {
        const state = load();
        if (!state) return;
        const key = `${subjectId}/${topicId}/${categoryId}`;
        const entry = state.stats[key] ?? { subject: String(subjectTitle), topic: String(topicTitle), category: String(categoryTitle), total: 0, correct: 0 };
        entry.total++;
        if (correct) entry.correct++;
        state.stats[key] = entry;
        save(state);
      } catch {
        // zápis statistiky nesmí shodit hru
      }
    },

    /**
     * Agregace statistiky: `{ startedAt, total, correct, wrong, percent, rows }`, kde řádek je
     * `{ subject, topic, category, total, correct, wrong }` seřazený podle předmětu, tématu a kategorie. Bez session null.
     */
    summary() {
      const state = load();
      if (!state) return null;
      const rows = Object.values(state.stats)
        .map((e) => ({ ...e, wrong: e.total - e.correct }))
        .sort((a, b) => a.subject.localeCompare(b.subject, 'cs') || a.topic.localeCompare(b.topic, 'cs') || a.category.localeCompare(b.category, 'cs'));
      const total = rows.reduce((sum, r) => sum + r.total, 0);
      const correct = rows.reduce((sum, r) => sum + r.correct, 0);
      return { startedAt: state.startedAt, total, correct, wrong: total - correct, percent: total > 0 ? Math.round((correct / total) * 100) : 0, rows };
    },

    /** Ukončí session a smaže všechna její data. Vrací true, když data v úložišti nezůstala. */
    end() {
      try {
        storage.removeItem(STORAGE_KEY);
        return load() === null;
      } catch {
        return false;
      }
    },
  };
}
