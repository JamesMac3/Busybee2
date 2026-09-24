import {
  Timeline,
  bbox,
  dist,
  makeNetwork,
  mulberry32,
  passCells,
  pointInPoly,
  polyD,
  circleD,
  routeVia,
} from './geometry.js';

// Deterministic service routes for one property. Everything here is derived
// from the PropertyGeometry, so switching properties regenerates every route.

const SPACING = 11; // mowing pass width (plan units)
const SPEED = { cut: 360, turn: 260, transit: 340, edge: 140, bed: 130, travel: 240, clean: 170 };
const PRUNE_SECS = 0.5;

export const SERVICES = [
  { id: 'mow', label: 'Mowing', proposal: 'routine' },
  { id: 'edge', label: 'Edging & trimming', proposal: 'routine' },
  { id: 'beds', label: 'Beds & mulch', proposal: 'beds' },
  { id: 'shrubs', label: 'Shrub & ornamental care', proposal: 'shrubs' },
  { id: 'seasonal', label: 'Seasonal cleanup', proposal: 'seasonal' },
  { id: 'improve', label: 'Landscape improvements', proposal: 'improvements' },
];

// Obstacles inside a lawn: trees, shrubs (circles) and beds (boxes).
function lawnHoles(lawn, p) {
  const holes = [];
  for (const t of [...p.trees, ...p.shrubs]) {
    if (pointInPoly([t.cx, t.cy], lawn.poly)) holes.push({ cx: t.cx, cy: t.cy, r: t.r + 4 });
  }
  for (const bed of p.beds) {
    const b = bbox(bed);
    if (pointInPoly([b.cx, b.cy], lawn.poly)) holes.push({ x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 });
  }
  return holes;
}

const swapPt = ([x, y]) => [y, x];
const swapHole = (h) =>
  h.r !== undefined ? { cx: h.cy, cy: h.cx, r: h.r } : { x0: h.y0, y0: h.x0, x1: h.y1, y1: h.x1 };

// Mowing cells for a lawn, as real-space pass segments.
function lawnCells(lawn, p) {
  const v = lawn.dir === 'v';
  const poly = v ? lawn.poly.map(swapPt) : lawn.poly;
  const holes = lawnHoles(lawn, p).map((h) => (v ? swapHole(h) : h));
  return passCells(poly, holes, SPACING).map((rows) =>
    rows.map((r) => {
      const a = v ? [r.y, r.a] : [r.a, r.y];
      const b = v ? [r.y, r.b] : [r.b, r.y];
      return { a, b, stripe: r.index % 2 };
    }),
  );
}

// Order a cell's passes (boustrophedon) starting from the end nearest `pos`.
function orientCell(passes, pos) {
  const first = passes[0];
  const last = passes[passes.length - 1];
  const options = [
    { list: passes, flip: false, d: dist(pos, first.a) },
    { list: passes, flip: true, d: dist(pos, first.b) },
    { list: [...passes].reverse(), flip: false, d: dist(pos, last.a) },
    { list: [...passes].reverse(), flip: true, d: dist(pos, last.b) },
  ].sort((x, y) => x.d - y.d)[0];
  return options.list.map((ps, i) => {
    const forward = (i % 2 === 0) !== options.flip;
    return { ...ps, from: forward ? ps.a : ps.b, to: forward ? ps.b : ps.a };
  });
}

