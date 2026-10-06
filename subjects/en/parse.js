/**
 * Parser textového formátu slovíček. Řádek `anglicky | varianta = česky | varianta`,
 * `#` začíná komentář, prázdné řádky se ignorují, `=` dělí strany (první výskyt),
 * `|` dělí přijatelné tvary. Neplatný řádek skončí v `errors` a parsování pokračuje.
 * Vrací `{ items: [{ a: string[], b: string[] }], errors: [{ line, message }] }`.
 */
export function parseVocab(text) {
  const items = [];
  const errors = [];
  const lines = String(text ?? '').split(/\r?\n/);

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;

    const eq = line.indexOf('=');
    if (eq < 0) {
      errors.push({ line: index + 1, message: 'Chybí znak "=" mezi anglickou a českou stranou.' });
      return;
    }

    const a = splitForms(line.slice(0, eq));
    const b = splitForms(line.slice(eq + 1));
    if (a.length === 0 || b.length === 0) {
      errors.push({ line: index + 1, message: 'Jedna ze stran je prázdná.' });
      return;
    }
    items.push({ a, b });
  });

  return { items, errors };
}

function splitForms(side) {
  return side.split('|').map((s) => s.trim()).filter((s) => s !== '');
}
