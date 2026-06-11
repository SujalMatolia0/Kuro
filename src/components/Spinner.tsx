interface SpinnerProps {
  size?: number;
  /** Token variable name without var() wrapper, e.g. '--jade2' or '--copper-btn' */
  color?: string;
  className?: string;
}

/**
 * Shared loading spinner using CSS border animation.
 * Defaults to jade/green accent matching the Kuro theme.
 */
export function Spinner({ size = 20, color = '--jade2', className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full animate-spin shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.08)`,
        borderTopColor: `var(${color})`,
        flexShrink: 0,
      }}
    />
  );
}
