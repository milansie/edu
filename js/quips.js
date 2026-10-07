/** Hlášky maskota Brajníka do bubliny na úvodní obrazovce. */
export const quips = [
  'Zlomky nekoušou. Většinou.',
  'Caesar taky musel šprtat.',
  'Skibidi… ehm, procvičujem.',
  'Můj mozek má 100 % baterky a 0 % výmluv.',
  'Slovíčka se samy nenaučí. Zkoušel jsem to.',
  'Pět minut a máš vyhráno. Slibuju.',
  'Čaj v pět, gramatika v šest.',
  'Dělit se umí i pizza. Zeptej se Pizzariuse.',
  'Mozek je sval. Pojď ho trochu zpotit.',
  'Tohle kolo bude legendární. Nebo aspoň slušné.',
  'Chyba je jen level, který ještě neprošel.',
  'Řím nepostavili za den. Slovíčka taky ne.',
  'Plus, mínus, krát, děleno… a bum, jedničky.',
  'Na mozek se nezapomíná. Na svačinu taky ne.',
  'Dneska to bude sigma procvičování.',
  'Nulou dělit nejde. Zkus to a vesmír zakašle.',
  'Zelený tyranosaurus pije čaj. Ty se učíš. Fér.',
  'Jedno kolo a pak třeba pauza. Dohoda?',
];

/** Vrátí náhodnou hlášku; `random` je volitelný generátor [0, 1) (pro testy). */
export function pickQuip(random = Math.random) {
  return quips[Math.floor(random() * quips.length)];
}

/** Hranice poměru správných odpovědí: od `great` včetně je výsledek skvělý, od `ok` včetně průměrný, níže slabý. */
export const RESULT_BANDS = { great: 0.9, ok: 0.5 };

/** Hlášky Brajníka na obrazovce výsledku podle pásma úspěšnosti (viz `RESULT_BANDS`). */
export const resultQuips = {
  great: [
    'Tohle by Caesar podepsal.',
    'Sigma výsledek. Mozek na maximum.',
    'Skoro bez chyby. Legenda.',
    'Takhle vypadá mistr procvičování.',
    'Tea Rex by s tebou pro radost připil čajem.',
  ],
  ok: [
    'Solidní. Mozek se zahřívá.',
    'Slušné! Ještě kolo a bude to bomba.',
    'Půlka v kapse, druhá se dotahuje.',
    'Dobrý základ. Chyby jsou jen bonus level.',
    'Není to špatný, není to ani sigma. Ještě trochu.',
  ],
  low: [
    'Hups. Dáme odvetu?',
    'Tohle kolo vyhrál zlomek. Příště ty.',
    'I Řím začínal jako vesnice. Zkus to znovu.',
    'Mozek se teprve probouzí. Dej mu další šanci.',
    'Chyba je jen level, který ještě neprošel.',
  ],
};

/** Vrátí náhodnou hlášku pro poměr správných odpovědí `ratio` (0–1; neplatná hodnota = slabé pásmo); `random` jako u `pickQuip`. */
export function pickResultQuip(ratio, random = Math.random) {
  const band = ratio >= RESULT_BANDS.great ? 'great' : ratio >= RESULT_BANDS.ok ? 'ok' : 'low';
  const list = resultQuips[band];
  return list[Math.floor(random() * list.length)];
}
