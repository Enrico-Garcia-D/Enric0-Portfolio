import type { ChipIcon } from '../data'
import type { ChipConfig, ChipStyle, MetalFinish, TechItem } from '../types'
import { ChipRenderer } from './chips/ChipRenderer'

export const CHIP_STYLES: ChipStyle[] = [
  'industrial-qfp',
  'cyber-rog',
  'enterprise-lga',
  'vintage-gold',
  'monolithic-m',
  'quantum-glass',
]

export const FINISHES: MetalFinish[] = ['silver', 'gold', 'titanium', 'copper', 'stealth']
export const PIN_COUNTS = [16, 24, 32]

export interface ChipLook {
  style: ChipStyle
  finish: MetalFinish
  pins: number
}

// Very dark brand colors would vanish on dark packages, so they fall back to a light blue.
const readable = (hex?: string) => {
  if (!hex) return '#7fb2ff'
  const n = parseInt(hex, 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.3 ? `#${hex}` : '#7fb2ff'
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Wraps a tool icon in the shape the chip designs expect. Spec text on the package is decorative. */
function toTech(icon: ChipIcon): TechItem {
  const h = hash(icon.label)
  const abbr = icon.label.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CHP'

  return {
    id: icon.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: icon.label,
    color: readable(icon.hex),
    accentColor: '#7dd3fc',
    specCode: `${abbr}-${(h % 900) + 100}`,
    revision: `REV ${'ABCD'[h % 4]}`,
    frequency: `${(2 + ((h >> 3) % 38) / 10).toFixed(1)}GHz`,
    // The icons are 24x24; the chip designs draw emblems in a 100x100 space.
    svgPath: (fill) =>
      icon.kind === 'fill' ? (
        <path d={icon.path} fill={fill} transform="scale(4.1667)" />
      ) : (
        <path
          d={icon.path}
          fill="none"
          stroke={fill}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(4.1667)"
        />
      ),
  }
}

const SIZE = 100

/** A tool shown as an IC package; the name is read out on hover, focus, and by screen readers. */
export default function Chip({ icon, look, decorative = false }: { icon: ChipIcon; look: ChipLook; decorative?: boolean }) {
  const config: ChipConfig = {
    style: look.style,
    pinCount: look.pins,
    metalFinish: look.finish,
    glowIntensity: 'medium',
    showPcbPads: true,
    showStatusLed: true,
    showMicroText: true,
    showSmdComponents: true,
    interactiveHover: true,
  }

  return (
    <li className="chip-item">
      <span className="chip" tabIndex={decorative ? -1 : 0} role="img" aria-label={icon.label} data-label={icon.label}>
        <ChipRenderer tech={toTech(icon)} config={config} size={SIZE} />
      </span>
    </li>
  )
}
