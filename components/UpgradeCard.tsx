
import React from 'react';
import { Upgrade } from '../types';

interface UpgradeCardProps {
  upgrade: Upgrade;
  onSelect: () => void;
  isOverallAnimationActive?: boolean; // True if the entire upgrade sequence is animating
  isThisCardSpinning?: boolean; // True if this specific card is currently cycling options (not locked)
  upgradeIcons?: Record<string, string>;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ 
  upgrade, 
  onSelect, 
  isOverallAnimationActive, 
  isThisCardSpinning, 
  upgradeIcons 
}) => {
  const tierColor = {
    comum: 'border-gray-400 hover:border-gray-200',
    incomum: 'border-green-500 hover:border-green-300',
    raro: 'border-purple-600 hover:border-purple-400',
  };

  const baseButtonClass = 'pixel-upgrade-card bg-gray-800 p-4 border-2 text-left w-full md:w-64 m-2 focus:outline-none';
  
  // Interaction classes based on overall animation state
  const interactionClass = isOverallAnimationActive
    ? 'opacity-85 cursor-default filter saturate-75'
    : 'hover:bg-gray-700 focus:bg-gray-700 focus:border-yellow-400';

  // LED class for individual card spinning
  const ledClass = isThisCardSpinning ? 'upgrade-card-spinning-led' : '';

  const icon = upgradeIcons && upgradeIcons[upgrade.id] ? upgradeIcons[upgrade.id] : '✨';

  return (
    <button
      onClick={isOverallAnimationActive ? undefined : onSelect}
      disabled={isOverallAnimationActive}
      className={`${baseButtonClass} ${tierColor[upgrade.tier]} ${interactionClass} ${ledClass}`}
      style={{ minHeight: '130px' }}
      aria-busy={isOverallAnimationActive}
    >
      <div className="flex items-center mb-2"> {/* Icon and Name on the same line */}
        <span className="text-2xl mr-3" role="img" aria-label={upgrade.name}> {/* Increased icon size and margin */}
          {icon}
        </span>
        <h3 className="text-sm font-bold text-indigo-400 truncate" style={{ lineHeight: '1.2' }}>
          {upgrade.name}
          <span className="text-xs text-gray-400 ml-1"> (ID: {upgrade.numericId})</span>
        </h3>
      </div>
      <p className="text-gray-300 text-xs mb-2" style={{ fontSize: '0.65rem', lineHeight: '1.3' }}>{upgrade.description}</p>
      <p className="text-xs text-gray-500 mt-auto italic capitalize">{upgrade.tier}</p>
    </button>
  );
};

export default UpgradeCard;