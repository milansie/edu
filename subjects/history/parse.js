/**
 * Parser CSV kartiček (export z NotebookLM): první řádek je hlavička `Otázka;Odpověď`, oddělovač
 * se zjistí z hlavičky (`;`, jinak `,`). Pole mohou být v uvozovkách (`""` = uvozovka) a obsahovat
 * oddělovač i konec řádku; UTF-8 BOM a CRLF se tolerují, prázdné řádky se ignorují.
 * Neplatný řádek (špatný počet polí, prázdná strana, neuzavřená uvozovka na konci souboru) skončí v `errors` a parsování pokračuje.
 * Vrací `{ items: [{ a: [otázka], b: [odpověď] }], errors: [{ line, message }] }`,
 * `line` je 1-based číslo řádku, na kterém záznam začíná.
 */
export function parseCards(text) {
  const source = String(text ?? '').replace(/^﻿/, '');
  const items = [];
  const errors = [];

  const newline = source.search(/\r?\n/);
  const header = newline < 0 ? source : source.slice(0, newline);
  const delimiter = header.includes(';') ? ';' : ',';

  let line = 1;
  let recordLine = 1;
  let fields = [];
  let field = '';
  let quoted = false;
  let recordStarted = false;
  let headerDone = false;

  const endRecord = () => {
    fields.push(field);
    const blank = fields.length === 1 && fields[0].trim() === '';
    if (!blank) {
      if (!headerDone) {
        headerDone = true;
      } else if (fields.length !== 2) {
        errors.push({ line: recordLine, message: `Očekávány 2 pole, nalezeno ${fields.length}.` });
      } else {
        const [q, a] = fields.map((f) => f.trim());
        if (q === '' || a === '') errors.push({ line: recordLine, message: 'Jedna ze stran je prázdná.' });
        else items.push({ a: [q], b: [a] });
      }
    }
    fields = [];
    field = '';
    recordStarted = false;
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (!recordStarted) {
      recordStarted = true;
      recordLine = line;
    }
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        if (ch === '\n') line++;
        field += ch;
      }
    } else if (ch === '"' && field.trim() === '') {
      field = '';
      quoted = true;
    } else if (ch === delimiter) {
      fields.push(field);
      field = '';
    } else if (ch === '\n') {
      endRecord();
      line++;
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (quoted) errors.push({ line: recordLine, message: 'Neuzavřená uvozovka.' });
  else if (recordStarted) endRecord();

  return { items, errors };
}
