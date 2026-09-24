import { useBuilder } from '../builderStore.jsx';
import { STEPS } from '../steps.js';
import Icon from './Icon.jsx';

// Narrow screens: a persistent Back / Next stepper for the builder slides.
export default function MobileStepBar() {
  const { step, goTo, draft } = useBuilder();
  const last = step === STEPS.length - 1;
  const next = STEPS[step + 1];
  const blocked = step === 3 && !draft.services.length;

  return (
    <nav className="mobile-bar" aria-label="Builder steps">
      <button
        type="button"
        className="bar-back"
        onClick={() => goTo(step - 1)}
        disabled={step === 0}
        aria-label="Previous step"
      >
        <Icon name="arrow" size={18} className="icon-flip" />
      </button>
      <p>
        <strong>
          {STEPS[step].num === 'PDF' ? 'PDF' : `Step ${STEPS[step].num.replace(/^0/, '')} of 4`}
        </strong>
        <span>{STEPS[step].label}</span>
      </p>
      {last ? (
        <button type="button" className="btn btn-accent btn-sm" onClick={() => window.print()} disabled={!draft.services.length}>
          Print / Save PDF
        </button>
      ) : (
        <button type="button" className="btn btn-accent btn-sm" onClick={() => goTo(step + 1)} disabled={blocked}>
          {next.num === 'PDF' ? 'PDF output' : `Next: ${next.label}`}
          <Icon name="arrow" size={17} />
        </button>
      )}
    </nav>
  );
}
