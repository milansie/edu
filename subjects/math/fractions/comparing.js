import { makeItem, frac, text, randInt } from './helpers.js';

const MAX_DENOMINATOR = 16;

export default {
  id: 'comparing',
  title: 'Porovnávání',
  task: 'Doplň znaménko < nebo >',
  answerType: 'relation',
  hint: {
    rule: 'Stejný jmenovatel: větší je zlomek s větším čitatelem. Stejný čitatel: větší je zlomek s menším jmenovatelem.',
    example: [frac(3, 7), text('<'), frac(5, 7)],
  },

  /** Polovina příkladů má stejný jmenovatel, polovina stejný čitatel; hodnoty jsou vždy různé. */
  generate(rng) {
    let left;
    let right;
    let rule;
    if (rng() < 0.5) {
      const d = randInt(rng, 5, MAX_DENOMINATOR);
      const a = randInt(rng, 1, d - 1);
      let b = randInt(rng, 1, d - 2);
      if (b >= a) b++;
      left = frac(a, d);
      right = frac(b, d);
      rule = `Stejný jmenovatel: větší je zlomek s větším čitatelem (${a} ${a < b ? '<' : '>'} ${b}).`;
    } else {
      const n = randInt(rng, 1, 9);
      const a = randInt(rng, n + 1, MAX_DENOMINATOR);
      let b = randInt(rng, n + 1, MAX_DENOMINATOR - 1);
      if (b >= a) b++;
      left = frac(n, a);
      right = frac(n, b);
      rule = `Stejný čitatel: větší je zlomek s menším jmenovatelem (${a} ${a > b ? '>' : '<'} ${b}).`;
    }
    const less = left.n * right.d < right.n * left.d;
    const sign = less ? '<' : '>';
    return makeItem(this.id, this.answerType, sign, [left, text('?'), right], [left, text(sign), right], [rule]);
  },
};
