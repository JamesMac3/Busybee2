const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrollBehavior() {
  return reduceMotion() ? 'auto' : 'smooth';
}

// Move keyboard focus to a builder control (used by the proposal card's
// "Change" links). A fieldset focuses its checked option.
export function focusControl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.matches('input, select, textarea, button')
    ? el
    : (el.querySelector('input:checked') ?? el.querySelector('select, textarea, input, button') ?? el);
  el.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
  target.focus({ preventScroll: true });
}

// Bring a region into view and move focus to it (its heading or itself).
export function revealRegion(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  el.focus({ preventScroll: true });
}
