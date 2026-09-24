import { moneyRange } from '../estimate.js';

// Illustrative estimate table + totals, shared by the proposal card and the
// PDF document. Figures come from placeholder sample rates (see estimate.js).
export default function EstimateBlock({ est, headingId, className = '' }) {
  if (est.empty) return null;
  return (
    <section className={`pc-estimate ${className}`} aria-labelledby={headingId}>
      <h3 id={headingId}>
        Illustrative estimate <em className="pc-tag">Sample rates</em>
      </h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Per visit</th>
            <th scope="col">Visits{est.oneTimeProject ? '' : ' / yr'}</th>
            <th scope="col">{est.oneTimeProject ? 'Project' : 'Annual'}</th>
          </tr>
        </thead>
        <tbody>
          {est.lines.map((l) =>
            l.separate ? (
              <tr key={l.id}>
                <th scope="row">{l.label}</th>
                <td colSpan={3} className="est-separate">
                  Estimated separately after design review
                </td>
              </tr>
            ) : (
              <tr key={l.id}>
                <th scope="row">{l.label}</th>
                <td>{moneyRange(l.perVisit)}</td>
                <td>{l.visits}</td>
                <td>{moneyRange(l.total)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      {est.priced && (
        <dl className="est-totals">
          <div>
            <dt>{est.oneTimeProject ? 'Estimated project total' : 'Estimated annual'}</dt>
            <dd>{moneyRange(est.annual)}</dd>
          </div>
          {!est.oneTimeProject && (
            <div>
              <dt>Average monthly</dt>
              <dd>{moneyRange(est.monthly)}</dd>
            </div>
          )}
          {est.termTotal && (
            <div>
              <dt>{est.termMonths}-month term</dt>
              <dd>{moneyRange(est.termTotal)}</dd>
            </div>
          )}
        </dl>
      )}
      <p className="est-basis">{est.basis}</p>
    </section>
  );
}
