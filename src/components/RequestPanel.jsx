import { useId, useRef, useState } from 'react';
import { proposalCopy } from '../content.js';
import { useBuilder } from '../builderStore.jsx';
import { buildDraft } from '../draft.js';
import { revealRegion } from '../focus.js';
import { listExamples } from '../plan/provider.js';
import Icon from './Icon.jsx';

// Contact details are collected only after the draft exists. They live in the
// builder store, so editing the draft never clears them. Nothing is sent.

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const EXAMPLE_STREETS = listExamples().map((f) => norm(f.address.split(',')[0]));

// A real street address: a street number, a street name, and not one of the
// fictional example addresses used by the demo plan.
function checkAddresses(text) {
  const lines = text
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return 'Enter the address of the property you want reviewed.';
  if (lines.some((l) => EXAMPLE_STREETS.some((ex) => norm(l).includes(ex)) || /\bexample\b/i.test(l))) {
    return 'That’s the fictional example address from the demo plan. Enter your actual property address.';
  }
  if (lines.some((l) => !/\d/.test(l) || !/[a-z]{3,}/i.test(l) || l.length < 8)) {
    return 'Include a street number and street name for each property, one per line.';
  }
  return '';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(c) {
  const errors = {};
  if (!c.organization.trim()) errors.organization = 'Enter your organization or association name.';
  if (!c.name.trim()) errors.name = 'Enter a contact name.';
  if (!EMAIL.test(c.email.trim())) errors.email = 'Enter an email address like name@company.com.';
  if (c.phone.trim() && c.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a 10-digit phone number, or leave it blank.';
  const addr = checkAddresses(c.addresses);
  if (addr) errors.addresses = addr;
  return errors;
}

const FIELDS = [
  { name: 'organization', label: 'Organization', autoComplete: 'organization' },
  { name: 'name', label: 'Contact name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', optional: true },
];

export default function RequestPanel({ property }) {
  const uid = useId();
  const { draft, contact, stage, setContactField, completeRequest, backToDraft, goTo } = useBuilder();
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const formRef = useRef(null);
  const d = buildDraft(draft, property);

  const onChange = (e) => {
    setContactField(e.target.name, e.target.value);
    if (tried) setErrors(validate({ ...contact, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTried(true);
    const next = validate(contact);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    if (d.empty) return;
    completeRequest();
    requestAnimationFrame(() => revealRegion('request'));
  };

  const errorFor = (name) =>
    errors[name] && (
      <p id={`${uid}-${name}-err`} className="field-error">
        <Icon name="alert" size={16} />
        {errors[name]}
      </p>
    );

  if (stage === 'done') {
    const count = contact.addresses.split(/\n|;/).filter((l) => l.trim()).length;
    return (
      <section id="request" className="request-panel is-done" tabIndex={-1} aria-labelledby={`${uid}-done`}>
        <p className="preview-notice">
          <Icon name="info" size={18} />
          Demo complete — nothing was sent or stored.
        </p>
        <h2 id={`${uid}-done`}>Proposal request prepared (preview)</h2>
        <p>
          In a live system, this draft for {contact.organization.trim()} ({count} propert{count === 1 ? 'y' : 'ies'}) would
          go to Busy Bee Lawn for property and scope review. Any quote would follow that review.
        </p>
        <p className="request-sub">Change anything in the builder and the draft updates; your contact details stay filled in.</p>
        <div className="request-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => goTo(1, 'ctl-services')}>
            Keep editing the draft
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => goTo(4)}>
            See the PDF output
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="request" className="request-panel" tabIndex={-1} aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`}>Request This Proposal</h2>
      <p className="request-lead">{proposalCopy.requestLead}</p>
      <p className="preview-notice">
        <Icon name="info" size={18} />
        {proposalCopy.notice}
      </p>

      <form ref={formRef} className="request-form" noValidate onSubmit={onSubmit}>
        {FIELDS.map((f) => (
          <div key={f.name} className={`field${errors[f.name] ? ' has-error' : ''}`}>
            <label htmlFor={`${uid}-${f.name}`}>
              {f.label} {f.optional && <span className="optional">(optional)</span>}
            </label>
            <input
              id={`${uid}-${f.name}`}
              name={f.name}
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              value={contact[f.name]}
              onChange={onChange}
              aria-invalid={errors[f.name] ? 'true' : undefined}
              aria-describedby={errors[f.name] ? `${uid}-${f.name}-err` : undefined}
              required={!f.optional}
            />
            {errorFor(f.name)}
          </div>
        ))}
        <div className={`field field-wide${errors.addresses ? ' has-error' : ''}`}>
          <label htmlFor={`${uid}-addresses`}>Property address(es)</label>
          <textarea
            id={`${uid}-addresses`}
            name="addresses"
            rows={3}
            autoComplete="street-address"
            value={contact.addresses}
            onChange={onChange}
            aria-invalid={errors.addresses ? 'true' : undefined}
            aria-describedby={`${uid}-addr-hint${errors.addresses ? ` ${uid}-addresses-err` : ''}`}
            required
          />
          <p id={`${uid}-addr-hint`} className="field-hint">
            One property per line. The {property.city} plan is a fictional example and doesn’t count as your
            property.
          </p>
          {errorFor('addresses')}
        </div>
        {d.empty && (
          <p className="field-error field-wide">
            <Icon name="alert" size={16} />
            Add at least one service to the draft before requesting it.
          </p>
        )}
        <div className="request-actions field-wide">
          <button type="submit" className="btn btn-primary" disabled={d.empty}>
            Send Proposal Request (preview)
            <Icon name="arrow" size={18} />
          </button>
          <button
            type="button"
            className="btn-text link-button"
            onClick={() => {
              backToDraft();
              revealRegion('proposal');
            }}
          >
            Back to the draft
          </button>
        </div>
      </form>
    </section>
  );
}
