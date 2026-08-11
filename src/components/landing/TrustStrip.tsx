export function TrustStrip() {
  const logos = [
    { name: 'Vercel', src: '/icons/vercel.svg' },
    { name: 'GitHub', src: '/icons/github.svg' },
    { name: 'Stripe', src: '/icons/stripe.svg' },
  ];

  return (
    <div className="mt-8 flex items-center justify-center gap-6">
      {logos.map((l) => (
        <div key={l.name} className="opacity-70 hover:opacity-100 transition">
          <img src={l.src} alt={l.name} className="h-6 w-auto" />
        </div>
      ))}
    </div>
  );
}
