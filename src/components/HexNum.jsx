// Hexagonal step number. The outline draws in and the number rises when its
// slide or rail step becomes active (CSS; static for reduced motion).
export default function HexNum({ children, className = '' }) {
  return (
    <span className={`hexnum ${className}`} aria-hidden="true">
      <svg viewBox="0 0 44 48" focusable="false">
        <path className="hex-fill" d="M22 2 41 13v22L22 46 3 35V13Z" />
        <path className="hex-line" pathLength="1" d="M22 2 41 13v22L22 46 3 35V13Z" />
      </svg>
      <span className="hexnum-text">{children}</span>
    </span>
  );
}
