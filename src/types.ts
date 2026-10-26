import type { ReactNode } from 'react'

export type ChipStyle =
  | 'industrial-qfp'
  | 'cyber-rog'
  | 'enterprise-lga'
  | 'vintage-gold'
  | 'monolithic-m'
  | 'quantum-glass'

export type MetalFinish = 'silver' | 'gold' | 'titanium' | 'copper' | 'stealth'

export interface TechItem {
  id: string
  name: string
  color?: string
  accentColor?: string
  specCode: string
  revision: string
  frequency: string
  /** Draws the emblem in a 100x100 coordinate space with the given fill/stroke color. */
  svgPath: (fill: string) => ReactNode
}

export interface ChipConfig {
  style: ChipStyle
  pinCount: number
  metalFinish: MetalFinish
  glowIntensity: 'none' | 'low' | 'medium' | 'high'
  showPcbPads: boolean
  showStatusLed: boolean
  showMicroText: boolean
  showSmdComponents: boolean
  interactiveHover: boolean
}
