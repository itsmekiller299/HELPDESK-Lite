'use client';

export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size, background: 'var(--gradient-primary)' }}
      aria-hidden="true"
    >
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 48 48" fill="none">
        <path d="M14.5 27c0-6.3 4.3-10.8 9.5-10.8s9.5 4.5 9.5 10.8" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
        <rect x="9.5" y="25" width="7.5" height="10" rx="3.2" fill="#fff" />
        <rect x="31" y="25" width="7.5" height="10" rx="3.2" fill="#fff" />
        <path d="M12.5 35v3.2a3.5 3.5 0 0 0 3.5 3.5h4.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="41.7" r="2.6" fill="#fff" />
      </svg>
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          right: -size * 0.08,
          bottom: -size * 0.08,
          background: 'var(--gradient-teal)',
        }}
      >
        <svg width={size * 0.22} height={size * 0.22} viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            stroke="#023859"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="11.5" r="1" fill="#023859" />
          <circle cx="13" cy="11.5" r="1" fill="#023859" />
          <circle cx="17" cy="11.5" r="1" fill="#023859" />
        </svg>
      </div>
    </div>
  );
}