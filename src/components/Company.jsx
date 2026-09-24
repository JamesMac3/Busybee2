import { team, business, coverage } from '../content.js';

// Short leadership + service coverage close. Verified facts only.
export default function Company() {
  return (
    <section id="company" className="company" aria-labelledby="company-title">
      <div className="wrap company-grid">
        <div className="company-lead">
          <p className="company-eyebrow">{team.eyebrow}</p>
          <h2 id="company-title">{team.title}</h2>
          {team.copy.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <ul className="company-people">
            {team.members.map((m) => (
              <li key={m.name}>
                <img
                  src={m.src}
                  srcSet={m.srcSet}
                  sizes="96px"
                  width="96"
                  height="120"
                  alt={m.alt}
                  loading="lazy"
                  decoding="async"
                />
                <p>
                  <strong>{m.name}</strong>
                  <span>{m.role}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="coverage">
        <dl>
          <div>
            <dt>Service coverage</dt>
            <dd>
              {coverage.areas.join(' · ')} <span className="muted">— {business.region}</span>
            </dd>
          </div>
          <div>
            <dt>Properties</dt>
            <dd>{coverage.properties.join(' · ')}</dd>
          </div>
          <div>
            <dt>Call</dt>
            <dd>
              <a href={business.phoneHref}>{business.phone}</a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </dd>
          </div>
        </dl>
        <p className="coverage-note">{coverage.note}</p>
        </div>
      </div>
    </section>
  );
}
