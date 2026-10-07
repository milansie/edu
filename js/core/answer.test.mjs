import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAnswer,
  stripDiacritics,
  levenshtein,
  diffMarks,
  checkTyped,
  acceptedAnswers,
} from './answer.js';

test('normalizeAnswer: velká písmena, okrajové a vícenásobné mezery', () => {
  assert.equal(normalizeAnswer('  Theatre  ', 'en'), 'theatre');
  assert.equal(normalizeAnswer('get   a  Grade'), 'get a grade');
});

test('normalizeAnswer: a/an/to na začátku jen u en', () => {
  assert.equal(normalizeAnswer('a film', 'en'), 'film');
  assert.equal(normalizeAnswer('An apple', 'en'), 'apple');
  assert.equal(normalizeAnswer('to get', 'en'), 'get');
  assert.equal(normalizeAnswer('to get', 'cs'), 'to get');
  assert.equal(normalizeAnswer('a', 'en'), 'a');
});

test('normalizeAnswer: text v závorce a koncové tři tečky se ignorují', () => {
  assert.equal(normalizeAnswer('slevy (prodej, tržby)'), 'slevy');
  assert.equal(normalizeAnswer('look forward to...'), 'look forward to');
  assert.equal(normalizeAnswer('so far…'), 'so far');
});

test('normalizeAnswer: pomlčka je mezera', () => {
  assert.equal(normalizeAnswer('record-breaking', 'en'), 'record breaking');
});

test('stripDiacritics odstraní háčky a čárky', () => {
  assert.equal(stripDiacritics('kočka žluťoučký'), 'kocka zlutoucky');
});

test('levenshtein', () => {
  assert.equal(levenshtein('theatre', 'theatr'), 1);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});

test('diffMarks označí chybějící a zaměněné znaky v očekávaném slově', () => {
  const text = (marks) => marks.map((m) => (m.wrong ? `[${m.char}]` : m.char)).join('');
  assert.equal(text(diffMarks('theatr', 'theatre')), 'theatr[e]');
  assert.equal(text(diffMarks('thaatre', 'theatre')), 'th[e]atre');
  assert.equal(text(diffMarks('theeatre', 'theatre')), 'theatre');
  assert.equal(text(diffMarks('theatre', 'theatre')), 'theatre');
});

test('checkTyped: shoda po normalizaci je správně', () => {
  assert.deepEqual(checkTyped('Theatre ', ['theatre'], 'en'), { status: 'correct', closest: 'theatre' });
  assert.equal(checkTyped('to get', ['get'], 'en').status, 'correct');
  assert.equal(checkTyped('record breaking', ['record-breaking'], 'en').status, 'correct');
  assert.equal(checkTyped('slevy', ['slevy (prodej, tržby)'], 'cs').status, 'correct');
});

test('checkTyped: diakritika se u cs odpouští s poznámkou, u en ne', () => {
  const cs = checkTyped('kocka', ['kočka'], 'cs');
  assert.equal(cs.status, 'correct');
  assert.equal(cs.note, 'diacritics');
  assert.equal(cs.closest, 'kočka');
  assert.equal(checkTyped('café', ['cafe'], 'en').status, 'wrong');
});

test('checkTyped: překlep o 1 znak u dlouhého slova je chyba s near', () => {
  const result = checkTyped('theatr', ['theatre'], 'en');
  assert.equal(result.status, 'wrong');
  assert.equal(result.near, true);
  assert.equal(result.closest, 'theatre');
});

test('checkTyped: krátká slova a větší vzdálenost nemají near', () => {
  assert.equal(checkTyped('cta', ['cat'], 'en').near, undefined);
  assert.equal(checkTyped('ca', ['cat'], 'en').near, undefined);
  assert.equal(checkTyped('thear', ['theatre'], 'en').near, undefined);
  assert.equal(checkTyped('thear', ['theatre'], 'en').status, 'wrong');
});

test('checkTyped: kterákoliv z přijatelných odpovědí', () => {
  assert.equal(checkTyped('movie', ['film', 'movie'], 'en').status, 'correct');
});

const item = (id, a, b) => ({ id, category: 'c', a, b });

test('acceptedAnswers: synonyma se stejným zadáním', () => {
  const film = item('1', ['film'], ['film']);
  const movie = item('2', ['movie'], ['film']);
  const pool = [film, movie, item('3', ['cat'], ['kočka'])];
  const question = { item: movie, direction: 'ba', prompt: 'film', answers: ['movie'] };
  assert.deepEqual(acceptedAnswers(question, pool).sort(), ['film', 'movie']);
});

test('acceptedAnswers: směr EN→CZ bere tvary cílové strany', () => {
  const a = item('1', ['talented'], ['nadaný']);
  const b = item('2', ['Talented'], ['talentovaný']);
  const question = { item: a, direction: 'ab', prompt: 'talented', answers: ['nadaný'] };
  assert.deepEqual(acceptedAnswers(question, [a, b]).sort(), ['nadaný', 'talentovaný']);
});

test('acceptedAnswers: bez poolu jen tvary položky', () => {
  const a = item('1', ['cat'], ['kočka', 'kocour']);
  const question = { item: a, direction: 'ab', prompt: 'cat', answers: ['kočka', 'kocour'] };
  assert.deepEqual(acceptedAnswers(question), ['kočka', 'kocour']);
});

test('normalizeAnswer: rozložené znaky se skládají (NFC)', () => {
  assert.equal(normalizeAnswer('kocka'.replace('c', 'c\u030c'), 'cs'), 'ko\u010dka');
  assert.equal(checkTyped('ko\u010dka'.normalize('NFD'), ['ko\u010dka'], 'cs').note, undefined);
  assert.equal(checkTyped('caf\u00e9'.normalize('NFD'), ['caf\u00e9'], 'en').status, 'correct');
});

test('checkTyped: u cs se near počítá nad textem bez diakritiky', () => {
  const result = checkTyped('kocca', ['ko\u010dka'], 'cs');
  assert.equal(result.status, 'wrong');
  assert.equal(result.near, true);
  assert.equal(checkTyped('kocca', ['kocka'], 'en').near, true);
});
