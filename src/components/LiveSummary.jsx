import { proposalCopy } from '../content.js';
import { useBuilder } from '../builderStore.jsx';
import { buildDraft } from '../draft.js';
import { buildEstimate, moneyRange } from '../estimate.js';
import ServiceSymbol from './ServiceSymbol.jsx';
import Icon from './Icon.jsx';

// Wide screens, steps 1–3: the proposal taking shape beside the slides.
export default function LiveSummary({ property }) {
  const { draft, change, goTo } = useBuilder();
  const d = buildDraft(draft, property);
  const est = buildEstimate(draft, property);
  return (
    <aside className="live-summary" aria-labelledby="live-title">
      <p className="pc-eyebrow">Live draft</p>
      <h2 id="live-title">{proposalCopy.heading}</h2>
      <p className="pc-status">
        <span className="pc-status-mark" aria-hidden="true" />
        {proposalCopy.status}
      </p>
      {d.empty ? (
        <p className="pc-empty">{proposalCopy.empty}</p>
      ) : (
        <>
          <p key={change.n} className={`pc-scope${change.n ? ' is-changed' : ''}`}>
            {d.sentence}
          </p>
          <ul className="live-services">
            {d.services.map((s) => (
              <li key={s.id}>
                <ServiceSymbol id={s.id} />
                <span>
                  {s.label} <span className="pc-sub">{s.cadence}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <dl className="live-facts">
        <div>
          <dt>Property</dt>
          <dd>
            {property.city} · {property.label}
          </dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{d.frequency}</dd>
        </div>
        <div>
          <dt>Term</dt>
          <dd>{d.term}</dd>
        </div>
        <div>
          <dt>Start</dt>
          <dd>{d.start}</dd>
        </div>
      </dl>
      {est.priced && (
        <p className="live-estimate">
          <span>Illustrative estimate · sample rates</span>
          <strong>
            {moneyRange(est.annual)}
            {est.oneTimeProject ? '' : ' / yr'}
          </strong>
        </p>
      )}
      <button type="button" className="btn btn-primary btn-block" onClick={() => goTo(3)} disabled={d.empty}>
        Review full proposal
        <Icon name="arrow" size={18} />
      </button>
    </aside>
  );
}
