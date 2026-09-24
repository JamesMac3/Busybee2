import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { SERVICES } from './plan/routes.js';
import { listExamples } from './plan/provider.js';
import { STEP_COUNT } from './steps.js';
import { focusControl } from './focus.js';

// The single source of truth for the proposal builder. The plan, the controls,
// the live proposal card, the mobile summary, the request form, and the print
// view all read from here. In memory only: nothing is sent or stored.
const BuilderContext = createContext(null);

const ORDER = SERVICES.map((s) => s.id);
const ordered = (ids) => [...new Set(ids)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

const INITIAL_DRAFT = {
  propertyId: listExamples()[0].id,
  services: ['mow', 'edge'],
  frequency: 'weekly',
  cadence: {}, // per-service override; missing = suggested default
  term: 'help',
  renewal: 'none',
  start: 'asap',
  startDate: '',
  notes: '',
};

const EMPTY_CONTACT = { organization: '', name: '', email: '', phone: '', addresses: '' };

export function BuilderProvider({ children }) {
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  // 'draft' → 'request' (contact form shown) → 'done' (demo completion)
  const [stage, setStage] = useState('draft');
  // Which builder slide is showing: 0 Property, 1 Services, 2 Schedule, 3 Proposal, 4 PDF.
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  stepRef.current = step;
  // A control to focus once the slide it lives on has moved into view.
  const pendingFocus = useRef(null);
  // Which proposal section last changed, for a brief highlight.
  const [change, setChange] = useState({ section: null, n: 0 });

  const touch = useCallback((section) => setChange((c) => ({ section, n: c.n + 1 })), []);

  const update = useCallback(
    (section, patch) => {
      setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }));
      touch(section);
      // Editing the draft after a demo request reopens the request, keeping contact details.
      setStage((s) => (s === 'done' ? 'request' : s));
    },
    [touch],
  );

  const actions = useMemo(
    () => ({
      setProperty: (propertyId) => update('property', { propertyId }),
      toggleService: (id) =>
        update('services', (d) => ({
          services: d.services.includes(id) ? d.services.filter((s) => s !== id) : ordered([...d.services, id]),
        })),
      setServices: (ids) => update('services', { services: ordered(ids) }),
      setFrequency: (frequency) => update('frequency', { frequency }),
      setCadence: (id, value) => update('cadence', (d) => ({ cadence: { ...d.cadence, [id]: value } })),
      resetCadence: () => update('cadence', { cadence: {} }),
      setTerm: (term) => update('term', { term }),
      setRenewal: (renewal) => update('renewal', { renewal }),
      setStart: (start) => update('start', { start }),
      setStartDate: (startDate) => update('start', { startDate }),
      setNotes: (notes) => update('notes', { notes }),
      setContactField: (name, value) => setContact((c) => ({ ...c, [name]: value })),
      openRequest: () => setStage('request'),
      completeRequest: () => setStage('done'),
      backToDraft: () => setStage('draft'),
      goTo: (n, focusId = null) => {
        const target = Math.max(0, Math.min(STEP_COUNT - 1, n));
        if (target === stepRef.current) {
          if (focusId) focusControl(focusId);
          return;
        }
        pendingFocus.current = focusId;
        setStep(target);
      },
    }),
    [update],
  );

  const value = useMemo(
    () => ({ draft, contact, stage, step, change, pendingFocus, ...actions }),
    [draft, contact, stage, step, change, actions],
  );
  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBuilder() {
  return useContext(BuilderContext);
}
