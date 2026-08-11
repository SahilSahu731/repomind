export function HeroIllustration(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      aria-hidden="true"
      role="img"
    >
      <rect x="0" y="0" width="800" height="560" rx="20" fill="url(#g)" />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#0f1724" />
          <stop offset="1" stopColor="#081022" />
        </linearGradient>
      </defs>
      <g opacity="0.9">
        <circle cx="140" cy="120" r="28" fill="#22d3ee" opacity="0.18" />
        <circle cx="220" cy="200" r="18" fill="#f97316" opacity="0.14" />
        <rect x="320" y="80" width="340" height="12" rx="6" fill="#1f2937" />
        <rect x="320" y="110" width="260" height="12" rx="6" fill="#111827" />
        <rect x="320" y="140" width="300" height="120" rx="10" fill="#0b1220" />
        <rect x="60" y="260" width="120" height="12" rx="6" fill="#111827" />
        <rect x="60" y="290" width="360" height="12" rx="6" fill="#0b1220" />
        <rect x="460" y="300" width="220" height="12" rx="6" fill="#111827" />
        <circle cx="560" cy="380" r="48" fill="#7c3aed" opacity="0.12" />
      </g>
    </svg>
  );
}
