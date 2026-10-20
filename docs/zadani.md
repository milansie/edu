# Brajnkraft — zadání

Brajnkraft je statický web na procvičování učiva pro 12letého uživatele. První předmět je angličtina (slovíčka z učebnice), později přibude matematika, případně další jazyky. Nejde o dlouhodobé učení se statistikami, ale o rychlé ad-hoc testy: vyber si, co procvičit, zahraj kolo, podívej se na výsledek.

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
- První český tvar je překlad ze sešitu (ten vyžaduje učitel), další tvary za `|` jsou přesnější významy, např. `stage = fáze | jeviště | pódium` — při psaní se uzná kterýkoliv. Text v závorce je jen poznámka: zobrazí se, ale při porovnání se ignoruje (nevyžaduje se ani neuznává).
- Identita slova = kategorie + anglický text (normalizovaný). Pozor: přepsání anglického textu „zapomene" uložené chyby k tomu slovu — u ad-hoc testů přijatelné.
- `index.json`: objekt `{ topics, categories }`. `topics` = pole `{ id, title, subtitle? }` (např. `unit6`, „Unit 6", „Umění a film"); `categories` = pole `{ id, file, title, topic }`, kde `topic` je `id` existujícího tématu (kategorie s neznámým tématem se přeskočí s varováním v konzoli).
- Přidání lekce = nový `.txt` + řádek v `categories` (případně nové téma v `topics`), žádná změna kódu.
- Seed data dodá uživatel; pro vývoj 2–3 ukázkové kategorie po 6–10 slovech.

## Dějepis — data

Jeden CSV soubor na kategorii v `subjects/history/data/`, seznam témat a kategorií v `subjects/history/data/index.json` (stejná struktura jako u angličtiny, soubory jsou `.csv`).

Formát souboru — export kartiček z NotebookLM: UTF-8 (BOM se toleruje), hlavička `Otázka;Odpověď`, oddělovač `;` (podle hlavičky i `,`), jeden řádek = jedna kartička:

```
Otázka;Odpověď
Kdo založil Řím podle pověsti?;Romulus.
"Co je to; a proč?";"Odpověď se středníkem; v uvozovkách."
```

- Pole mohou být v uvozovkách (`""` = uvozovka) a obsahovat oddělovač i konec řádku; prázdné řádky se ignorují, neplatný řádek se přeskočí s varováním v konzoli.
- Postup: fotky ze sešitu → NotebookLM → export kartiček jako CSV → kopie do `subjects/history/data/` → řádek v `categories` (případně téma v `topics`). Žádná změna kódu.
- Jen hra Kartičky (sebehodnocení), směr vždy otázka → odpověď, strany se jmenují „Otázka" / „Odpověď"; volba hry ani směru se nenabízí.
- Počet otázek v kole: 10 / 20 / 30, výchozí 30 (z velké sady se náhodně vybere). Dlouhý text na kartě se zobrazí menším písmem.
- Identita kartičky = kategorie + otázka (normalizovaná).

## Zeměpis — data

Téma „Biomy" (jedna kategorie „Biomy", `biomy.csv`) jako kartičky, stejně jako dějepis: CSV `Otázka;Odpověď` v `subjects/geo/data/`, seznam témat a kategorií v `subjects/geo/data/index.json`. Formát, parser (sdílený `subjects/history/parse.js`), počty otázek v kole i identita kartičky jsou stejné jako u dějepisu; nové kategorie se přidávají jen datově.

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
| Řazení | 3/8 1/2 1/4 5/8 → seřaď | pořadí ťuknutím |
| Sčítání – stejný jmenovatel | 2/7 + 3/7 = ? | libovolný správný tvar (typ `value`) |
| Sčítání – různý jmenovatel | 1/4 + 1/6 = ? | libovolný správný tvar (typ `value`) |
| Odčítání – stejný jmenovatel | 5/7 − 2/7 = ? | libovolný správný tvar (typ `value`), rozdíl je vždy kladný |
| Odčítání – různý jmenovatel | 5/6 − 1/4 = ? | libovolný správný tvar (typ `value`), rozdíl je vždy kladný |

Typ odpovědi `value` (políčka celá část – nepovinná, čitatel, jmenovatel): uznává se nepravý zlomek v základním tvaru i smíšené číslo (9/7 i 1 2/7); celý výsledek jen jako celé číslo. Určen i pro další početní operace.

Připravené rozšíření: násobení a dělení zlomků (typ odpovědi `value`).

