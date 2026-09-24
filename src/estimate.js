// Illustrative estimate for the draft proposal.
//
// PLACEHOLDER SAMPLE RATES. These are not Busy Bee Lawn prices. They exist so
// the concept can show how an estimate would read. Replace RATES and
// VISITS_PER_YEAR with the company's own figures before any real use.
// Deterministic: the same draft always produces the same estimate.

import { SERVICES, scopeFacts } from './plan/routes.js';
import { effectiveCadence } from './draft.js';

// Per-visit sample rates, from the sample zone counts.
const RATES = {
  mow: (f) => 28 * f.lawns + 20, // per turf area, plus a trip charge
  edge: (f) => 7 * f.edges,
  beds: (f) => 95 * f.beds, // weeding + mulch refresh per bed
  shrubs: (f) => 8 * f.shrubs + 22 * f.trees,
  seasonal: (f) => 140 + 16 * f.trees,
};

// Service visits per year for each cadence (Middle Tennessee growing season).
const VISITS_PER_YEAR = {
  weekly: 30,
  biweekly: 15,
  monthly: 9,
  custom: 4,
  seasonal: 2,
  periodic: 3,
  'one-time': 1,
};

const SPREAD = 0.15; // range shown: ±15% around the sample figure
const round10 = (n) => Math.round(n / 10) * 10;
const range = (n) => ({ low: round10(n * (1 - SPREAD)), high: round10(n * (1 + SPREAD)) });
const add = (a, b) => ({ low: a.low + b.low, high: a.high + b.high });

export const money = (n) => `$${n.toLocaleString('en-US')}`;
export const moneyRange = (r) => (r.low === r.high ? money(r.low) : `${money(r.low)}–${money(r.high)}`);

const TERM_MONTHS = { '12': 12, '24': 24, '36': 36 };

export function buildEstimate(state, property) {
  const facts = scopeFacts(property);
  const oneTimeProject = state.term === 'one-time';
  const lines = [];
  let annual = { low: 0, high: 0 };

  for (const s of SERVICES.filter((x) => state.services.includes(x.id))) {
    if (s.id === 'improve') {
      lines.push({ id: s.id, label: s.label, separate: true });
      continue;
    }
    const perVisit = RATES[s.id](facts);
    const cadence = effectiveCadence(state, s.id);
    const visits = oneTimeProject ? 1 : VISITS_PER_YEAR[cadence];
    const total = range(perVisit * visits);
    annual = add(annual, total);
    lines.push({ id: s.id, label: s.label, perVisit: range(perVisit), visits, total });
  }

  const months = TERM_MONTHS[state.term];
  return {
    empty: lines.length === 0,
    priced: lines.some((l) => !l.separate),
    oneTimeProject,
    lines,
    annual,
    monthly: { low: round10(annual.low / 12), high: round10(annual.high / 12) },
    termMonths: months ?? null,
    termTotal: months ? { low: (annual.low * months) / 12, high: (annual.high * months) / 12 } : null,
    basis: 'Placeholder sample rates applied to the sample plan quantities. Not a Busy Bee Lawn quote.',
  };
}
