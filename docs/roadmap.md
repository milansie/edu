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

- [ ] Psaní + tolerance odpovědí (normalizace, diakritika, Levenshtein, ignorovat text v závorce) + testy
- [ ] Předmět deklaruje jazyk každé strany (pro toleranci `a/an/to` a diakritiky)
- [ ] Hláška při výběru kategorií bez slov (teď „Hrát" tiše nic neudělá)
- [ ] Pexeso
- [ ] Lokální profily (jméno + avatar)
- [ ] Chybná slova per profil a jejich preference v kole
- [ ] Pamatování posledního nastavení

## Matematika — zlomky

- [x] Zobecnění setupu/kola pro předmět bez směrů a s generovanými příklady
- [x] Zlomková aritmetika + generátory 7 kategorií + testy
- [x] Hra „Zápis" (vykreslení zlomků, klávesnice na obrazovce, vyhodnocení s hláškami, postup po chybě)
- [x] Vzor a pravidlo u jedné kategorie
- [ ] Později: sčítání, odčítání, násobení, dělení zlomků

## Fáze 3 — nasazení

- [x] `_headers` (CSP a security hlavičky)
- [ ] README (spuštění, struktura, jak přidat kategorii / předmět)
- [ ] Deploy na Cloudflare Pages
- [ ] PWA (manifest, offline) — nice-to-have

## Nápady na později

- Zlomky: obrázek koláče u porovnávání/krácení, časová výzva, „najdi chybu"
- Další jazyky
