import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { builder, propertyTypes } from '../content.js';
import { useBuilder } from '../builderStore.jsx';
import { listExamples, getProperty, lookupAddress } from '../plan/provider.js';
import { SERVICES } from '../plan/routes.js';
import {
  FREQUENCIES,
  TERMS,
  RENEWALS,
  STARTS,
  CADENCE_OPTIONS,
  cadenceLabel,
  suggestedCadence,
  labelOf,
} from '../draft.js';
import { STEPS } from '../steps.js';
import { focusControl, scrollBehavior } from '../focus.js';
import PlanPanel from './PlanPanel.jsx';
import ServiceSymbol from './ServiceSymbol.jsx';
import ProposalCard from './ProposalCard.jsx';
import ProposalMini from './ProposalMini.jsx';
import ProposalDocument from './ProposalDocument.jsx';
import LiveSummary from './LiveSummary.jsx';
import RequestPanel from './RequestPanel.jsx';
import HexNum from './HexNum.jsx';
import Icon from './Icon.jsx';

// The builder is a row of slides, left to right:
// 01 Property → 02 Services → 03 Schedule → 04 Proposal → PDF output.
// Every control writes to the one builder store; the plan, the live summary,
// the proposal card, and the document all render from it.

const SLIDE_MS = 560;
const INTROS = [
  'Pick one of three example sites. Your actual address comes later, with the request.',
  'Every service you select appears on the plan and in the proposal. They run together.',
  'Set how often visits happen and how the agreement should run. Every choice is a request for review.',
  'Check the draft, adjust anything with “Change”, then request a review.',
  'The proposal as a document: the plan, the scope, and an illustrative estimate. Print it or save it as PDF.',
];

// Elements that assemble like bricks when their slide arrives.
const brick = (i) => ({ className: 'brick', style: { '--i': i } });

function StepIntro({ index }) {
  const s = STEPS[index];
  return (
    <header className="step-intro brick" style={{ '--i': 0 }}>
      <HexNum className="hexnum-lg">{s.num}</HexNum>
      <div>
        <p className="step-kicker">
          {s.num === 'PDF' ? 'Final output · PDF' : `Step ${s.num} of 04 · ${s.label}`}
        </p>
        <h2 id={`slide-h-${index}`} tabIndex={-1}>
          {s.title}
        </h2>
        <p className="step-note">{INTROS[index]}</p>
      </div>
    </header>
  );
}

function SlideNav({ index, i }) {
  const { goTo, draft } = useBuilder();
  const prev = STEPS[index - 1];
  const next = STEPS[index + 1];
  return (
    <div className="slide-nav brick" style={{ '--i': i }}>
      {prev ? (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => goTo(index - 1)}>
          <Icon name="arrow" size={17} className="icon-flip" />
          Back: {prev.label}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => goTo(index + 1)}
          disabled={next.id === 'output' && !draft.services.length}
        >
          {next.id === 'output' ? 'See the PDF output' : `Next: ${next.label}`}
          <Icon name="arrow" size={18} />
        </button>
      )}
    </div>
  );
}

