
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
}

const MAX_TOTAL_SPIN_DURATION_MS = 6000;
const FAST_SPIN_INTERVAL_SPEED_MS = 70; // How fast the options cycle visually

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
}) => {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationDisplayUpgrades, setAnimationDisplayUpgrades] = useState<Upgrade[]>([]);
  const [reelLockStates, setReelLockStates] = useState<boolean[]>([]);
  const [localPicksRemaining, setLocalPicksRemaining] = useState<number>(picksAllowed);
  const [selectedUpgradeIdsThisTurn, setSelectedUpgradeIdsThisTurn] = useState<string[]>([]);

  const animationTimerRefs = useRef<number[]>([]);
  const masterSpinIntervalRef = useRef<number | null>(null);
  const overallAnimationTimeoutRef = useRef<number | null>(null);

  // Refs for state values to be used in intervals/timeouts
  const reelLockStatesRef = useRef(reelLockStates);
  useEffect(() => { reelLockStatesRef.current = reelLockStates; }, [reelLockStates]);
  
  const localPicksRemainingRef = useRef(localPicksRemaining);
  useEffect(() => { localPicksRemainingRef.current = localPicksRemaining; }, [localPicksRemaining]);


  const getRandomUpgradeForSpin = useCallback(() => {
    const pool = availableUpgradePool.length > 0 ? availableUpgradePool : initialUpgradePool;
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Fallback if all pools are empty
    return choicesOffered.length > 0 ? choicesOffered[0] : ({ id: 'dummy', name: 'Carregando...', description: '...', tier: 'comum', apply: () => {} } as Upgrade);
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
      
      const initialRandomDisplays = choicesOffered.map(() => getRandomUpgradeForSpin());
      setAnimationDisplayUpgrades(initialRandomDisplays);

      // Master interval to visually spin all non-locked cards
      masterSpinIntervalRef.current = setInterval(() => {
        setAnimationDisplayUpgrades(prevDisplays =>
          prevDisplays.map((currentDisplay, displayIdx) => {
            if (reelLockStatesRef.current[displayIdx]) {
              return choicesOffered[displayIdx]; // Keep locked card
            }
            return getRandomUpgradeForSpin(); // Spin non-locked cards
          })
        );
      }, FAST_SPIN_INTERVAL_SPEED_MS);

      // Schedule sequential stops for each reel
      const timePerReelSlotMs = MAX_TOTAL_SPIN_DURATION_MS / numReels;

      for (let i = 0; i < numReels; i++) {
        const stopTimeForThisReel = (i + 1) * timePerReelSlotMs;
        const timerId = setTimeout(() => {
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

          if (i === numReels - 1) { // Last reel has stopped
            if (masterSpinIntervalRef.current) {
              clearInterval(masterSpinIntervalRef.current);
              masterSpinIntervalRef.current = null;
            }
            setIsAnimating(false);
            if (localPicksRemainingRef.current <= 0 && choicesOffered.length > 0) { // Check if picks were somehow made or if it was 0
                 // onAllPicksMade might be called too early if picksAllowed was already 0
                 // This ensures it's called after animation if needed.
            }
          }
        }, stopTimeForThisReel);
        animationTimerRefs.current.push(timerId);
      }

      // Overall safeguard timeout
      const safeguardTime = MAX_TOTAL_SPIN_DURATION_MS + 500; // A little buffer
      overallAnimationTimeoutRef.current = setTimeout(() => {
        if (isAnimatingRef.current) { // Check ref to see if animation is still supposed to be running
          console.warn("Upgrade animation safeguard triggered.");
          clearAnimationTimers();
          setIsAnimating(false);
          setAnimationDisplayUpgrades(choicesOffered);
          setReelLockStates(new Array(numReels).fill(true));
        }
      }, safeguardTime);

    } else { // No choices offered
      clearAnimationTimers();
      setIsAnimating(false);
      setAnimationDisplayUpgrades([]);
      setReelLockStates([]);
      if (picksAllowed <= 0) { // If no picks were allowed from the start
        onAllPicksMade();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choicesOffered, picksAllowed, getRandomUpgradeForSpin, clearAnimationTimers]);
  // Note: onAllPicksMade is intentionally not in deps to avoid re-triggering animation if it changes

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

  let titleText = "Sorteando Melhorias...";
  if (!isAnimating) {
    if (choicesOffered.length === 0) {
      titleText = "Nenhuma melhoria cósmica disponível.";
    } else if (localPicksRemaining > 1) {
      titleText = `Escolha ${localPicksRemaining} Melhorias Cósmicas:`;
    } else if (localPicksRemaining === 1){
      titleText = "Aprimoramento Detectado! Escolha Melhoria:";
    } else { // localPicksRemaining <= 0 but choices were offered
      titleText = "Melhorias Selecionadas!";
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
              key={upgrade.id + (isAnimating ? `-anim-${index}-${Date.now()}` : `-${index}`)} // Ensure key changes during animation for re-render if needed
              upgrade={upgrade}
              upgradeIcons={upgradeIcons}
              onSelect={() => handleCardSelect(upgrade)}
              isOverallAnimationActive={isAnimating}
              isThisCardSpinning={isAnimating && !reelLockStates[index]}
            />
          ))}
        </div>
      ) : (
        !isAnimating && <p className="text-gray-400 text-sm">Aguardando...</p>
      )}

      {!isAnimating && choicesOffered.length > 0 && localPicksRemaining > 0 && player.selectedHatId === 'hat_fedora' && player.canFreeRerollUpgrades && !player.usedFreeRerollThisLevelUp && (
        <button 
          onClick={() => {
            clearAnimationTimers(); // Stop any pending animations before rerolling
            onRequestReroll();
          }} 
          className={`${commonButtonClass} mt-4`}
        >
          Rerrolar (Grátis)
        </button>
      )}
      {!isAnimating && choicesOffered.length === 0 && localPicksRemaining <= 0 && ( // Case when no choices but also no picks left (e.g. after reroll into no options)
         <button onClick={onAllPicksMade} className={`${commonButtonClass} mt-6`}>
            Continuar
        </button>
      )}
    </div>
  );
};

export default UpgradeSelectionScreen;
