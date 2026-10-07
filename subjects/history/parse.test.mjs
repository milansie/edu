import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCards } from './parse.js';

test('parseCards: BOM a hlavička se přeskočí, řádky se oříznou', () => {
  const { items, errors } = parseCards('﻿Otázka;Odpověď\nKdo?; Římané \nKde?;V Itálii\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(items, [
    { a: ['Kdo?'], b: ['Římané'] },
    { a: ['Kde?'], b: ['V Itálii'] },
  ]);
});

test('parseCards: pole v uvozovkách může obsahovat oddělovač', () => {
  const { items, errors } = parseCards('Otázka;Odpověď\n"Co je to; a proč?";"Jedno; druhé"\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(items, [{ a: ['Co je to; a proč?'], b: ['Jedno; druhé'] }]);
});

test('parseCards: zdvojené uvozovky dávají jednu uvozovku', () => {
  const { items } = parseCards('Otázka;Odpověď\n"Řekl ""veni""";"Caesar ""vidi"""\n');
  assert.deepEqual(items, [{ a: ['Řekl "veni"'], b: ['Caesar "vidi"'] }]);
});

test('parseCards: CRLF a prázdné řádky', () => {
  const { items, errors } = parseCards('Otázka;Odpověď\r\n\r\nA;B\r\n   \r\nC;D\r\n');
  assert.deepEqual(errors, []);
  assert.equal(items.length, 2);
});

test('parseCards: konec řádku uvnitř uvozovek zůstane v poli a počítá se do čísel řádků', () => {
  const { items, errors } = parseCards('Otázka;Odpověď\n"A\nB";C\nchyba\n');
  assert.deepEqual(items, [{ a: ['A\nB'], b: ['C'] }]);
  assert.deepEqual(errors.map((e) => e.line), [4]);
});

test('parseCards: chybné řádky skončí v errors s číslem řádku a parsování pokračuje', () => {
  const { items, errors } = parseCards('Otázka;Odpověď\nbez odpovědi\nA;B;C\n;prázdná otázka\nOK;ano\n');
  assert.deepEqual(items, [{ a: ['OK'], b: ['ano'] }]);
  assert.deepEqual(errors.map((e) => e.line), [2, 3, 4]);
});

test('parseCards: neuzavřená uvozovka ve 2. poli skončí v errors a záznam se nezařadí', () => {
  const { items, errors } = parseCards('Otázka;Odpověď\nOK;ano\nKdo?;"Římané\n');
  assert.deepEqual(items, [{ a: ['OK'], b: ['ano'] }]);
  assert.deepEqual(errors, [{ line: 3, message: 'Neuzavřená uvozovka.' }]);
});

test('parseCards: oddělovač čárka podle hlavičky', () => {
  const { items } = parseCards('Otázka,Odpověď\nA,B\n');
  assert.deepEqual(items, [{ a: ['A'], b: ['B'] }]);
});

test('parseCards: prázdný vstup a jen hlavička', () => {
  assert.deepEqual(parseCards(''), { items: [], errors: [] });
  assert.deepEqual(parseCards(undefined), { items: [], errors: [] });
  assert.deepEqual(parseCards('Otázka;Odpověď'), { items: [], errors: [] });
});
