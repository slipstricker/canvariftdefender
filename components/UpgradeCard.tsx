
import React from 'react';
import { Upgrade, Player } from '../types';

interface UpgradeCardProps {
  upgrade: Upgrade;
  player: Player; // Added to access current upgrade counts
  onSelect: () => void;
  isOverallAnimationActive?: boolean;
  isThisCardSpinning?: boolean;
  upgradeIcons?: Record<string, string>;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ 
  upgrade, 
  player,
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

  const baseButtonClass = 'pixel-upgrade-card bg-gray-800 p-4 border-2 text-left w-full md:w-80 m-2 focus:outline-none flex flex-col justify-between'; // Changed md:w-72 to md:w-80
  
  const interactionClass = isOverallAnimationActive
    ? 'opacity-85 cursor-default filter saturate-75'
    : 'hover:bg-gray-700 focus:bg-gray-700 focus:border-yellow-400';

  const ledClass = isThisCardSpinning ? 'upgrade-card-spinning-led' : '';
  const icon = upgradeIcons && upgradeIcons[upgrade.id] ? upgradeIcons[upgrade.id] : '✨';

  const currentApplications = player.upgrades.filter(uid => uid === upgrade.id).length;
  let applicationsText = `Aplicações: ${currentApplications}`;
  if (upgrade.maxApplications !== undefined) {
    applicationsText += ` / ${upgrade.maxApplications} (Máx)`;
  }

  return (
    <button
      onClick={isOverallAnimationActive ? undefined : onSelect}
      disabled={isOverallAnimationActive}
      className={`${baseButtonClass} ${tierColor[upgrade.tier]} ${interactionClass} ${ledClass}`}
      style={{ minHeight: '160px' }} 
      aria-busy={isOverallAnimationActive}
    >
      <div>
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3" role="img" aria-label={upgrade.name}>
            {icon}
          </span>
          <h3 className="text-sm font-bold text-indigo-400 truncate" style={{ lineHeight: '1.2' }}>
            {upgrade.name}
            <span className="text-xs text-gray-400 ml-1">(ID: {upgrade.numericId})</span>
          </h3>
        </div>
        <p className="text-gray-300 text-xs mb-1" style={{ fontSize: '0.68rem', lineHeight: '1.35' }}>{upgrade.description}</p>
      </div>
      <div className="mt-auto pt-1"> 
        <p className="text-xs text-yellow-300 mb-1" style={{ fontSize: '0.65rem' }}>{applicationsText}</p>
        <p className="text-xs text-gray-500 italic capitalize" style={{ fontSize: '0.65rem' }}>Tier: {upgrade.tier}</p>
      </div>
    </button>
  );
};

export default UpgradeCard;