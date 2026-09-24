import { useEffect, useRef, useState } from 'react';
import { nav, business } from '../content.js';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';
import { useBuilder } from '../builderStore.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { goTo } = useBuilder();
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !toggleRef.current?.contains(e.target)) setOpen(false);
    };
    const mq = window.matchMedia('(min-width: 1160px)');
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq.addEventListener('change', onMq);
    panelRef.current?.querySelector('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq.removeEventListener('change', onMq);
    };
  }, [open]);

  const close = () => setOpen(false);
  const toProposal = (e) => {
    e.preventDefault();
    close();
    goTo(3);
    document.getElementById('builder-stage')?.scrollIntoView({ block: 'start' });
  };

  return (
    <header className={`site-header${open ? ' menu-open' : ''}`}>
      <div className="wrap header-bar">
        <Logo />
        <nav className="primary-nav" aria-label="Primary">
          <ol>
            {nav.map((item, i) => (
              <li key={item.href}>
                <a href={item.href}>
                  <span className="nav-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={business.phoneHref}>
            <Icon name="phone" size={17} />
            {business.phone}
          </a>
          <a className="btn btn-primary btn-sm header-cta" href="#builder-stage" onClick={toProposal}>
            <span className="cta-long">View My Proposal</span>
            <span className="cta-short">Proposal</span>
            <Icon name="arrow" size={17} />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={panelRef} className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          <ol>
            {nav.map((item, i) => (
              <li key={item.href}>
                <a href={item.href} onClick={close}>
                  <span className="nav-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
          <a className="btn btn-primary btn-block" href="#builder-stage" onClick={toProposal}>
            View My Proposal
            <Icon name="arrow" size={18} />
          </a>
          <a className="mobile-phone" href={business.phoneHref} onClick={close}>
            <Icon name="phone" size={18} /> Call {business.phone}
          </a>
        </nav>
      </div>
    </header>
  );
}
