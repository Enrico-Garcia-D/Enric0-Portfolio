import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CyberRogChip: React.FC<ChipProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  const pinsPerSide = Math.max(4, Math.floor(config.pinCount / 4));
  const pinIndices = Array.from({ length: pinsPerSide }, (_, i) => i);
  const glowColor = tech.color || '#00f0ff';

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`chip-frame group ${className}${config.interactiveHover ? ' chip-hover' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="chip-svg">
        <defs>
          {/* Cyber Armor Brushed Gunmetal */}
          <linearGradient id={`cyber-body-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e2229" />
            <stop offset="30%" stopColor="#14171d" />
            <stop offset="70%" stopColor="#0d0e12" />
            <stop offset="100%" stopColor="#1a1e24" />
          </linearGradient>

          {/* Neon Lightpipe Gradient */}
          <linearGradient id={`neon-flow-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={tech.accentColor || glowColor} stopOpacity="0.8" />
          </linearGradient>

          {/* High-tech pin gradient */}
          <linearGradient id={`cyber-pin-${tech.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="40%" stopColor="#94a3b8" />
            <stop offset="60%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Intense Neon Glow Filter */}
          <filter id={`neon-glow-${tech.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= RADIATING NEON MOTHERBOARD BUS TRACES ================= */}
        {config.showPcbPads && (
          <g opacity="0.9">
            {/* Corner diagonal bus traces */}
            <path d="M 28 28 L 10 10 M 24 36 L 6 18 M 36 24 L 18 6" stroke={glowColor} strokeWidth="1.2" strokeOpacity="0.35" />
            <path d="M 172 28 L 190 10 M 176 36 L 194 18 M 164 24 L 182 6" stroke={glowColor} strokeWidth="1.2" strokeOpacity="0.35" />
            <path d="M 28 172 L 10 190 M 24 164 L 6 182 M 36 176 L 18 194" stroke={glowColor} strokeWidth="1.2" strokeOpacity="0.35" />
            <path d="M 172 172 L 190 190 M 176 164 L 194 182 M 164 176 L 182 194" stroke={glowColor} strokeWidth="1.2" strokeOpacity="0.35" />

            {/* Glowing gold terminal vias */}
            <circle cx="10" cy="10" r="2.5" fill="#eab308" stroke="#000" strokeWidth="0.8" />
            <circle cx="190" cy="10" r="2.5" fill="#eab308" stroke="#000" strokeWidth="0.8" />
            <circle cx="10" cy="190" r="2.5" fill="#eab308" stroke="#000" strokeWidth="0.8" />
            <circle cx="190" cy="190" r="2.5" fill="#eab308" stroke="#000" strokeWidth="0.8" />
          </g>
        )}

        {/* ================= PINS WITH ENERGIZED CONTACTS ================= */}
        {/* Top Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`cyber-pin-t-${i}`}>
              <line x1={x} y1="8" x2={x} y2="28" stroke={glowColor} strokeWidth="1" strokeOpacity="0.4" />
              <rect x={x - 2.5} y="15" width="5" height="17" rx="0.8" fill={`url(#cyber-pin-${tech.id})`} />
              <rect x={x - 1.5} y="15" width="3" height="3" fill={glowColor} opacity="0.8" />
            </g>
          );
        })}

        {/* Bottom Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`cyber-pin-b-${i}`}>
              <line x1={x} y1="172" x2={x} y2="192" stroke={glowColor} strokeWidth="1" strokeOpacity="0.4" />
              <rect x={x - 2.5} y="168" width="5" height="17" rx="0.8" fill={`url(#cyber-pin-${tech.id})`} />
              <rect x={x - 1.5} y="182" width="3" height="3" fill={glowColor} opacity="0.8" />
            </g>
          );
        })}

        {/* Left Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`cyber-pin-l-${i}`}>
              <line x1="8" y1={y} x2="28" y2={y} stroke={glowColor} strokeWidth="1" strokeOpacity="0.4" />
              <rect x="15" y={y - 2.5} width="17" height="5" rx="0.8" fill={`url(#cyber-pin-${tech.id})`} />
              <rect x="15" y={y - 1.5} width="3" height="3" fill={glowColor} opacity="0.8" />
            </g>
          );
        })}

        {/* Right Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`cyber-pin-r-${i}`}>
              <line x1="172" y1={y} x2="192" y2={y} stroke={glowColor} strokeWidth="1" strokeOpacity="0.4" />
              <rect x="168" y={y - 2.5} width="17" height="5" rx="0.8" fill={`url(#cyber-pin-${tech.id})`} />
              <rect x="182" y={y - 1.5} width="3" height="3" fill={glowColor} opacity="0.8" />
            </g>
          );
        })}

        {/* ================= CYBER ARMOR BODY ================= */}
        {/* Base polygon with chamfered angular corners (gaming GPU / motherboard style) */}
        <polygon
          points="40,28 160,28 172,40 172,160 160,172 40,172 28,160 28,40"
          fill="#0a0c10"
        />
        <polygon
          points="41,29 159,29 171,41 171,159 159,171 41,171 29,159 29,41"
          fill={`url(#cyber-body-${tech.id})`}
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* ================= ACTIVE RGB NEON LIGHTPIPE PERIMETER ================= */}
        {/* Glowing border trace */}
        <polygon
          points="46,36 154,36 164,46 164,154 154,164 46,164 36,154 36,46"
          fill="none"
          stroke={glowColor}
          strokeWidth="2"
          filter={`url(#neon-glow-${tech.id})`}
          opacity={config.glowIntensity === 'none' ? '0' : '0.85'}
        />
        <polygon
          points="46,36 154,36 164,46 164,154 154,164 46,164 36,154 36,46"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.8"
          opacity="0.9"
        />

        {/* Diagonal mechanical heat-dissipation strakes */}
        <g stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round">
          <line x1="135" y1="36" x2="164" y2="65" />
          <line x1="145" y1="36" x2="164" y2="55" />
          <line x1="36" y1="135" x2="65" y2="164" />
          <line x1="36" y1="145" x2="55" y2="164" />
        </g>

        {/* Inner core recess */}
        <rect x="48" y="48" width="104" height="104" rx="4" fill="#090b0e" stroke="#1f2937" strokeWidth="1" />

        {/* Active Core Status LED on Pin 1 */}
        {config.showStatusLed && (
          <g>
            <circle cx="42" cy="42" r="3.5" fill={glowColor} filter={`url(#neon-glow-${tech.id})`} />
            <circle cx="42" cy="42" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Cyberpunk Specs */}
        {config.showMicroText && (
          <g fontFamily="monospace" fontSize="6" fill="#64748b" letterSpacing="0.5">
            <text x="56" y="58" fill={glowColor} opacity="0.9" fontWeight="700">CORE//RGB</text>
            <text x="56" y="146" fill="#94a3b8">{tech.specCode}</text>
            <text x="144" y="146" textAnchor="end" fill={glowColor} opacity="0.8">{tech.frequency}</text>
          </g>
        )}

        {/* ================= CENTER ICON WITH ENERGY GLOW ================= */}
        <g transform="translate(68, 62) scale(0.64)">
          {/* Subtle neon shadow halo behind icon */}
          <g opacity="0.5" filter={`url(#neon-glow-${tech.id})`}>
            {tech.svgPath(glowColor)}
          </g>
          {/* Core crisp icon */}
          {tech.svgPath('#ffffff')}
        </g>

        {/* Tech label with cyber stencil underline */}
        <text
          x="100"
          y="134"
          fill="#f8fafc"
          fontSize="9"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          textAnchor="middle"
        >
          {tech.name.toUpperCase()}
        </text>

        {/* Tech-accented underline bracket */}
        <path d="M 70 138 H 130" stroke={glowColor} strokeWidth="1" opacity="0.7" />
        <circle cx="100" cy="138" r="1.5" fill={glowColor} />
      </svg>
    </div>
  );
};
