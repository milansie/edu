import convertUnits from './convert-units.js';
import speed from './speed.js';
import distance from './distance.js';
import time from './time.js';
import compare from './compare.js';
import order from './order.js';
import timetable from './timetable.js';
import segments from './segments.js';

/**
 * Kategorie tématu Rychlost. Kategorie:
 * `{ id, title, task, answerType, hint: { rule, example }, generate(rng, level = 1) → položka }`.
 */
export const categories = [convertUnits, speed, distance, time, compare, order, timetable, segments];
