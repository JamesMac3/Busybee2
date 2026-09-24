import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { buildRoutes } from '../plan/routes.js';
import { polyD, sampleAt } from '../plan/geometry.js';

// Adaptive SVG site plan with concurrent service animations.
//
// One shared clock drives every active service overlay; each overlay keeps its
// own progress (it starts at 0 when switched on) and its own marker. The
// component is keyed by property id, so switching properties remounts it with
// freshly generated routes and a reset clock: no stale routes can remain.

const HOLD = 2.6; // seconds a finished service stays complete before repeating
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const guideD = (segs, types) =>
  segs
    .filter((s) => types.includes(s.type) && s.len > 0)
    .map((s) => polyD(s.pts, false))
    .join('');

function placeMarker(el, segs, t, still) {
  if (!el) return;
  if (still || !segs.length) {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  const s = sampleAt(segs, t);
  el.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle.toFixed(0)})`);
}

// ---------------------------------------------------------------- base plan

function BasePlan({ p }) {
  return (
    <g className="plan-base">
      <rect className="pl-ground" x="0" y="0" width="640" height="440" />
      <g style={p.imageDerived ? { display: 'none' } : undefined}><rect className="pl-sidewalk" x="0" y="370" width="640" height="14" />
      <rect className="pl-street" x="0" y="384" width="640" height="56" />
      <line className="pl-street-line" x1="0" y1="414" x2="640" y2="414" /></g>
      {p.paving.map((poly, i) => (
        <path key={`pv${i}`} className="pl-paving" d={polyD(poly)} />
      ))}
      {p.walks.map((w, i) => (
        <path key={`wk${i}`} className="pl-walkway" d={polyD(w.pts, false)} style={{ strokeWidth: w.width }} />
      ))}
      {p.surfaces?.map((s, i) => <path key={`surface${i}`} className="campus-sports" d={polyD(s.poly)} />)}
      {p.lawns.map((l, i) => (
        <path key={`ln${i}`} className={`pl-lawn${l.uncertain ? ' is-uncertain' : ''}`} d={polyD(l.poly)} />
      ))}
      {p.beds.map((poly, i) => (
        <path key={`bd${i}`} className="pl-bed" d={polyD(poly)} />
      ))}
      {p.buildings.map((b, i) => (
        <path key={`bl${i}`} className="pl-building" d={polyD(b.poly)} pathLength="1" />
      ))}
      {p.shrubs.map((s, i) => (
        <circle key={`sh${i}`} className="pl-shrub" cx={s.cx} cy={s.cy} r={s.r} />
      ))}
      {p.trees.map((t, i) => (
        <g key={`tr${i}`}>
          <circle className="pl-tree" cx={t.cx} cy={t.cy} r={t.r} />
          <circle className="pl-trunk" cx={t.cx} cy={t.cy} r="2" />
        </g>
      ))}
      <g className="pl-labels" aria-hidden="true">
        {p.buildings.map((b, i) => (
          <text key={i} x={b.labelAt[0]} y={b.labelAt[1]}>
            {b.label}
          </text>
        ))}
      </g>
      {!p.imageDerived && <rect className="pl-boundary" x="14" y="14" width="612" height="352" pathLength="1" />}
    </g>
  );
}

// ---------------------------------------------------------------- overlays

function MowOverlay({ route, clips, uid, register }) {
  const lines = useRef([]);
  const marker = useRef(null);
  useEffect(() => {
    const cuts = route.cuts;
    let done = 0;
    let last = -1;
    return register('mow', {
      duration: route.duration,
      update(t, still) {
        if (t < last) {
          cuts.forEach((c, i) => lines.current[i]?.setAttribute('stroke-dashoffset', c.len));
          done = 0;
        }
        last = t;
        while (done < cuts.length && cuts[done].t1 <= t) lines.current[done++]?.setAttribute('stroke-dashoffset', 0);
        if (done < cuts.length) {
          const c = cuts[done];
          const k = clamp01((t - c.t0) / (c.t1 - c.t0));
          lines.current[done]?.setAttribute('stroke-dashoffset', (c.len * (1 - k)).toFixed(1));
        }
        placeMarker(marker.current, route.segs, t, still);
      },
    });
  }, [route, register]);

  return (
    <g className="ov ov-mow">
      <defs>
        {clips.map((d, i) => (
          <clipPath key={i} id={`${uid}-lawn${i}`}>
            <path d={d} clipRule="evenodd" />
          </clipPath>
        ))}
      </defs>
      <path className="guide guide-turn" d={guideD(route.segs, ['turn'])} />
      {clips.map((_, li) => (
        <g key={li} clipPath={`url(#${uid}-lawn${li})`}>
          {route.cuts.map((c, i) =>
            c.lawn === li ? (
              <line
                key={i}
                ref={(el) => (lines.current[i] = el)}
                className={`mow-stripe s${c.stripe}`}
                x1={c.pts[0][0]}
                y1={c.pts[0][1]}
                x2={c.pts[1][0]}
                y2={c.pts[1][1]}
                strokeWidth={route.spacing}
                strokeDasharray={c.len}
                strokeDashoffset={c.len}
              />
            ) : null,
          )}
        </g>
      ))}
      <path className="guide guide-transit" d={guideD(route.segs, ['transit'])} />
      <g ref={marker} className="marker marker-mow"><g className="marker-art">
        <rect x="-6.5" y="-5" width="13" height="10" />
        <path d="M-2 -2.6 2 0 -2 2.6" />
      </g></g>
    </g>
  );
}

