import { useBuilder } from '../builderStore.jsx';
import { buildDraft } from '../draft.js';
import { buildEstimate, moneyRange } from '../estimate.js';
import Icon from './Icon.jsx';

// Phones and tablets: a compact read-out of the draft directly below the plan.
// Hidden on wide screens, where the full proposal sits beside the plan.
export default function ProposalMini({ property }) {
  const { draft, goTo } = useBuilder();
  const d = buildDraft(draft, property);
  const est = buildEstimate(draft, property);
  return (
    <div className="proposal-mini" aria-live="polite">
      <p className="mini-head">
        <strong>Proposal draft</strong>
        <span>
          {d.empty ? 'No services yet' : `${d.services.length} service${d.services.length === 1 ? '' : 's'}`} ·{' '}
          {d.frequency} · {d.term}
        </span>
      </p>
      <p className="mini-scope">{d.empty ? 'Select at least one service to start your proposal.' : d.sentence}</p>
      {est.priced && (
        <p className="mini-est">
          Illustrative estimate: <strong>{moneyRange(est.annual)}</strong>
          {est.oneTimeProject ? ' project total' : ' per year'} <span>(sample rates)</span>
        </p>
      )}
      <button type="button" className="link-button" onClick={() => goTo(3)}>
        View full proposal <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}
