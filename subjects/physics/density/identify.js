import { makeItem, text, pick, levelOf } from '../../math/fractions/helpers.js';
import { shuffle } from '../../../js/core/rng.js';
import { materials, acceptedNames } from '../materials.js';
import { Rejected, convert, toBase, mul, div, fmt, fmtStep, withUnit, conversionStep } from '../units.js';
import { LEVELS } from './levels.js';
import { randomVolume } from './amounts.js';

const MAX_ATTEMPTS = 1000;
const CANDIDATES = 4;

/** Liší se hustoty `a` a `b` (zlomky v g/cm³) nejméně o 0,5 g/cm³? */
const farApart = (a, b) => 2 * Math.abs(a.n * b.d - b.n * a.d) >= a.d * b.d;

/** Správný materiál a 3 další, jejichž hustoty se po dvou liší nejméně o 0,5 g/cm³, v náhodném pořadí; nebo null. */
function pickCandidates(rng, correct) {
  const chosen = [correct];
  for (const other of shuffle(materials, rng)) {
    if (chosen.length === CANDIDATES) break;
    if (chosen.every((c) => farApart(c.density, other.density))) chosen.push(other);
  }
  return chosen.length === CANDIDATES ? shuffle(chosen, rng) : null;
}

/** Sestaví položku z materiálu, hmotnosti `m`, objemu `v` (`{ value, unit }`) a nabízených materiálů. */
function describe(category, correct, m, v, candidates) {
  const steps = [];
  const into = (label, amount, target) => {
    if (amount.unit === target) return amount.value;
    steps.push(conversionStep(label, amount.value, amount.unit, target));
    return convert(amount.value, amount.unit, target);
  };
  const grams = into('Hmotnost', m, 'g');
  const cubic = into('Objem', v, 'cm³');
  const rho = div(grams, cubic);
  steps.push(`ρ = m / V = ${fmtStep(grams)} / ${fmtStep(cubic)} = ${fmtStep(rho)} g/cm³`);
  steps.push(`ρ = ${fmtStep(rho)} g/cm³ → ${correct.name}`);
  const offer = candidates.map((c) => `${c.name} (${withUnit(c.density, 'g/cm³')})`).join(', ');
  const subject = correct.state === 'liquid' ? 'tekutinu' : 'těleso';
  const prompt = `Sir Isaac našel ${subject} o hmotnosti ${withUnit(m.value, m.unit)} a objemu ${withUnit(v.value, v.unit)}. Na výběr: ${offer}.`;
  const item = makeItem(category.id, category.answerType, acceptedNames(correct), [text(prompt)], [text(correct.name)], steps);
  return { ...item, material: correct.id, candidates: candidates.map((c) => c.id), quantities: { m, v } };
}

const byId = (ids) => ids.map((id) => materials.find((x) => x.id === id));

export default {
  id: 'identify',
  title: 'Z čeho je předmět',
  task: 'Z jakého materiálu je předmět? Napiš název',
  answerType: 'text',
  hint: {
    rule: 'Spočítej hustotu ρ = m / V a najdi materiál se stejnou hustotou v nabídce. Nejdřív sjednoť jednotky na g a cm³.',
    example: [text('355 g : 50 cm³ = 7,1 g/cm³ → zinek')],
  },

  /**
   * Hmotnost a objem předmětu (v jednotkách úrovně) vycházejí přesně na hustotu jednoho materiálu z tabulky;
   * v zadání je nabídka 4 materiálů s hustotami. `expected` jsou uznávané názvy správného materiálu.
   */
  generate(rng, level = 1) {
    const params = levelOf(LEVELS, level);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const correct = pick(rng, materials);
      const [massUnit, volumeUnit] = pick(rng, params.combos);
      const v = randomVolume(rng, volumeUnit, params.inputDecimals);
      const m = convert(mul(correct.density, toBase(v, volumeUnit)), 'g', massUnit);
      const candidates = pickCandidates(rng, correct);
      if (!candidates) continue;
      try {
        fmt(m, params.inputDecimals);
        fmt(v, params.inputDecimals);
        return describe(this, correct, { value: m, unit: massUnit }, { value: v, unit: volumeUnit }, candidates);
      } catch (error) {
        if (!(error instanceof Rejected)) throw error;
      }
    }
    const [zinc, ...others] = byId(['zinc', 'water', 'gold', 'cork']);
    return describe(this, zinc, { value: { n: 355, d: 1 }, unit: 'g' }, { value: { n: 50, d: 1 }, unit: 'cm³' }, [zinc, ...others]);
  },
};
