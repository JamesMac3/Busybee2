import { proposalCopy, propertyTypes } from '../content.js';
import { useBuilder } from '../builderStore.jsx';
import { buildDraft } from '../draft.js';
import { buildEstimate } from '../estimate.js';
import BrandLogo from '../brand/BrandLogo.jsx';
import PlanPanel from './PlanPanel.jsx';
import EstimateBlock from './EstimateBlock.jsx';

// The proposal as a two-page document. The same markup is the on-screen
// preview (final slide) and the printed / saved PDF.

function Detail({ label, children }) {
  return (
    <div className="doc-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ProposalDocument({ property }) {
  const { draft } = useBuilder();
  const d = buildDraft(draft, property);
  const est = buildEstimate(draft, property);
  const prepared = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const header = (page) => (
    <header className="doc-brand">
      <BrandLogo layout="horizontal" height={36} decorative />
      <p>
        <strong>Property service proposal</strong>
        <span>
          Preliminary draft · {prepared} · Page {page} of 2
        </span>
      </p>
    </header>
  );

  if (d.empty) {
    return (
      <div className="proposal-doc is-empty">
        <p className="pc-empty">Select at least one service to produce the proposal document.</p>
      </div>
    );
  }

  return (
    <article className="proposal-doc" aria-label="Proposal document preview">
      <section className="doc-page">
        {header(1)}
        <PlanPanel property={property} active={draft.services} still />
        <h2 className="doc-title">{proposalCopy.heading}</h2>
        <p className="pc-status">
          <span className="pc-status-mark" aria-hidden="true" />
          {proposalCopy.status}
        </p>
        <p className="pc-scope">{d.sentence}</p>
        <ol className="pc-tiers doc-tiers" aria-label="Where this draft stands">
          {proposalCopy.tiers.map((t) => (
            <li key={t.id} className={`tier${t.id === 'requested' ? ' is-current' : ''}`}>
              <strong>{t.label}</strong>
              <span>{t.text}</span>
            </li>
          ))}
        </ol>
        <p className="doc-foot">
          Sample document from the Busy Bee Lawn proposal builder preview. The plan shows a fictional example property,
          not a measured map.
        </p>
      </section>

      <section className="doc-page">
        {header(2)}
        <div className="doc-details">
          <dl>
            <Detail label="Property">
              {propertyTypes[property.propertyType]} · {property.label}
              <span className="pc-sub">{property.city}, TN · fictional example property</span>
            </Detail>
            <Detail label="Services · sample zones">
              <ul className="doc-services">
                {d.services.map((s) => (
                  <li key={s.id}>
                    <strong>{s.label}</strong>
                    <span className="pc-sub">
                      {s.zones} · {s.cadence}
                      {s.suggested && <em className="pc-tag">Suggested</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </Detail>
          </dl>
          <dl>
            <Detail label="Visit frequency">{d.frequency}</Detail>
            {d.differences.length > 0 && (
              <Detail label="Service schedules">
                <ul className="pc-diff">
                  {d.differences.map((x) => (
                    <li key={x.label}>
                      {x.label}: {x.cadence}
                    </li>
                  ))}
                </ul>
              </Detail>
            )}
            <Detail label="Agreement term">{d.term} (requested)</Detail>
            <Detail label="Renewal">{d.renewal}</Detail>
            <Detail label="Desired start">{d.start}</Detail>
            <Detail label="Notes">{d.notes || 'None added'}</Detail>
          </dl>
        </div>
        <EstimateBlock est={est} headingId="doc-est-title" className="doc-estimate" />
        <p className="pc-pricing">{proposalCopy.pricing}</p>
        <p className="doc-foot">
          Estimate uses placeholder sample rates applied to sample quantities. It is not a Busy Bee Lawn quote, offer, or
          contract. A company-approved quote follows property and scope review.
        </p>
      </section>
    </article>
  );
}
