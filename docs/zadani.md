# edu — zadání

Statický web na procvičování učiva pro 12letého uživatele. První předmět je angličtina (slovíčka z učebnice), později přibude matematika, případně další jazyky. Nejde o dlouhodobé učení se statistikami, ale o rychlé ad-hoc testy: vyber si, co procvičit, zahraj kolo, podívej se na výsledek.

## Cíle a necíle

- Cíl: dítě si samo spustí krátký test nad vybranou látkou a baví ho to. Vizuál je hravý a appka funguje hlavně na telefonu.
- Mimo scope: backend, skutečné přihlašování, dlouhodobé statistiky, spaced repetition, TTS/výslovnost, IPA, zvuky, sdílení mezi uživateli, platby.

## Constraints

- Čistě statický web, vanilla HTML/CSS/JS s ES moduly, žádný build step, žádný npm, žádné CDN ani externí služby za běhu (fonty a obrázky lokálně).
- Lokálně `python3 -m http.server` z kořene repa; kořen repa = kořen webu. Cesty relativní.
- Hosting Cloudflare Pages (auto-deploy z GitHubu `milansie/edu`), security hlavičky v `_headers` (CSP `script-src 'self'` apod.) po vzoru `personal-hub`.
- Mobile-first, dotykové ovládání na prvním místě; použitelné bez horizontálního scrollu od šířky 360 px. Desktop s klávesnicí funguje taky.
- UI česky.
- PWA (manifest, offline) je nice-to-have na konec; online provoz stačí.

## Architektura

- **Společný základ**: obrazovky (profil → předmět → nastavení kola → hra → výsledek), vzhled, sdílené komponenty.
- **Předmět = modul** v `subjects/<id>/`. Dodává kategorie a otázky a deklaruje, které typy her podporuje. Registrace na jednom místě (`js/registry.js`).
- **Typ hry = modul** v `js/games/`. Pracuje s obecnou otázkou (zadání → seznam přijatelných odpovědí), ne se „slovíčkem". Matematika otázky generuje místo čtení ze souboru (viz sekce Matematika — zlomky).
- **Design tokeny** v `css/tokens.css` — jediné místo pro barvy, fonty, rozměry, stíny.
- Čistá logika (normalizace a porovnání odpovědí, Levenshtein, sestavení kola, výběr distraktorů, parser dat) je oddělená od DOM a pokrytá testy.

## Angličtina — data

Jeden textový soubor na kategorii v `subjects/en/data/`, seznam kategorií v `subjects/en/data/index.json` (statický hosting neumí vylistovat adresář).

Formát souboru — jeden řádek = jedno slovo/fráze, vlevo anglicky, vpravo česky, více přijatelných překladů oddělených `|`:

```
# 6A Grammar and Vocabulary
3D printing = 3D tisk | 3D tiskárna
get a good grade = dostat dobrou známku
```

- Řádek začínající `#` je komentář (první může nést název kategorie, autoritativní je ale `index.json`), prázdné řádky se ignorují.
- Vícero přijatelných anglických tvarů lze stejně oddělit `|` vlevo.
- Text v závorce je doplňující nápověda, např. `stage = fáze (jeviště, pódium)` — první tvar je překlad ze sešitu (ten vyžaduje učitel), závorka nabízí přesnější význam. Zobrazuje se celý; při psaní se závorka při porovnání ignoruje a stačí odpovědět „fáze".
- Identita slova = kategorie + anglický text (normalizovaný). Pozor: přepsání anglického textu „zapomene" uložené chyby k tomu slovu — u ad-hoc testů přijatelné.
- `index.json`: objekt `{ topics, categories }`. `topics` = pole `{ id, title, subtitle? }` (např. `unit6`, „Unit 6", „Umění a film"); `categories` = pole `{ id, file, title, topic }`, kde `topic` je `id` existujícího tématu (kategorie s neznámým tématem se přeskočí s varováním v konzoli).
- Přidání lekce = nový `.txt` + řádek v `categories` (případně nové téma v `topics`), žádná změna kódu.
- Seed data dodá uživatel; pro vývoj 2–3 ukázkové kategorie po 6–10 slovech.

