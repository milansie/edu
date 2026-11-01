import { makeItem, text, pick, randInt, levelOf } from '../../math/fractions/helpers.js';
import { reduce } from '../../../js/core/fraction.js';
import { Rejected, mul, div, fmt, fmtStep, withUnit } from '../units.js';
import { LEVELS } from './levels.js';
import { STORIES } from './stories.js';
import { randomValue } from './amounts.js';

const MAX_ATTEMPTS = 1000;
/** Nejdřívější odjezd v minutách od půlnoci (5:00). */
const EARLIEST_DEPART = 300;
/** Nejpozdější odjezd v minutách od půlnoci (20:00); příjezd je vždy před půlnocí. */
const LATEST_DEPART = 1200;

/** Jistá úloha (autobus, 7:00 → 8:30, 60 km/h), když se ani po `MAX_ATTEMPTS` pokusech nepodaří vygenerovat vhodné hodnoty. */
const FALLBACK = { story: STORIES[1], depart: 420, duration: 90, speed: { n: 60, d: 1 } };

/** Čas v minutách od půlnoci jako „7:05“. */
const clock = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** Doba v minutách slovně: „1 h 15 min“, „2 h“, „45 min“. */
function span(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h > 0 ? `${h} h` : '', m > 0 ? `${m} min` : ''].filter(Boolean).join(' ');
}

/** Položka z autobusu/vlaku/… `story`, odjezdu `depart` a doby jízdy `duration` (minuty) a rychlosti `speed` (km/h, zlomek). */
function describe(category, { story, depart, duration, speed }) {
  const arrive = depart + duration;
  const hours = reduce({ n: duration, d: 60 });
  const distance = mul(speed, hours);
  const prompt = `${story.name} vyjel v ${clock(depart)} a v ${clock(arrive)} dojel do místa vzdáleného ${withUnit(distance, 'km')}. Průměrnou rychlost zapiš v km/h.`;
  const steps = [`Doba jízdy: ${clock(arrive)} − ${clock(depart)} = ${span(duration)}`];
  if (duration % 60 !== 0) steps.push(`${duration} min = ${fmtStep(hours)} h (1 h = 60 min)`);
  steps.push(`v = s / t = ${fmtStep(distance)} / ${fmtStep(hours)} = ${fmtStep(div(distance, hours))} km/h`);
  const item = makeItem(category, 'decimal', speed, [text(prompt)], [text(withUnit(speed, 'km/h'))], steps);
  return { ...item, timetable: { depart, arrive, distance, speed } };
}

export default {
  id: 'speed-timetable',
  title: 'Jízdní řád',
  task: 'Spočítej průměrnou rychlost',
  answerType: 'decimal',
  hint: {
    rule: 'Dobu jízdy spočítej jako rozdíl příjezdu a odjezdu a převeď na hodiny (1 h = 60 min). Pak v = s / t.',
    example: [text('7:15 → 8:30 = 1 h 15 min = 1,25 h; 50 km : 1,25 h = 40 km/h')],
  },

  /**
   * Odjezd a příjezd (h:mm) dopravního prostředku a vzdálenost v km, rychlost v km/h (nejvýš 1 desetinné místo).
   * Na vyšších úrovních jsou odjezdy i doby jízdy v menších krocích než čtvrt hodiny.
   */
  generate(rng, level = 1) {
    const p = levelOf(LEVELS, level).timetable;
    const stories = STORIES.filter((s) => s.vehicle);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const story = pick(rng, stories);
      const duration = p.durationStep * randInt(rng, 1, Math.floor(p.maxDuration / p.durationStep));
      const depart = EARLIEST_DEPART + p.departStep * randInt(rng, 0, Math.floor((LATEST_DEPART - EARLIEST_DEPART) / p.departStep));
      if (duration * 60 > story.maxTime || depart + duration >= 1440) continue;
      const speed = randomValue(rng, story.kmh, p.speedDecimals);
      try {
        fmt(mul(speed, reduce({ n: duration, d: 60 })), p.distanceDecimals);
        return describe(this.id, { story, depart, duration, speed });
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    return describe(this.id, FALLBACK);
  },
};
