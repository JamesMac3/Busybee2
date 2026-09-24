// Small legend / toggle symbols that match each overlay's marker and line style.
export default function ServiceSymbol({ id }) {
  return (
    <svg className={`svc-symbol svc-${id}`} viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" focusable="false">
      {id === 'mow' && (
        <>
          <rect x="0" y="0" width="24" height="5" className="sym-stripe-a" />
          <rect x="0" y="5.5" width="24" height="5" className="sym-stripe-b" />
          <rect x="7" y="4" width="10" height="8" className="sym-mower" />
        </>
      )}
      {id === 'edge' && (
        <>
          <line x1="1" y1="8" x2="23" y2="8" className="sym-edge" />
          <rect x="9" y="5" width="6" height="6" transform="rotate(45 12 8)" className="sym-edge-marker" />
        </>
      )}
      {id === 'beds' && <rect x="2" y="2" width="20" height="12" className="sym-mulch" />}
      {id === 'shrubs' && (
        <>
          <circle cx="8" cy="8" r="5.5" className="sym-shrub" />
          <path d="M14 3 22 13M14 13 22 3" className="sym-shears" />
        </>
      )}
      {id === 'seasonal' && (
        <>
          <line x1="1" y1="8" x2="23" y2="8" className="sym-clean" />
          <path d="M8 3.5 10.5 8 8 12.5 5.5 8Z" className="sym-leaf" />
          <path d="M20 8 14 4.5V11.5Z" className="sym-seasonal-marker" />
        </>
      )}
      {id === 'improve' && (
        <>
          <rect x="1.5" y="1.5" width="21" height="13" className="sym-improve" />
          <path d="M12 5V11M9 8H15" className="sym-plus" />
        </>
      )}
      {id === 'transit' && <line x1="1" y1="8" x2="23" y2="8" className="sym-transit" />}
    </svg>
  );
}
