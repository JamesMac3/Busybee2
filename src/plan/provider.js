import { FIXTURES } from './fixtures.js';

// Property data provider.
//
// This demo resolves only the three fictional example addresses. It never
// geocodes an arbitrary address and never invents a parcel for one.
//
// To connect live data later, replace `lookupAddress` / `getProperty` with a
// geocoder + parcel/GIS integration that returns the same PropertyGeometry
// shape documented in fixtures.js (projected into the 640 x 440 plan space).
// The visualization and route generation consume only that shape.

export const PROVIDER = {
  name: 'Sample fixtures',
  live: false,
};

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function listExamples() {
  return FIXTURES;
}

export function getProperty(id) {
  return FIXTURES.find((f) => f.id === id) ?? null;
}

// Returns { status: 'example', property } for an exact demo-address match, or
// { status: 'unavailable', suggestions } otherwise. No network, no delay.
export async function lookupAddress(query) {
  const q = norm(query);
  if (!q) return { status: 'empty', suggestions: [] };
  const hit = FIXTURES.find((f) => norm(f.address) === q || norm(f.address).startsWith(q + ' '));
  if (hit && q.length > 8) return { status: 'example', property: hit };
  const suggestions = FIXTURES.filter((f) => q.includes(norm(f.city)));
  return { status: 'unavailable', suggestions: suggestions.length ? suggestions : FIXTURES };
}
