import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const IndustrialQfpChip: React.FC<ChipProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  // Pin counts per side based on total pins (default 6 per side = 24 pins)
  const pinsPerSide = Math.max(4, Math.floor(config.pinCount / 4));
  const pinIndices = Array.from({ length: pinsPerSide }, (_, i) => i);

  // Metal color mappings
  const metalFinishes = {
    silver: {
      pinGrad: ['#f1f5f9', '#94a3b8', '#64748b', '#cbd5e1'],
      pad: '#d97706',
      rim: '#475569',
      notch: '#f8fafc',
    },
    gold: {
      pinGrad: ['#fef08a', '#ca8a04', '#854d0e', '#fde047'],
      pad: '#eab308',
      rim: '#ca8a04',
      notch: '#fef08a',
    },
    titanium: {
      pinGrad: ['#cbd5e1', '#64748b', '#334155', '#94a3b8'],
      pad: '#b45309',
      rim: '#334155',
      notch: '#e2e8f0',
    },
    copper: {
      pinGrad: ['#fdba74', '#ea580c', '#9a3412', '#fed7aa'],
      pad: '#c2410c',
      rim: '#9a3412',
      notch: '#ffedd5',
    },
    stealth: {
      pinGrad: ['#475569', '#1e293b', '#0f172a', '#334155'],
      pad: '#78350f',
      rim: '#1e293b',
      notch: '#94a3b8',
    },
  };

  const finish = metalFinishes[config.metalFinish] || metalFinishes.silver;

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`chip-frame group ${className}${config.interactiveHover ? ' chip-hover' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="chip-svg">
        <defs>
          {/* Metallic Pin Gradient */}
          <linearGradient id={`pin-grad-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={finish.pinGrad[0]} />
            <stop offset="35%" stopColor={finish.pinGrad[1]} />
            <stop offset="70%" stopColor={finish.pinGrad[2]} />
            <stop offset="100%" stopColor={finish.pinGrad[3]} />
          </linearGradient>

          {/* Solder Landing Pad Gradient (ENIG Immersion Gold / Copper) */}
          <linearGradient id={`pad-grad-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Ceramic Body Matte Gradient */}
          <linearGradient id={`body-grad-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22262d" />
            <stop offset="40%" stopColor="#17191e" />
            <stop offset="100%" stopColor="#0f1115" />
          </linearGradient>

          {/* Recessed Die Inner Gradient */}
          <linearGradient id={`recessed-grad-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111317" />
            <stop offset="100%" stopColor="#1e222a" />
          </linearGradient>

          {/* Laser-Etched Silver/White Text/Logo Gradient */}
          <linearGradient id={`etch-grad-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.75" />
          </linearGradient>

          {/* Gold Pin 1 Dot */}
          <radialGradient id={`gold-dot-${tech.id}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </radialGradient>

          {/* Glow filter */}
          <filter id={`soft-glow-${tech.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= PCB SOLDER PADS & TRACES (BACKGROUND) ================= */}
        {config.showPcbPads && (
          <g opacity="0.85">
            {/* Top pads */}
            {pinIndices.map((i) => {
              const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
              return (
                <g key={`pad-t-${i}`}>
                  <line x1={x} y1="8" x2={x} y2="28" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
                  <rect x={x - 3} y="14" width="6" height="14" rx="1.5" fill={`url(#pad-grad-${tech.id})`} />
                </g>
              );
            })}
            {/* Bottom pads */}
            {pinIndices.map((i) => {
              const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
              return (
                <g key={`pad-b-${i}`}>
                  <line x1={x} y1="172" x2={x} y2="192" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
                  <rect x={x - 3} y="172" width="6" height="14" rx="1.5" fill={`url(#pad-grad-${tech.id})`} />
                </g>
              );
            })}
            {/* Left pads */}
            {pinIndices.map((i) => {
              const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
              return (
                <g key={`pad-l-${i}`}>
                  <line x1="8" y1={y} x2="28" y2={y} stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
                  <rect x="14" y={y - 3} width="14" height="6" rx="1.5" fill={`url(#pad-grad-${tech.id})`} />
                </g>
              );
            })}
            {/* Right pads */}
            {pinIndices.map((i) => {
              const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
              return (
                <g key={`pad-r-${i}`}>
                  <line x1="172" y1={y} x2="192" y2={y} stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
                  <rect x="172" y={y - 3} width="14" height="6" rx="1.5" fill={`url(#pad-grad-${tech.id})`} />
                </g>
              );
            })}
          </g>
        )}

        {/* ================= GULL-WING METALLIC PINS ================= */}
        {/* Top Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`pin-t-${i}`}>
              {/* Pin shadow */}
              <rect x={x - 2.5} y="19" width="5" height="15" fill="#000000" opacity="0.6" filter="blur(1px)" />
              {/* Pin body */}
              <rect
                x={x - 2.5}
                y="18"
                width="5"
                height="15"
                rx="1"
                fill={`url(#pin-grad-${tech.id})`}
                stroke="#000000"
                strokeWidth="0.5"
                strokeOpacity="0.5"
              />
              {/* Specular center reflection line */}
              <line x1={x} y1="19" x2={x} y2="32" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
              {/* Solder tip */}
              <rect x={x - 2} y="18" width="4" height="3" rx="0.5" fill="#cbd5e1" />
            </g>
          );
        })}

        {/* Bottom Pins */}
        {pinIndices.map((i) => {
          const x = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`pin-b-${i}`}>
              <rect x={x - 2.5} y="167" width="5" height="15" fill="#000000" opacity="0.6" filter="blur(1px)" />
              <rect
                x={x - 2.5}
                y="167"
                width="5"
                height="15"
                rx="1"
                fill={`url(#pin-grad-${tech.id})`}
                stroke="#000000"
                strokeWidth="0.5"
                strokeOpacity="0.5"
              />
              <line x1={x} y1="168" x2={x} y2="181" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
              <rect x={x - 2} y="179" width="4" height="3" rx="0.5" fill="#cbd5e1" />
            </g>
          );
        })}

        {/* Left Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`pin-l-${i}`}>
              <rect x="19" y={y - 2.5} width="15" height="5" fill="#000000" opacity="0.6" filter="blur(1px)" />
              <rect
                x="18"
                y={y - 2.5}
                width="15"
                height="5"
                rx="1"
                fill={`url(#pin-grad-${tech.id})`}
                stroke="#000000"
                strokeWidth="0.5"
                strokeOpacity="0.5"
              />
              <line x1="19" y1={y} x2="32" y2={y} stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
              <rect x="18" y={y - 2} width="3" height="4" rx="0.5" fill="#cbd5e1" />
            </g>
          );
        })}

        {/* Right Pins */}
        {pinIndices.map((i) => {
          const y = 50 + (i * (100 / (pinsPerSide - 1 || 1)));
          return (
            <g key={`pin-r-${i}`}>
              <rect x="167" y={y - 2.5} width="15" height="5" fill="#000000" opacity="0.6" filter="blur(1px)" />
              <rect
                x="167"
                y={y - 2.5}
                width="15"
                height="5"
                rx="1"
                fill={`url(#pin-grad-${tech.id})`}
                stroke="#000000"
                strokeWidth="0.5"
                strokeOpacity="0.5"
              />
              <line x1="168" y1={y} x2="181" y2={y} stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
              <rect x="179" y={y - 2} width="3" height="4" rx="0.5" fill="#cbd5e1" />
            </g>
          );
        })}

        {/* ================= CERAMIC CHIP BODY ================= */}
        {/* Outer drop shadow rim */}
        <rect x="30" y="30" width="140" height="140" rx="10" fill="#05070a" />

        {/* Outer beveled chamfer border */}
        <rect
          x="31"
          y="31"
          width="138"
          height="138"
          rx="9"
          fill={`url(#body-grad-${tech.id})`}
          stroke="#384152"
          strokeWidth="1.2"
        />

        {/* Top-left specular rim highlight */}
        <path
          d="M 40 32 L 160 32 A 8 8 0 0 1 168 40 L 168 41 L 32 41 L 32 40 A 8 8 0 0 1 40 32 Z"
          fill="#ffffff"
          opacity="0.12"
        />

        {/* Inner molded step rim (realistic QFP packaging step) */}
        <rect
          x="38"
          y="38"
          width="124"
          height="124"
          rx="6"
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <rect
          x="39"
          y="39"
          width="122"
          height="122"
          rx="5"
          fill={`url(#recessed-grad-${tech.id})`}
          stroke="#2a303c"
          strokeWidth="0.8"
        />

        {/* Microscopic PCB trace texture inside */}
        <g opacity="0.05">
          <line x1="45" y1="50" x2="155" y2="50" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 2" />
          <line x1="45" y1="150" x2="155" y2="150" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 2" />
          <line x1="50" y1="45" x2="50" y2="155" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 2" />
          <line x1="150" y1="45" x2="150" y2="155" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 2" />
        </g>

        {/* ================= PIN 1 REGISTRATION MARK ================= */}
        {/* Authentic gold/foil pin 1 index dot */}
        <circle cx="48" cy="48" r="4" fill={`url(#gold-dot-${tech.id})`} stroke="#000000" strokeWidth="0.8" />
        <circle cx="47" cy="47" r="1.5" fill="#ffffff" opacity="0.8" />
        <path d="M 33 46 L 46 33" stroke="#ffffff" strokeWidth="1" opacity="0.25" strokeLinecap="round" />

        {/* ================= MICRO TECHNICAL SILKSCREEN ================= */}
        {config.showMicroText && (
          <g fontFamily="monospace" fontSize="6.5" fill="#94a3b8" letterSpacing="0.6" opacity="0.75">
            <text x="60" y="50" fontWeight="600">{tech.specCode}</text>
            <text x="48" y="152" fontSize="5.5" fill="#64748b">{tech.revision}</text>
            <text x="118" y="152" fontSize="5.5" fill="#64748b" textAnchor="end">{tech.frequency}</text>
          </g>
        )}

        {/* ================= CENTER EMBOSSED/ETCHED TECH ICON ================= */}
        <g transform="translate(68, 62) scale(0.64)">
          {/* Subtle drop shadow under icon */}
          <g transform="translate(0.5, 1)" opacity="0.7">
            {tech.svgPath('#000000')}
          </g>
          {/* Main etched icon */}
          {tech.svgPath(tech.color || '#ffffff')}
        </g>

        {/* Tech Name laser silkscreen underneath */}
        <text
          x="100"
          y="136"
          fill="#f8fafc"
          fontSize="9.5"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.8"
          textAnchor="middle"
          className="chip-label"
        >
          {tech.name}
        </text>

        {/* Corner fiducials & assembly crosses */}
        <g stroke="#ffffff" strokeWidth="0.7" opacity="0.2">
          <line x1="148" y1="45" x2="154" y2="45" />
          <line x1="151" y1="42" x2="151" y2="48" />
          <line x1="148" y1="145" x2="154" y2="145" />
          <line x1="151" y1="142" x2="151" y2="148" />
        </g>

        {/* ================= SMD BYPASS CAPACITORS (0402 RESISTORS) ================= */}
        {config.showSmdComponents && (
          <g>
            {/* Top-right capacitor */}
            <rect x="156" y="18" width="12" height="6" rx="1" fill="#78350f" stroke="#000000" strokeWidth="0.5" />
            <rect x="156" y="18" width="3" height="6" fill="#cbd5e1" />
            <rect x="165" y="18" width="3" height="6" fill="#cbd5e1" />

            {/* Bottom-left capacitor */}
            <rect x="32" y="176" width="12" height="6" rx="1" fill="#78350f" stroke="#000000" strokeWidth="0.5" />
            <rect x="32" y="176" width="3" height="6" fill="#cbd5e1" />
            <rect x="41" y="176" width="3" height="6" fill="#cbd5e1" />
          </g>
        )}
      </svg>
    </div>
  );
};
