
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Upgrade } from '../types';
import UpgradeCard from './UpgradeCard';
import { INITIAL_PAID_REROLL_COST } from '../constants';

interface UpgradeSelectionScreenProps {
  player: Player;
  choicesOffered: Upgrade[];
  picksAllowed: number;
  availableUpgradePool: Upgrade[];
  initialUpgradePool: Upgrade[];
  upgradeIcons: Record<string, string>;
  onUpgradeSelected: (upgrade: Upgrade) => void;
  onAllPicksMade: () => void;
  onRequestReroll: () => void; // Free reroll
  onRequestPaidReroll: (cost: number) => void; // Paid reroll
  panelBaseClass: string;
  commonButtonClass: string;
  isBossRewardMode?: boolean;
}

const MAX_TOTAL_SPIN_DURATION_MS = 6000;
const FAST_SPIN_INTERVAL_SPEED_MS = 70;

const RARITY_WEIGHTS = { comum: 65, incomum: 25, raro: 10 }; // Sums to 100

// Helper function to select an upgrade based on rarity weights
function selectWeightedUpgrade(
    pool: Upgrade[], 
    weights: typeof RARITY_WEIGHTS,
    player: Player, 
    filterMaxedOut: (upgrade: Upgrade, currentPlayer: Player) => boolean,
    alreadySelectedIdsThisTurn?: string[] 
): Upgrade | null {
    const getCandidates = (rarity: 'comum' | 'incomum' | 'raro') => {
        let candidates = pool.filter(u => u.tier === rarity && filterMaxedOut(u, player));
        if (alreadySelectedIdsThisTurn) {
            candidates = candidates.filter(u => !alreadySelectedIdsThisTurn.includes(u.id));
        }
        return candidates;
    };

    const rand = Math.random() * 100;
    let chosenRarityInitial: 'comum' | 'incomum' | 'raro';

    if (rand < weights.comum) {
        chosenRarityInitial = 'comum';
    } else if (rand < weights.comum + weights.incomum) {
        chosenRarityInitial = 'incomum';
    } else {
        chosenRarityInitial = 'raro';
    }

    const rarityOrder: ('comum' | 'incomum' | 'raro')[] = ['comum', 'incomum', 'raro'];
    
    let candidates = getCandidates(chosenRarityInitial);
    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const fallbackOrder = rarityOrder.filter(r => r !== chosenRarityInitial);
    for (const rarity of fallbackOrder) {
        candidates = getCandidates(rarity);
        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
    }
    
    let allRemainingCandidates = pool.filter(u => filterMaxedOut(u, player));
    if (alreadySelectedIdsThisTurn) {
        allRemainingCandidates = allRemainingCandidates.filter(u => !alreadySelectedIdsThisTurn.includes(u.id));
    }
    if (allRemainingCandidates.length > 0) {
        return allRemainingCandidates[Math.floor(Math.random() * allRemainingCandidates.length)];
    }

    return null; 
}


