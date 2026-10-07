# Roadmap

Specifikace: [zadani.md](zadani.md).

## Fáze 1 — kostra, kartičky, výběr ze 4

- [x] Kostra appky, obrazovky a navigace, `js/registry.js`
- [x] `css/tokens.css` a hravý vizuální styl (mobile-first)
- [x] Předmět EN: parser textového formátu, `index.json`, ukázkové kategorie
- [x] Nastavení kola (kategorie, směr, typ hry, počet otázek)
- [x] Výběr tématu mezi předmětem a nastavením kola
- [x] Kartičky
- [x] Výběr ze 4 (distraktory, kontrola synonym)
- [x] Výsledková obrazovka
- [x] Unit testy (parser, sestavení kola, distraktory)

## Fáze 2 — psaní, pexeso, profily

- [x] Psaní + tolerance odpovědí (normalizace, diakritika, Levenshtein, ignorovat text v závorce) + testy
- [x] Předmět deklaruje jazyk každé strany (pro toleranci `a/an/to` a diakritiky)
- [ ] Hláška při výběru kategorií bez slov (teď „Hrát" tiše nic neudělá)
- [ ] Pexeso
- [ ] Lokální profily (jméno + avatar)
- [ ] Chybná slova per profil a jejich preference v kole
- [ ] Pamatování posledního nastavení

## Matematika — zlomky

- [x] Zobecnění setupu/kola pro předmět bez směrů a s generovanými příklady
- [x] Zlomková aritmetika + generátory 9 kategorií + testy
- [x] Hra „Zápis" (vykreslení zlomků, klávesnice na obrazovce, vyhodnocení s hláškami, postup po chybě)
- [x] Vzor a pravidlo u jedné kategorie
- [x] Sčítání zlomků (stejný a různý jmenovatel, typ odpovědi `value`)
- [ ] Později: odčítání, násobení, dělení zlomků

## Dějepis

- [x] Předmět Dějepis: kartičky z CSV (NotebookLM), téma Řím
- [x] Předmět bez stran a s jednou hrou (bez směru a volby hry, popisky Otázka/Odpověď, menší písmo u dlouhého textu)
- [ ] Další témata (nové CSV + řádek v `index.json`)
- [ ] Sjednocení loaderu s angličtinou do obecného předmětu „páry"

## Fáze 3 — nasazení

- [x] `_headers` (CSP a security hlavičky)
- [ ] README (spuštění, struktura, jak přidat kategorii / předmět)
- [ ] Deploy na Cloudflare Pages
- [ ] PWA (manifest, offline) — nice-to-have

## Nápady na později

- Zlomky: obrázek koláče u porovnávání/krácení, časová výzva, „najdi chybu"
- Další jazyky