**Obtížnost 1–5**: úroveň se volí posuvníkem v nastavení kola (popisky 1–5), výchozí je 1 = základní chování popsané výše. Vyšší úrovně zvětšují jmenovatele, činitele, celé části a násobky (každá kategorie má tabulku parametrů ve svém souboru) a přidávají těžší varianty: porovnávání od úrovně 3 se zlomky s různými jmenovateli a na úrovni 5 s těsnými dvojicemi (7/8 a 8/9); řazení od úrovně 3 s různými jmenovateli, od 4 jen s navzájem různými jmenovateli a na 5 s blízkými hodnotami; část z celku od úrovně 4 i s nepravými zlomky (5/4 z 36); převod na desetinné číslo s větším podílem nepravých zlomků a od úrovně 4 se jmenovateli 16, 40, 125, 200; sčítání se stejným jmenovatelem od úrovně 4 občas se třemi sčítanci; sčítání s různým jmenovatelem s většími jmenovateli a na úrovni 5 převážně nesoudělnými; odčítání se stejným jmenovatelem od úrovně 4 občas se dvěma odečítanými zlomky, odčítání s různým jmenovatelem stejně jako sčítání. Podmínky „hezkých" čísel výše platí pro úroveň 1.

- **Generátory** hlídají „hezká" čísla jako v pracovním listu: jmenovatele zhruba do 12–16 (u sčítání a odčítání s různým jmenovatelem společný jmenovatel nejvýše 36), část z celku vychází celá, u desetinných jen jmenovatele s konečným rozvojem (2, 4, 5, 8, 10, 20, 25, 50, 100). Každý generátor vrací zadání, správnou odpověď a postup řešení.
- **Výběr**: konkrétní kategorie, nebo „Náhodně" (všechny kategorie promíchané). Směr se u matematiky nevolí.
- **Délka kola**: výchozí 10 příkladů, volitelně 20.
- **Hra „Zápis"**: zlomky se vykreslují pod sebou (čitatel / čára / jmenovatel). Vstup přes vlastní klávesnici na obrazovce (0–9, `,`, ⌫, potvrdit) do políček podle typu odpovědi (celá část / čitatel / jmenovatel / číslo); u porovnávání dvě velká tlačítka `<` a `>`; u řazení se zlomky ťukají v pořadí od nejmenšího do čtyř políček (⌫ vrátí poslední, ✓ odešle; na klávesnici `1`–`4`). Na desktopu funguje i fyzická klávesnice.
- **Vyhodnocení**: hodnota se porovnává matematicky, ne textově. Správná hodnota v nezkráceném tvaru, kde se chce základní tvar → neuznává se, hláška „Správně, ale ještě zkrať". Celé číslo zapsané jako zlomek (3/1) → neuznává se, hláška „Zapiš jako celé číslo". Smíšené číslo musí mít zlomkovou část menší než 1.
- **Nápověda**: při procvičování jedné kategorie je nahoře vzor a pravidlo (z pracovního listu). V režimu „Náhodně" nápověda není.
- **Po chybě** se ukáže správná odpověď i postup (např. `120 : 5 = 24, 24 · 3 = 72`). Postup je i ve výsledku kola u chybných příkladů.
- Obtížnost zatím jedna úroveň.

## Fyzika — hustota

Příklady se generují při každém kole znovu (předmět Fyzika, postava Sir Isaac Gravitón, přezdívka Physique), jediné téma „Hustota" s kategoriemi:

| Kategorie | Zadání | Odpověď |
|---|---|---|
| Převody jednotek | 2,5 l = ? ml (hmotnost, objem, od úrovně 4 i hustota) | desetinné číslo (typ `decimal`) |
| Výpočet hustoty | z hmotnosti a objemu, „hustotu zapiš v kg/m³" | desetinné číslo |
| Výpočet hmotnosti | z hustoty a objemu | desetinné číslo |
| Výpočet objemu | z hmotnosti a hustoty | desetinné číslo |
| Z čeho je předmět | hmotnost a objem předmětu + nabídka 4 materiálů s hustotami | název materiálu (typ `text`) |

