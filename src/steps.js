// The builder's slides, left to right. The first four are the proposal steps;
// the last shows the finished PDF document.
export const STEPS = [
  { id: 'property', num: '01', label: 'Property', title: 'Choose the property' },
  { id: 'services', num: '02', label: 'Services', title: 'Select the work' },
  { id: 'schedule', num: '03', label: 'Schedule', title: 'Set the schedule' },
  { id: 'proposal', num: '04', label: 'Proposal', title: 'Review and request' },
  { id: 'output', num: 'PDF', label: 'Output', title: 'Your proposal document' },
];

export const STEP_COUNT = STEPS.length;

// Which slide owns each control, for the proposal's "Change" links.
export const CONTROL_STEP = {
  'ctl-property': 0,
  'ctl-services': 1,
  'ctl-frequency': 2,
  'ctl-cadence': 2,
  'ctl-term': 2,
  'ctl-renewal': 2,
  'ctl-start': 2,
  'ctl-notes': 2,
};
