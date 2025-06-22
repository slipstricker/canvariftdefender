
import React from 'react';
import { Upgrade } from '../types';

interface SkillsInfoScreenProps {
  upgrades: Upgrade[];
  upgradeIcons: Record<string, string>;
  onBack: () => void;
  panelBaseClass: string;
  commonButtonClass: string;
}

const SkillsInfoScreen: React.FC<SkillsInfoScreenProps> = ({ 
  upgrades, 
  upgradeIcons, 
  onBack,
  panelBaseClass,
  commonButtonClass
}) => {
  return (
    <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="skillsInfoTitleExternal">
      <h2 id="skillsInfoTitleExternal" className="text-2xl font-bold my-4 text-indigo-300 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Habilidades Disponíveis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mb-4">
        {upgrades.map(upgrade => (
          <div key={upgrade.id} className="bg-gray-800 p-3 border-2 border-gray-700 flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2" role="img" aria-label={upgrade.name}>{upgradeIcons[upgrade.id] || '❓'}</span>
              <h3 className="text-sm font-bold text-indigo-400">
                {upgrade.name}
                <span className="text-xs text-gray-400 ml-1"> (ID: {upgrade.numericId})</span>
              </h3>
            </div>
            <p className="text-gray-300 text-xs mb-2 flex-grow">{upgrade.description}</p>
            <p className="text-xs text-gray-500 mt-auto italic capitalize">Tier: {upgrade.tier}</p>
            {upgrade.maxApplications && <p className="text-xs text-yellow-400 mt-1">Máx. aplicações: {upgrade.maxApplications}</p>}
          </div>
        ))}
      </div>
      <button onClick={onBack} className={`${commonButtonClass} bg-gray-600 hover:bg-gray-700 sticky bottom-4`}>
        Voltar
      </button>
    </div>
  );
};

export default SkillsInfoScreen;