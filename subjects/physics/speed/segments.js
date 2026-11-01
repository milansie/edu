import { makeItem, text, pick, randInt, levelOf } from '../../math/fractions/helpers.js';
import { reduce } from '../../../js/core/fraction.js';
import { Rejected, mul, div, fmt, fmtStep, fmtApprox, tenths, withUnit } from '../units.js';
import { LEVELS } from './levels.js';
import { STORIES } from './stories.js';
import { relativeGap } from './amounts.js';

const MAX_ATTEMPTS = 1000;
const ORDINALS = ['první', 'druhý', 'třetí'];
/** Hrdinové s dobou pohybu aspoň tak dlouhou (s), aby se u nich dal zadat úsek v minutách. */
const SEGMENT_STORIES = STORIES.filter((story) => story.maxTime >= 3600);
/** Rozsah času úseku v minutách (jednotka `min`) a v sekundách (jednotka `s`). */
const MINUTES = [5, 120];
const SECONDS = [30, 600];
/** Rozsah času úseku v minutách pro zápis „X h Y min“. */
const HOUR_MINUTES = [61, 300];
/** Rozsah času úseku v desetinách hodiny (jednotka `h`; desetina hodiny = 6 min). */
const HOUR_TENTHS = [5, 60];
/** Dráha v metrech se zaokrouhluje na násobky této hodnoty. */
const METER_STEP = 100;
/** Nejdelší dráha zadaná v metrech (4 číslice). */
const MAX_METERS = 9900;

/** Jistá úloha (autobus, úseky 20 km za 30 min, 50 km za 60 min, 45 km za 30 min), když se vhodné hodnoty nepodaří vygenerovat. */
const FALLBACK = {
  story: STORIES[1],
  ask: 'slowest',
  segments: [
    { km: 20, seconds: 1800, distanceUnit: 'km', timeUnit: 'min' },
    { km: 50, seconds: 3600, distanceUnit: 'km', timeUnit: 'min' },
    { km: 45, seconds: 1800, distanceUnit: 'km', timeUnit: 'min' },
  ].map((s) => ({ ...s, km: { n: s.km, d: 1 } })),
};

/** Čas úseku v sekundách pro jednotku zápisu `timeUnit` (`s`, `min`, `h`, `hmin`). */
function randomSeconds(rng, timeUnit) {
  if (timeUnit === 's') return randInt(rng, ...SECONDS);
  if (timeUnit === 'min') return 60 * randInt(rng, ...MINUTES);
  if (timeUnit === 'h') return 360 * randInt(rng, ...HOUR_TENTHS);
  return 60 * randInt(rng, ...HOUR_MINUTES);
}