- **Jednotky**: hmotnost g, kg, t; objem cm³, ml, l, dm³, m³; hustota g/cm³, kg/l, kg/dm³, kg/m³. Veškerá aritmetika je přes zlomky (`js/core/fraction.js`), žádné floaty; jednotky a převody jsou v `subjects/physics/units.js`.
- **„Hezká" čísla**: generátory počítají odzadu (zvolí se hustota a objem, hmotnost vyjde přesně); zadané hodnoty i výsledek mají nejvýš 1 desetinné místo a vejdou se do políčka odpovědi (celá část nejvýš 6 číslic, celý zápis nejvýš 7 znaků), jinak se hodnoty přegenerují.
- **Slovní úlohy**: zhruba polovina zadání je s příběhem Sira Isaaca; u hmotnosti a objemu s materiálem z tabulky (`subjects/physics/materials.js`: korek, smrkové dřevo, benzín, led, voda, beton, sklo, hliník, titan, zinek, cín, železo, měď, stříbro, olovo, rtuť, zlato, platina; každý s hustotou v g/cm³ a skupenstvím). Hustoty v tabulce jsou navzájem různé. Úlohy „z čeho je předmět" nabízejí 4 materiály s hustotami lišícími se po dvou nejméně o 0,5 g/cm³.
- **Typ odpovědi `text`**: jedno textové pole (místo klávesnice s číslicemi); `expected` je pole uznávaných názvů, porovnává se bez diakritiky a velikosti písmen (`zelezo` = `Železo`). Typ je obecný a hra „Zápis" ho podporuje pro libovolný předmět.
- **Obtížnost 1–5**: 1 = g + cm³ (resp. kg + dm³) bez převodů, celá čísla v zadání; 2 = i ml a l, zadání s 1 desetinným místem; 3 = jeden převod (kg↔g, l↔cm³, dm³↔cm³); 4 = i m³ a t, hustota většinou v kg/m³, převody g/cm³ ↔ kg/m³; 5 = libovolná kombinace jednotek, dva i více převodů.
- **Po chybě** se ukáže správná odpověď a postup (převod jednotek, dosazení do vzorce, výsledek; u „z čeho je" i „ρ = 7,1 g/cm³ → zinek").
- **Nápověda** (při jedné vybrané kategorii): vzorec ρ = m / V (resp. m = ρ · V, V = m / ρ) a převodní vztahy jednotek.

## Nastavení kola

- **Téma**: před nastavením kola se vybírá téma předmětu (obrazovka se ukazuje i při jediném tématu); nastavení nabízí jen kategorie zvoleného tématu.
- **Kategorie**: jedna, více, nebo vše (v rámci zvoleného tématu).
- **Směr**: EN→CZ, CZ→EN, oba (pak se směr losuje po otázkách).
- **Typ hry**: kartičky, výběr ze 4, psaní, pexeso.
- **Obtížnost** (jen předměty s úrovněmi, dnes matematika a fyzika): posuvník 1–5, výchozí 1.
- **Počet otázek**: defaultně celá výběrová sada, volitelně omezit (např. 10 / 20).
- Slova, ve kterých profil dřív chyboval, se do kola zařazují přednostně (při omezení počtu mají přednost, jinak jdou na začátek).
- Chybně zodpovězené slovo se v rámci kola jednou vrátí na konec fronty.

## Typy her

