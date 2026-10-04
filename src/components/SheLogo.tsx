type SheLogoProps = {
  className?: string;
  src?: string;
};

/**
 * The supplied brand artwork has a generous transparent canvas. This compact
 * viewport keeps the full mark crisp and proportional in the navigation bar.
 * Default uses the dark SVG logo.
 */
export default function SheLogo({ className = '', src = '/brand/she-logo-dark.svg' }: SheLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`she-brand-mark ${className}`.trim()}
      style={{ backgroundImage: `url('${src}'}` }}
    />
  );
}