## Matematika — zlomky

Příklady se generují při každém kole znovu. Typy převzaté z pracovního listu (6. ročník), každý typ = jedna kategorie ve skupině „Zlomky":

| Kategorie | Zadání | Odpověď |
|---|---|---|
| Krácení | 12/42 = ? | zlomek v základním tvaru, nebo celé číslo |
| Na smíšené číslo | 17/5 = ? | smíšené číslo |
| Smíšené číslo na zlomek | 5 1/5 = ? | zlomek |
| Rozšiřování | 3/4 (· 4) = ? | zlomek |
| Porovnávání | 3/7 ? 5/7 (stejný jmenovatel nebo stejný čitatel) | `<` / `>` |
| Část z celku | 3/5 z 120 = ? | celé číslo |
| Na desetinné číslo | 3/4 = ? | desetinné číslo (uznává se `,` i `.`) |

Připravené rozšíření: sčítání, odčítání, násobení a dělení zlomků (odpověď zlomek / smíšené číslo).

- **Generátory** hlídají „hezká" čísla jako v pracovním listu: jmenovatele zhruba do 12–16, část z celku vychází celá, u desetinných jen jmenovatele s konečným rozvojem (2, 4, 5, 8, 10, 20, 25, 50, 100). Každý generátor vrací zadání, správnou odpověď a postup řešení.
- **Výběr**: konkrétní kategorie, nebo „Náhodně" (všechny kategorie promíchané). Směr se u matematiky nevolí.
- **Délka kola**: výchozí 10 příkladů, volitelně 20.
- **Hra „Zápis"**: zlomky se vykreslují pod sebou (čitatel / čára / jmenovatel). Vstup přes vlastní klávesnici na obrazovce (0–9, `,`, ⌫, potvrdit) do políček podle typu odpovědi (celá část / čitatel / jmenovatel / číslo); u porovnávání dvě velká tlačítka `<` a `>`. Na desktopu funguje i fyzická klávesnice.
- **Vyhodnocení**: hodnota se porovnává matematicky, ne textově. Správná hodnota v nezkráceném tvaru, kde se chce základní tvar → neuznává se, hláška „Správně, ale ještě zkrať". Celé číslo zapsané jako zlomek (3/1) → neuznává se, hláška „Zapiš jako celé číslo". Smíšené číslo musí mít zlomkovou část menší než 1.
- **Nápověda**: při procvičování jedné kategorie je nahoře vzor a pravidlo (z pracovního listu). V režimu „Náhodně" nápověda není.
- **Po chybě** se ukáže správná odpověď i postup (např. `120 : 5 = 24, 24 · 3 = 72`). Postup je i ve výsledku kola u chybných příkladů.
- Obtížnost zatím jedna úroveň.

## Nastavení kola

- **Téma**: před nastavením kola se vybírá téma předmětu (obrazovka se ukazuje i při jediném tématu); nastavení nabízí jen kategorie zvoleného tématu.
- **Kategorie**: jedna, více, nebo vše (v rámci zvoleného tématu).
- **Směr**: EN→CZ, CZ→EN, oba (pak se směr losuje po otázkách).
- **Typ hry**: kartičky, výběr ze 4, psaní, pexeso.
- **Počet otázek**: defaultně celá výběrová sada, volitelně omezit (např. 10 / 20).
- Slova, ve kterých profil dřív chyboval, se do kola zařazují přednostně (při omezení počtu mají přednost, jinak jdou na začátek).
- Chybně zodpovězené slovo se v rámci kola jednou vrátí na konec fronty.

## Typy her

