interface HoshiLogoProps {
  width?: number;
  height?: number;
  className?: string;
  /** タイトル（aria-label 用） */
  title?: string;
}

/**
 * hoshiorange のシンボル。
 * - 中央の四芒星（star）
 * - オレンジの軌道リング
 * - 散らした副星
 */
export function HoshiLogo({ width = 36, height = 36, className, title = 'hoshiorange logo' }: HoshiLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="hoshiOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffb066" />
          <stop offset="60%" stopColor="#ff8c2a" />
          <stop offset="100%" stopColor="#ff5e1f" />
        </linearGradient>
        <radialGradient id="hoshiCore" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#ffd9a6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff8c2a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 軌道リング */}
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="10"
        transform="rotate(-22 32 32)"
        fill="none"
        stroke="url(#hoshiOrange)"
        strokeWidth="2"
        opacity="0.85"
      />

      {/* 後ろのほの明かり */}
      <circle cx="32" cy="32" r="18" fill="url(#hoshiCore)" />

      {/* 中央の四芒星 */}
      <path
        d="M32 6 L36 28 L58 32 L36 36 L32 58 L28 36 L6 32 L28 28 Z"
        fill="url(#hoshiOrange)"
      />

      {/* 副星 */}
      <circle cx="12" cy="14" r="1.6" fill="#ffffff" />
      <circle cx="54" cy="20" r="1.2" fill="#ffffff" opacity="0.85" />
      <circle cx="50" cy="50" r="1.8" fill="#ffffff" />
      <circle cx="14" cy="48" r="1.1" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}