// Segmented single-choice control on native radios.
function Choice({ id, legend, hint, name, options, value, onChange, cols, i }) {
  return (
    <fieldset
      id={id}
      className="choice brick"
      style={{ '--i': i }}
      aria-describedby={hint ? `${id}-hint` : undefined}
    >
      <legend>{legend}</legend>
      {hint && (
        <p id={`${id}-hint`} className="choice-hint">
          {hint}
        </p>
      )}
      <div className={`seg bricks${cols ? ` seg-${cols}` : ''}`}>
        {options.map((o) => (
          <label key={o.id} className={`seg-opt${value === o.id ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PropertySlide({ property, active }) {
  const uid = useId();
  const { draft, setProperty } = useBuilder();
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState(null);

  const choose = (id) => {
    setProperty(id);
    setLookup(null);
  };

  const onLookup = async (e) => {
    e.preventDefault();
    const result = await lookupAddress(query);
    if (result.status === 'example') {
      setProperty(result.property.id);
      setLookup({ kind: 'ok', text: `Loaded the ${result.property.city} example (fictional demo address).` });
    } else if (result.status === 'empty') {
      setLookup({ kind: 'warn', text: 'Enter an address, or choose one of the example properties.' });
    } else {
      setLookup({
        kind: 'warn',
        text: `Live address lookup isn’t connected in this preview, so “${query.trim()}” can’t be mapped. Build the draft on an example property — you’ll give your actual address when you request the proposal.`,
        suggestions: result.suggestions,
      });
    }
  };

  return (
    <>
      <StepIntro index={0} />
      <div className="property-layout">
        <div className="property-controls">
          <fieldset id="ctl-property" className="examples brick" style={{ '--i': 1 }}>
            <legend>
              Example property <span className="example-tag">Fictional sample sites</span>
            </legend>
            <div className="example-list bricks">
              {listExamples().map((f) => (
                <label key={f.id} className={`example${draft.propertyId === f.id ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name={`${uid}-example`}
                    value={f.id}
                    checked={draft.propertyId === f.id}
                    onChange={() => choose(f.id)}
                  />
                  <span className="example-city">{f.city}</span>
                  <span className="example-type">{f.label}</span>
                  <span className="visually-hidden">{propertyTypes[f.propertyType]}, fictional example</span>
                </label>
              ))}
            </div>
          </fieldset>

          <form
            className="address-form brick"
            style={{ '--i': 2 }}
            onSubmit={onLookup}
            role="search"
            aria-label="Property address lookup"
          >
            <label htmlFor={`${uid}-addr`}>Look up an address</label>
            <div className="address-row">
              <input
                id={`${uid}-addr`}
                type="text"
                autoComplete="off"
                placeholder="e.g. 0 Example Campus Drive, Murfreesboro, TN"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-describedby={`${uid}-disclosure`}
              />
              <button type="submit" className="btn btn-outline btn-sm">
                Look up
              </button>
            </div>
            <p id={`${uid}-disclosure`} className="gis-disclosure">
              <Icon name="info" size={16} />
              {builder.disclosure}
            </p>
            {lookup && (
              <div className={`lookup-status is-${lookup.kind}`} role="status">
                <p>{lookup.text}</p>
                {lookup.suggestions && (
                  <div className="lookup-suggest">
                    {lookup.suggestions.map((f) => (
                      <button key={f.id} type="button" className="link-button" onClick={() => choose(f.id)}>
                        {f.city} example
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        <div {...brick(3)}>
          <PlanPanel property={property} active={draft.services} paused={!active} compact />
        </div>
      </div>
      <SlideNav index={0} i={4} />
    </>
  );
}

function ServicesSlide({ property, active }) {
  const { draft, toggleService, setServices } = useBuilder();
  return (
    <>
      <StepIntro index={1} />
      <div className="plan-work">
        <fieldset id="ctl-services" className="service-toggles brick" style={{ '--i': 1 }}>
          <legend className="visually-hidden">Services in this proposal</legend>
          <div className="toggle-list bricks">
            {SERVICES.map((s) => (
              <label key={s.id} className={`svc-toggle${draft.services.includes(s.id) ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  value={s.id}
                  checked={draft.services.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                />
                <ServiceSymbol id={s.id} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
          <div className="toggle-actions">
            <button type="button" className="mini-btn" onClick={() => setServices(SERVICES.map((s) => s.id))}>
              Select all
            </button>
            <button
              type="button"
              className="mini-btn"
              onClick={() => setServices([])}
              disabled={!draft.services.length}
            >
              Clear
            </button>
          </div>
        </fieldset>
        <div {...brick(2)}>
          <PlanPanel property={property} active={draft.services} paused={!active} />
        </div>
      </div>
      <div {...brick(3)}>
        <ProposalMini property={property} />
      </div>
      <SlideNav index={1} i={4} />
    </>
  );
}

function CadenceList() {
  const { draft, setCadence, resetCadence } = useBuilder();
  const chosen = SERVICES.filter((s) => draft.services.includes(s.id));
  const customized = chosen.some((s) => (draft.cadence[s.id] ?? suggestedCadence(s.id)) !== suggestedCadence(s.id));
  const optionText = (serviceId, c) => {
    const base = c === 'inherit' ? `Same as visit frequency (${labelOf(FREQUENCIES, draft.frequency)})` : cadenceLabel(c);
    return c === suggestedCadence(serviceId) ? `${base} — suggested` : base;
  };

  return (
    <fieldset id="ctl-cadence" className="choice cadence brick" style={{ '--i': 2 }}>
      <legend>Schedule by service</legend>
      <p className="choice-hint">Each service follows the visit frequency or its own schedule. Suggested defaults are editable.</p>
      {chosen.length === 0 ? (
        <p className="cadence-empty">Select services on the plan to set their schedules.</p>
      ) : (
        <ul className="cadence-list bricks">
          {chosen.map((s) => {
            const options = CADENCE_OPTIONS[s.id];
            const value = draft.cadence[s.id] ?? suggestedCadence(s.id);
            return (
              <li key={s.id}>
                <label htmlFor={`cad-${s.id}`}>
                  <ServiceSymbol id={s.id} />
                  {s.label}
                </label>
                {options.length > 1 ? (
                  <select id={`cad-${s.id}`} value={value} onChange={(e) => setCadence(s.id, e.target.value)}>
                    {options.map((c) => (
                      <option key={c} value={c}>
                        {optionText(s.id, c)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <output id={`cad-${s.id}`} className="cadence-fixed">
                    {cadenceLabel(value)}
                  </output>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {customized && (
        <button type="button" className="link-button" onClick={resetCadence}>
          Restore suggested schedules
        </button>
      )}
    </fieldset>
  );
}

function ScheduleSlide({ property }) {
  const uid = useId();
  const b = useBuilder();
  const { draft } = b;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    <>
      <StepIntro index={2} />
      <div className="schedule-grid">
        <Choice
          id="ctl-frequency"
          legend="Visit frequency"
          name={`${uid}-freq`}
          options={FREQUENCIES}
          value={draft.frequency}
          onChange={b.setFrequency}
          cols={2}
          i={1}
        />
        <CadenceList />
        <Choice
          id="ctl-term"
          legend="Agreement term"
          hint="How long you’d like the service agreement to run. Terms are set with the company after review."
          name={`${uid}-term`}
          options={TERMS}
          value={draft.term}
          onChange={b.setTerm}
          cols={3}
          i={3}
        />
        <Choice
          id="ctl-renewal"
          legend="Renewal"
          name={`${uid}-renew`}
          options={RENEWALS}
          value={draft.renewal}
          onChange={b.setRenewal}
          i={4}
        />
        <div className="start-group">
          <Choice
            id="ctl-start"
            legend="Desired start"
            name={`${uid}-start`}
            options={STARTS}
            value={draft.start}
            onChange={b.setStart}
            i={5}
          />
          {draft.start === 'date' && (
            <div className="field field-short">
              <label htmlFor="ctl-start-date">Preferred start date</label>
              <input
                id="ctl-start-date"
                type="date"
                min={today}
                value={draft.startDate}
                onChange={(e) => b.setStartDate(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="field brick" style={{ '--i': 6 }}>
          <label htmlFor="ctl-notes">
            Notes for the review <span className="optional">(optional)</span>
          </label>
          <textarea
            id="ctl-notes"
            rows={3}
            value={draft.notes}
            onChange={(e) => b.setNotes(e.target.value)}
            aria-describedby="ctl-notes-hint"
          />
          <p id="ctl-notes-hint" className="field-hint">
            Areas to include or skip, access hours, parking. Don’t include gate codes or passwords.
          </p>
        </div>
      </div>
      <div {...brick(7)}>
        <ProposalMini property={property} />
      </div>
      <SlideNav index={2} i={8} />
    </>
  );
}

function ProposalSlide({ property }) {
  const { stage } = useBuilder();
  return (
    <>
      <StepIntro index={3} />
      <div className={`proposal-layout${stage === 'draft' ? '' : ' is-requesting'}`}>
        <div {...brick(1)}>
          <ProposalCard property={property} />
        </div>
        {stage !== 'draft' && (
          <div {...brick(2)}>
            <RequestPanel property={property} />
          </div>
        )}
      </div>
      <SlideNav index={3} i={3} />
    </>
  );
}

function OutputSlide({ property }) {
  const { draft } = useBuilder();
  return (
    <>
      <StepIntro index={4} />
      <div className="doc-actions brick" style={{ '--i': 1 }}>
        <button type="button" className="btn btn-primary" onClick={() => window.print()} disabled={!draft.services.length}>
          Print / Save as PDF
          <Icon name="arrow" size={18} />
        </button>
        <a className="btn btn-outline btn-sm" href="/examples/Busy-Bee-Example-Proposal-Christiana.pdf" download>
          Download a finished example PDF
        </a>
        <p className="field-hint">Choose “Save as PDF” in the print dialog. Nothing is sent or stored.</p>
      </div>
      <div className="doc-stage brick" style={{ '--i': 2 }}>
        <ProposalDocument property={property} />
      </div>
      <SlideNav index={4} i={3} />
    </>
  );
}

const SLIDES = [PropertySlide, ServicesSlide, ScheduleSlide, ProposalSlide, OutputSlide];

function StageRail() {
  const { step, goTo } = useBuilder();
  return (
    <ol className="stage-rail" aria-label="Proposal steps">
      {STEPS.map((s, i) => (
        <li key={s.id} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} style={{ '--i': i }}>
          <button type="button" onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}>
            <HexNum>{s.num}</HexNum>
            <span className="rail-label">{s.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function Builder() {
  const { draft, step, pendingFocus } = useBuilder();
  const property = getProperty(draft.propertyId);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const [height, setHeight] = useState(null);
  const shownStep = useRef(step);

  // The viewport takes the height of the slide that is showing.
  useLayoutEffect(() => {
    const slide = trackRef.current?.children[step];
    if (!slide) return undefined;
    const measure = () => setHeight(slide.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(slide);
    return () => ro.disconnect();
  }, [step]);

  // On a step change: bring the slides into view, then move focus to the new
  // slide's heading (or to the control a "Change" link asked for).
  useEffect(() => {
    if (shownStep.current === step) return undefined;
    shownStep.current = step;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const top = stageRef.current.getBoundingClientRect().top;
    if (window.innerWidth < 760 || top < header || top > window.innerHeight * 0.5) {
      window.scrollTo({ top: window.scrollY + top - header - 8, behavior: scrollBehavior() });
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(
      () => {
        const target = pendingFocus.current;
        pendingFocus.current = null;
        if (target) focusControl(target);
        else document.getElementById(`slide-h-${step}`)?.focus({ preventScroll: true });
      },
      reduced ? 20 : SLIDE_MS,
    );
    return () => clearTimeout(t);
  }, [step, pendingFocus]);

  const wide = step >= 3;

  return (
    <section id="builder" className="builder-section" aria-labelledby="builder-title">
      <div className="wrap">
        <header className="builder-head">
          <h1 id="builder-title">{builder.title}</h1>
          <p className="builder-lede">{builder.lede}</p>
        </header>

        <div id="builder-stage" ref={stageRef} className="builder-stage">
          <StageRail />
          <div className={`builder${wide ? ' is-wide' : ''}`}>
            <div className="slide-viewport" style={height ? { height } : undefined}>
              <div ref={trackRef} className="slide-track" style={{ '--step': step }}>
                {SLIDES.map((Slide, i) => (
                  <div
                    key={STEPS[i].id}
                    className={`slide slide-${STEPS[i].id}${i === step ? ' is-active' : ''}`}
                    inert={i !== step}
                    aria-labelledby={`slide-h-${i}`}
                    role="group"
                  >
                    <Slide property={property} active={i === step} />
                  </div>
                ))}
              </div>
            </div>
            {!wide && (
              <div className="bld-side">
                <LiveSummary property={property} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