/** Čas úseku `seconds` v zápisu podle jednotky `timeUnit`; nevhodnou kombinaci odmítne. */
function showTime(seconds, timeUnit) {
  if (timeUnit === 's') return `${seconds} s`;
  const minutes = seconds / 60;
  if (timeUnit === 'min') return `${minutes} min`;
  if (timeUnit === 'h') return withUnit(reduce({ n: seconds, d: 3600 }), 'h');
  if (minutes <= 60 || minutes % 60 === 0) throw new Rejected('Čas se nehodí do zápisu h min.');
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/**
 * Zápis úseku „25 km za 28 min“ a kroky postupu pro úsek číslo `index`: převod dráhy z m na km, převod „X h Y min“
 * na minuty a výpočet rychlosti (čas v min a s se převádí násobkem 60 resp. 3600, čas v h je desetinné číslo).
 */
function describeSegment({ km, seconds, distanceUnit, timeUnit }, index, decimals) {
  const time = showTime(seconds, timeUnit);
  const distance = distanceUnit === 'm' ? `${fmt(mul(km, { n: 1000, d: 1 }), 0)} m` : `${fmt(km, decimals)} km`;
  const kmText = fmtStep(km);
  const result = fmtApprox(div(km, reduce({ n: seconds, d: 3600 })));
  const parts = [];
  if (distanceUnit === 'm') parts.push(`${distance} = ${kmText} km`);
  if (timeUnit === 'h') {
    parts.push(`v = ${kmText} / ${fmtStep(reduce({ n: seconds, d: 3600 }))} ${result} km/h`);
  } else {
    const [amount, unit, factor] = timeUnit === 's' ? [seconds, 's', 3600] : [seconds / 60, 'min', 60];
    if (timeUnit === 'hmin') parts.push(`${time} = ${amount} min`);
    parts.push(`${kmText} km : ${amount} ${unit} = ${kmText} · ${factor} / ${amount} km/h ${result} km/h`);
  }
  return { shown: `${distance} za ${time}`, step: `${index + 1}. úsek: ${parts.join(', ')}` };
}

/** Rychlost úseku v km/h jako přesný zlomek. */
const speedOf = ({ km, seconds }) => div(km, reduce({ n: seconds, d: 3600 }));

/** Index nejpomalejšího (`slowest`) nebo nejrychlejšího úseku podle přesných rychlostí `speeds`. */
function targetIndex(ask, speeds) {
  const key = (s) => s.n / s.d;
  const values = speeds.map(key);
  return values.indexOf(ask === 'slowest' ? Math.min(...values) : Math.max(...values));
}

/** Položka z hrdiny `story`, otázky `ask` (`slowest` / `fastest`) a tří úseků `segments`. */
function describe(category, { story, ask, segments }, decimals) {
  const described = segments.map((segment, i) => describeSegment(segment, i, decimals));
  const speeds = segments.map(speedOf);
  const target = targetIndex(ask, speeds);
  const answer = target + 1;
  const [first, second, third] = described.map((d, i) => `${ORDINALS[i]} úsek ${d.shown}`);
  const sentence = `${story.name} ${story.moved} ${first}, ${second} a ${third}.`;
  const question = `Ve kterém úseku ${story.go} ${ask === 'slowest' ? 'nejpomaleji' : 'nejrychleji'}? Zapiš číslo úseku.`;
  const steps = [...described.map((d) => d.step), `Odpověď: úsek ${answer} (${fmtApprox(speeds[target])} km/h)`];
  const item = makeItem(category, 'integer', answer, [text(`${sentence} ${question}`)], [text(`${answer}. úsek`)], steps);
  return { ...item, ask, segments: segments.map((s, i) => ({ ...s, speed: speeds[i] })) };
}

/** Rychlost zlomkem `{ n, d }` je v rozsahu `[lo, hi]` km/h. */
const inRange = ({ n, d }, [lo, hi]) => n >= lo * d && n <= hi * d;

/**
 * Náhodný úsek: čas podle `timeUnit`, dráha dopočtená z rychlosti běžné pro hrdinu `story` a zaokrouhlená
 * (km na `decimals` míst, m na násobky `METER_STEP` nejvýš `MAX_METERS`). Dráha v m se nekombinuje s časem v h
 * ani „X h Y min“. Výsledná rychlost musí zůstat v rozsahu hrdiny.
 */
function randomSegment(rng, story, p) {
  const distanceUnit = pick(rng, p.distanceUnits);
  const timeUnit = pick(rng, p.timeUnits);
  const seconds = randomSeconds(rng, timeUnit);
  if (distanceUnit === 'm' && (timeUnit === 'h' || timeUnit === 'hmin')) throw new Rejected('Dráha v m se nekombinuje s časem v h.');
  if (seconds > story.maxTime) throw new Rejected('Úsek je pro hrdinu příliš dlouhý.');
  const kmh = randInt(rng, story.kmh[0], story.kmh[1]);
  const meters = (kmh * seconds * 1000) / 3600;
  const roundedMeters = Math.round(meters / METER_STEP) * METER_STEP;
  if (distanceUnit === 'm' && roundedMeters > MAX_METERS) throw new Rejected('Dráha v metrech je příliš dlouhá.');
  const km = distanceUnit === 'm'
    ? reduce({ n: roundedMeters, d: 1000 })
    : tenths(Math.round((meters / 1000) * 10 ** p.decimals) * 10 ** (1 - p.decimals));
  if (km.n <= 0 || !inRange(speedOf({ km, seconds }), story.kmh)) throw new Rejected('Rychlost úseku je mimo rozsah hrdiny.');
  return { km, seconds, distanceUnit, timeUnit };
}

export default {
  id: 'speed-segments',
  title: 'Úseky cesty',
  task: 'Urči úsek',
  answerType: 'integer',
  hint: {
    rule: 'U každého úseku spočítej rychlost v = s / t v km/h (dráhu převeď na km, čas na h), potom je porovnej.',
    example: [text('30 km za 0,5 h = 60 km/h; 24 km za 0,4 h = 60 km/h')],
  },

  /**
   * Tři úseky cesty se vzdáleností a časem v různých jednotkách; ptá se na nejpomalejší nebo nejrychlejší.
   * Hledaný úsek se od ostatních liší aspoň o `gap` (relativně, z přesných zlomků), což je mnohem víc než
   * chyba zaokrouhlení rychlostí v postupu na 0,1 km/h; odpověď je tak jednoznačná.
   */
  generate(rng, level = 1) {
    const p = levelOf(LEVELS, level).segments;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const story = pick(rng, SEGMENT_STORIES);
      const ask = rng() < 0.5 ? 'slowest' : 'fastest';
      let segments;
      try {
        segments = Array.from({ length: 3 }, () => randomSegment(rng, story, p));
        const speeds = segments.map(speedOf);
        const target = targetIndex(ask, speeds);
        const unique = speeds.every((s, i) => i === target || relativeGap(s, speeds[target]) >= p.gap);
        if (!unique) continue;
        return describe(this.id, { story, ask, segments }, p.decimals);
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    return describe(this.id, FALLBACK, 0);
  },
};
