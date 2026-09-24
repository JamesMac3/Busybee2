// All copy and data for the commercial concept. Only verified facts belong in
// `business` and `team`. Do not add fleet size, staffing, certifications,
// insurance, client names, guarantees, or coverage claims without confirmation.

export const business = {
  name: 'Busy Bee Lawn',
  phone: '615-621-5296',
  phoneHref: 'tel:+16156215296',
  email: 'Services@BusyBeeLawn.net',
  areas: ['Murfreesboro', 'Smyrna', 'Christiana'],
  region: 'Middle Tennessee',
  logo: {
    srcSet: '/images/busy-bee-lawn-logo-220.webp 1x, /images/busy-bee-lawn-logo-440.webp 2x',
    fallback: '/images/busy-bee-lawn-logo-220.png',
    width: 220,
    height: 84,
  },
};

export const nav = [
  { label: 'Plan builder', href: '#builder' },
  { label: 'Your proposal', href: '#builder-stage' },
  { label: 'Leadership', href: '#company' },
];

export const propertyTypes = {
  commercial: 'Commercial property',
  education: 'School campus study',
  hoa: 'HOA / shared community',
};

export const builder = {
  title: 'Your grounds. A plan already taking shape.',
  lede: 'Choose your property, select the work, and build a maintenance proposal around your schedule.',
  steps: ['Property', 'Services', 'Schedule', 'Proposal'],
  disclosure: 'Interactive example using sample property geometry. Live address and GIS lookup are not connected.',
  planLabel: 'Illustrative service plan',
  scheduleNote: 'Every schedule choice is a request. Busy Bee Lawn confirms what is practical after reviewing the property and scope.',
};

export const proposalCopy = {
  heading: 'Your Property Service Proposal',
  status: 'Preliminary draft · For review',
  pricing: 'Final pricing follows property and scope review.',
  empty: 'Select at least one service on the plan to start your proposal.',
  requestLead: 'Confirm your property and contact details so this scope can be reviewed.',
  tiers: [
    { id: 'sample', label: 'Sample demonstration', text: 'Illustrative geometry from a sample site or manual aerial study.' },
    { id: 'requested', label: 'Requested scope + estimate', text: 'Your selections and an illustrative estimate from sample rates.' },
    { id: 'approved', label: 'Company-approved quote', text: 'Issued by Busy Bee Lawn only after property and scope review.' },
  ],
  notice: 'Preview only — this form does not send or store any information.',
};

// Portraits are the team's existing profile photos from busybeelawn.net.
export const team = {
  eyebrow: 'Leadership',
  title: 'Who you’ll work with.',
  copy: [
    'Busy Bee Lawn is a lawn care and landscaping company serving Murfreesboro, Smyrna, and Christiana.',
    'The company is led by John Fricke, Owner, and Jared Fricke, Operations Manager.',
  ],
  members: [
    {
      name: 'John Fricke',
      role: 'Owner',
      src: '/images/team-john-cut-480.webp',
      srcSet: '/images/team-john-cut-240.webp 240w, /images/team-john-cut-480.webp 480w',
      alt: 'Portrait of John Fricke, owner of Busy Bee Lawn',
    },
    {
      name: 'Jared Fricke',
      role: 'Operations Manager',
      src: '/images/team-jared-cut-480.webp',
      srcSet: '/images/team-jared-cut-240.webp 240w, /images/team-jared-cut-480.webp 480w',
      alt: 'Portrait of Jared Fricke, operations manager at Busy Bee Lawn',
    },
  ],
};

export const coverage = {
  areas: business.areas,
  properties: ['Commercial properties', 'HOA communities', 'Shared spaces'],
  note: 'Service availability for a specific property is confirmed during review.',
};
