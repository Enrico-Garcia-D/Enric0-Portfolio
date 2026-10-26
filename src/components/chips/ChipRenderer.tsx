import React from 'react';
import { TechItem, ChipConfig } from '../../types';
import { IndustrialQfpChip } from './IndustrialQfpChip';
import { CyberRogChip } from './CyberRogChip';
import { EnterpriseLgaChip } from './EnterpriseLgaChip';
import { VintageGoldChip } from './VintageGoldChip';
import { MonolithicChip } from './MonolithicChip';
import { QuantumGlassChip } from './QuantumGlassChip';

interface ChipRendererProps {
  tech: TechItem;
  config: ChipConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const ChipRenderer: React.FC<ChipRendererProps> = ({
  tech,
  config,
  size = 180,
  className = '',
  onClick,
}) => {
  switch (config.style) {
    case 'industrial-qfp':
      return <IndustrialQfpChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    case 'cyber-rog':
      return <CyberRogChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    case 'enterprise-lga':
      return <EnterpriseLgaChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    case 'vintage-gold':
      return <VintageGoldChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    case 'monolithic-m':
      return <MonolithicChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    case 'quantum-glass':
      return <QuantumGlassChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
    default:
      return <IndustrialQfpChip tech={tech} config={config} size={size} className={className} onClick={onClick} />;
  }
};