function EdgeOverlay({ route, register }) {
  const runs = useRef([]);
  const marker = useRef(null);
  useEffect(
    () =>
      register('edge', {
        duration: route.duration,
        update(t, still) {
          route.runs.forEach((r, i) => {
            const k = clamp01((t - r.t0) / (r.t1 - r.t0));
            runs.current[i]?.setAttribute('stroke-dashoffset', (r.len * (1 - k)).toFixed(1));
          });
          placeMarker(marker.current, route.segs, t, still);
        },
      }),
    [route, register],
  );
  return (
    <g className="ov ov-edge">
      {route.runs.map((r, i) => (
        <path key={`g${i}`} className="edge-guide" d={polyD(r.pts, false)} />
      ))}
      {route.runs.map((r, i) => (
        <path
          key={i}
          ref={(el) => (runs.current[i] = el)}
          className="edge-done"
          d={polyD(r.pts, false)}
          strokeDasharray={r.len}
          strokeDashoffset={r.len}
        />
      ))}
      <path className="guide guide-transit" d={guideD(route.segs, ['transit'])} />
      <g ref={marker} className="marker marker-edge"><g className="marker-art">
        <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" />
      </g></g>
    </g>
  );
}

function BedsOverlay({ route, uid, register }) {
  const sweeps = useRef([]);
  const marker = useRef(null);
  useEffect(
    () =>
      register('beds', {
        duration: route.duration,
        update(t, still) {
          route.beds.forEach((b, i) => {
            const k = clamp01((t - b.t0) / (b.t1 - b.t0));
            const el = sweeps.current[i];
            if (!el) return;
            if (b.horizontal) el.setAttribute('width', (b.box.w * k + 0.01).toFixed(1));
            else el.setAttribute('height', (b.box.h * k + 0.01).toFixed(1));
          });
          placeMarker(marker.current, route.segs, t, still);
        },
      }),
    [route, register],
  );
  return (
    <g className="ov ov-beds">
      <defs>
        <pattern id={`${uid}-mulch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <rect width="6" height="6" className="mulch-base" />
          <rect x="0.5" y="1" width="3.2" height="1.3" className="mulch-chip" />
          <circle cx="4.6" cy="4.3" r="0.9" className="mulch-fleck" />
        </pattern>
        {route.beds.map((b, i) => (
          <clipPath key={i} id={`${uid}-bed${i}`}>
            <path d={polyD(b.poly)} />
          </clipPath>
        ))}
      </defs>
      {route.beds.map((b, i) => (
        <g key={i} clipPath={`url(#${uid}-bed${i})`}>
          <rect
            ref={(el) => (sweeps.current[i] = el)}
            x={b.box.x0}
            y={b.box.y0}
            width={b.horizontal ? 0.01 : b.box.w}
            height={b.horizontal ? b.box.h : 0.01}
            fill={`url(#${uid}-mulch)`}
          />
        </g>
      ))}
      {route.beds.map((b, i) => (
        <path key={`o${i}`} className="bed-outline" d={polyD(b.poly)} />
      ))}
      <path className="guide guide-transit" d={guideD(route.segs, ['transit'])} />
      <g ref={marker} className="marker marker-beds"><g className="marker-art">
        <rect x="-4.5" y="-4.5" width="9" height="9" />
      </g></g>
    </g>
  );
}

