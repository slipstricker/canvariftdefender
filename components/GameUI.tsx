
import React from 'react';
import { Player, Upgrade, GameState, LeaderboardEntry, AdminConfig, DisplayedSkillInfo, HatItem, StaffItem, LeveledSkill, CosmeticItem } from '../types';
import UpgradeSelectionScreen from './UpgradeSelectionScreen';
import SkillsInfoScreen from './SkillsInfoScreen';
import { SKILL_ID_DASH } from '../constants'; 

interface GameUIProps {
  gameState: GameState;
  player: Player; // This will be playerRef.current from App.tsx
  nickname: string;
  setNickname: (value: string) => void;
  nicknameError: string;
  setNicknameError: (value: string) => void;
  handleProceedToCharacterSelection: () => void;
  handleViewShop: () => void;
  handleViewShopFromPause: () => void; 
  handleViewAllSkills: () => void;
  handleViewLeaderboard: () => void;
  handleViewDebugPanel: () => void;
  getPermanentSkillLevel: (skillId: string) => number;
  playerCoins: number;
  ALL_HATS_SHOP: HatItem[];
  ALL_STAFFS_SHOP: StaffItem[];
  PERMANENT_SKILLS_SHOP: LeveledSkill[];
  isCosmeticPurchased: (itemId: string) => boolean;
  handlePurchaseCosmetic: (itemId: string, price: number) => void;
  handlePurchasePermanentSkill: (skillId: string, levelToBuy: number, price: number) => void;
  handleBackToPreviousState: () => void;
  handleExitToMainMenu: () => void;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  selectedHatIdForSelectionScreen: string | null;
  setSelectedHatIdForSelectionScreen: (id: string | null) => void;
  selectedStaffIdForSelectionScreen: string | null;
  setSelectedStaffIdForSelectionScreen: (id: string | null) => void;
  handleConfirmCharacterSelectionAndStart: () => void;
  handleOpenCosmeticModal: () => void;
  getSelectableCosmeticHats: () => HatItem[];
  getPurchasableStaffs: () => StaffItem[];
  handleConfirmCosmetics: () => void;
  adminConfig: AdminConfig;
  handleAdminConfigChange: (field: keyof AdminConfig, value: any) => void;
  InitialUpgrades: Upgrade[]; 
  UPGRADE_ICONS: Record<string, string>;
  handleAdminSkillChange: (skillId: string, count: number) => void;
  handleStartAdminGame: () => void;
  leaderboardEntries: LeaderboardEntry[];
  displayedSkills: DisplayedSkillInfo[];
  currentOfferedUpgradesForSelection: Upgrade[];
  currentPicksAllowedForSelection: number;
  availableUpgradesForSelection: Upgrade[];
  handleApplyUpgradeForSelection: (upgrade: Upgrade) => void;
  handleAllPicksMadeForSelection: () => void;
  handleRequestRerollForSelection: () => void;
  handleRequestPaidReroll: (cost: number) => void; // Added prop
  currentWaveForGameOver: number;
  gameTimeForGameOver: number;
  handleRestartGameFromGameOver: () => void;
  handleCoinBasedRevive: () => void; 
  reviveCoinCost: number; 
  handleViewActivePlayerSkills: () => void;
  handleSetGameState: (newState: GameState) => void; 
  reviveCountdown: number; // For RevivePending screen
  handleGameOver: () => void; // For "No" button on RevivePending
  isBossRewardMode: boolean; // New prop

