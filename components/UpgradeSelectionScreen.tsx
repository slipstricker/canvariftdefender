
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Upgrade } from '../types';
import UpgradeCard from './UpgradeCard';

interface UpgradeSelectionScreenProps {
  player: Player;
  choicesOffered: Upgrade[];
  picksAllowed: number;
  availableUpgradePool: Upgrade[];
  initialUpgradePool: Upgrade[];
  upgradeIcons: Record<string, string>;
  onUpgradeSelected: (upgrade: Upgrade) => void;
  onAllPicksMade: () => void;
  onRequestReroll: () => void;
  panelBaseClass: string;
  commonButtonClass: string;
  isBossRewardMode?: boolean; 
}

const MAX_TOTAL_SPIN_DURATION_MS = 6000;
const FAST_SPIN_INTERVAL_SPEED_MS = 70; 

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
  panelBaseClass,
  commonButtonClass,
  isBossRewardMode,
}) => {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationDisplayUpgrades, setAnimationDisplayUpgrades] = useState<Upgrade[]>([]);
  const [reelLockStates, setReelLockStates] = useState<boolean[]>([]);
  const [localPicksRemaining, setLocalPicksRemaining] = useState<number>(picksAllowed);
  const [selectedUpgradeIdsThisTurn, setSelectedUpgradeIdsThisTurn] = useState<string[]>([]);

  const animationTimerRefs = useRef<number[]>([]);
  const masterSpinIntervalRef = useRef<number | null>(null);
  const overallAnimationTimeoutRef = useRef<number | null>(null);

  const reelLockStatesRef = useRef(reelLockStates);
  useEffect(() => { reelLockStatesRef.current = reelLockStates; }, [reelLockStates]);
  
  const localPicksRemainingRef = useRef(localPicksRemaining);
  useEffect(() => { localPicksRemainingRef.current = localPicksRemaining; }, [localPicksRemaining]);


  const getRandomUpgradeForSpin = useCallback((currentPlayer: Player) => {
    const filterMaxedOut = (upgrade: Upgrade) => {
      if (upgrade.maxApplications === undefined) {
        return true; 
      }
      const currentApplications = currentPlayer.upgrades.filter(uid => uid === upgrade.id).length;
      return currentApplications < upgrade.maxApplications;
    };

    let pool = availableUpgradePool.length > 0 ? availableUpgradePool : initialUpgradePool;
    pool = pool.filter(filterMaxedOut);
    
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const nonMaxedChoices = choicesOffered.filter(filterMaxedOut);
    if (nonMaxedChoices.length > 0) {
        return nonMaxedChoices[Math.floor(Math.random() * nonMaxedChoices.length)];
    }

    return choicesOffered.length > 0 ? choicesOffered[0] : ({ id: 'dummy', numericId: '000', name: 'Carregando...', description: 'Analisando o cosmos...', tier: 'comum', apply: () => {} } as Upgrade);
  }, [availableUpgradePool, initialUpgradePool, choicesOffered]);

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
            if (localPicksRemainingRef.current <= 0 && choicesOffered.length > 0) { 
            }
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
  }, [choicesOffered, picksAllowed, getRandomUpgradeForSpin, clearAnimationTimers, player]); 

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
              player={player} // Pass player to UpgradeCard
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

      {!isAnimating && !isBossRewardMode && choicesOffered.length > 0 && localPicksRemaining > 0 && player.selectedHatId === 'hat_fedora' && player.canFreeRerollUpgrades && !player.usedFreeRerollThisLevelUp && (
        <button 
          onClick={() => {
            clearAnimationTimers(); 
            onRequestReroll();
          }} 
          className={`${commonButtonClass} mt-4`}
        >
          Rerrolar Destino (Grátis)
        </button>
      )}
      {!isAnimating && choicesOffered.length === 0 && localPicksRemaining <= 0 && ( 
         <button onClick={onAllPicksMade} className={`${commonButtonClass} mt-6`}>
            Prosseguir na Jornada
        </button>
      )}
    </div>
  );
};

export default UpgradeSelectionScreen;
