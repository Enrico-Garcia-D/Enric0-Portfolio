import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const QuantumGlassChip: React.FC<ChipProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  const pinsPerSide = Math.max(4, Math.floor(config.pinCount / 4));
  const pinIndices = Array.from({ length: pinsPerSide }, (_, i) => i);
  const glow = tech.color || '#38bdf8';

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`chip-frame group ${className}${config.interactiveHover ? ' chip-hover' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="chip-svg">
        <defs>
          {/* Smoked Sapphire Glass Gradient */}
          <linearGradient id={`glass-lid-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0f172a" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </linearGradient>

          {/* Internal Silicon Wafer Rainbow Diffraction */}
          <linearGradient id={`silicon-wafer-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="25%" stopColor="#0f2b48" />
            <stop offset="50%" stopColor="#042f2e" />
            <stop offset="75%" stopColor="#172554" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Gold Bond Wire Gradient */}
          <linearGradient id={`bond-gold-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* ================= GULL-WING SILVER LEADS ================= */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`q-pin-t-${i}`}>
              <rect x={x - 2} y="16" width="4" height="18" rx="0.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            </g>
          );
        })}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`q-pin-b-${i}`}>
              <rect x={x - 2} y="166" width="4" height="18" rx="0.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            </g>
          );
        })}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`q-pin-l-${i}`}>
              <rect x="16" y={y - 2} width="18" height="4" rx="0.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            </g>
          );
        })}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`q-pin-r-${i}`}>
              <rect x="166" y={y - 2} width="18" height="4" rx="0.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* ================= CERAMIC CARRIER FRAME ================= */}
        <rect x="30" y="30" width="140" height="140" rx="8" fill="#0b0f19" stroke="#334155" strokeWidth="1.2" />

        {/* Leadframe Gold Contact Ring (inside package) */}
        <rect x="38" y="38" width="124" height="124" rx="4" fill="#0f172a" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="6 3" />

        {/* ================= REVEALED SILICON DIE (DIE-SHOT) ================= */}
        {/* Silicon Die Substrate */}
        <rect
          x="58"
          y="58"
          width="84"
          height="84"
          rx="3"
          fill={`url(#silicon-wafer-${tech.id})`}
          stroke="#38bdf8"
          strokeWidth="0.8"
        />

        {/* Microscopic Integrated Circuit Grid */}
        <g stroke={glow} strokeWidth="0.5" opacity="0.3">
          <line x1="62" y1="72" x2="138" y2="72" />
          <line x1="62" y1="86" x2="138" y2="86" />
          <line x1="62" y1="114" x2="138" y2="114" />
          <line x1="62" y1="128" x2="138" y2="128" />
          <line x1="72" y1="62" x2="72" y2="138" />
          <line x1="86" y1="62" x2="86" y2="138" />
          <line x1="114" y1="62" x2="114" y2="138" />
          <line x1="128" y1="62" x2="128" y2="138" />
        </g>

        {/* Microscopic Gold Wire Bonds (connecting die to package lead ring) */}
        <g stroke={`url(#bond-gold-${tech.id})`} strokeWidth="0.8" opacity="0.85">
          <line x1="42" y1="68" x2="60" y2="68" />
          <line x1="42" y1="84" x2="60" y2="84" />
          <line x1="42" y1="116" x2="60" y2="116" />
          <line x1="42" y1="132" x2="60" y2="132" />

          <line x1="158" y1="68" x2="140" y2="68" />
          <line x1="158" y1="84" x2="140" y2="84" />
          <line x1="158" y1="116" x2="140" y2="116" />
          <line x1="158" y1="132" x2="140" y2="132" />

          <line x1="68" y1="42" x2="68" y2="60" />
          <line x1="84" y1="42" x2="84" y2="60" />
          <line x1="116" y1="42" x2="116" y2="60" />
          <line x1="132" y1="42" x2="132" y2="60" />

          <line x1="68" y1="158" x2="68" y2="140" />
          <line x1="84" y1="158" x2="84" y2="140" />
          <line x1="116" y1="158" x2="116" y2="140" />
          <line x1="132" y1="158" x2="132" y2="140" />
        </g>

        {/* Gold Bonding Pads on Die Rim */}
        {[68, 84, 116, 132].map((p) => (
          <React.Fragment key={`bond-pad-${p}`}>
            <rect x="58.5" y={p - 1.5} width="3" height="3" fill="#fef08a" />
            <rect x="138.5" y={p - 1.5} width="3" height="3" fill="#fef08a" />
            <rect x={p - 1.5} y="58.5" width="3" height="3" fill="#fef08a" />
            <rect x={p - 1.5} y="138.5" width="3" height="3" fill="#fef08a" />
          </React.Fragment>
        ))}

        {/* Central illuminated silicon core logo */}
        <g transform="translate(72, 68) scale(0.56)">
          <g opacity="0.4" filter="blur(2px)">
            {tech.svgPath(glow)}
          </g>
          {tech.svgPath('#ffffff')}
        </g>

        {/* ================= SMOKED SAPPHIRE GLASS TOP LID ================= */}
        <rect
          x="34"
          y="34"
          width="132"
          height="132"
          rx="6"
          fill={`url(#glass-lid-${tech.id})`}
          stroke="#60a5fa"
          strokeWidth="0.8"
          strokeOpacity="0.3"
        />

        {/* Diagonal Glass Glare Reflection */}
        <path
          d="M 38 38 L 110 38 L 44 104 L 38 104 Z"
          fill="#ffffff"
          opacity="0.12"
        />

        {/* Glass Spec Code Laser Silk */}
        {config.showMicroText && (
          <g fontFamily="monospace" fontSize="6" fill="#93c5fd" opacity="0.8">
            <text x="44" y="46">DIE-SHOT // 2NM</text>
            <text x="100" y="152" textAnchor="middle" fill="#ffffff" fontWeight="700">{tech.name}</text>
          </g>
        )}
      </svg>
    </div>
  );
};
