/**
 * InvestoLogo — matches the actual brand mark:
 * Navy rounded square background, "inv" in white bold, "esto" in amber/gold bold,
 * with a small amber square dot above the "i".
 *
 * Props:
 *   size  — controls the overall height in px (default 40)
 *   showText — whether to show the full "investo" wordmark beside the icon (default true)
 *   textClassName — extra classes for the wordmark span
 */

interface InvestoLogoProps {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  /** "icon" = square icon only, "full" = icon + wordmark side-by-side */
  variant?: "icon" | "full";
}

export function InvestoLogo({
  size = 40,
  showText = true,
  textClassName = "",
  variant = "full",
}: InvestoLogoProps) {
  const iconSize = size;
  const radius = Math.round(iconSize * 0.22); // ~22% corner radius matches logo
  const fontSize = Math.round(iconSize * 0.38);
  const dotSize = Math.round(iconSize * 0.13);
  const dotOffset = Math.round(iconSize * 0.12);

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      {/* Icon mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Navy rounded background */}
        <rect width={iconSize} height={iconSize} rx={radius} fill="#0f2460" />

        {/* Amber dot above the "i" */}
        <rect
          x={dotOffset}
          y={dotOffset}
          width={dotSize}
          height={dotSize}
          rx={Math.round(dotSize * 0.2)}
          fill="#f5a623"
        />

        {/* "inv" in white */}
        <text
          x={dotOffset}
          y={Math.round(iconSize * 0.75)}
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          fill="#ffffff"
          letterSpacing="-0.5"
        >
          inv
        </text>

        {/* "esto" in amber — positioned right after "inv" */}
        {/* We estimate 'inv' width as ~fontSize * 1.65 */}
        <text
          x={Math.round(dotOffset + fontSize * 1.65)}
          y={Math.round(iconSize * 0.75)}
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          fill="#f5a623"
          letterSpacing="-0.5"
        >
          esto
        </text>
      </svg>

      {/* Wordmark beside the icon */}
      {(showText && variant === "full") && (
        <span
          className={`font-bold leading-none ${textClassName}`}
          style={{ fontSize: Math.round(iconSize * 0.48) }}
        >
          <span className="text-white">inv</span>
          <span style={{ color: "#f5a623" }}>esto</span>
        </span>
      )}
    </span>
  );
}
