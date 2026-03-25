
export const IslamicPattern = ({ color = "#34d399", opacity = 0.04 }: { color?: string; opacity?: number }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <defs>
      <pattern id="islamic-dash" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={color} strokeWidth="0.8">
          <polygon points="40,4 52,16 52,36 40,48 28,36 28,16" />
          <polygon points="40,4 76,22 76,58 40,76 4,58 4,22" />
          <line x1="40" y1="4" x2="40" y2="76" />
          <line x1="4" y1="22" x2="76" y2="58" />
          <line x1="4" y1="58" x2="76" y2="22" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-dash)" />
  </svg>
);

export const CrescentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.95z" />
  </svg>
);

export const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);
