export function AuthIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 760 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="A minimal map of a software repository"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="516" cy="207" r="146" fill="#D75C3F" />
      <circle cx="516" cy="207" r="105" stroke="#292721" strokeOpacity=".22" />
      <path d="M68 73H692M68 357H692" stroke="#292721" strokeOpacity=".2" />

      <g stroke="#292721" strokeWidth="1.4">
        <path d="M129 209H245L337 126H448L516 207L624 120" />
        <path d="M245 209L337 295H468L516 207L638 299" />
        <path d="M337 126V295M448 126L468 295" strokeOpacity=".55" />
      </g>

      <g fill="#E8DFCF" stroke="#292721" strokeWidth="1.5">
        <circle cx="129" cy="209" r="19" />
        <circle cx="245" cy="209" r="27" />
        <circle cx="337" cy="126" r="20" />
        <circle cx="337" cy="295" r="23" />
        <circle cx="448" cy="126" r="13" />
        <circle cx="468" cy="295" r="16" />
      </g>
      <g fill="#292721">
        <circle cx="516" cy="207" r="34" />
        <circle cx="624" cy="120" r="16" />
        <circle cx="638" cy="299" r="20" />
      </g>

      <g fill="#292721" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" letterSpacing="1.2">
        <text x="68" y="57">SYSTEM / 01</text>
        <text x="691" y="57" textAnchor="end">READ-ONLY MAP</text>
        <text x="129" y="245" textAnchor="middle">REPO</text>
        <text x="245" y="254" textAnchor="middle">SRC</text>
        <text x="337" y="101" textAnchor="middle">API</text>
        <text x="337" y="332" textAnchor="middle">DATA</text>
        <text x="692" y="381" textAnchor="end">DEPENDENCIES / ROUTES / CONTEXT</text>
      </g>
      <text x="516" y="211" fill="#F5F0E5" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" textAnchor="middle" letterSpacing="1.4">
        CORE
      </text>

      <g transform="translate(74 282)">
        <path d="M0 0H112" stroke="#292721" strokeWidth="1.5" />
        <path d="M0 14H78" stroke="#292721" strokeOpacity=".45" />
        <path d="M0 28H94" stroke="#292721" strokeOpacity=".45" />
      </g>
    </svg>
  );
}
