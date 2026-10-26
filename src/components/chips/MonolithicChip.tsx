import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const MonolithicChip: React.FC<ChipProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`chip-frame group ${className}${config.interactiveHover ? ' chip-hover' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="chip-svg">
        <defs>
          {/* Space-Black Obsidian Ceramic Monolith */}
          <linearGradient id={`mono-body-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a1c23" />
            <stop offset="45%" stopColor="#0d0e12" />
            <stop offset="100%" stopColor="#050608" />
          </linearGradient>

          {/* Diamond-Cut Specular Chamfer Edge */}
          <linearGradient id={`mono-chamfer-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="25%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Liquid Titanium / Laser Mirror Etched Finish */}
          <linearGradient id={`liquid-silver-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Subtle Ambient Glow */}
          <radialGradient id={`ambient-aura-${tech.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tech.color || '#38bdf8'} stopOpacity="0.12" />
            <stop offset="100%" stopColor={tech.color || '#38bdf8'} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Silicon Aura on PCB */}
        <circle cx="100" cy="100" r="85" fill={`url(#ambient-aura-${tech.id})`} />

        {/* ================= SUBTERRANEAN BGA EDGE CONTACTS ================= */}
        {config.showPcbPads && (
          <g opacity="0.6">
            {/* Edge solder balls / test pads */}
            {Array.from({ length: 14 }).map((_, i) => {
              const pos = 32 + (i * 10.4);
              return (
                <React.Fragment key={`bga-edge-${i}`}>
                  <circle cx={pos} cy="20" r="1.5" fill="#ca8a04" />
                  <circle cx={pos} cy="180" r="1.5" fill="#ca8a04" />
                  <circle cx="20" cy={pos} r="1.5" fill="#ca8a04" />
                  <circle cx="180" cy={pos} r="1.5" fill="#ca8a04" />
                </React.Fragment>
              );
            })}
          </g>
        )}

        {/* ================= MONOLITHIC BODY ================= */}
        {/* Base Drop Shadow Frame */}
        <rect x="25" y="25" width="150" height="150" rx="16" fill="#020305" />

        {/* Diamond-cut Chamfered Bevel Frame */}
        <rect
          x="26"
          y="26"
          width="148"
          height="148"
          rx="15"
          fill={`url(#mono-chamfer-${tech.id})`}
        />

        {/* Space-Black Core Monolith Surface */}
        <rect
          x="28"
          y="28"
          width="144"
          height="144"
          rx="13.5"
          fill={`url(#mono-body-${tech.id})`}
          stroke="#1e293b"
          strokeWidth="0.8"
        />

        {/* Top-Right Light Sweep Highlight */}
        <path
          d="M 42 29 L 158 29 A 13 13 0 0 1 171 42 L 171 43 L 29 43 L 29 42 A 13 13 0 0 1 42 29 Z"
          fill="#ffffff"
          opacity="0.18"
        />

        {/* Microscopic Grid Texture (3nm Wafer Mesh) */}
        <g opacity="0.04" stroke="#ffffff" strokeWidth="0.5">
          <line x1="30" y1="60" x2="170" y2="60" />
          <line x1="30" y1="100" x2="170" y2="100" />
          <line x1="30" y1="140" x2="170" y2="140" />
          <line x1="60" y1="30" x2="60" y2="170" />
          <line x1="100" y1="30" x2="100" y2="170" />
          <line x1="140" y1="30" x2="140" y2="170" />
        </g>

        {/* Apple-Style Minimalist Corner Fiducial Indicator */}
        <circle cx="44" cy="44" r="2.5" fill="#f8fafc" opacity="0.85" />
        <circle cx="44" cy="44" r="5" fill="none" stroke="#f8fafc" strokeWidth="0.6" opacity="0.4" />

        {/* Hyper-Clean Swiss Micro Typography */}
        {config.showMicroText && (
          <g fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" fontSize="5.5" fill="#64748b" letterSpacing="0.8">
            <text x="56" y="46" fontWeight="600" fill="#94a3b8">SILICON CORE</text>
            <text x="44" y="156" fill="#475569">{tech.specCode}</text>
            <text x="156" y="156" fill="#475569" textAnchor="end">3NM FINFET</text>
          </g>
        )}

        {/* ================= POLISHED LIQUID TITANIUM EMBLEM ================= */}
        <g transform="translate(68, 62) scale(0.64)">
          {/* Subtle specular reflection */}
          <g opacity="0.95">
            {tech.svgPath(`url(#liquid-silver-${tech.id})`)}
          </g>
        </g>

        {/* Monolithic Minimal Tech Title */}
        <text
          x="100"
          y="136"
          fill="#f8fafc"
          fontSize="9.5"
          fontWeight="600"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
          letterSpacing="0.5"
          textAnchor="middle"
        >
          {tech.name}
        </text>

        {/* Microscopic Core Arch Line */}
        <line x1="88" y1="142" x2="112" y2="142" stroke={tech.color || '#38bdf8'} strokeWidth="1.2" opacity="0.75" />
      </svg>
    </div>
  );
};
