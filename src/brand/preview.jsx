import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BrandLogo from './BrandLogo.jsx';
import { COLORS } from './logoData.js';
import './preview.css';

const LAYOUTS = [
  { id: 'horizontal', label: 'Horizontal — header', height: 56 },
  { id: 'stacked', label: 'Stacked — larger placements', height: 150 },
  { id: 'emblem', label: 'Emblem — favicon and small marks', height: 96 },
];
const TONES = [
  { id: 'color', label: 'Full color', bg: 'light' },
  { id: 'reverse', label: 'Reverse color', bg: 'dark' },
  { id: 'mono-light', label: 'Monochrome — light backgrounds', bg: 'light' },
  { id: 'mono-dark', label: 'Monochrome — dark backgrounds', bg: 'dark' },
];

// eslint-disable-next-line react-refresh/only-export-components -- page entry, not a module
function Preview() {
  return (
    <main className="bp">
      <header className="bp-head">
        <p className="bp-kicker">Proposed brand direction · not an adopted company identity</p>
        <h1>Busy Bee Lawn &amp; Landscape</h1>
        <p>
          Original SVG logo system for the commercial concept. The original company logo files are preserved
          unchanged in <code>public/images/</code>.
        </p>
      </header>

      {LAYOUTS.map((l) => (
        <section key={l.id} className="bp-section" aria-labelledby={`h-${l.id}`}>
          <h2 id={`h-${l.id}`}>{l.label}</h2>
          <div className="bp-grid">
            {TONES.map((t) => (
              <figure key={t.id} className={`bp-tile bp-${t.bg}`}>
                <BrandLogo layout={l.id} tone={t.id} height={l.height} />
                <figcaption>
                  {t.label}
                  <a href={`/brand/busy-bee-${l.id}-${t.id}.svg`}>SVG file</a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      <section className="bp-section" aria-labelledby="h-small">
        <h2 id="h-small">Small sizes</h2>
        <div className="bp-row bp-light">
          {[16, 24, 32, 48, 64].map((s) => (
            <figure key={s} className="bp-size">
              <img src="/favicon.svg" width={s} height={s} alt={`Emblem at ${s} pixels`} />
              <figcaption>{s}px</figcaption>
            </figure>
          ))}
          <figure className="bp-size">
            <img src="/favicon-32.png" width="32" height="32" alt="PNG favicon, 32 pixels" />
            <figcaption>PNG 32</figcaption>
          </figure>
          <figure className="bp-size">
            <img src="/apple-touch-icon.png" width="60" height="60" alt="Apple touch icon" />
            <figcaption>Touch icon</figcaption>
          </figure>
        </div>
        <div className="bp-row bp-light">
          {[28, 34, 40].map((h) => (
            <figure key={h} className="bp-size">
              <BrandLogo height={h} />
              <figcaption>Horizontal at {h}px tall</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bp-section" aria-labelledby="h-colors">
        <h2 id="h-colors">Palette</h2>
        <ul className="bp-swatches">
          {Object.entries(COLORS).map(([name, hex]) => (
            <li key={name}>
              <span style={{ background: hex }} />
              <strong>{name}</strong> {hex}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
