# Roadmap

Specifikace: [zadani.md](zadani.md).

## Fáze 1 — kostra, kartičky, výběr ze 4

- [x] Kostra appky, obrazovky a navigace, `js/registry.js`
- [x] `css/tokens.css` a hravý vizuální styl (mobile-first)
- [x] Předmět EN: parser textového formátu, `index.json`, ukázkové kategorie
- [x] Nastavení kola (kategorie, směr, typ hry, počet otázek)
- [x] Kartičky
- [x] Výběr ze 4 (distraktory, kontrola synonym)
- [x] Výsledková obrazovka
- [x] Unit testy (parser, sestavení kola, distraktory)

## Fáze 2 — psaní, pexeso, profily

- [ ] Psaní + tolerance odpovědí (normalizace, diakritika, Levenshtein, ignorovat text v závorce) + testy
- [ ] Předmět deklaruje jazyk každé strany (pro toleranci `a/an/to` a diakritiky)
- [ ] Hláška při výběru kategorií bez slov (teď „Hrát" tiše nic neudělá)
- [ ] Pexeso
- [ ] Lokální profily (jméno + avatar)
- [ ] Chybná slova per profil a jejich preference v kole
- [ ] Pamatování posledního nastavení

## Fáze 3 — nasazení

- [x] `_headers` (CSP a security hlavičky)
- [ ] README (spuštění, struktura, jak přidat kategorii / předmět)
- [ ] Deploy na Cloudflare Pages
- [ ] PWA (manifest, offline) — nice-to-have

## Nápady na později

- Matematika jako druhý předmět (generované příklady)
- Další jazyky
