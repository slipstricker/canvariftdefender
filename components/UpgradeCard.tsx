
import React from 'react';
import { Upgrade } from '../types';

interface UpgradeCardProps {
  upgrade: Upgrade;
  onSelect: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, onSelect }) => {
  const tierColor = {
    common: 'border-gray-400 hover:border-gray-200',
    uncommon: 'border-green-500 hover:border-green-300',
    rare: 'border-purple-600 hover:border-purple-400',
  };

  return (
    <button
      onClick={onSelect}
      className={`pixel-upgrade-card bg-gray-800 p-4 border-2 ${tierColor[upgrade.tier]} text-left w-full md:w-64 m-2 hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:border-yellow-400`}
      style={{ minHeight: '130px' }} // Ensure cards have some minimum height
    >
      <h3 className="text-base font-bold text-indigo-400 mb-2 truncate" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{upgrade.name}</h3>
      <p className="text-gray-300 text-xs mb-2" style={{ fontSize: '0.65rem', lineHeight: '1.3' }}>{upgrade.description}</p>
      <p className="text-xs text-gray-500 mt-auto italic capitalize">{upgrade.tier}</p>
    </button>
  );
};

export default UpgradeCard;