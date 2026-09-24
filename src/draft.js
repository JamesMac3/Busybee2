// Deterministic draft-proposal logic. Pure functions of the builder state:
// no network, no AI, no pricing, no measurements.

import { SERVICES, scopeFacts } from './plan/routes.js';

export const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every two weeks' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Seasonal / custom' },
];

export const TERMS = [
  { id: 'one-time', label: 'One-time project' },
  { id: 'monthly', label: 'Month-to-month' },
  { id: '12', label: '12 months' },
  { id: '24', label: '24 months' },
  { id: '36', label: '36 months' },
  { id: 'help', label: 'Help me decide' },
];

export const RENEWALS = [
  { id: 'review', label: 'Review before the term ends' },
  { id: 'annual', label: 'Discuss annual renewal' },
  { id: 'none', label: 'No preference yet' },
];

export const STARTS = [
  { id: 'asap', label: 'As soon as practical' },
  { id: 'date', label: 'Choose a preferred date' },
  { id: 'flexible', label: 'Flexible' },
];

// Per-service cadence options. `inherit` follows the general visit frequency.
// The first option in each list is the suggested default.
const CADENCE_LABELS = {
  inherit: 'Same as visit frequency',
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  monthly: 'Monthly',
  seasonal: 'Seasonal (spring and fall)',
  periodic: 'Periodic refresh',
  'one-time': 'One-time',
  separate: 'Scoped as a separate project',
};

export const CADENCE_OPTIONS = {
  mow: ['inherit', 'weekly', 'biweekly', 'monthly'],
  edge: ['inherit', 'weekly', 'biweekly', 'monthly'],
  beds: ['one-time', 'periodic', 'inherit'],
  shrubs: ['seasonal', 'inherit', 'monthly'],
  seasonal: ['seasonal', 'one-time'],
  improve: ['separate'],
};

export const suggestedCadence = (id) => CADENCE_OPTIONS[id][0];
export const cadenceLabel = (id) => CADENCE_LABELS[id];
export const labelOf = (list, id) => list.find((x) => x.id === id)?.label ?? '';

// What a service actually happens on, after inheriting the general frequency.
export function effectiveCadence(state, serviceId) {
  const c = state.cadence[serviceId] ?? suggestedCadence(serviceId);
  return c === 'inherit' ? state.frequency : c;
}

const RECURRING = new Set(['weekly', 'biweekly', 'monthly', 'custom']);

const NOUN = {
  mow: 'mowing',
  edge: 'edging',
  beds: 'bed maintenance and mulching',
  shrubs: 'shrub and ornamental care',
  seasonal: 'seasonal cleanup',
  improve: 'landscape improvements',
};
const ZONE_WORD = { mow: 'turf areas', edge: 'turf areas', beds: 'planting beds', shrubs: 'shrubs and trees', seasonal: 'lawn areas' };

const joinAnd = (items) =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')}${items.length > 2 ? ',' : ''} and ${items[items.length - 1]}`;

function separatePhrase(id, cadence) {
  if (id === 'improve') return 'landscape improvements';
  if (id === 'beds') return cadence === 'periodic' ? 'periodic bed and mulch work' : 'a one-time bed and mulch refresh';
  if (id === 'shrubs') return 'seasonal shrub care';
  if (id === 'seasonal') return cadence === 'one-time' ? 'a one-time cleanup' : 'spring and fall cleanups';
  return NOUN[id];
}

// One short, natural description of the requested scope.
export function scopeSentence(state) {
  const chosen = SERVICES.filter((s) => state.services.includes(s.id));
  if (!chosen.length) return '';
  const recurring = chosen.filter((s) => RECURRING.has(effectiveCadence(state, s.id)));
  const separate = chosen.filter((s) => !recurring.includes(s));
  const parts = [];
  if (recurring.length) {
    const zones = [...new Set(recurring.map((s) => ZONE_WORD[s.id]))];
    parts.push(`Recurring ${joinAnd(recurring.map((s) => NOUN[s.id]))} of the illustrated ${joinAnd(zones)}`);
  }
  const extras = separate.map((s) => separatePhrase(s.id, effectiveCadence(state, s.id)));
  if (parts.length && extras.length) return `${parts[0]}, with ${joinAnd(extras)} requested separately.`;
  if (parts.length) return `${parts[0]}.`;
  const text = joinAnd(extras);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} requested.`;
}

// Illustrative zones per service, from the sample geometry.
export function zoneText(serviceId, facts) {
  switch (serviceId) {
    case 'mow':
      return `${facts.lawns} turf areas`;
    case 'edge':
      return `${facts.edges} edge runs`;
    case 'beds':
      return `${facts.beds} planting beds`;
    case 'shrubs':
      return `${facts.shrubs} shrubs and ${facts.trees} trees`;
    case 'seasonal':
      return `lawn areas around ${facts.trees} trees`;
    case 'improve':
      return `${facts.improvements} proposed area${facts.improvements === 1 ? '' : 's'}`;
    default:
      return '';
  }
}

export function cadenceText(state, serviceId) {
  const raw = state.cadence[serviceId] ?? suggestedCadence(serviceId);
  if (raw === 'inherit') return labelOf(FREQUENCIES, state.frequency);
  return cadenceLabel(raw);
}

export function isSuggested(state, serviceId) {
  return (state.cadence[serviceId] ?? suggestedCadence(serviceId)) === suggestedCadence(serviceId);
}

export function startText(state) {
  if (state.start === 'date') {
    if (!state.startDate) return 'Preferred date (not chosen yet)';
    const d = new Date(`${state.startDate}T12:00:00`);
    return `Preferred date: ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  return labelOf(STARTS, state.start);
}

// Everything the proposal card and print view show, derived from one state.
export function buildDraft(state, property) {
  const facts = scopeFacts(property);
  const chosen = SERVICES.filter((s) => state.services.includes(s.id));
  const differences = chosen.filter((s) => {
    const raw = state.cadence[s.id] ?? suggestedCadence(s.id);
    return raw !== 'inherit';
  });
  return {
    empty: chosen.length === 0,
    sentence: scopeSentence(state),
    services: chosen.map((s) => ({
      id: s.id,
      label: s.label,
      zones: zoneText(s.id, facts),
      cadence: cadenceText(state, s.id),
      suggested: isSuggested(state, s.id),
    })),
    frequency: labelOf(FREQUENCIES, state.frequency),
    differences: differences.map((s) => ({ label: s.label, cadence: cadenceText(state, s.id), suggested: isSuggested(state, s.id) })),
    term: labelOf(TERMS, state.term),
    renewal: labelOf(RENEWALS, state.renewal),
    start: startText(state),
    notes: state.notes.trim(),
  };
}
