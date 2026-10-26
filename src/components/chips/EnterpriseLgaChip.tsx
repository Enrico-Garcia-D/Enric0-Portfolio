import React from 'react';
import { TechItem, ChipConfig } from '../../types';

interface ChipProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const EnterpriseLgaChip: React.FC<ChipProps> = ({
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
          {/* Nickel-Plated Copper Brushed Metal Radial/Linear Gradient */}
          <radialGradient id={`ihs-radial-${tech.id}`} cx="45%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="35%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>

          {/* Steely Socket Bracket Gradient */}
          <linearGradient id={`socket-frame-${tech.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Copper Substrate Edge Gradient */}
          <linearGradient id={`substrate-edge-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Torx Screw Metallic Specular */}
          <radialGradient id={`torx-metal-${tech.id}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Laser-engraved recessed bevel filter */}
          <filter id={`engrave-depth-${tech.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="0.8" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="#000000" floodOpacity="0.75" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* ================= HEAVY RETENTION SOCKET FRAME (LGA BRACKET) ================= */}
        {/* Outer socket perimeter housing */}
        <rect x="18" y="18" width="164" height="164" rx="14" fill="#090d16" />
        <rect
          x="19"
          y="19"
          width="162"
          height="162"
          rx="13"
          fill={`url(#socket-frame-${tech.id})`}
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* 4 Corner Heavy-Duty Torx / Hex Screws */}
        {[
          { cx: 28, cy: 28 },
          { cx: 172, cy: 28 },
          { cx: 28, cy: 172 },
          { cx: 172, cy: 172 },
        ].map((screw, idx) => (
          <g key={`screw-${idx}`}>
            <circle cx={screw.cx} cy={screw.cy} r="6" fill={`url(#torx-metal-${tech.id})`} stroke="#0f172a" strokeWidth="0.8" />
            <circle cx={screw.cx} cy={screw.cy} r="4" fill="#1e293b" />
            {/* Hex/Torx 6-point star slot */}
            <path
              d={`M ${screw.cx} ${screw.cy - 2.5} L ${screw.cx} ${screw.cy + 2.5} M ${screw.cx - 2.2} ${screw.cy - 1.2} L ${screw.cx + 2.2} ${screw.cy + 1.2} M ${screw.cx - 2.2} ${screw.cy + 1.2} L ${screw.cx + 2.2} ${screw.cy - 1.2}`}
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          </g>
        ))}

        {/* Socket Retention Clamp Levers */}
        <rect x="42" y="14" width="116" height="4" rx="2" fill="#64748b" stroke="#000" strokeWidth="0.5" />
        <rect x="42" y="182" width="116" height="4" rx="2" fill="#64748b" stroke="#000" strokeWidth="0.5" />

        {/* ================= GREEN/BLACK FIBERGLASS SUBSTRATE ================= */}
        <rect
          x="32"
          y="32"
          width="136"
          height="136"
          rx="6"
          fill={`url(#substrate-edge-${tech.id})`}
          stroke="#000000"
          strokeWidth="1"
        />

        {/* Substrate Gold Test Pads Array (LGA perimeter test points) */}
        {config.showPcbPads && (
          <g opacity="0.6">
            {[40, 48, 56, 144, 152, 160].map((pos) => (
              <React.Fragment key={`lga-pads-${pos}`}>
                <circle cx={pos} cy="36" r="1.2" fill="#eab308" />
                <circle cx={pos} cy="164" r="1.2" fill="#eab308" />
                <circle cx="36" cy={pos} r="1.2" fill="#eab308" />
                <circle cx="164" cy={pos} r="1.2" fill="#eab308" />
              </React.Fragment>
            ))}
          </g>
        )}

        {/* ================= INTEGRATED HEAT SPREADER (IHS) ================= */}
        {/* IHS Drop shadow */}
        <rect x="43" y="43" width="114" height="114" rx="8" fill="#000000" opacity="0.8" filter="blur(2px)" />

        {/* IHS Nickel Plate Body */}
        <rect
          x="42"
          y="42"
          width="116"
          height="116"
          rx="7"
          fill={`url(#ihs-radial-${tech.id})`}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Polished Chamfer Rim Highlight */}
        <path
          d="M 50 43 L 150 43 A 6 6 0 0 1 157 50 L 43 50 A 6 6 0 0 1 50 43 Z"
          fill="#ffffff"
          opacity="0.35"
        />

        {/* Heatspreader Center Stepped Lid */}
        <rect
          x="52"
          y="52"
          width="96"
          height="96"
          rx="5"
          fill="#475569"
          stroke="#1e293b"
          strokeWidth="1"
          opacity="0.95"
        />

        {/* CNC Circular Machining Texture Rings */}
        <circle cx="100" cy="100" r="42" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.4" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.4" />
        <circle cx="100" cy="100" r="26" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />

        {/* Pin 1 Golden Alignment Triangle */}
        <polygon points="56,64 56,56 64,56" fill="#eab308" stroke="#713f12" strokeWidth="0.5" />

        {/* Enterprise Spec Typography */}
        {config.showMicroText && (
          <g fontFamily="monospace" fontSize="5.5" fill="#1e293b" fontWeight="700" letterSpacing="0.6">
            <text x="68" y="60" fill="#0f172a">LGA-ENTERPRISE</text>
            <text x="56" y="142" fill="#1e293b">{tech.specCode}</text>
            <text x="144" y="142" fill="#1e293b" textAnchor="end">{tech.frequency}</text>
          </g>
        )}

        {/* ================= LASER EMBOSSED / RECESSED TECH EMBLEM ================= */}
        <g transform="translate(68, 62) scale(0.64)">
          {/* Deep laser burn underlayer */}
          <g transform="translate(0, 1.2)" opacity="0.65">
            {tech.svgPath('#090d16')}
          </g>
          {/* Metallic highlight edge */}
          <g transform="translate(0, -0.8)" opacity="0.5">
            {tech.svgPath('#f8fafc')}
          </g>
          {/* Main emblem filled with tech tint */}
          {tech.svgPath('#0f172a')}
        </g>

        {/* Stamped Tech Title */}
        <text
          x="100"
          y="132"
          fill="#0f172a"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          textAnchor="middle"
        >
          {tech.name}
        </text>
        <text
          x="100"
          y="131"
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          textAnchor="middle"
          opacity="0.25"
        >
          {tech.name}
        </text>
      </svg>
    </div>
  );
};