function ShrubsOverlay({ route, register }) {
  const rough = useRef([]);
  const tidy = useRef([]);
  const shears = useRef(null);
  const bladeA = useRef(null);
  const bladeB = useRef(null);
  const marker = useRef(null);
  useEffect(() => {
    const state = [];
    return register('shrubs', {
      duration: route.duration,
      update(t, still) {
        let pruning = null;
        route.targets.forEach((s, i) => {
          const q = clamp01((t - s.t0) / (s.t1 - s.t0));
          if (q > 0 && q < 1) pruning = { s, q };
          const key = q.toFixed(2);
          if (state[i] === key) return;
          state[i] = key;
          rough.current[i]?.setAttribute('opacity', (1 - q).toFixed(2));
          tidy.current[i]?.setAttribute('opacity', q.toFixed(2));
        });
        const sh = shears.current;
        if (sh) {
          if (pruning && !still) {
            const { s, q } = pruning;
            const open = 14 + 16 * Math.abs(Math.sin(q * Math.PI * 4));
            sh.style.display = '';
            sh.setAttribute('transform', `translate(${s.plant.cx + s.plant.r + 4} ${s.plant.cy - s.plant.r - 4})`);
            bladeA.current.setAttribute('transform', `rotate(${open})`);
            bladeB.current.setAttribute('transform', `rotate(${-open})`);
          } else sh.style.display = 'none';
        }
        placeMarker(marker.current, route.segs, t, still);
      },
    });
  }, [route, register]);
  return (
    <g className="ov ov-shrubs">
      <path className="guide guide-travel" d={guideD(route.segs, ['travel'])} />
      {route.targets.map((s, i) => (
        <g key={i}>
          <path ref={(el) => (rough.current[i] = el)} className="shrub-rough" d={s.rough} opacity="1" />
          <circle
            ref={(el) => (tidy.current[i] = el)}
            className="shrub-tidy"
            cx={s.plant.cx}
            cy={s.plant.cy}
            r={s.plant.r + 1}
            opacity="0"
          />
        </g>
      ))}
      <g ref={shears} className="shears" style={{ display: 'none' }}>
        <line ref={bladeA} x1="-6" y1="0" x2="6" y2="0" />
        <line ref={bladeB} x1="-6" y1="0" x2="6" y2="0" />
        <circle r="1.4" />
      </g>
      <g ref={marker} className="marker marker-shrubs"><g className="marker-art">
        <circle r="5" />
        <circle r="1.6" className="marker-dot" />
      </g></g>
    </g>
  );
}

function SeasonalOverlay({ route, register }) {
  const leaves = useRef([]);
  const marker = useRef(null);
  useEffect(() => {
    const cleared = [];
    return register('seasonal', {
      duration: route.duration,
      update(t, still) {
        route.leaves.forEach((l, i) => {
          const gone = t >= l.t;
          if (cleared[i] === gone) return;
          cleared[i] = gone;
          leaves.current[i]?.setAttribute('opacity', gone ? '0' : '1');
        });
        placeMarker(marker.current, route.segs, t, still);
      },
    });
  }, [route, register]);
  return (
    <g className="ov ov-seasonal">
      <path className="guide guide-clean" d={guideD(route.segs, ['clean'])} />
      <path className="guide guide-transit" d={guideD(route.segs, ['transit'])} />
      {route.leaves.map((l, i) => (
        <path
          key={i}
          ref={(el) => (leaves.current[i] = el)}
          className="leaf"
          d="M0 -4.2 2.6 0 0 4.2 -2.6 0Z"
          transform={`translate(${l.pt[0].toFixed(1)} ${l.pt[1].toFixed(1)}) rotate(${l.rot})`}
        />
      ))}
      <g ref={marker} className="marker marker-seasonal"><g className="marker-art">
        <path d="M5.5 0 -4 -4.8 -4 4.8Z" />
      </g></g>
    </g>
  );
}

