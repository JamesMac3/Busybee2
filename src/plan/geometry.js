// Small, dependency-free geometry helpers for the property-plan demo.

export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

export function bbox(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

export function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const f = (n) => Math.round(n * 10) / 10;
export const polyD = (pts, close = true) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('') + (close ? 'Z' : '');
export const circleD = ({ cx, cy, r }) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

export function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- scanlines

function scanRow(poly, y) {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
  }
  xs.sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  return out;
}

function subtract(intervals, [s, e]) {
  const out = [];
  for (const [a, b] of intervals) {
    if (e <= a || s >= b) out.push([a, b]);
    else {
      if (s > a) out.push([a, s]);
      if (e < b) out.push([e, b]);
    }
  }
  return out;
}

function holeSpan(hole, y) {
  if (hole.r !== undefined) {
    const dy = y - hole.cy;
    if (Math.abs(dy) >= hole.r) return null;
    const dx = Math.sqrt(hole.r * hole.r - dy * dy);
    return [hole.cx - dx, hole.cx + dx];
  }
  if (y <= hole.y0 || y >= hole.y1) return null;
  return [hole.x0, hole.x1];
}

// Parallel passes inside a polygon, avoiding holes. Passes are grouped into
// cells (runs of rows that overlap), so no cutting pass ever crosses a hole.
// Works in "h" space; callers swap axes for vertical mowing.
export function passCells(poly, holes, spacing, inset = 3, minLen = 6) {
  const b = bbox(poly);
  const n = Math.max(1, Math.floor((b.h - 2 * inset) / spacing) + 1);
  const first = b.cy - ((n - 1) * spacing) / 2;
  const cells = [];
  let open = [];
  for (let r = 0; r < n; r++) {
    const y = first + r * spacing;
    let ivs = scanRow(poly, y)
      .map(([a, c]) => [a + inset, c - inset])
      .filter(([a, c]) => c - a > minLen);
    for (const h of holes) {
      const span = holeSpan(h, y);
      if (span) ivs = subtract(ivs, span);
    }
    ivs = ivs.filter(([a, c]) => c - a > minLen);
    const next = [];
    const used = new Set();
    for (const iv of ivs) {
      const cell = open.find((c) => !used.has(c) && Math.min(c.last[1], iv[1]) - Math.max(c.last[0], iv[0]) > 0);
      const row = { y, a: iv[0], b: iv[1], index: r };
      if (cell) {
        used.add(cell);
        cell.rows.push(row);
        cell.last = iv;
        next.push(cell);
      } else {
        const c = { rows: [row], last: iv };
        cells.push(c);
        next.push(c);
      }
    }
    open = next;
  }
  return cells.map((c) => c.rows);
}

// ---------------------------------------------------------------- access routing

function densify(loop, step = 36) {
  const out = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    const n = Math.max(1, Math.round(dist(a, b) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

export function makeNetwork(loop) {
  return densify(loop);
}

const nearestIdx = (net, p) => {
  let best = 0;
  let bd = Infinity;
  net.forEach((q, i) => {
    const d = dist(p, q);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};

// Plausible travel between two points: straight when close, otherwise along
// the property's access loop (drives / walks), whichever direction is shorter.
export function routeVia(net, a, b, direct = 80) {
  if (dist(a, b) <= direct) return [a, b];
  const i = nearestIdx(net, a);
  const j = nearestIdx(net, b);
  if (i === j) return [a, net[i], b];
  const n = net.length;
  const fwd = [];
  for (let k = i; k !== j; k = (k + 1) % n) fwd.push(net[k]);
  fwd.push(net[j]);
  const back = [];
  for (let k = i; k !== j; k = (k - 1 + n) % n) back.push(net[k]);
  back.push(net[j]);
  const path = polyLength(fwd) <= polyLength(back) ? fwd : back;
  return [a, ...path, b];
}

// ---------------------------------------------------------------- timelines

// A timed route: an ordered list of segments with start/end times (seconds).
export class Timeline {
  constructor() {
    this.segs = [];
    this.t = 0;
  }
  move(type, pts, speed, extra = {}) {
    const len = polyLength(pts);
    const seg = { type, pts, len, t0: this.t, t1: this.t + len / speed, ...extra };
    this.t = seg.t1;
    this.segs.push(seg);
    return seg;
  }
  hold(type, at, secs, extra = {}) {
    const seg = { type, pts: [at, at], len: 0, t0: this.t, t1: this.t + secs, ...extra };
    this.t = seg.t1;
    this.segs.push(seg);
    return seg;
  }
}

// Position and heading at time t along a timeline's segments.
export function sampleAt(segs, t) {
  if (!segs.length) return { x: 0, y: 0, angle: 0, seg: -1 };
  let lo = 0;
  let hi = segs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segs[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  const s = segs[lo];
  const span = s.t1 - s.t0;
  const k = span > 0 ? Math.min(1, Math.max(0, (t - s.t0) / span)) : 1;
  let target = k * s.len;
  const pts = s.pts;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (target <= d || i === pts.length - 1) {
      const q = d ? Math.min(1, target / d) : 0;
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q;
      const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q;
      const angle = d ? (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI : 0;
      return { x, y, angle, seg: lo, k };
    }
    target -= d;
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0, seg: lo, k };
}
