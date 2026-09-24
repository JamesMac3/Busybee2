import { proposalCopy, propertyTypes } from '../content.js';
import { useBuilder } from '../builderStore.jsx';
import { buildDraft } from '../draft.js';
import { buildEstimate } from '../estimate.js';
import EstimateBlock from './EstimateBlock.jsx';
import { revealRegion } from '../focus.js';
import { CONTROL_STEP } from '../steps.js';
import ServiceSymbol from './ServiceSymbol.jsx';
import Icon from './Icon.jsx';

// The live proposal: always derived from the builder store, never edited here.
// "Change" returns focus to the control that owns each line.

// Which store changes highlight which rows.
const TRIGGERS = {
  property: ['property'],
  scope: ['services', 'cadence', 'frequency'],
  services: ['services', 'cadence', 'frequency'],
  frequency: ['frequency'],
  schedules: ['cadence', 'frequency', 'services'],
  term: ['term'],
  renewal: ['renewal'],
  start: ['start'],
  notes: ['notes'],
  estimate: ['property', 'services', 'cadence', 'frequency', 'term'],
};

function Tiers() {
  return (
    <ol className="pc-tiers" aria-label="Where this draft stands">
      {proposalCopy.tiers.map((t) => (
        <li key={t.id} className={`tier tier-${t.id}${t.id === 'requested' ? ' is-current' : ''}`}>
          <strong>{t.label}</strong>
          <span>{t.text}</span>
          {t.id === 'requested' && <em className="pc-tag">This draft</em>}
        </li>
      ))}
    </ol>
  );
}

function Row({ id, label, control, change, children }) {
  const { goTo } = useBuilder();
  const hit = TRIGGERS[id].includes(change.section);
  return (
    <div key={hit ? `${id}-${change.n}` : id} className={`pc-row${hit ? ' is-changed' : ''}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
      {control && (
        <button type="button" className="pc-change" onClick={() => goTo(CONTROL_STEP[control], control)}>
          Change<span className="visually-hidden"> {label.toLowerCase()}</span>
        </button>
      )}
    </div>
  );
}

export default function ProposalCard({ property }) {
  const { draft, change, stage, openRequest, goTo } = useBuilder();
  const d = buildDraft(draft, property);
  const est = buildEstimate(draft, property);
  const estChanged = TRIGGERS.estimate.includes(change.section);

  const request = () => {
    openRequest();
    // Wait for the request panel to mount before moving focus to it.
    requestAnimationFrame(() => revealRegion('request'));
  };

  return (
    <aside id="proposal" className="proposal-card" aria-labelledby="proposal-title" tabIndex={-1}>
      <header className="pc-head">
        <h2 id="proposal-title">{proposalCopy.heading}</h2>
        <p className="pc-status">
          <span className="pc-status-mark" aria-hidden="true" />
          {proposalCopy.status}
        </p>
      </header>

      <p className="visually-hidden" aria-live="polite">
        {d.empty ? proposalCopy.empty : `Proposal updated: ${d.sentence}`}
      </p>
      <div>
        {d.empty ? (
          <p className="pc-empty">
            <Icon name="info" size={18} />
            {proposalCopy.empty}
          </p>
        ) : (
          <p
            key={TRIGGERS.scope.includes(change.section) ? change.n : 'scope'}
            className={`pc-scope${TRIGGERS.scope.includes(change.section) ? ' is-changed' : ''}`}
          >
            {d.sentence}
          </p>
        )}

        <div className="pc-lists">
          <dl className="pc-list">
            <Row id="property" label="Property" control="ctl-property" change={change}>
              {propertyTypes[property.propertyType]} · {property.label}
              <span className="pc-sub">
                {property.imageDerived ? 'Tennessee aerial study · location unknown; manually interpreted.' : `${property.city}, TN · fictional example.`} Your address is confirmed with the request.
              </span>
            </Row>
            {!d.empty && (
              <>
                <Row id="services" label="Services · sample zones" control="ctl-services" change={change}>
                  <ul className="pc-services">
                    {d.services.map((s) => (
                      <li key={s.id}>
                        <ServiceSymbol id={s.id} />
                        <span>
                          <strong>{s.label}</strong>
                          <span className="pc-sub">
                            {s.zones} · {s.cadence}
                            {s.suggested && <em className="pc-tag">Suggested</em>}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Row>
              </>
            )}
          </dl>
          <dl className="pc-list">
            {!d.empty && (
              <>
                <Row id="frequency" label="Visit frequency" control="ctl-frequency" change={change}>
                  {d.frequency}
                </Row>
                {d.differences.length > 0 && (
                  <Row id="schedules" label="Service schedules" control="ctl-cadence" change={change}>
                    <ul className="pc-diff">
                      {d.differences.map((x) => (
                        <li key={x.label}>
                          {x.label}: {x.cadence}
                          {x.suggested && <em className="pc-tag">Suggested</em>}
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}
              </>
            )}
            <Row id="term" label="Agreement term" control="ctl-term" change={change}>
              {d.term} <span className="pc-sub">Requested</span>
            </Row>
            <Row id="renewal" label="Renewal" control="ctl-renewal" change={change}>
              {d.renewal}
            </Row>
            <Row id="start" label="Desired start" control="ctl-start" change={change}>
              {d.start}
            </Row>
            <Row id="notes" label="Notes" control="ctl-notes" change={change}>
              {d.notes ? <span className="pc-notes">{d.notes}</span> : <span className="pc-sub">None added</span>}
            </Row>
          </dl>
        </div>
      </div>

      {!est.empty && (
        <div key={estChanged ? `est-${change.n}` : 'est'} className={estChanged ? 'is-changed' : ''}>
          <EstimateBlock est={est} headingId="pc-est-title" />
        </div>
      )}

      <p className="pc-pricing">
        <Icon name="info" size={17} />
        {proposalCopy.pricing}
      </p>

      <div className="pc-tiers-screen">
        <Tiers />
      </div>

      <div className="pc-actions">
        {stage === 'draft' && (
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={request} disabled={d.empty}>
              Request This Proposal
              <Icon name="arrow" size={18} />
            </button>
            <p className="pc-lead">{d.empty ? 'The request unlocks once the draft includes a service.' : proposalCopy.requestLead}</p>
          </>
        )}
        <button type="button" className="btn btn-outline btn-block btn-sm" onClick={() => goTo(4)} disabled={d.empty}>
          Preview the PDF
        </button>
      </div>
    </aside>
  );
}