function ImproveOverlay({ route, uid, register }) {
  const wipes = useRef([]);
  const plants = useRef([]);
  const labels = useRef([]);
  useEffect(
    () =>
      register('improve', {
        duration: route.duration,
        update(t) {
          let n = 0;
          route.areas.forEach((a, i) => {
            const k = clamp01((t - a.t0) / (a.t1 - a.t0));
            wipes.current[i]?.setAttribute('width', ((a.box.w + 8) * k + 0.01).toFixed(1));
            labels.current[i]?.setAttribute('opacity', k.toFixed(2));
            a.plantsAt.forEach((pl) => {
              const q = clamp01((t - pl.t0) / (pl.t1 - pl.t0));
              const e = 1 - (1 - q) * (1 - q);
              plants.current[n++]?.setAttribute(
                'transform',
                `translate(${pl.pt[0].toFixed(1)} ${pl.pt[1].toFixed(1)}) scale(${e.toFixed(2)})`,
              );
            });
          });
        },
      }),
    [route, register],
  );
  let n = 0;
  return (
    <g className="ov ov-improve">
      <defs>
        {route.areas.map((a, i) => (
          <clipPath key={i} id={`${uid}-wipe${i}`}>
            <rect ref={(el) => (wipes.current[i] = el)} x={a.box.x0 - 4} y={a.box.y0 - 4} width="0.01" height={a.box.h + 8} />
          </clipPath>
        ))}
      </defs>
      {route.areas.map((a, i) => (
        <g key={i}>
          <g clipPath={`url(#${uid}-wipe${i})`}>
            <path className="improve-area" d={polyD(a.poly)} />
          </g>
          {a.label && (
            <text ref={(el) => (labels.current[i] = el)} className="improve-label" x={a.labelAt[0]} y={a.labelAt[1]} opacity="0">
              {a.label}
            </text>
          )}
          {a.plantsAt.map((pl) => {
            const idx = n++;
            return (
              <g
                key={idx}
                ref={(el) => (plants.current[idx] = el)}
                className="plant-new"
                transform={`translate(${pl.pt[0]} ${pl.pt[1]}) scale(0)`}
              >
                <circle r="3.4" />
                <path d="M-1.9 0H1.9M0 -1.9V1.9" />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- canvas

export default function PlanCanvas({ property, active, playing, replayKey, reduced, label }) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const routes = useMemo(() => buildRoutes(property), [property]);
  const registry = useRef(new Map());
  const clock = useRef(0);
  const stillRef = useRef(reduced);
  const printingRef = useRef(false);
  stillRef.current = reduced;

  const drawOne = useCallback((api) => {
    if (stillRef.current || printingRef.current) {
      api.update(api.duration, true);
      return;
    }
    const local = Math.max(0, clock.current - api.start);
    api.update(Math.min(local % (api.duration + HOLD), api.duration), false);
  }, []);

  // Overlays register here. A newly shown service starts from zero on the
  // shared clock; removing it only removes its own overlay.
  const register = useCallback(
    (id, api) => {
      api.start = clock.current;
      registry.current.set(id, api);
      drawOne(api);
      return () => registry.current.delete(id);
    },
    [drawOne],
  );

  // Replay: restart every active service together.
  useEffect(() => {
    if (!replayKey) return;
    clock.current = 0;
    registry.current.forEach((api) => {
      api.start = 0;
      drawOne(api);
    });
  }, [replayKey, drawOne]);

  // Reduced-motion switch at runtime: redraw in the static completed state.
  useEffect(() => {
    registry.current.forEach((api) => drawOne(api));
  }, [reduced, drawOne]);

  // Printing / saving the draft shows every active service completed.
  useEffect(() => {
    const redraw = (printing) => () => {
      printingRef.current = printing;
      registry.current.forEach((api) => drawOne(api));
    };
    const before = redraw(true);
    const after = redraw(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [drawOne]);

  // Shared animation clock. Paused when not playing, off-screen, in a
  // background tab, or for reduced motion.
  useEffect(() => {
    const svg = svgRef.current;
    let raf = 0;
    let last = 0;
    let visible = true;
    const loop = (now) => {
      clock.current += Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      registry.current.forEach((api) => drawOne(api));
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !playing || reduced || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(svg);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [playing, reduced, drawOne]);

  const on = (id) => active.includes(id);

  return (
    <svg
      ref={svgRef}
      className={`plan-svg${reduced ? ' is-still' : ''}${property.imageDerived ? ' campus-svg' : ''}`}
      viewBox="0 0 640 440"
      role="img"
      aria-labelledby={`${uid}-title ${uid}-desc`}
      data-property={property.id}
    >
      <title id={`${uid}-title`}>{label}</title>
      <desc id={`${uid}-desc`}>
        {property.imageDerived ? 'Manual aerial interpretation. ' : `Stylized sample site plan for a fictional ${property.label.toLowerCase()} in ${property.city}: `}{property.summary}{' '}
        {active.length ? `Showing: ${active.join(', ')}.` : 'No services selected.'}
      </desc>
      <BasePlan p={property} />
      {on('beds') && <BedsOverlay route={routes.beds} uid={uid} register={register} />}
      {on('mow') && <MowOverlay route={routes.mow} clips={routes.lawnClips} uid={uid} register={register} />}
      {on('seasonal') && <SeasonalOverlay route={routes.seasonal} register={register} />}
      {on('edge') && <EdgeOverlay route={routes.edge} register={register} />}
      {on('improve') && <ImproveOverlay route={routes.improve} uid={uid} register={register} />}
      {on('shrubs') && <ShrubsOverlay route={routes.shrubs} register={register} />}
    </svg>
  );
}


