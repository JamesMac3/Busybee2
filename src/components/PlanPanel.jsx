import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { builder } from '../content.js';
import { PROVIDER } from '../plan/provider.js';
import { SERVICES } from '../plan/routes.js';
import ServiceSymbol from './ServiceSymbol.jsx';
import Icon from './Icon.jsx';

// The animated plan. The SVG canvas is code-split; its progress bar shows only
// while the module genuinely loads, and a fallback appears if it fails.
const PlanCanvas = lazy(() => import('./PlanCanvas.jsx'));

class CanvasBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="plan-fallback" role="status">
          <Icon name="alert" size={22} />
          <p>The site plan couldn’t load. Service selections and the proposal still work.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CanvasLoading() {
  return (
    <div className="plan-loading" role="status">
      <span className="plan-loading-bar" aria-hidden="true" />
      <span>Loading the site plan…</span>
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function PlanPanel({ property, active, paused = false, still = false, compact = false }) {
  const reducedMotion = useReducedMotion();
  const reduced = reducedMotion || still;
  const [playing, setPlaying] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [aerialView, setAerialView] = useState('photo');
  const [photoLoaded, setPhotoLoaded] = useState(false);
  useEffect(() => { setAerialView('photo'); setPhotoLoaded(false); }, [property.id]);
  useEffect(() => {
    if (!property.aerial || paused || still || !photoLoaded) return;
    if (reduced) { setAerialView('plan'); return; }
    const timer = setTimeout(() => setAerialView('plan'), 1800);
    return () => clearTimeout(timer);
  }, [property.id, paused, still, reduced, photoLoaded]);

  return (
    <div className={`plan-panel${compact ? ' is-compact' : ''}${still ? ' is-still' : ''}`}>
      <div className="plan-bar">
        <p className="plan-title">
          <span className="plan-label-mark" aria-hidden="true" />
          {builder.planLabel} · {property.city} example
        </p>
        <div className="playback" role="group" aria-label="Animation controls">
          {still ? null : reduced ? (
            <span className="playback-note">Reduced motion: completed plan shown</span>
          ) : (
            <>
              <button type="button" className="mini-btn" aria-pressed={!playing} onClick={() => setPlaying((v) => !v)}>
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="mini-btn"
                onClick={() => {
                  setReplayKey((k) => k + 1);
                  setPlaying(true);
                }}
              >
                Replay
              </button>
            </>
          )}
        </div>
      </div>
      {property.aerial && !still && <div className="aerial-controls" role="group" aria-label="Compare aerial and service plan">
        <button type="button" className="mini-btn" aria-pressed={aerialView === 'photo'} onClick={() => setAerialView('photo')}>Aerial photo</button>
        <button type="button" className="mini-btn" aria-pressed={aerialView === 'plan'} onClick={() => { setAerialView('plan'); setReplayKey(k => k + 1); }}>Animated plan</button>
        <span>Photo → traced service zones</span>
      </div>}
      <div className={`plan-stage${property.aerial ? ' aerial-stage' : ''}`}>
        <CanvasBoundary>
          <Suspense fallback={<CanvasLoading />}>
            <PlanCanvas
              key={property.id}
              property={property}
              active={active}
              playing={playing && !paused && (!property.aerial || aerialView === 'plan')}
              replayKey={replayKey}
              reduced={reduced}
              label={`${builder.planLabel}: ${property.city} example`}
            />
          </Suspense>
        </CanvasBoundary>
        {property.aerial && !still && <img key={property.id} className={`aerial-reference${aerialView === 'plan' ? ' is-revealed' : ''}`} src={property.aerial} alt="Supplied Tennessee school aerial, dated February–April 2025; exact location unknown" onLoad={() => setPhotoLoaded(true)} /> }
      </div>
      {!compact && (
        <ul className="legend" aria-label="Legend">
          {SERVICES.map((s) => (
            <li key={s.id} className={active.includes(s.id) ? '' : 'is-dim'}>
              <ServiceSymbol id={s.id} />
              {s.label}
            </li>
          ))}
          <li>
            <ServiceSymbol id="transit" />
            Travel between areas (no work)
          </li>
        </ul>
      )}
      <p className="plan-note">
        {property.sourceNote || `Sample geometry for a fictional property — not a client site, a measured map, or live tracking. Data source: ${PROVIDER.name}.`}
      </p>
    </div>
  );
}
