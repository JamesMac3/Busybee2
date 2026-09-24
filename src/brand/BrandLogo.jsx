import { COLORS, TONES, EMBLEM, WORD, SUB, LAYOUTS } from './logoData.js';

// Proposed Busy Bee Lawn & Landscape logo system (see tools/brand/generate_logo.py).
//
//   layout: 'horizontal' | 'stacked' | 'emblem'
//   tone:   'color' | 'reverse' | 'mono-light' | 'mono-dark'
//   height: rendered height in px; width follows the layout's aspect ratio,
//           and both are set explicitly so the logo never shifts layout.
//   title:  accessible name; pass decorative to hide it from assistive tech.
export default function BrandLogo({
  layout = 'horizontal',
  tone = 'color',
  height = 44,
  title,
  decorative = false,
  className = '',
}) {
  const lay = LAYOUTS[layout];
  const t = TONES[tone];
  const c = (part) => COLORS[t[part]];
  const width = Math.round((lay.width / lay.height) * height * 100) / 100;
  const [ex, ey, es] = lay.emblem;
  const label = title ?? (layout === 'emblem' ? 'Busy Bee emblem' : 'Busy Bee Lawn & Landscape');

  return (
    <svg
      className={`brand-logo brand-${layout} ${className}`}
      viewBox={`0 0 ${lay.width} ${lay.height}`}
      width={width}
      height={height}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      focusable="false"
    >
      <g transform={`translate(${ex} ${ey}) scale(${es})`}>
        {EMBLEM.wings.map((d) => (
          <path key={d} fill={c('wing')} d={d} />
        ))}
        <path
          fill="none"
          stroke={c('head')}
          strokeWidth={EMBLEM.antennaWidth}
          strokeLinecap="square"
          d={EMBLEM.antennae}
        />
        <circle fill={c('head')} cx={EMBLEM.head.cx} cy={EMBLEM.head.cy} r={EMBLEM.head.r} />
        {EMBLEM.body.map((d) => (
          <path key={d} fill={c('body')} d={d} />
        ))}
        {t.stripes && EMBLEM.stripes.map((d) => <path key={d} fill={c('stripes')} d={d} />)}
      </g>
      {layout !== 'emblem' && (
        <>
          <path fill={c('word')} transform={`translate(${lay.word[0]} ${lay.word[1]})`} d={WORD.d} />
          <path fill={c('sub')} transform={`translate(${lay.sub[0]} ${lay.sub[1]})`} d={SUB.d} />
        </>
      )}
    </svg>
  );
}
