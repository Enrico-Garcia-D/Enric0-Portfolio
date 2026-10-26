import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const VintageGoldChip: React.FC<ChipProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  const pinsPerSide = Math.max(4, Math.floor(config.pinCount / 4));
  const pinIndices = Array.from({ length: pinsPerSide }, (_, i) => i);

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`chip-frame group ${className}${config.interactiveHover ? ' chip-hover' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="chip-svg">
        <defs>
          {/* Imperial Ceramic Purple / Burgundy Body */}
          <linearGradient id={`vintage-ceramic-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="40%" stopColor="#2e0854" />
            <stop offset="80%" stopColor="#1e0538" />
            <stop offset="100%" stopColor="#140224" />
          </linearGradient>

          {/* 24K Pure Gold Mirror Lid Radial Gradient */}
          <radialGradient id={`gold-lid-${tech.id}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="15%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>

          {/* 24K Gold Leads */}
          <linearGradient id={`gold-pins-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>

          {/* Gold hot-stamp text fill */}
          <linearGradient id={`gold-stamp-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* ================= 24K GOLD PINS ================= */}
        {/* Top Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`v-pin-t-${i}`}>
              <rect x={x - 2.5} y="16" width="5" height="17" rx="0.5" fill={`url(#gold-pins-${tech.id})`} stroke="#713f12" strokeWidth="0.5" />
              <line x1={x} y1="16" x2={x} y2="30" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>
          );
        })}

        {/* Bottom Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`v-pin-b-${i}`}>
              <rect x={x - 2.5} y="167" width="5" height="17" rx="0.5" fill={`url(#gold-pins-${tech.id})`} stroke="#713f12" strokeWidth="0.5" />
              <line x1={x} y1="167" x2={x} y2="181" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>
          );
        })}

        {/* Left Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`v-pin-l-${i}`}>
              <rect x="16" y={y - 2.5} width="17" height="5" rx="0.5" fill={`url(#gold-pins-${tech.id})`} stroke="#713f12" strokeWidth="0.5" />
              <line x1="16" y1={y} x2="30" y2={y} stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>
          );
        })}

        {/* Right Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`v-pin-r-${i}`}>
              <rect x="167" y={y - 2.5} width="17" height="5" rx="0.5" fill={`url(#gold-pins-${tech.id})`} stroke="#713f12" strokeWidth="0.5" />
              <line x1="167" y1={y} x2="181" y2={y} stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>
          );
        })}

        {/* ================= IMPERIAL PURPLE CERAMIC CARRIER ================= */}
        <rect x="29" y="29" width="142" height="142" rx="4" fill="#120320" />
        <rect
          x="30"
          y="30"
          width="140"
          height="140"
          rx="3"
          fill={`url(#vintage-ceramic-${tech.id})`}
          stroke="#581c87"
          strokeWidth="1.2"
        />

        {/* Gold Corner Solder Braze Pads (classic 80s ceramic package feature) */}
        <polygon points="31,31 44,31 31,44" fill={`url(#gold-pins-${tech.id})`} />
        <polygon points="169,31 156,31 169,44" fill={`url(#gold-pins-${tech.id})`} />
        <polygon points="31,169 44,169 31,156" fill={`url(#gold-pins-${tech.id})`} />
        <polygon points="169,169 156,169 169,156" fill={`url(#gold-pins-${tech.id})`} />

        {/* ================= 24K GOLD THERMAL LID ================= */}
        {/* Lid shadow */}
        <rect x="52" y="52" width="96" height="96" rx="4" fill="#10031c" opacity="0.7" />

        {/* Gold Lid Body with Chamfered Gold Rim */}
        <rect
          x="50"
          y="50"
          width="100"
          height="100"
          rx="3"
          fill={`url(#gold-lid-${tech.id})`}
          stroke="#713f12"
          strokeWidth="1.2"
        />

        {/* Gold Lid Beveled Step */}
        <rect
          x="54"
          y="54"
          width="92"
          height="92"
          rx="2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Vintage Mil-Spec Registration Triangle */}
        <polygon points="56,66 56,58 64,58" fill="#581c87" stroke="#3b0764" strokeWidth="0.5" />

        {/* Vintage Technical Stamping */}
        {config.showMicroText && (
          <g fontFamily="'Courier New', monospace" fontSize="5.8" fill="#713f12" fontWeight="800" letterSpacing="0.4">
            <text x="68" y="62">MIL-M-38510</text>
            <text x="56" y="142">SN-8422A</text>
            <text x="144" y="142" textAnchor="end">{tech.specCode}</text>
          </g>
        )}

        {/* ================= EMBOSSED TECH ICON IN GOLD LID ================= */}
        <g transform="translate(68, 62) scale(0.64)">
          {/* Golden highlight */}
          <g transform="translate(0, -0.6)" opacity="0.4">
            {tech.svgPath('#ffffff')}
          </g>
          {/* Deep etched purple insignia */}
          {tech.svgPath('#2e0854')}
        </g>

        {/* Gold Hot-Stamped Tech Name */}
        <text
          x="100"
          y="134"
          fill="#3b0764"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="'Times New Roman', serif"
          letterSpacing="0.8"
          textAnchor="middle"
        >
          {tech.name}
        </text>
      </svg>
    </div>
  );
};
