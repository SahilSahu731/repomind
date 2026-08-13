interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 8h10v10H8V8Z" fill="currentColor" />
      <path d="M22 8h10v10H22V8Z" fill="currentColor" opacity=".42" />
      <path d="M8 22h10v10H8V22Z" fill="currentColor" opacity=".42" />
      <path d="M22 22h10v10H22V22Z" fill="currentColor" />
      <path d="M18 13h4M13 18v4M27 18v4M18 27h4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
