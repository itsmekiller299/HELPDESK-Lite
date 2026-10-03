'use client';

export default function Logo({ size = 32, className = '', src = '/brand/she-navbar-logo-light.png' }: { size?: number; className?: string; src?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundImage: `url('${src}'}` }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{ width: size, height: size, backgroundImage: `url('${src}'}` }}
      />
    </div>
  );
}