function nearestFirst(items, pos, keyPoint) {
  const rest = [...items];
  const out = [];
  let cur = pos;
  while (rest.length) {
    let bi = 0;
    let bd = Infinity;
    rest.forEach((it, i) => {
      const d = dist(cur, keyPoint(it));
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    const it = rest.splice(bi, 1)[0];
    out.push(it);
    cur = keyPoint(it);
  }
  return out;
}

function buildMow(p, net) {
  const tl = new Timeline();
  const cuts = [];
  let pos = p.start;
  const lawns = nearestFirst(
    p.lawns.map((l, i) => ({ ...l, index: i })),
    pos,
    (l) => [bbox(l.poly).cx, bbox(l.poly).cy],
  );
  for (const lawn of lawns) {
    const cells = nearestFirst(lawnCells(lawn, p), pos, (c) => c[0].a);
    cells.forEach((cell, ci) => {
      const passes = orientCell(cell, pos);
      // Between lawns: travel along access routes. Within a lawn: short hop.
      const hop = ci === 0 ? routeVia(net, pos, passes[0].from) : [pos, passes[0].from];
      tl.move('transit', hop, SPEED.transit);
      passes.forEach((ps, i) => {
        if (i > 0) tl.move('turn', [passes[i - 1].to, ps.from], SPEED.turn);
        cuts.push(tl.move('cut', [ps.from, ps.to], SPEED.cut, { lawn: lawn.index, stripe: ps.stripe }));
      });
      pos = passes[passes.length - 1].to;
    });
  }
  return { segs: tl.segs, cuts, duration: tl.t, spacing: SPACING };
}

function buildEdge(p, net) {
  const tl = new Timeline();
  const runs = [];
  let pos = p.start;
  const rest = p.edges.map((pts, i) => ({ pts, i }));
  while (rest.length) {
    let bi = 0;
    let rev = false;
    let bd = Infinity;
    rest.forEach((e, i) => {
      const d0 = dist(pos, e.pts[0]);
      const d1 = dist(pos, e.pts[e.pts.length - 1]);
      if (d0 < bd) [bd, bi, rev] = [d0, i, false];
      if (d1 < bd) [bd, bi, rev] = [d1, i, true];
    });
    const e = rest.splice(bi, 1)[0];
    const pts = rev ? [...e.pts].reverse() : e.pts;
    tl.move('transit', routeVia(net, pos, pts[0]), SPEED.transit);
    runs.push(tl.move('edge', pts, SPEED.edge));
    pos = pts[pts.length - 1];
  }
  return { segs: tl.segs, runs, duration: tl.t };
}

function buildBeds(p, net) {
  const tl = new Timeline();
  const beds = [];
  let pos = p.start;
  const order = nearestFirst(
    p.beds.map((poly) => ({ poly, b: bbox(poly) })),
    pos,
    (x) => [x.b.cx, x.b.cy],
  );
  for (const bed of order) {
    const { b } = bed;
    const horizontal = b.w >= b.h;
    // Zig-zag across the short axis while advancing along the long axis.
    const step = 7;
    const n = Math.max(2, Math.ceil((horizontal ? b.w : b.h) / step));
    const zig = [];
    for (let i = 0; i <= n; i++) {
      const along = (i / n) * (horizontal ? b.w - 6 : b.h - 6) + 3;
      const across = i % 2 ? 3 : (horizontal ? b.h : b.w) - 3;
      zig.push(horizontal ? [b.x0 + along, b.y0 + across] : [b.x0 + across, b.y0 + along]);
    }
    tl.move('transit', routeVia(net, pos, zig[0]), SPEED.transit);
    beds.push(tl.move('bed', zig, SPEED.bed, { poly: bed.poly, box: b, horizontal }));
    pos = zig[zig.length - 1];
  }
  return { segs: tl.segs, beds, duration: tl.t };
}

// Irregular (overgrown) silhouette around a plant, deterministic per plant.
function roughD(c, rng) {
  const pts = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = c.r * (1.18 + rng() * 0.38);
    pts.push([c.cx + Math.cos(a) * r, c.cy + Math.sin(a) * r]);
  }
  return polyD(pts);
}

function buildShrubs(p, net, rng) {
  const tl = new Timeline();
  const targets = [];
  let pos = p.start;
  const plants = nearestFirst(
    [...p.shrubs.map((s) => ({ ...s, kind: 'shrub' })), ...p.trees.map((t) => ({ ...t, kind: 'tree' }))],
    pos,
    (c) => [c.cx, c.cy],
  );
  for (const c of plants) {
    const d = dist(pos, [c.cx, c.cy]) || 1;
    const off = c.r + 6;
    const at = [c.cx + ((pos[0] - c.cx) / d) * off, c.cy + ((pos[1] - c.cy) / d) * off];
    tl.move('travel', routeVia(net, pos, at, 110), SPEED.travel);
    targets.push(tl.hold('prune', at, PRUNE_SECS, { plant: c, rough: roughD(c, rng) }));
    pos = at;
  }
  return { segs: tl.segs, targets, duration: tl.t };
}

function buildSeasonal(p, net, rng) {
  const inLawn = (pt) => p.lawns.some((l) => pointInPoly(pt, l.poly));
  const blocked = (pt) =>
    [...p.trees, ...p.shrubs].some((c) => dist(pt, [c.cx, c.cy]) < c.r + 3) ||
    p.beds.some((bed) => pointInPoly(pt, bed));
  const leaves = [];
  for (const t of p.trees) {
    for (let k = 0; k < 5; k++) {
      const a = rng() * Math.PI * 2;
      const r = t.r + 7 + rng() * 22;
      const pt = [t.cx + Math.cos(a) * r, t.cy + Math.sin(a) * r];
      if (inLawn(pt) && !blocked(pt)) leaves.push({ pt, rot: Math.round(rng() * 180) });
    }
  }
  const tl = new Timeline();
  let pos = p.start;
  const order = nearestFirst(leaves, pos, (l) => l.pt);
  for (const leaf of order) {
    const far = dist(pos, leaf.pt) > 90;
    tl.move(far ? 'transit' : 'clean', far ? routeVia(net, pos, leaf.pt) : [pos, leaf.pt], far ? SPEED.transit : SPEED.clean);
    leaf.t = tl.t;
    pos = leaf.pt;
  }
  return { segs: tl.segs, leaves: order, duration: Math.max(tl.t, 1) };
}

function buildImprove(p) {
  let t = 0;
  const areas = p.improvements.map((imp) => {
    const area = { ...imp, box: bbox(imp.poly), t0: t, t1: t + 1.1 };
    t = area.t1;
    area.plantsAt = imp.plants.map((pt) => {
      const pl = { pt, t0: t, t1: t + 0.35 };
      t += 0.14;
      return pl;
    });
    t += 0.4;
    return area;
  });
  return { areas, duration: Math.max(t, 1) };
}

// Keep every service watchable: long routes are time-scaled (geometry unchanged).
const MAX_SECS = 22;
function capDuration(route) {
  if (route.duration <= MAX_SECS) return route;
  const k = MAX_SECS / route.duration;
  for (const seg of route.segs) {
    seg.t0 *= k;
    seg.t1 *= k;
  }
  for (const leaf of route.leaves ?? []) leaf.t *= k;
  route.duration = MAX_SECS;
  return route;
}

export function buildRoutes(p) {
  const net = makeNetwork(p.access);
  const rng = mulberry32(p.seed);
  return {
    mow: capDuration(buildMow(p, net)),
    edge: capDuration(buildEdge(p, net)),
    beds: capDuration(buildBeds(p, net)),
    shrubs: capDuration(buildShrubs(p, net, rng)),
    seasonal: capDuration(buildSeasonal(p, net, rng)),
    improve: buildImprove(p),
    lawnClips: p.lawns.map((l) => {
      const holes = lawnHoles(l, p)
        .map((h) => (h.r !== undefined ? circleD(h) : polyD([[h.x0, h.y0], [h.x1, h.y0], [h.x1, h.y1], [h.x0, h.y1]])))
        .join('');
      return polyD(l.poly) + holes;
    }),
  };
}

// Illustrative counts for the scope summary (no measurements).
export function scopeFacts(p) {
  return {
    lawns: p.lawns.length,
    edges: p.edges.length,
    beds: p.beds.length,
    shrubs: p.shrubs.length,
    trees: p.trees.length,
    improvements: p.improvements.length,
  };
}