1. **Kartičky** — tap otočí, pak „umím / neumím" (tlačítka nebo swipe). Sebehodnocení; „neumím" se počítá jako chyba.
2. **Výběr ze 4** — distraktory přednostně ze stejné kategorie; když nestačí, z ostatních vybraných kategorií, pak z celého předmětu. Žádná z nabídek nesmí být také správnou odpovědí (synonyma).
3. **Psaní** — zadání v jednom jazyce, odpověď napsat ve druhém. Tolerance:
   - ignoruje velikost písmen, mezery na okrajích a vícenásobné mezery;
   - u angličtiny ignoruje úvodní `a` / `an` / `to` (na obou stranách porovnání);
   - ignoruje text v závorce, koncové `…`/`...` a bere pomlčku jako mezeru (`record-breaking` = `record breaking`);
   - u češtiny chybějící diakritika = správně s upozorněním „pozor na háčky a čárky";
   - překlep o 1 znak (Levenshtein) u odpovědí od 4 znaků = chyba s mírnou hláškou „Skoro! Správně je …" a zvýrazněnými chybnými písmeny; počítá se jako chyba jako každá jiná;
   - uznává se kterákoliv z přijatelných odpovědí; uznává se i jiná položka se shodným zadáním (synonyma, např. „film"/„movie" → „film").
   - Jazyk každé strany deklaruje předmět (`langs`), podle něj se vyhodnocuje `a/an/to` a diakritika.
   - Vstup: `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, Enter = potvrdit.
4. **Pexeso** — otočené karty, hledají se dvojice EN–CZ. Po 6 párech na hrací plochu (3×4, vejde se na 360 px); větší sada = více ploch za sebou. Časovač ani nátlak.

## Výsledek kola

Skóre, 1–3 hvězdy podle úspěšnosti, seznam chybných slov se správnou odpovědí, tlačítka „Zopakovat chybná" a „Nové kolo". Zpětná vazba krátká, pozitivní, ne infantilní.

## Profily

- Lokální profily bez hesla (jméno + avatar z vestavěné sady ve stylu pixel-art), výběr na úvodní obrazovce, založení nového v jednom kroku, smazání s potvrzením.
- Účel: když si appku půjčí kamarád, nepokazí data jinému profilu. Nejde o zabezpečení (rodičovská kontrola s PINem je samostatná funkce, viz Rodičovská kontrola).
- Per profil v `localStorage`: poslední nastavení kola a chybná slova (čítač; správná odpověď ho snižuje, na nule slovo z chybných zmizí).
- Data mají verzi schématu; nevalidní/poškozená data se nesmí shodit appku (fallback na prázdný profil).

## Rodičovská kontrola

Rodič na úvodní obrazovce (tlačítko „Rodič“ pod dlaždicemi předmětů, trasa `#/parent`) zadá dvakrát čtyřmístný PIN a zahájí session. Dokud session běží, sčítají se výsledky; dítě vidí jen nenápadný zámek v hlavičce a na úvodní obrazovce tlačítko „Kontrola běží“. Stejným PINem rodič zobrazí statistiku a zvolí „Pokračovat“ (session běží dál) nebo „Ukončit kontrolu“ (s potvrzením, data se smažou). Statistika se po odchodu z obrazovky skryje, další vstup znovu vyžaduje PIN. Session přežije reload stránky.

- **Co se počítá:** jen první pokusy (opakování chybné otázky se nezapočítá), po předmětu › tématu › kategorii: počet příkladů, dobře, špatně. Zápis je v `round.answer` (obaluje ho `js/app.js`), logika je v `js/core/parental.js`. Předmět bez kategorií se zapisuje pod téma.
- **Úložiště:** `localStorage`, klíč `brajnkraft.parental`, schéma `{ version: 1, startedAt, salt, pinHash, failed, lockedUntil, stats }`; `stats` je mapa `"<předmět>/<téma>/<kategorie>"` → `{ subject, topic, category, total, correct }` (titulky pro zobrazení). Poškozená data nebo neznámá verze = žádná session. Nejde-li `localStorage` použít, tlačítko se nezobrazí a zápis statistik je no-op.
- **PIN:** přesně 4 číslice (`^\d{4}$`), neukládá se; ukládá se `SHA-256(salt + PIN)` (hex, `crypto.subtle`) s náhodnou 16B solí z `crypto.getRandomValues`.
- **Throttling:** po 5 chybných pokusech zámek na 60 s (`failed`, `lockedUntil`); během zámku se PIN neověřuje, správný PIN čítač vynuluje.
- **Model hrozby:** ochrana proti dítěti u zařízení, ne proti útočníkovi. Čtyřmístný PIN lze offline hrubou silou zjistit z uloženého hashe a kdo smaže data prohlížeče, session zruší.

## Vizuál a UX

- **Identita**: název Brajnkraft, pixel-art logo mozku (`assets/logo-brain.svg`, použité i jako favicon).
- **Maskot Brajník** s náhodnými hláškami na úvodní obrazovce a hláškami podle pásma skóre na výsledku kola (`js/quips.js`, čistá logika s testy).
- **Postavy předmětů** v `assets/` (čistě dekorativní obrázky, `alt=""`): Tea-Rex (angličtina), Kalkulátoro Zlomkini (matematika), Pizzarius Maximus (dějepis), Kapitán Kompas (zeměpis), Sir Isaac Gravitón (fyzika).
- **Přezdívky předmětů** na dlaždicích: Engliš, Matyka (s přeškrtnutým „y" opraveným na „i"), Děják, Zeměkoulopis, Physique.
- **Jména postav** jsou vidět v textu: v nápovědě u matematiky („Kalkulátoro Zlomkini radí:") a pod obrázkem postavy na obrazovce výběru tématu.
- V `js/registry.js` má předmět volitelná pole `image` (`{ src, alt }`, `alt` = jméno postavy) a `nickname` (pole částí; část `{ wrong, fix }` = přeškrtnutý překlep s opravou). Bez nich se zobrazí textová ikona a `title`.

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
