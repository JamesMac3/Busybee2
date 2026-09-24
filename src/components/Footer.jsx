import { nav, business } from '../content.js';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo className="logo-footer" layout="stacked" tone="reverse" height={104} />
          <p>Recurring lawn and landscape care for commercial properties, HOAs, and shared spaces.</p>
        </div>
        <nav aria-label="Footer">
          <ol className="footer-nav">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="footer-contact">
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <span>{business.areas.join(' · ')}, TN</span>
        </div>
      </div>
      <div className="wrap footer-base">
        <p>© {new Date().getFullYear()} {business.name}</p>
        <p>Website concept prepared for Busy Bee Lawn. Logo shown is a proposed brand direction.</p>
        <p>Property plans are illustrative samples, not measured maps of real sites.</p>
      </div>
    </footer>
  );
}