1. **Kartičky** — tap otočí, pak „umím / neumím" (tlačítka nebo swipe). Sebehodnocení; „neumím" se počítá jako chyba.
2. **Výběr ze 4** — distraktory přednostně ze stejné kategorie; když nestačí, z ostatních vybraných kategorií, pak z celého předmětu. Žádná z nabídek nesmí být také správnou odpovědí (synonyma).
3. **Psaní** — zadání v jednom jazyce, odpověď napsat ve druhém. Tolerance:
   - ignoruje velikost písmen, mezery na okrajích a vícenásobné mezery;
   - u angličtiny ignoruje úvodní `a` / `an` / `to` (na obou stranách porovnání);
   - u češtiny chybějící diakritika = správně s upozorněním „pozor na háčky a čárky";
   - překlep o 1 znak (Levenshtein) u slov od 4 znaků = „skoro, správně je …", počítá se jako správně, slovo se ale nezařazuje mezi úspěšně zvládnutá (zůstává v chybných, pokud tam bylo);
   - uznává se kterákoliv z přijatelných odpovědí; při CZ→EN se uznává i jiné anglické slovo se stejným českým překladem.
   - Vstup: `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, Enter = potvrdit.
4. **Pexeso** — otočené karty, hledají se dvojice EN–CZ. Po 6 párech na hrací plochu (3×4, vejde se na 360 px); větší sada = více ploch za sebou. Časovač ani nátlak.

## Výsledek kola

Skóre, 1–3 hvězdy podle úspěšnosti, seznam chybných slov se správnou odpovědí, tlačítka „Zopakovat chybná" a „Nové kolo". Zpětná vazba krátká, pozitivní, ne infantilní.

## Profily

- Lokální profily bez hesla (jméno + avatar z vestavěné sady ve stylu pixel-art), výběr na úvodní obrazovce, založení nového v jednom kroku, smazání s potvrzením.
- Účel: když si appku půjčí kamarád, nepokazí data jinému profilu. Nejde o zabezpečení.
- Per profil v `localStorage`: poslední nastavení kola a chybná slova (čítač; správná odpověď ho snižuje, na nule slovo z chybných zmizí).
- Data mají verzi schématu; nevalidní/poškozená data se nesmí shodit appku (fallback na prázdný profil).

## Vizuál a UX

- Barevně a hravě, spíš „klučičí" styl — inspirace Minecraft / Brawl Stars (sytě barevné bloky, výrazné obrysy, pixelový font na nadpisy, čitelný font na obsah). Ne pastelové/jednorožcové.
- Animace (otočení karty, odměna při dobrém výsledku), respektuje `prefers-reduced-motion`.
- Velká tlačítka, žádný text navíc, jedna věc na obrazovce, žádný scroll uprostřed cvičení.
- Dostatečný kontrast; klávesnice na desktopu: mezerník = otočit, šipky = umím/neumím, Enter = potvrdit, čísla 1–4 = volba.
- Tmavý režim přes tokeny podle `prefers-color-scheme` — nice-to-have.

## Postup po fázích

Po každé fázi stop a krátké shrnutí (co funguje, co se předpokládalo, co by se dalo udělat jinak). Stav vede `docs/roadmap.md`.

1. **Fáze 1** — kostra, registry, tokeny a vizuální styl, předmět EN s parserem dat a ukázkovými kategoriemi, nastavení kola, kartičky, výběr ze 4, výsledková obrazovka. Bez ukládání.
2. **Fáze 2** — psaní (tolerance + testy), pexeso, profily, chybná slova a jejich preference, pamatování posledního nastavení.
3. **Fáze 3** — `_headers`, README, deploy na Cloudflare Pages, případně PWA.

## Akceptační kritéria

- Běží přes `python3 -m http.server` bez jakékoliv instalace, žádná externí síťová volání za běhu.
- Přidání kategorie slovíček = jen data, žádná změna kódu.
- Na 360 px šířky vše použitelné bez horizontálního scrollu.
- Po reloadu zůstane profil, poslední nastavení a chybná slova (od fáze 2).

## Testování

- Unit testy čisté logiky přes `node --test` (`*.test.js` vedle zdrojáku), bez frameworku.
- UI ručně na telefonu a desktopu (uživatel).
