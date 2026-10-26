/** Animated EG monogram. Ink color follows the theme via currentColor; blue accents are fixed. */
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="eg-logo"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Enrico Garcia"
    >
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="4.5" className="eg-circle" />

      <g className="eg-e" strokeWidth="4.5" strokeLinecap="round">
        <path d="M 28 34 L 28 66" stroke="currentColor" />
        <path d="M 28 34 L 50 34" stroke="currentColor" />
        <path d="M 28 50 L 46 50" stroke="#2563EB" />
        <path d="M 28 66 L 50 66" stroke="currentColor" />
      </g>

      <g className="eg-g">
        <path
          d="M 88 50 L 58 50 L 58 64"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="50" r="2.025" fill="#2563EB" />
      </g>
    </svg>
  )
}