  commonButtonClass: string;
  inputClass: string;
  adminInputClass: string;
  adminLabelClass: string;
  panelBaseClass: string;
  cosmeticItemButtonClass: string;
  cosmeticItemSelectedClass: string;
  cosmeticItemUnselectedClass: string;
  shopItemCardClass: string;
  leaderboardEntryCardClass: string;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  player,
  nickname,
  setNickname,
  nicknameError,
  setNicknameError,
  handleProceedToCharacterSelection,
  handleViewShop,
  handleViewShopFromPause,
  handleViewAllSkills,
  handleViewLeaderboard,
  handleViewDebugPanel,
  getPermanentSkillLevel,
  playerCoins,
  ALL_HATS_SHOP,
  ALL_STAFFS_SHOP,
  PERMANENT_SKILLS_SHOP,
  isCosmeticPurchased,
  handlePurchaseCosmetic,
  handlePurchasePermanentSkill,
  handleBackToPreviousState,
  handleExitToMainMenu,
  previewCanvasRef,
  selectedHatIdForSelectionScreen,
  setSelectedHatIdForSelectionScreen,
  selectedStaffIdForSelectionScreen,
  setSelectedStaffIdForSelectionScreen,
  handleConfirmCharacterSelectionAndStart,
  handleOpenCosmeticModal,
  getSelectableCosmeticHats,
  getPurchasableStaffs,
  handleConfirmCosmetics,
  adminConfig,
  handleAdminConfigChange,
  InitialUpgrades,
  UPGRADE_ICONS,
  handleAdminSkillChange,
  handleStartAdminGame,
  leaderboardEntries,
  displayedSkills,
  currentOfferedUpgradesForSelection,
  currentPicksAllowedForSelection,
  availableUpgradesForSelection,
  handleApplyUpgradeForSelection,
  handleAllPicksMadeForSelection,
  handleRequestRerollForSelection,
  handleRequestPaidReroll, // Destructured prop
  currentWaveForGameOver,
  gameTimeForGameOver,
  handleRestartGameFromGameOver,
  handleCoinBasedRevive,
  reviveCoinCost,
  handleViewActivePlayerSkills,
  handleSetGameState,
  reviveCountdown,
  handleGameOver,
  isBossRewardMode, 
  commonButtonClass,
  inputClass,
  adminInputClass,
  adminLabelClass,
  panelBaseClass,
  cosmeticItemButtonClass,
  cosmeticItemSelectedClass,
  cosmeticItemUnselectedClass,
  shopItemCardClass,
  leaderboardEntryCardClass,
}) => {
  return (
    <>
      {gameState === GameState.StartMenu && (
            <div className={`${panelBaseClass} justify-center text-center`} role="dialog" aria-labelledby="startMenuTitle">
                <h2 id="startMenuTitle" className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Pixel Rift Defenders</h2>
                <input
                    type="text"
                    placeholder="Insira seu Apelido Cósmico"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value); // Removed slice(0,15) to allow cheat codes
                        if (nicknameError) setNicknameError("");
                    }}
                    className={`${inputClass} mb-1 w-64 md:w-80 mx-auto`} 
                    aria-label="Apelido do Jogador"
                />
                {nicknameError && <p className="text-red-400 text-xs mb-3">{nicknameError}</p>}

                <button onClick={handleProceedToCharacterSelection} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Iniciar Jornada
                </button>
                <button onClick={handleViewShop} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Loja de Artefatos
                </button>
                <button onClick={handleViewAllSkills} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Ver Habilidades Cósmicas
                </button>
                <button onClick={handleViewLeaderboard} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Placar Estelar
                </button>
                 <button onClick={handleViewDebugPanel} className={`${commonButtonClass} mt-4 w-64 md:w-80`}>
                    Debug
                </button>
                <div className="mt-6 pt-1 text-center text-xs text-gray-400">
                  <p className="mb-1">Controles: A/D para mover, Espaço para pular, {player.hasDashSkill && getPermanentSkillLevel(SKILL_ID_DASH) > 0 ? "Shift para Dash, " : ""}Mouse para mirar e atirar. P para Pausar.</p>
                </div>
            </div>
        )}

        {gameState === GameState.Shop && (
            <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="shopTitle">
                <h2 id="shopTitle" className="text-2xl font-bold my-4 text-yellow-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Loja de Artefatos Cósmicos</h2>
                <p className="text-lg text-yellow-300 mb-4">Suas Moedas: <span className="font-bold">{playerCoins} 💰</span></p>

                <div className="w-full max-w-4xl">
                    <h3 className="text-xl font-semibold text-cyan-300 mb-2 text-center">Chapéus Galácticos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 p-2 bg-gray-900 border border-cyan-700 rounded-md shadow-[0_0_10px_theme(colors.cyan.700)]">
                        {ALL_HATS_SHOP.sort((a,b) => a.price - b.price).map(hat => ( 
                            <div key={hat.id} className={`${shopItemCardClass}`}>
                                <p className="font-semibold text-cyan-200 text-sm">{hat.name}</p>
                                <p className="text-gray-400 text-xxs my-1 flex-grow">{hat.effectDescription || hat.description}</p>
                                {isCosmeticPurchased(hat.id) ? (
                                    <p className="text-green-400 font-bold text-xs mt-2">Adquirido</p>
                                ) : (
                                    <button
                                        onClick={() => handlePurchaseCosmetic(hat.id, hat.price)}
                                        disabled={playerCoins < hat.price}
                                        className={`${commonButtonClass} text-xs mt-2 w-full ${playerCoins < hat.price ? 'opacity-50 cursor-not-allowed !border-gray-600 !bg-gray-700' : ''}`}
                                    >
                                        Comprar ({hat.price} 💰)
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <h3 className="text-xl font-semibold text-cyan-300 mb-2 text-center">Cajados Astrais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 p-2 bg-gray-900 border border-cyan-700 rounded-md shadow-[0_0_10px_theme(colors.cyan.700)]">
                        {ALL_STAFFS_SHOP.filter(item => item.effectDescription !== 'Dispara um projétil em linha reta.').sort((a,b) => a.price - b.price).map(staff => (
                             <div key={staff.id} className={`${shopItemCardClass}`}>
                                <p className="font-semibold text-cyan-200 text-sm">{staff.name}</p>
                                <p className="text-gray-400 text-xxs my-1 flex-grow">{staff.effectDescription || staff.description}</p>
                                 {isCosmeticPurchased(staff.id) ? (
                                    <p className="text-green-400 font-bold text-xs mt-2">Adquirido</p>
                                ) : (
                                    <button
                                        onClick={() => handlePurchaseCosmetic(staff.id, staff.price)}
                                        disabled={playerCoins < staff.price}
                                        className={`${commonButtonClass} text-xs mt-2 w-full ${playerCoins < staff.price ? 'opacity-50 cursor-not-allowed !border-gray-600 !bg-gray-700' : ''}`}
                                    >
                                        Comprar ({staff.price} 💰)
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <h3 className="text-xl font-semibold text-purple-400 mb-2 text-center">Habilidades Permanentes</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-2 bg-gray-900 border border-purple-700 rounded-md shadow-[0_0_10px_theme(colors.purple.700)]">
                        {PERMANENT_SKILLS_SHOP.map(skill => {
                            const currentLevel = getPermanentSkillLevel(skill.id);
                            const maxLevel = skill.levels.length;
                            const isMaxed = currentLevel >= maxLevel;
                            const nextLevelInfo = !isMaxed ? skill.levels[currentLevel] : null;
                            const currentLevelInfo = currentLevel > 0 ? skill.levels[currentLevel - 1] : null;

                            return (
                                <div key={skill.id} className={`${shopItemCardClass} border-purple-600`}>
                                    <div className="flex items-center mb-1">
                                        <span className="text-xl mr-2" role="img" aria-label={skill.name}>{skill.icon}</span>
                                        <p className="font-semibold text-purple-200 text-sm">
                                            {skill.name} 
                                            <span className="text-xs text-gray-400 ml-1">(ID: {skill.numericId})</span>
                                            {currentLevel > 0 ? ` (Nível ${currentLevel})` : ''}
                                        </p>
                                    </div>
                                    <p className="text-gray-400 text-xxs my-1 flex-grow">{skill.baseDescription}</p>
                                    {currentLevelInfo && <p className="text-xs text-yellow-300 mt-1">Atual: {currentLevelInfo.effectDescription}</p>}
                                    
                                    {isMaxed ? (
                                        <p className="text-green-400 font-bold text-xs mt-2">Nível Máximo Atingido!</p>
                                    ) : nextLevelInfo ? (
                                        <>
                                            <p className="text-xs text-cyan-300 mt-1">Próximo Nível ({nextLevelInfo.level}): {nextLevelInfo.effectDescription}</p>
                                            <button
                                                onClick={() => handlePurchasePermanentSkill(skill.id, nextLevelInfo.level, nextLevelInfo.price)}
                                                disabled={playerCoins < nextLevelInfo.price}
                                                className={`${commonButtonClass} text-xs mt-2 w-full ${playerCoins < nextLevelInfo.price ? 'opacity-50 cursor-not-allowed !border-gray-600 !bg-gray-700' : '!border-purple-500 hover:!border-purple-300 !bg-purple-800 hover:!bg-purple-700'}`}
                                            >
                                                Comprar Nível {nextLevelInfo.level} ({nextLevelInfo.price} 💰)
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button onClick={handleBackToPreviousState} className={`${commonButtonClass} mt-auto sticky bottom-4`}>
                    Voltar
                </button>
            </div>
        )}

        {gameState === GameState.CharacterSelection && (
            <div className={`${panelBaseClass} justify-center`} role="dialog" aria-labelledby="characterSelectionTitle">
                <h2 id="characterSelectionTitle" className="text-2xl font-bold my-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Confirme seu Avatar</h2>

                 <div className="my-2 p-1 border border-cyan-700 bg-gray-900 shadow-[0_0_15px_theme(colors.cyan.700)] flex items-center justify-center rounded-lg" style={{ width: '300px', height: '375px' }}>
                     <canvas ref={previewCanvasRef} width="300" height="375" aria-label="Pré-visualização do personagem" />
                </div>
                <p className="text-center text-sm mb-1 text-cyan-200">Chapéu: {ALL_HATS_SHOP.find(h=>h.id === selectedHatIdForSelectionScreen)?.name || "Nenhum"}</p>
                <p className="text-center text-sm mb-4 text-cyan-200">Cajado: {ALL_STAFFS_SHOP.find(s=>s.id === selectedStaffIdForSelectionScreen)?.name || "Nenhum"}</p>

                <div className="flex flex-col md:flex-row gap-3 sticky bottom-4">
                    <button onClick={handleConfirmCharacterSelectionAndStart} className={`${commonButtonClass}`}>
                        Confirmar e Iniciar
                    </button>
                    <button onClick={handleOpenCosmeticModal} className={`${commonButtonClass}`}>
                        Customizar Aparência
                    </button>
                     <button onClick={handleViewShop} className={`${commonButtonClass}`}>
                        Ir para Loja
                    </button>
                    <button onClick={handleExitToMainMenu} className={`${commonButtonClass}`}>
                        Voltar ao Menu Principal
                    </button>
                </div>
            </div>
        )}

        {gameState === GameState.CosmeticSelectionModal && (
             <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="cosmeticSelectionTitle">
                <h2 id="cosmeticSelectionTitle" className="text-2xl font-bold my-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Escolha seu Visual Cósmico</h2>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:gap-12 w-full max-w-5xl p-4">
                    <div>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-3 text-center">Chapéus Galácticos</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-900 border border-cyan-600 rounded-md shadow-[0_0_10px_theme(colors.cyan.600)]">
                            {getSelectableCosmeticHats().map(hat => (
                                <button
                                    key={hat.id}
                                    onClick={() => { setSelectedHatIdForSelectionScreen(hat.id); }}
                                    className={`${cosmeticItemButtonClass} ${selectedHatIdForSelectionScreen === hat.id ? cosmeticItemSelectedClass : cosmeticItemUnselectedClass}`}
                                    aria-pressed={selectedHatIdForSelectionScreen === hat.id}
                                >
                                    <p className="font-semibold text-cyan-200">{hat.name}</p>
                                    <p className="text-gray-400 text-xxs mt-1">{hat.effectDescription || hat.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                         <div className="my-2 p-1 border border-cyan-700 bg-gray-900 shadow-[0_0_15px_theme(colors.cyan.700)] flex items-center justify-center rounded-lg" style={{ width: '300px', height: '375px' }}>
                            <canvas ref={previewCanvasRef} width="300" height="375" aria-label="Pré-visualização do personagem com cosméticos" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-3 text-center">Cajados Astrais</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-900 border border-cyan-600 rounded-md shadow-[0_0_10px_theme(colors.cyan.600)]">
                            {getPurchasableStaffs().map(staff => (
                                <button
                                    key={staff.id}
                                    onClick={() => { setSelectedStaffIdForSelectionScreen(staff.id); }}
                                    className={`${cosmeticItemButtonClass} ${selectedStaffIdForSelectionScreen === staff.id ? cosmeticItemSelectedClass : cosmeticItemUnselectedClass}`}
                                    aria-pressed={selectedStaffIdForSelectionScreen === staff.id}
                                >
                                    <p className="font-semibold text-cyan-200">{staff.name}</p>
                                    <p className="text-gray-400 text-xxs mt-1">{staff.effectDescription || staff.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 mt-auto sticky bottom-4">
                    <button onClick={handleConfirmCosmetics} className={`${commonButtonClass}`}>
                        Confirmar Visual
                    </button>
                </div>
            </div>
        )}

        {gameState === GameState.DebugMenu && (
            <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="debugMenuTitle">
                <h2 id="debugMenuTitle" className="text-2xl font-bold my-4 text-yellow-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Menu de Debug</h2>
                 <input
                    type="text"
                    placeholder="Apelido Debug (ex: Nick,001-2,101-1)"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value);
                        if (nicknameError) setNicknameError("");
                    }}
                    className={`${inputClass} mb-1 w-64 md:w-80 mx-auto`}
                    aria-label="Apelido do Jogador Debug com Cheats"
                />
                {nicknameError && <p className="text-red-400 text-xs mb-3">{nicknameError}</p>}

                <div className="mb-3 flex items-center">
                    <input
                        type="checkbox"
                        id="enableDebugMode"
                        checked={adminConfig.isAdminEnabled}
                        onChange={(e) => handleAdminConfigChange('isAdminEnabled', e.target.checked)}
                        className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-500 focus:ring-yellow-600 ring-offset-gray-800 focus:ring-1 mr-2"
                    />
                    <label htmlFor="enableDebugMode" className="text-base text-yellow-300">Habilitar Modo Debug (aplica abaixo se marcado)</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                        <label htmlFor="debugStartWave" className={`${adminLabelClass} block text-center`}>Wave Inicial:</label>
                        <input type="number" id="debugStartWave" value={adminConfig.startWave} onChange={(e) => handleAdminConfigChange('startWave', parseInt(e.target.value, 10))} className={adminInputClass} aria-label="Wave Inicial Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugXpMultiplier" className={`${adminLabelClass} block text-center`}>Multiplicador XP:</label>
                        <input type="number" id="debugXpMultiplier" value={adminConfig.xpMultiplier} step="0.1" onChange={(e) => handleAdminConfigChange('xpMultiplier', parseFloat(e.target.value))} className={adminInputClass} aria-label="Multiplicador de XP Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugDamageMultiplier" className={`${adminLabelClass} block text-center`}>Multiplicador Dano:</label>
                        <input type="number" id="debugDamageMultiplier" value={adminConfig.damageMultiplier} step="0.1" onChange={(e) => handleAdminConfigChange('damageMultiplier', parseFloat(e.target.value))} className={adminInputClass} aria-label="Multiplicador de Dano Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugDefenseBoost" className={`${adminLabelClass} block text-center`}>Bônus Defesa (0-0.9):</label>
                        <input type="number" id="debugDefenseBoost" value={adminConfig.defenseBoost} step="0.05" min="0" max="0.9" onChange={(e) => handleAdminConfigChange('defenseBoost', parseFloat(e.target.value))} className={adminInputClass} aria-label="Bônus de Defesa Debug"/>
                    </div>
                </div>


                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Pré-aplicar Habilidades (Admin):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-4">
                    {InitialUpgrades.map(upgrade => (
                        <div key={upgrade.id} className="bg-gray-800 p-2 border border-gray-700 rounded-md flex flex-col items-center">
                            <div className="flex items-center mb-1">
                                <span className="text-xl mr-2" role="img" aria-label={upgrade.name}>{UPGRADE_ICONS[upgrade.id] || '✨'}</span>
                                <h4 className="text-xs font-semibold text-indigo-300">{upgrade.name} <span className="text-gray-400">(ID:{upgrade.numericId})</span></h4>
                            </div>
                            <input
                                type="number"
                                value={adminConfig.selectedSkills[upgrade.id] || 0}
                                onChange={(e) => handleAdminSkillChange(upgrade.id, parseInt(e.target.value, 10))}
                                min="0"
                                max={upgrade.maxApplications !== undefined ? upgrade.maxApplications : 99}
                                className={adminInputClass}
                                aria-label={`Quantidade para ${upgrade.name}`}
                            />
                             <p className="text-xs text-gray-400 mt-1">Máx: {upgrade.maxApplications !== undefined ? upgrade.maxApplications : "∞"}</p>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-3 mt-3 sticky bottom-4">
                    <button onClick={handleStartAdminGame} className={`${commonButtonClass}`}>
                        Iniciar Jogo Debug
                    </button>
                    <button onClick={handleExitToMainMenu} className={`${commonButtonClass}`}>
                        Voltar ao Menu Principal
                    </button>
                </div>
            </div>
        )}

        {gameState === GameState.Leaderboard && (
            <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="leaderboardTitle">
                <h2 id="leaderboardTitle" className="text-2xl font-bold my-4 text-green-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Placar Estelar</h2>
                {leaderboardEntries.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma pontuação cósmica ainda. Seja o primeiro!</p>
                ) : (
                    <div className="w-full max-w-lg">
                        {leaderboardEntries.map((entry, index) => (
                            <div key={index} className={leaderboardEntryCardClass} >
                                <span className="font-bold text-cyan-300 text-sm">{index + 1}.</span>
                                <span className="font-semibold text-purple-300 col-span-1 truncate">{entry.nickname}</span>
                                <span className="text-gray-300 text-right">W: {entry.wave}</span>
                                <span className="text-gray-300 text-right">T: {entry.time}s</span>
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={handleBackToPreviousState} className={`${commonButtonClass} mt-4 sticky bottom-4`}>
                    Voltar
                </button>
            </div>
        )}

        {gameState === GameState.SkillsInfo && (
           <SkillsInfoScreen
             upgrades={InitialUpgrades}
             upgradeIcons={UPGRADE_ICONS}
             onBack={handleBackToPreviousState}
             panelBaseClass={panelBaseClass}
             commonButtonClass={commonButtonClass}
           />
        )}

        {gameState === GameState.ActiveSkillsDisplay && (
          <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="activeSkillsTitle">
            <h2 id="activeSkillsTitle" className="text-2xl font-bold my-4 text-purple-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Minhas Habilidades Cósmicas</h2>
            {displayedSkills.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma habilidade adquirida ainda.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mb-4">
                    {displayedSkills.map(skill => {
                      const upgradeDetails = InitialUpgrades.find(u => u.id === skill.id);
                      return (
                        <div key={skill.id} className="bg-gray-800 p-3 border-2 border-gray-700 rounded-md flex flex-col shadow-[0_0_5px_theme(colors.gray.700)]">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-2" role="img" aria-label={skill.name}>{skill.icon}</span>
                                <h3 className="text-sm font-bold text-purple-300">
                                  {skill.name}
                                  {upgradeDetails && <span className="text-xs text-gray-400 ml-1">(ID: {upgradeDetails.numericId})</span>}
                                </h3>
                                {skill.count > 1 && <span className="ml-2 text-xs font-semibold text-yellow-300">(x{skill.count})</span>}
                            </div>
                            <p className="text-gray-300 text-xs mb-2 flex-grow">{skill.description}</p>
                        </div>
                      );
                    })}
                </div>
            )}
            <button onClick={handleBackToPreviousState} className={`${commonButtonClass} mt-4 sticky bottom-4`}>
                Voltar ao Menu de Pausa
            </button>
          </div>
        )}

        {gameState === GameState.ChoosingUpgrade && (
            <UpgradeSelectionScreen
                player={player}
                choicesOffered={currentOfferedUpgradesForSelection}
                picksAllowed={currentPicksAllowedForSelection}
                availableUpgradePool={availableUpgradesForSelection}
                initialUpgradePool={InitialUpgrades}
                upgradeIcons={UPGRADE_ICONS}
                onUpgradeSelected={handleApplyUpgradeForSelection}
                onAllPicksMade={handleAllPicksMadeForSelection}
                onRequestReroll={handleRequestRerollForSelection}
                onRequestPaidReroll={handleRequestPaidReroll} // Added prop
                panelBaseClass={panelBaseClass}
                commonButtonClass={commonButtonClass}
                isBossRewardMode={isBossRewardMode} 
            />
        )}
        
        {gameState === GameState.RevivePending && (
            <div className={`${panelBaseClass} justify-center text-center p-4`} role="alertdialog" aria-labelledby="revivePendingTitle">
                <div className="bg-gray-800 border-2 border-red-500 p-5 md:p-6 rounded-lg shadow-[0_0_15px_theme(colors.red.600)] w-full max-w-lg md:max-w-xl">
                    <h2 id="revivePendingTitle" className="text-3xl md:text-4xl font-bold mb-3 text-red-400">Você foi Aniquilado!</h2>
                    <p className="text-lg text-cyan-200 mb-4">Deseja usar Essência Cósmica para Reviver?</p>
                    
                    <p className="text-xl font-bold mb-5 text-yellow-300">
                        Tempo Restante: {reviveCountdown.toFixed(1)}s
                    </p>

                    <div className="flex flex-col md:flex-row justify-around gap-3 w-full">
                        <button 
                            onClick={handleCoinBasedRevive} 
                            className={`${commonButtonClass} flex-1 ${playerCoins < reviveCoinCost ? 'opacity-50 cursor-not-allowed !border-gray-600 !bg-gray-700 !shadow-none' : '!border-green-500 hover:!border-green-300 !bg-green-700 hover:!bg-green-600'}`}
                            disabled={playerCoins < reviveCoinCost}
                        >
                            Sim, Reviver ({reviveCoinCost} 💰)
                        </button>
                        <button 
                            onClick={handleGameOver} 
                            className={`${commonButtonClass} flex-1 !border-purple-500 hover:!border-purple-300 !bg-purple-800 hover:!bg-purple-700`}
                        >
                            Não, Aceitar o Vazio
                        </button>
                    </div>
                </div>
            </div>
        )}

        {gameState === GameState.GameOver && (
            <div className={`${panelBaseClass} justify-center text-center p-4`} role="alertdialog" aria-labelledby="gameOverTitle">
                <div className="bg-gray-800 border-2 border-cyan-500 p-5 md:p-6 rounded-lg shadow-[0_0_15px_theme(colors.cyan.600)] w-full max-w-lg md:max-w-xl">
                    <h2 id="gameOverTitle" className="text-3xl md:text-4xl font-bold mb-5 text-red-500">FIM DE JOGO</h2>
                    
                    <div className="bg-gray-700 border border-cyan-600 p-4 rounded-md mb-6 text-left text-sm shadow-[0_0_8px_theme(colors.cyan.700)]">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-300">Combatente:</span>
                            <span className="text-yellow-300 font-semibold">{player.nickname}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-300">Wave Alcançada:</span>
                            <span className="text-yellow-300 font-semibold">{currentWaveForGameOver}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-300">Tempo de Sobrevivência:</span>
                            <span className="text-yellow-300 font-semibold">{Math.floor(gameTimeForGameOver)}s</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Moedas Coletadas na Partida:</span>
                            <span className="text-yellow-300 font-semibold">{playerCoins - player.coins} 💰</span> 
                        </div>
                         {player.selectedHatId === 'hat_fedora' &&  // Assumed hat_fedora means no score, was hat_crown
                            <p className="text-xs text-yellow-400 mt-3 text-center">(Pontuação não registrada devido ao Chapéu Fedora)</p>
                         }
                    </div>

                    <div className="flex flex-col md:flex-row justify-around gap-3 w-full">
                        <button onClick={handleRestartGameFromGameOver} className={`${commonButtonClass} flex-1`}>
                            Reiniciar
                        </button>
                        <button onClick={handleViewLeaderboard} className={`${commonButtonClass} flex-1`}>
                            Placar
                        </button>
                        <button onClick={handleExitToMainMenu} className={`${commonButtonClass} flex-1`}>
                            Menu Principal
                        </button>
                    </div>
                </div>
            </div>
        )}

        {gameState === GameState.Paused && (
            <div className={`${panelBaseClass} justify-center text-center`} role="dialog" aria-labelledby="pausedTitle">
                <h2 id="pausedTitle" className="text-3xl font-bold mb-6 text-blue-300">Pausa Cósmica</h2>
                <button onClick={() => { handleSetGameState(GameState.Playing); }} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Continuar
                </button>
                 <button onClick={handleViewActivePlayerSkills} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Minhas Habilidades
                </button>
                <button onClick={handleViewShopFromPause} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Loja de Artefatos
                </button>
                <button onClick={handleExitToMainMenu} className={`${commonButtonClass} w-64 md:w-80`}>
                    Sair para Menu Principal
                </button>
            </div>
        )}
    </>
  );
};

export default GameUI;
