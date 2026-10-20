import test from 'node:test';
import assert from 'node:assert/strict';
import { createParental, isValidPin, STORAGE_KEY, MAX_FAILED, LOCK_MS } from './parental.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    data,
  };
}

function setup(storage = memoryStorage()) {
  const clock = { t: 1_000_000 };
  const parental = createParental({ storage, crypto: globalThis.crypto, now: () => clock.t });
  return { storage, clock, parental };
}

const entry = (over = {}) => ({
  subjectId: 'math',
  subjectTitle: 'Matematika',
  topicId: 'fractions',
  topicTitle: 'Zlomky',
  categoryId: 'add-same',
  categoryTitle: 'Sčítání',
  correct: true,
  ...over,
});

test('isValidPin: přesně 4 číslice', () => {
  assert.equal(isValidPin('1234'), true);
  assert.equal(isValidPin('123'), false);
  assert.equal(isValidPin('12345'), false);
  assert.equal(isValidPin('12a4'), false);
  assert.equal(isValidPin(1234), false);
});

test('start: uloží jen sůl a hash, ne PIN', async () => {
  const { parental, storage } = setup();
  assert.equal(await parental.start('4821'), true);
  const text = storage.getItem(STORAGE_KEY);
  assert.ok(!text.includes('4821'));
  const state = JSON.parse(text);
  assert.equal(state.version, 1);
  assert.match(state.salt, /^[0-9a-f]{32}$/);
  assert.match(state.pinHash, /^[0-9a-f]{64}$/);
  assert.deepEqual(parental.status(), { available: true, active: true });
});

test('start: neplatný PIN session nezahájí', async () => {
  const { parental } = setup();
  assert.equal(await parental.start('12'), false);
  assert.equal(parental.status().active, false);
});

test('start: dvě session se stejným PINem mají různou sůl i hash', async () => {
  const a = setup();
  const b = setup();
  await a.parental.start('1111');
  await b.parental.start('1111');
  const sa = JSON.parse(a.storage.getItem(STORAGE_KEY));
  const sb = JSON.parse(b.storage.getItem(STORAGE_KEY));
  assert.notEqual(sa.salt, sb.salt);
  assert.notEqual(sa.pinHash, sb.pinHash);
});

test('verify: správný a špatný PIN', async () => {
  const { parental } = setup();
  await parental.start('4821');
  assert.equal((await parental.verify('4821')).ok, true);
  const bad = await parental.verify('0000');
  assert.equal(bad.ok, false);
  assert.equal(bad.locked, false);
  assert.equal(bad.attemptsLeft, MAX_FAILED - 1);
});

test('verify: po 5 chybách zámek, během zámku se PIN neověřuje, po uplynutí znovu', async () => {
  const { parental, clock } = setup();
  await parental.start('4821');
  for (let i = 0; i < MAX_FAILED - 1; i++) assert.equal((await parental.verify('0000')).locked, false);
  const locked = await parental.verify('0000');
  assert.equal(locked.locked, true);
  assert.equal(locked.retryAfterMs, LOCK_MS);

  clock.t += 10_000;
  const during = await parental.verify('4821');
  assert.equal(during.ok, false);
  assert.equal(during.locked, true);
  assert.equal(during.retryAfterMs, LOCK_MS - 10_000);

  clock.t += LOCK_MS;
  assert.equal((await parental.verify('4821')).ok, true);
});

test('verify: správný PIN vynuluje čítač chyb', async () => {
  const { parental, storage } = setup();
  await parental.start('4821');
  await parental.verify('0000');
  await parental.verify('0000');
  await parental.verify('4821');
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).failed, 0);
  assert.equal((await parental.verify('0000')).attemptsLeft, MAX_FAILED - 1);
});

test('verify: bez session neprojde', async () => {
  const { parental } = setup();
  assert.equal((await parental.verify('4821')).ok, false);
});

test('record + summary: agregace po předmětu › tématu › kategorii', async () => {
  const { parental } = setup();
  await parental.start('4821');
  parental.record(entry());
  parental.record(entry({ correct: false }));
  parental.record(entry());
  parental.record(entry({ categoryId: 'sub-same', categoryTitle: 'Odčítání' }));
  parental.record(entry({ subjectId: 'en', subjectTitle: 'Angličtina', topicId: 't', topicTitle: 'Téma', categoryId: 'c', categoryTitle: 'Kat', correct: false }));
  const s = parental.summary();
  assert.equal(s.total, 5);
  assert.equal(s.correct, 3);
  assert.equal(s.wrong, 2);
  assert.equal(s.percent, 60);
  assert.equal(s.rows.length, 3);
  assert.deepEqual(s.rows[0], { subject: 'Angličtina', topic: 'Téma', category: 'Kat', total: 1, correct: 0, wrong: 1 });
  const add = s.rows.find((r) => r.category === 'Sčítání');
  assert.deepEqual([add.total, add.correct, add.wrong], [3, 2, 1]);
});

test('summary: prázdná session má 0 %; bez session null', async () => {
  const { parental } = setup();
  assert.equal(parental.summary(), null);
  await parental.start('4821');
  const s = parental.summary();
  assert.equal(s.total, 0);
  assert.equal(s.percent, 0);
  assert.deepEqual(s.rows, []);
});

test('record bez session nic nezapíše', () => {
  const { parental, storage } = setup();
  parental.record(entry());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('end: smaže data', async () => {
  const { parental, storage } = setup();
  await parental.start('4821');
  parental.record(entry());
  assert.equal(parental.end(), true);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(parental.status().active, false);
});

test('poškozená nebo cizí data = žádná session', () => {
  const bad = [
    'není json',
    '{"version":2}',
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, startedAt: 1, salt: 's', pinHash: 'h', failed: 0, lockedUntil: 0, stats: { k: { subject: 'a', topic: 'b', category: 'c', total: 1, correct: 2 } } }),
    JSON.stringify({ version: 1, startedAt: 1, salt: 's', pinHash: 'h', failed: -1, lockedUntil: 0, stats: {} }),
    'null',
  ];
  for (const text of bad) {
    const { parental } = setup(memoryStorage({ [STORAGE_KEY]: text }));
    assert.equal(parental.status().active, false, text);
    assert.equal(parental.summary(), null);
  }
});

test('úložiště vyhazuje výjimky: nic se nerozbije, funkce není dostupná', async () => {
  const broken = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    },
    removeItem() {
      throw new Error('denied');
    },
  };
  const { parental } = setup(broken);
  assert.deepEqual(parental.status(), { available: false, active: false });
  assert.equal(await parental.start('4821'), false);
  assert.doesNotThrow(() => parental.record(entry()));
  assert.equal(parental.summary(), null);
  assert.equal(parental.end(), false);
});
