type SheLogoProps = {
  className?: string;
  src?: string;
};

/**
 * The supplied brand artwork has a generous transparent canvas. This compact
 * viewport keeps the full mark crisp and proportional in the navigation bar.
 */
export default function SheLogo({ className = '', src = '/brand/she-navbar-logo-light.png' }: SheLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`she-brand-mark ${className}`.trim()}
      style={{ backgroundImage: `url('${src}'}` }}
    />
  );
}