const UpgradeSelectionScreen: React.FC<UpgradeSelectionScreenProps> = ({
  player,
  choicesOffered,
  picksAllowed,
  availableUpgradePool,
  initialUpgradePool,
  upgradeIcons,
  onUpgradeSelected,
  onAllPicksMade,
  onRequestReroll,
  onRequestPaidReroll,
  panelBaseClass,
  commonButtonClass,
  isBossRewardMode,
}) => {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationDisplayUpgrades, setAnimationDisplayUpgrades] = useState<Upgrade[]>([]);
  const [reelLockStates, setReelLockStates] = useState<boolean[]>([]);
  const [localPicksRemaining, setLocalPicksRemaining] = useState<number>(picksAllowed);
  const [selectedUpgradeIdsThisTurn, setSelectedUpgradeIdsThisTurn] = useState<string[]>([]);
  const [currentPaidRerollCost, setCurrentPaidRerollCost] = useState<number>(INITIAL_PAID_REROLL_COST);

  const animationTimerRefs = useRef<number[]>([]);
  const masterSpinIntervalRef = useRef<number | null>(null);
  const overallAnimationTimeoutRef = useRef<number | null>(null);

  const reelLockStatesRef = useRef(reelLockStates);
  useEffect(() => { reelLockStatesRef.current = reelLockStates; }, [reelLockStates]);
  
  const localPicksRemainingRef = useRef(localPicksRemaining);
  useEffect(() => { localPicksRemainingRef.current = localPicksRemaining; }, [localPicksRemaining]);


  const filterUpgradeMaxedOut = useCallback((upgrade: Upgrade, currentPlayer: Player) => {
    if (upgrade.maxApplications === undefined) {
      return true; 
    }
    const currentApplications = currentPlayer.upgrades.filter(uid => uid === upgrade.id).length;
    return currentApplications < upgrade.maxApplications;
  }, []);

  const getRandomUpgradeForSpin = useCallback((currentPlayer: Player) => {
    let pool = availableUpgradePool.length > 0 ? availableUpgradePool : initialUpgradePool;
    
    const weightedSelection = selectWeightedUpgrade(pool, RARITY_WEIGHTS, currentPlayer, filterUpgradeMaxedOut);
    if (weightedSelection) {
        return weightedSelection;
    }

    const nonMaxedChoices = choicesOffered.filter(u => filterUpgradeMaxedOut(u, currentPlayer));
    if (nonMaxedChoices.length > 0) {
        return nonMaxedChoices[Math.floor(Math.random() * nonMaxedChoices.length)];
    }
    
    if (choicesOffered.length > 0) return choicesOffered[0];
    return ({ id: 'dummy', numericId: '000', name: 'Carregando...', description: 'Analisando o cosmos...', tier: 'comum', apply: () => {} } as Upgrade);
  }, [availableUpgradePool, initialUpgradePool, choicesOffered, filterUpgradeMaxedOut]);

  const clearAnimationTimers = useCallback(() => {
    animationTimerRefs.current.forEach(clearTimeout);
    animationTimerRefs.current = [];
    if (masterSpinIntervalRef.current) {
      clearInterval(masterSpinIntervalRef.current);
      masterSpinIntervalRef.current = null;
    }
    if (overallAnimationTimeoutRef.current) {
      clearTimeout(overallAnimationTimeoutRef.current);
      overallAnimationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setLocalPicksRemaining(picksAllowed);
    setSelectedUpgradeIdsThisTurn([]);
    setCurrentPaidRerollCost(INITIAL_PAID_REROLL_COST); // Reset paid reroll cost on new choices

    if (choicesOffered.length > 0) {
      clearAnimationTimers();
      setIsAnimating(true);
      
      const numReels = choicesOffered.length;
      setReelLockStates(new Array(numReels).fill(false));
      
      const initialRandomDisplays = choicesOffered.map(() => getRandomUpgradeForSpin(player));
      setAnimationDisplayUpgrades(initialRandomDisplays);

      masterSpinIntervalRef.current = setInterval(() => {
        setAnimationDisplayUpgrades(prevDisplays =>
          prevDisplays.map((currentDisplay, displayIdx) => {
            if (reelLockStatesRef.current[displayIdx]) {
              return choicesOffered[displayIdx]; 
            }
            return getRandomUpgradeForSpin(player); 
          })
        );
      }, FAST_SPIN_INTERVAL_SPEED_MS) as unknown as number;

      const timePerReelSlotMs = MAX_TOTAL_SPIN_DURATION_MS / numReels;

      for (let i = 0; i < numReels; i++) {
        const stopTimeForThisReel = (i + 1) * timePerReelSlotMs;
        const timerId = window.setTimeout(() => {
          setAnimationDisplayUpgrades(prev => {
            const newDisplays = [...prev];
            newDisplays[i] = choicesOffered[i];
            return newDisplays;
          });
          setReelLockStates(prev => {
            const newLocks = [...prev];
            newLocks[i] = true;
            return newLocks;
          });

          if (i === numReels - 1) { 
            if (masterSpinIntervalRef.current) {
              clearInterval(masterSpinIntervalRef.current);
              masterSpinIntervalRef.current = null;
            }
            setIsAnimating(false);
          }
        }, stopTimeForThisReel) as unknown as number; 
        animationTimerRefs.current.push(timerId);
      }

      const safeguardTime = MAX_TOTAL_SPIN_DURATION_MS + 500; 
      overallAnimationTimeoutRef.current = window.setTimeout(() => {
        if (isAnimatingRef.current) { 
          console.warn("Upgrade animation safeguard triggered.");
          clearAnimationTimers();
          setIsAnimating(false);
          setAnimationDisplayUpgrades(choicesOffered);
          setReelLockStates(new Array(numReels).fill(true));
        }
      }, safeguardTime) as unknown as number;

    } else { 
      clearAnimationTimers();
      setIsAnimating(false);
      setAnimationDisplayUpgrades([]);
      setReelLockStates([]);
      if (picksAllowed <= 0) { 
        onAllPicksMade();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choicesOffered, picksAllowed, player]); // Removed getRandomUpgradeForSpin, clearAnimationTimers as direct deps to avoid re-triggering from their recreation. They depend on player.

  const isAnimatingRef = useRef(isAnimating);
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const handleCardSelect = (upgrade: Upgrade) => {
    if (isAnimating || selectedUpgradeIdsThisTurn.includes(upgrade.id)) return;

    onUpgradeSelected(upgrade);
    setSelectedUpgradeIdsThisTurn(prev => [...prev, upgrade.id]);
    const newPicksRemaining = localPicksRemaining - 1;
    setLocalPicksRemaining(newPicksRemaining);

    if (newPicksRemaining <= 0) {
      onAllPicksMade();
    }
  };

  const handlePaidRerollClick = () => {
    if (player.coins >= currentPaidRerollCost && !isAnimating && !isBossRewardMode) {
      clearAnimationTimers();
      onRequestPaidReroll(currentPaidRerollCost);
      setCurrentPaidRerollCost(prev => prev * 2);
    }
  };

  const currentChoicesToRender = isAnimating ? animationDisplayUpgrades : choicesOffered;

  let titleText = "Alinhando Constelações de Poder...";
  if (isBossRewardMode) {
    titleText = "Recompensa Astral do Guardião! Fortaleça uma Habilidade Dominada:";
  } else if (!isAnimating) {
    if (choicesOffered.length === 0) {
      titleText = "O Oráculo Cósmico Silencia... Nenhuma melhoria neste momento.";
    } else if (localPicksRemaining > 1) {
      titleText = `O Cosmos Oferece ${localPicksRemaining} Dádivas! Escolha sabiamente:`;
    } else if (localPicksRemaining === 1){
      titleText = "Bênção Estelar Concedida! Selecione seu Aprimoramento:";
    } else { 
      titleText = "Poderes Cósmicos Adquiridos!";
    }
  }


  return (
    <div className={`${panelBaseClass} justify-center text-center`} role="dialog" aria-labelledby="upgradeSelectionTitle">
      <h2 id="upgradeSelectionTitle" className="text-xl md:text-2xl font-bold mb-3 text-yellow-300">
        {titleText}
      </h2>
      {currentChoicesToRender.length > 0 ? (
        <div className="flex flex-wrap justify-center items-start">
          {currentChoicesToRender.map((upgrade, index) => (
            <UpgradeCard
              key={upgrade.id + (isAnimating ? `-anim-${index}-${Date.now()}` : `-${index}`)} 
              upgrade={upgrade}
              player={player}
              upgradeIcons={upgradeIcons}
              onSelect={() => handleCardSelect(upgrade)}
              isOverallAnimationActive={isAnimating}
              isThisCardSpinning={isAnimating && !reelLockStates[index]}
            />
          ))}
        </div>
      ) : (
        !isAnimating && <p className="text-gray-400 text-sm">Aguardando o cosmos se manifestar...</p>
      )}

      <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
        {!isAnimating && !isBossRewardMode && choicesOffered.length > 0 && localPicksRemaining > 0 && player.selectedHatId === 'hat_fedora' && player.canFreeRerollUpgrades && !player.usedFreeRerollThisLevelUp && (
          <button 
            onClick={() => {
              clearAnimationTimers(); 
              onRequestReroll();
            }} 
            className={`${commonButtonClass}`}
            aria-label="Rerrolar destino gratuitamente com o Chapéu Fedora"
          >
            Rerrolar Destino (Grátis)
          </button>
        )}

        {!isAnimating && !isBossRewardMode && choicesOffered.length > 0 && localPicksRemaining > 0 && (
          <button
            onClick={handlePaidRerollClick}
            disabled={player.coins < currentPaidRerollCost}
            className={`${commonButtonClass} ${player.coins < currentPaidRerollCost ? 'opacity-50 cursor-not-allowed !border-gray-600 !bg-gray-700' : '!border-yellow-500 hover:!border-yellow-300 !bg-yellow-700 hover:!bg-yellow-600'}`}
            aria-label={`Rerrolar destino por ${currentPaidRerollCost} moedas`}
          >
            Rerrolar (Custo: {currentPaidRerollCost} 💰)
          </button>
        )}
      </div>

      {!isAnimating && choicesOffered.length === 0 && localPicksRemaining <= 0 && ( 
         <button onClick={onAllPicksMade} className={`${commonButtonClass} mt-6`}>
            Prosseguir na Jornada
        </button>
      )}
    </div>
  );
};

export default UpgradeSelectionScreen;