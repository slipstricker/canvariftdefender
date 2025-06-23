
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Player, Enemy, Projectile, Particle, Platform, Upgrade, GameState, Keys, MouseState, ActiveLightningBolt, LeaderboardEntry, AdminConfig,
    DisplayedSkillInfo, FloatingText, CosmeticUnlocksData, HatItem, StaffItem, Star, Nebula, CoinDrop, WaveStatus, CenterScreenMessage, ParticleType, ScreenShakeState, BorderFlashState, BOSS_FURY_MODE_HP_THRESHOLD, ProjectileEffectType
} from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_INITIAL_HP,
  XP_PER_LEVEL_BASE, XP_LEVEL_MULTIPLIER,
  INITIAL_WAVE_CONFIG, PLAYER_INTERMISSION_HEAL_PERCENT,
  ADMIN_START_WAVE,
  SPRITE_PIXEL_SIZE,
  COSMETIC_DATA_KEY,
  SKILL_ID_DASH,
  PIXEL_FONT_FAMILY,
  WAVE_ANNOUNCEMENT_DURATION,
  BOSS_MINION_RESPAWN_WARNING_DURATION,
  PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT,
  FRAGMENTATION_PROJECTILE_DAMAGE_FACTOR
} from './constants';
import { ALL_HATS_SHOP, ALL_STAFFS_SHOP, PERMANENT_SKILLS_SHOP, DEFAULT_HAT_ID, DEFAULT_STAFF_ID, applyHatEffect, applyStaffEffectToPlayerBase } from './gameLogic/shopLogic';
import { repositionAndResizeAllDynamicPlatforms } from './gameLogic/platformLogic';
import { UPGRADES as InitialUpgradesConfig } from './gameLogic/upgradeLogic';
import { updatePlayerState, PlayerUpdateResult } from './gameLogic/playerLogic';
import { updateProjectiles } 
from './gameLogic/projectileLogic';
import { createEnemyOrBoss, createMiniSplitterEnemy } from './gameLogic/enemyLogic';
import { runEnemyUpdateCycle, updateParticleSystem } from './gameLogic/entityCycle';
import { checkCollisions } from './gameLogic/collisionLogic';
import { updateWaveSystem } from './gameLogic/waveManager';
import { initializeNewGameState, getDefaultPlayerState, applyPermanentSkillEffectsToPlayer } from './gameLogic/gameSetup'; 
import { parseCheatNickname } from './gameLogic/cheatLogic'; 
import { createParticleEffect, triggerThunderboltStrikes, applyBurnEffect, applyChillEffect, handleExplosion } from './gameLogic/gameEffects';
import { drawBackground } from './gameLogic/rendering/backgroundRenderer';
import { drawPlatforms } from './gameLogic/rendering/platformRenderer';
import { drawPlayerAndAccessories, drawEnemies, drawProjectiles as drawProjectilesRenderer, drawParticles as drawParticlesRenderer, drawCoinDrops, drawActiveLightningBolts, drawFloatingTexts as drawFloatingTextsRenderer, drawMiniatures } from './gameLogic/rendering/entityRenderer';
import { drawHUD, drawCenterScreenMessages, drawMouseCursor, drawSkillTooltip } from './gameLogic/rendering/hudRenderer';
import GameUI from './components/GameUI';
import { fetchLeaderboard, submitScore } from './onlineLeaderboardService';
import { playSound as playSoundFromManager, pauseMusic, playMusic, stopMusic, toggleGlobalMute, getGlobalMuteStatus, setGlobalVolume, getGlobalVolume, loadSfx, loadMusic } from './gameLogic/audioManager';


export const UPGRADE_ICONS: Record<string, string> = {
  catalyst: "🔥", growth: "❤️", resonance: "⚡", swift: "👟", renew: "✚", leech: "🩸",
  fragmentation: "💥", thunderbolt: "🌩️", appraisal: "📜", immortal: "😇", eyesight: "👁️",
  scorchedRounds: "♨️", cryoRounds: "❄️", piercingRounds: "🎯", seekerRounds: "🛰️", energyShield: "🛡️",
  damagingAura: "💢", mirroredMinion: "👥", 
  preciseStrike: "🗡️", kineticBoost: "💨", starlightRestoration: "✨",
};

const COIN_DROP_SIZE = 16 * SPRITE_PIXEL_SIZE;
const BASE_REVIVE_COIN_COST = 30;
const REVIVE_COST_INCREMENT = 10;
const REVIVE_PENDING_DURATION_S = 10; 

const REVIVE_EXPLOSION_RADIUS = 350 * SPRITE_PIXEL_SIZE;
const REVIVE_EXPLOSION_BOSS_DAMAGE_FACTOR = 0.75; 

const SLOW_MOTION_FACTOR = 0.2; 
const SLOW_MOTION_DURATION_MS = 2000; 


const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.StartMenu);
  const previousGameStateRef = useRef<GameState>(GameState.StartMenu);

  const [nickname, setNickname] = useState<string>(""); 
  const [nicknameError, setNicknameError] = useState<string>("");
  
  const [isSlowMotionActive, setIsSlowMotionActive] = useState<boolean>(false);
  const slowMotionTimeoutRef = useRef<number | null>(null);

  const [isBossRewardMode, setIsBossRewardMode] = useState(false);
  const isBossRewardModeRef = useRef(isBossRewardMode);
  useEffect(() => { isBossRewardModeRef.current = isBossRewardMode; }, [isBossRewardMode]);
  
  const gameContextForUpgrades = useRef({
    enableFragmentation: (enemy: Enemy) => {
        const currentStaff = ALL_STAFFS_SHOP.find(s => s.id === playerRef.current.selectedStaffId) || ALL_STAFFS_SHOP.find(s => s.id === DEFAULT_STAFF_ID)!;
        const projectileColor = currentStaff.projectileColor;
        const projectileGlowColor = currentStaff.projectileGlowColor;
        const fragmentationDamage = Math.max(1, ((playerRef.current.minProjectileDamage + playerRef.current.maxProjectileDamage) / 2) * FRAGMENTATION_PROJECTILE_DAMAGE_FACTOR);
        const fragProjectileSize = SPRITE_PIXEL_SIZE * 3 * 1.2; 
        for(let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2; const speed = 350;
          setPlayerProjectiles(prev => [...prev, {
            x: enemy.x + enemy.width / 2 - fragProjectileSize / 2, y: enemy.y + enemy.height / 2 - fragProjectileSize / 2,
            width: fragProjectileSize, height: fragProjectileSize, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            damage: fragmentationDamage, owner: 'player', color: projectileColor, glowEffectColor: projectileGlowColor,
            appliedEffectType: 'standard', // Fragmentation projectiles are treated as 'standard' for their individual hit logic, damage is pre-set
            damagedEnemyIDs: [], draw: () => {},
            hitsLeft: 1 + (playerRef.current.projectilePierceCount || 0), isHoming: playerRef.current.projectilesAreHoming,
            homingStrength: playerRef.current.projectileHomingStrength, trailSpawnTimer: 0.01 + Math.random() * 0.02,
          }]);
        }
    },
    activateThunderbolts: (boltCountAttribute: number, interval: number, targetX?: number, targetY?: number) => {
        if (interval > 0 && targetX === undefined && targetY === undefined) { 
            if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
            if (boltCountAttribute <= 0) return;
            thunderboltIntervalRef.current = setInterval(() => {
                if (gameStateRef.current === GameState.Playing) {
                    triggerThunderboltStrikes(playerRef.current.thunderboltEffectiveBolts || 0, undefined, undefined, playerRef.current, enemiesRef.current, adminConfigRef.current, setActiveLightningBolts, setEnemies, setFloatingTexts, handleEnemyDeath, (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles,x,y,count,color,size,speed,life,type));
                    playSoundFromManager('/assets/sounds/thunderbolt_strike_01.wav', 0.6);
                }
            }, interval) as unknown as number; 
        } else if (targetX !== undefined && targetY !== undefined) { 
             if (gameStateRef.current === GameState.Playing) {
                triggerThunderboltStrikes(1, targetX, targetY, playerRef.current, enemiesRef.current, adminConfigRef.current, setActiveLightningBolts, setEnemies, setFloatingTexts, handleEnemyDeath, (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles,x,y,count,color,size,speed,life,type));
                playSoundFromManager('/assets/sounds/thunderbolt_strike_01.wav', 0.6);
            }
        }
    },
    removeUpgradeFromPool: (upgradeId: string) => { 
        if (!playerRef.current.isAdmin) { 
             setAvailableUpgrades(prev => prev.filter(u => u.id !== upgradeId));
        }
    },
    addEnemyProjectile: (
        x: number, y: number, vx: number, vy: number, damage: number, 
        owner: 'player' | 'enemy', color: string, glowColor?: string, 
        projectileEffectType?: ProjectileEffectType, 
        hitsLeftOverride?: number, 
        customWidth?: number, 
        customHeight?: number 
      ) => { 
        
        let projX = x;
        let projY = y;
        const defaultWidth = SPRITE_PIXEL_SIZE * 3 * 1.2;
        const defaultHeight = SPRITE_PIXEL_SIZE * 3 * 1.2;

        if (projectileEffectType !== 'boss_laser') {
             projX = x - (customWidth !== undefined ? customWidth : defaultWidth) / 2;
             projY = y - (customHeight !== undefined ? customHeight : defaultHeight) / 2;
        } // For boss laser, x and y are the exact origin points.

        const newProjectile: Projectile = {
            x: projX, 
            y: projY, 
            width: customWidth !== undefined ? customWidth : defaultWidth, 
            height: customHeight !== undefined ? customHeight : defaultHeight,
            vx: vx, 
            vy: vy, 
            damage: damage, 
            owner: owner, 
            color: color, 
            glowEffectColor: glowColor, 
            appliedEffectType: projectileEffectType || 'standard', 
            damagedEnemyIDs: [],
            draw: () => {}, 
            hitsLeft: hitsLeftOverride !== undefined ? hitsLeftOverride : 1,
        };

        if (projectileEffectType === 'boss_laser') {
            newProjectile.angle = Math.atan2(vy, vx); 
            newProjectile.currentLength = 0;
            newProjectile.maxLength = customHeight; 
            // newProjectile.height = customHeight!; // height is already set to customHeight
            // newProjectile.width = customWidth!;  // width is already set to customWidth
            newProjectile.vx = 0; 
            newProjectile.vy = 0;
        }
        
       setEnemyProjectiles(prev => [...prev, newProjectile]);
    }
  }).current;

  const initialGameData = initializeNewGameState(
      "Viajante", undefined, DEFAULT_HAT_ID, DEFAULT_STAFF_ID, 0, {}, gameContextForUpgrades
  );

  const [player, setPlayer] = useState<Player>(initialGameData.player);
  const [enemies, setEnemies] = useState<Enemy[]>(initialGameData.enemies);
  const [playerProjectiles, setPlayerProjectiles] = useState<Projectile[]>(initialGameData.playerProjectiles);
  const [enemyProjectiles, setEnemyProjectiles] = useState<Projectile[]>(initialGameData.enemyProjectiles);
  const [particles, setParticles] = useState<Particle[]>(initialGameData.particles);
  const [activeLightningBolts, setActiveLightningBolts] = useState<ActiveLightningBolt[]>(initialGameData.activeLightningBolts);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>(initialGameData.floatingTexts);
  const [coinDrops, setCoinDrops] = useState<CoinDrop[]>(initialGameData.coinDrops);
  const [platforms, setPlatforms] = useState<Platform[]>(initialGameData.platforms);
  const [availableUpgrades, setAvailableUpgrades] = useState<Upgrade[]>(initialGameData.availableUpgrades);
  const [currentOfferedUpgradesForSelection, setCurrentOfferedUpgradesForSelection] = useState<Upgrade[]>(initialGameData.currentOfferedUpgradesForSelection);
  const [currentPicksAllowedForSelection, setCurrentPicksAllowedForSelection] = useState<number>(initialGameData.currentPicksAllowedForSelection);
  const [gameTime, setGameTime] = useState(initialGameData.gameTime);
  const [currentWave, setCurrentWave] = useState(initialGameData.currentWave);
  const [waveStatus, setWaveStatus] = useState<WaveStatus>(initialGameData.waveStatus);
  const [enemiesToSpawnThisWave, setEnemiesToSpawnThisWave] = useState(initialGameData.enemiesToSpawnThisWave);
  const [enemiesSpawnedThisWaveCount, setEnemiesSpawnedThisWaveCount] = useState(initialGameData.enemiesSpawnedThisWaveCount);
  const [centerScreenMessage, setCenterScreenMessage] = useState<CenterScreenMessage | null>(initialGameData.centerScreenMessage);
  const currentWaveConfigRef = useRef(initialGameData.currentWaveConfig);
  const [stars, setStars] = useState<Star[]>(initialGameData.stars);
  const [nebulae, setNebulae] = useState<Nebula[]>(initialGameData.nebulae);
  
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    isAdminEnabled: false, selectedSkills: {}, startWave: ADMIN_START_WAVE,
    xpMultiplier: 1, damageMultiplier: 1, defenseBoost: 0,
  });
  const [playerCoins, setPlayerCoins] = useState<number>(0);
  const [purchasedCosmeticIds, setPurchasedCosmeticIds] = useState<string[]>([DEFAULT_HAT_ID, DEFAULT_STAFF_ID]);
  const [purchasedPermanentSkillsState, setPurchasedPermanentSkillsState] = useState<Record<string, { level: number }>>({});
  const [selectedHatIdForSelectionScreen, setSelectedHatIdForSelectionScreen] = useState<string | null>(DEFAULT_HAT_ID);
  const [selectedStaffIdForSelectionScreen, setSelectedStaffIdForSelectionScreen] = useState<string | null>(DEFAULT_STAFF_ID);
  
  const [screenShake, setScreenShake] = useState<ScreenShakeState>({ active: false, intensity: 0, duration: 0, startTime: 0 });
  const [borderFlash, setBorderFlash] = useState<BorderFlashState>({ active: false, duration: 0, startTime: 0 });
  
  const [displayedSkills, setDisplayedSkills] = useState<DisplayedSkillInfo[]>([]);
  const [hoveredSkillTooltip, setHoveredSkillTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const skillIconRectsOnCanvasRef = useRef<Array<{ id: string, name: string, rect: {x:number, y:number, w:number, h:number} }>>([]);
  
  const lastClearedWaveRef = useRef<number>(initialGameData.lastClearedWave);
  
  const [revivesUsedThisSession, setRevivesUsedThisSession] = useState<number>(0);
  const revivePendingTimerRef = useRef<number | null>(null);
  const [reviveCountdown, setReviveCountdown] = useState<number>(REVIVE_PENDING_DURATION_S);

  const adminConfigRef = useRef(adminConfig);
  useEffect(() => { adminConfigRef.current = adminConfig; }, [adminConfig]);
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);
  const enemiesRef = useRef(enemies);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  const playerProjectilesRef = useRef(playerProjectiles);
  useEffect(() => { playerProjectilesRef.current = playerProjectiles; }, [playerProjectiles]);
  const enemyProjectilesRef = useRef(enemyProjectiles);
  useEffect(() => { enemyProjectilesRef.current = enemyProjectiles; }, [enemyProjectiles]);
  const coinDropsRef = useRef(coinDrops);
  useEffect(() => { coinDropsRef.current = coinDrops; }, [coinDrops]);
  const gameStateRef = useRef(gameState);
   useEffect(() => {
      const oldGameState = gameStateRef.current;
      gameStateRef.current = gameState;
      
      if (revivePendingTimerRef.current && gameState !== GameState.RevivePending) {
        clearInterval(revivePendingTimerRef.current);
        revivePendingTimerRef.current = null;
      }
      if (slowMotionTimeoutRef.current && gameState !== GameState.Playing) {
          clearTimeout(slowMotionTimeoutRef.current);
          slowMotionTimeoutRef.current = null;
          setIsSlowMotionActive(false);
      }
      if (gameState !== GameState.ChoosingUpgrade) { 
          setIsBossRewardMode(false);
      }


      if (gameState === GameState.RevivePending) {
        pauseMusic();
        setReviveCountdown(REVIVE_PENDING_DURATION_S);
        revivePendingTimerRef.current = setInterval(() => {
            setReviveCountdown(prev => {
                if (prev <= 0.1) { 
                    if (revivePendingTimerRef.current) clearInterval(revivePendingTimerRef.current);
                    revivePendingTimerRef.current = null;
                    if (gameStateRef.current === GameState.RevivePending) { 
                        handleGameOver();
                    }
                    return 0;
                }
                return prev - 0.1; 
            });
        }, 100) as unknown as number;
      } else if (gameState === GameState.Playing) {
          canvasRef.current?.focus();
          playMusic(); 
      } else {
          pauseMusic();
          if (isSlowMotionActive) setIsSlowMotionActive(false); 
      }

      if (gameState !== oldGameState) {
          const statesThatCanSetPrevious = [GameState.StartMenu, GameState.Paused, GameState.CharacterSelection, GameState.DebugMenu, GameState.Shop, GameState.GameOver, GameState.RevivePending];
          const statesThatNeedPrevious = [GameState.SkillsInfo, GameState.Leaderboard, GameState.ActiveSkillsDisplay, GameState.DebugMenu, GameState.CharacterSelection, GameState.Shop, GameState.CosmeticSelectionModal];
          
          if (statesThatCanSetPrevious.includes(oldGameState) && statesThatNeedPrevious.includes(gameState)) {
              if (gameState === GameState.Shop && oldGameState === GameState.Paused) {
                  previousGameStateRef.current = GameState.Paused;
              } else if (gameState === GameState.GameOver && oldGameState === GameState.RevivePending) {
                  previousGameStateRef.current = GameState.GameOver; 
              }
               else {
                  previousGameStateRef.current = oldGameState;
              }
          }
          if (oldGameState === GameState.CosmeticSelectionModal && gameState === GameState.CharacterSelection) {
              previousGameStateRef.current = GameState.Shop; 
          }
      }
      return () => {
        if (revivePendingTimerRef.current && oldGameState === GameState.RevivePending) {
           clearInterval(revivePendingTimerRef.current);
           revivePendingTimerRef.current = null;
        }
        if (slowMotionTimeoutRef.current && oldGameState === GameState.Playing) {
           clearTimeout(slowMotionTimeoutRef.current);
           slowMotionTimeoutRef.current = null;
        }
      };
  }, [gameState, isSlowMotionActive]); 


  const lastFrameTimeRef = useRef<number>(performance.now());
  const thunderboltIntervalRef = useRef<number | null>(null);
  const [timeToNextWaveAction, setTimeToNextWaveAction] = useState(INITIAL_WAVE_CONFIG.intermissionTime);


  const keysRef = useRef<Keys>({ a: false, d: false, space: false, shift: false });
  const mouseStateRef = useRef<MouseState>({ x: 0, y: 0, isDown: false });

  useEffect(() => {
    loadSfx(); 
    loadMusic('/assets/music/game_theme_01.mp3'); 
  }, []);

  useEffect(() => {
    if (borderFlash.active) {
        gameContainerRef.current?.classList.add('border-flash-active');
        const timer = setTimeout(() => {
            gameContainerRef.current?.classList.remove('border-flash-active');
            setBorderFlash(prev => ({ ...prev, active: false }));
        }, borderFlash.duration);
        return () => clearTimeout(timer);
    }
  }, [borderFlash]);

  const saveCosmeticData = useCallback(() => {
    const data: CosmeticUnlocksData = { playerCoins, purchasedItemIds: purchasedCosmeticIds, purchasedPermanentSkills: purchasedPermanentSkillsState };
    localStorage.setItem(COSMETIC_DATA_KEY, JSON.stringify(data));
  }, [playerCoins, purchasedCosmeticIds, purchasedPermanentSkillsState]);

  const loadCosmeticData = useCallback(() => {
    const storedData = localStorage.getItem(COSMETIC_DATA_KEY);
    if (storedData) {
      const loaded = JSON.parse(storedData) as CosmeticUnlocksData;
      setPlayerCoins(loaded.playerCoins || 0);
      const defaultItems = [DEFAULT_HAT_ID, DEFAULT_STAFF_ID];
      const combinedPurchased = new Set([...(loaded.purchasedItemIds || []), ...defaultItems]);
      setPurchasedCosmeticIds(Array.from(combinedPurchased));
      setPurchasedPermanentSkillsState(loaded.purchasedPermanentSkills || {});
    } else { 
      setPurchasedCosmeticIds([DEFAULT_HAT_ID, DEFAULT_STAFF_ID]);
      setPlayerCoins(0);
      setPurchasedPermanentSkillsState({});
    }
  }, []);

  useEffect(() => { loadCosmeticData(); }, [loadCosmeticData]);
  useEffect(() => { saveCosmeticData(); }, [playerCoins, purchasedCosmeticIds, purchasedPermanentSkillsState, saveCosmeticData]);

  const isCosmeticPurchased = useCallback((itemId: string): boolean => purchasedCosmeticIds.includes(itemId), [purchasedCosmeticIds]);
  const getPermanentSkillLevel = useCallback((skillId: string): number => purchasedPermanentSkillsState[skillId]?.level || 0, [purchasedPermanentSkillsState]);
  const getSelectableCosmeticHats = useCallback((): HatItem[] => ALL_HATS_SHOP.filter(hat => isCosmeticPurchased(hat.id)), [isCosmeticPurchased]);
  const getPurchasableStaffs = useCallback((): StaffItem[] => ALL_STAFFS_SHOP.filter(staff => isCosmeticPurchased(staff.id)), [isCosmeticPurchased]);

  const drawPlayerPreview = useCallback(() => {
      const ctx = previewCanvasRef.current?.getContext('2d');
      if (!ctx || !previewCanvasRef.current) return;
      ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      ctx.imageSmoothingEnabled = true;

      const previewPlayer: Player = {
          ...getDefaultPlayerState("Preview", selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen),
          x: previewCanvasRef.current.width / 2 - playerRef.current.width / 2, 
          y: previewCanvasRef.current.height / 2 - playerRef.current.height / 2 + 30, 
          animationState: 'idle', facingDirection: 'right',
      };
      drawPlayerAndAccessories(ctx, previewPlayer, 0, {x:0,y:0, isDown:false}, null, previewCanvasRef.current.width, previewCanvasRef.current.height, ALL_HATS_SHOP, ALL_STAFFS_SHOP);
  }, [selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen]);

  useEffect(() => { if ([GameState.CharacterSelection, GameState.CosmeticSelectionModal, GameState.Shop].includes(gameState)) drawPlayerPreview(); }, [gameState, selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen, drawPlayerPreview]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    playerRef.current.upgrades?.forEach(upgradeId => { counts[upgradeId] = (counts[upgradeId] || 0) + 1; });
    const skillsToShow: DisplayedSkillInfo[] = Object.entries(counts)
        .map(([id, count]) => {
            const upgradeDetails = InitialUpgradesConfig.find(u => u.id === id);
            return {
                id,
                name: upgradeDetails?.name || id,
                icon: UPGRADE_ICONS[id] || '✨',
                count,
                description: upgradeDetails?.description || "Sem descrição."
            };
        })
        .sort((a, b) => InitialUpgradesConfig.findIndex(u => u.id === a.id) - InitialUpgradesConfig.findIndex(u => u.id === b.id));
    setDisplayedSkills(skillsToShow);
  }, [player.upgrades]); 

  const loadLeaderboardFromService = useCallback(async (isDebugLeaderboard = false) => { try { setLeaderboardEntries(await fetchLeaderboard(isDebugLeaderboard)); } catch { setLeaderboardEntries([]); } }, []);
  
  useEffect(() => {
    if (gameState === GameState.Leaderboard) {
        loadLeaderboardFromService(false);
    } else if (gameState === GameState.DebugMenu) {
        loadLeaderboardFromService(true);
    } else if (gameState === GameState.GameOver) {
        loadLeaderboardFromService(player.isAdmin);
    }
  }, [gameState, loadLeaderboardFromService, adminConfig.isAdminEnabled, player.isAdmin]);
  
  const currentWaveRef = useRef(currentWave); useEffect(() => { currentWaveRef.current = currentWave; }, [currentWave]);
  const gameTimeRef = useRef(gameTime); useEffect(() => { gameTimeRef.current = gameTime; }, [gameTime]);

  const saveScoreToLeaderboardService = useCallback(async (nicknameToSave: string, wave: number, time: number, isAdminPlayer: boolean) => {
    const scoreEntry: LeaderboardEntry = { nickname: nicknameToSave, wave, time: Math.floor(time), date: new Date().toISOString().split('T')[0] };
    try { await submitScore(scoreEntry, isAdminPlayer); } catch (error) { console.error("Falha ao enviar pontuação:", error); }
    loadLeaderboardFromService(isAdminPlayer); 
  }, [loadLeaderboardFromService]);

  const handleLevelUp = useCallback(() => {
    playSoundFromManager('/assets/sounds/event_level_up_01.wav', 0.7);
    const numChoices = playerRef.current.appraisalChoices;
    const selectedUpgrades: Upgrade[] = [];
    
    const tempPoolForSelection = [...availableUpgrades];

    for (let i = 0; i < numChoices; i++) {
        if (tempPoolForSelection.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempPoolForSelection.length);
        selectedUpgrades.push(tempPoolForSelection[randomIndex]);
        tempPoolForSelection.splice(randomIndex, 1); 
    }
    setCurrentOfferedUpgradesForSelection(selectedUpgrades);
    setCurrentPicksAllowedForSelection(1); 
    setGameState(GameState.ChoosingUpgrade);
  }, [availableUpgrades, playSoundFromManager]); 

  const handleEnemyDeath = useCallback((killedEnemy: Enemy) => {
    const randomHue = Math.random() * 360; const particleColor = `hsl(${randomHue}, 90%, 70%)`;
    createParticleEffect(setParticles, killedEnemy.x + killedEnemy.width/2, killedEnemy.y + killedEnemy.height/2, killedEnemy.enemyType === 'boss' ? 80 : (killedEnemy.enemyType === 'splitter' ? 40 : 30), particleColor, killedEnemy.enemyType === 'boss' ? 83 : (killedEnemy.enemyType === 'splitter' ? 33 : 33), 500, 0.8, 'generic');
    
    if (killedEnemy.enemyType === 'boss') playSoundFromManager('/assets/sounds/enemy_death_boss_01.wav', 0.9);
    else if (killedEnemy.enemyType === 'splitter') playSoundFromManager('/assets/sounds/enemy_death_splitter_01.wav', 0.7);
    else playSoundFromManager('/assets/sounds/enemy_death_generic_01.wav', 0.6);

    if (killedEnemy.enemyType === 'splitter') {
        const numMini = Math.floor(Math.random() * 2) + 2; 
        for (let i = 0; i < numMini; i++) {
            const mini = createMiniSplitterEnemy(currentWaveRef.current, playerRef.current.level, killedEnemy.x + killedEnemy.width / 2, killedEnemy.y + killedEnemy.height / 2, playSoundFromManager);
            setEnemies(prev => [...prev, mini]);
        }
        playSoundFromManager('/assets/sounds/enemy_mini_splitter_spawn_01.wav', 0.6);
    }
    
    if (playerRef.current.upgrades.includes('fragmentation') && gameContextForUpgrades.enableFragmentation) {
       gameContextForUpgrades.enableFragmentation(killedEnemy);
    }
    
    let coinCheatJustDropped = false;
    if (playerRef.current.coinCheatActiveAmount && playerRef.current.coinCheatActiveAmount > 0) {
        const cheatCoinValue = playerRef.current.coinCheatActiveAmount;
        setCoinDrops(prev => [...prev, {
            id: `coin-cheat-${performance.now()}`,
            x: killedEnemy.x + killedEnemy.width / 2 - COIN_DROP_SIZE / 2,
            y: killedEnemy.y + killedEnemy.height / 2 - COIN_DROP_SIZE / 2,
            width: COIN_DROP_SIZE,
            height: COIN_DROP_SIZE,
            value: cheatCoinValue,
            life: 15, 
            initialLife: 15,
            vy: -250, 
            vx: (Math.random() - 0.5) * 150,
            onGround: false,
            draw: () => {}
        }]);
        playSoundFromManager('/assets/sounds/event_level_up_01.wav', 0.9); 
        setPlayer(p => ({ ...p, coinCheatActiveAmount: 0 })); 
        coinCheatJustDropped = true;
    }
    
    if (!killedEnemy.isSummonedByBoss && killedEnemy.enemyType !== 'healing_drone' && killedEnemy.enemyType !== 'miniSplitter') {
        if (!coinCheatJustDropped && killedEnemy.enemyType !== 'boss') { 
            if (!adminConfigRef.current.isAdminEnabled) { 
                let coinDropChance = 0.10 + (playerRef.current.coinDropBonus || 0);
                if (playerRef.current.selectedHatId === 'hat_crown') coinDropChance += 0.05;
                if (Math.random() < coinDropChance) {
                    setCoinDrops(prev => [...prev, {
                        id: `coin-${performance.now()}`, x: killedEnemy.x + killedEnemy.width/2 - COIN_DROP_SIZE/2, y: killedEnemy.y + killedEnemy.height/2 - COIN_DROP_SIZE/2,
                        width: COIN_DROP_SIZE, height: COIN_DROP_SIZE, value: 1, life: 10, initialLife: 10, vy: -200, vx: (Math.random() - 0.5) * 100, onGround: false, draw: () => {}
                    }]);
                }
            }
        }

        let xpEarned = killedEnemy.expValue * (playerRef.current.xpBonus || 1);
        if (playerRef.current.isAdmin && adminConfigRef.current.xpMultiplier) {
            xpEarned *= adminConfigRef.current.xpMultiplier;
        }

        let currentExp = playerRef.current.exp + xpEarned;
        let currentLevel = playerRef.current.level;
        let currentXpToNextLevel = playerRef.current.xpToNextLevel;
        let levelsGained = 0;

        while (currentExp >= currentXpToNextLevel) {
            currentExp -= currentXpToNextLevel;
            currentLevel++;
            levelsGained++;
            currentXpToNextLevel = Math.floor(currentXpToNextLevel * XP_LEVEL_MULTIPLIER);
        }

        if (levelsGained > 0) {
            setPlayer(p => ({
                ...p,
                level: currentLevel,
                exp: currentExp,
                xpToNextLevel: currentXpToNextLevel,
            }));
            if (!isBossRewardModeRef.current && killedEnemy.enemyType !== 'boss') {
                setTimeout(() => {
                    if (gameStateRef.current === GameState.Playing && !isBossRewardModeRef.current) {
                        handleLevelUp();
                    }
                }, 1000);
            }
        } else {
            setPlayer(p => ({ ...p, exp: currentExp }));
        }
    }


    if (killedEnemy.enemyType === 'boss') {
        setIsBossRewardMode(true);
        playSoundFromManager('/assets/sounds/event_level_up_01.wav', 0.8);

        const uniquePlayerUpgradeIds = [...new Set(playerRef.current.upgrades)];
        const singleApplicationSkillIdsToExclude = ['immortal', 'renew', 'energyShield', 'fragmentation', 'appraisal'];

        const bossRewardChoices = InitialUpgradesConfig.filter(u => {
            if (!uniquePlayerUpgradeIds.includes(u.id)) return false; 
            if (singleApplicationSkillIdsToExclude.includes(u.id)) return false;
            // Ensure the upgrade is not already maxed out
            if (u.maxApplications !== undefined) {
                const currentApplications = playerRef.current.upgrades.filter(uid => uid === u.id).length;
                if (currentApplications >= u.maxApplications) {
                    return false;
                }
            }
            return true;
        });

        if (bossRewardChoices.length > 0) {
            setCurrentOfferedUpgradesForSelection(bossRewardChoices);
            setCurrentPicksAllowedForSelection(1);
            setGameState(GameState.ChoosingUpgrade);
        } else {
            setPlayerCoins(prevCoins => prevCoins + 50);
            setCenterScreenMessage({ text: "Recompensa do Chefe: +50 Moedas!", duration: 3, initialDuration: 3, color: "#FFD700" });
            setIsBossRewardMode(false); 
        }
    }

  }, [gameContextForUpgrades, playSoundFromManager, handleLevelUp]); 


  const handleApplyUpgrade = useCallback((upgrade: Upgrade) => {
    let newPlayerState = { ...playerRef.current, upgrades: [...playerRef.current.upgrades, upgrade.id] };
    upgrade.apply(newPlayerState, gameContextForUpgrades);
    setPlayer(newPlayerState); 
    
    if (!isBossRewardModeRef.current) { 
        const currentCountOfThisUpgradeAfterApply = newPlayerState.upgrades.filter(id => id === upgrade.id).length;
        if (upgrade.maxApplications !== undefined && currentCountOfThisUpgradeAfterApply >= upgrade.maxApplications) {
            setAvailableUpgrades(prev => prev.filter(u => u.id !== upgrade.id));
        }
    }
    
    playSoundFromManager('/assets/sounds/event_upgrade_select_01.wav', 0.6);
    lastFrameTimeRef.current = performance.now(); 
  }, [gameContextForUpgrades, playSoundFromManager]);

  const handleAllPicksMade = useCallback(() => { 
    if (isBossRewardModeRef.current) {
        setIsBossRewardMode(false); 
    }
    setGameState(GameState.Playing); 
    setCurrentOfferedUpgradesForSelection([]); 
    setCurrentPicksAllowedForSelection(0); 
    lastFrameTimeRef.current = performance.now(); 
  }, []);
  const handleRequestReroll = useCallback(() => { setPlayer(p => ({...p, usedFreeRerollThisLevelUp: true})); handleLevelUp(); }, [handleLevelUp]);
  

  const triggerReviveAOEDamage = useCallback(() => {
    const explosionDamageBoss = playerRef.current.maxHp * REVIVE_EXPLOSION_BOSS_DAMAGE_FACTOR;

    playSoundFromManager('/assets/sounds/projectile_fire_explode_01.wav', 0.9);
    createParticleEffect(setParticles,
        playerRef.current.x + playerRef.current.width / 2,
        playerRef.current.y + playerRef.current.height / 2,
        150, '#FF8C00', 120, 900, 1.2, 'explosion'
    );
    setScreenShake({ active: true, intensity: 20, duration: 600, startTime: performance.now() });

    const enemiesToUpdateList = [...enemiesRef.current];
    const killedEnemyIds: string[] = [];

    enemiesToUpdateList.forEach(enemy => {
        if (!enemy || enemy.hp <= 0) return;

        const dx = (enemy.x + enemy.width / 2) - (playerRef.current.x + playerRef.current.width / 2);
        const dy = (enemy.y + enemy.height / 2) - (playerRef.current.y + playerRef.current.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < REVIVE_EXPLOSION_RADIUS) {
            if (enemy.enemyType === 'standard' || enemy.enemyType === 'miniSplitter') {
                handleEnemyDeath(enemy);
                killedEnemyIds.push(enemy.id);
            } else if (enemy.enemyType === 'boss' || enemy.enemyType === 'splitter') {
                const damageToApply = explosionDamageBoss;
                enemy.hp -= damageToApply;

                setFloatingTexts(prev => [...prev, {
                    id: `reviveDmg-${enemy.id}-${performance.now()}`,
                    text: `${Math.round(damageToApply)}`,
                    x: enemy.x + enemy.width / 2, y: enemy.y,
                    vy: -80, life: 0.8, initialLife: 0.8, color: "#FF4500", fontSize: 26,
                }]);

                if (enemy.hp <= 0) {
                    handleEnemyDeath(enemy);
                    killedEnemyIds.push(enemy.id);
                } else if (enemy.enemyType === 'boss' && !enemy.inFuryMode && enemy.hp <= enemy.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
                    enemy.inFuryMode = true;
                    setFloatingTexts(prevFt => [...prevFt, {
                        id: `furyRevive-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                        x: enemy.x + enemy.width / 2, y: enemy.y - 30, 
                        vy: -20, life: 3, initialLife: 3, color: "#FF00FF", fontSize: 18,
                    }]);
                }
            }
        }
    });

    setEnemies(prevEnemies =>
        prevEnemies
            .map(e => {
                if (killedEnemyIds.includes(e.id)) return null;
                const updatedVersion = enemiesToUpdateList.find(ue => ue.id === e.id);
                return updatedVersion || e;
            })
            .filter(e => e !== null) as Enemy[]
    );
  }, [handleEnemyDeath, playerRef, setEnemies, setFloatingTexts, setParticles, setScreenShake, playSoundFromManager]);


  const handleGameOver = useCallback(() => {
    if (gameStateRef.current === GameState.GameOver) return;
    setIsSlowMotionActive(false);
    if (slowMotionTimeoutRef.current) {
        clearTimeout(slowMotionTimeoutRef.current);
        slowMotionTimeoutRef.current = null;
    }

    const finalWave = currentWaveRef.current;
    const finalTime = gameTimeRef.current;

    const parsedNicknameForScore = parseCheatNickname(nickname);
    const hasSkillCheats = parsedNicknameForScore.skillCheats.length > 0;
    const hasCoinCheat = parsedNicknameForScore.coinCheatAmount > 0;
    let suffix = "";

    if (hasSkillCheats && hasCoinCheat) {
        suffix = " - SkillCoinCheater";
    } else if (hasSkillCheats) {
        suffix = " - SkillCheater";
    } else if (hasCoinCheat) {
        suffix = " - CoinCheater";
    }
    
    const nicknameToSaveOnLeaderboard = parsedNicknameForScore.baseNickname + suffix;
    
    if (playerRef.current.selectedHatId !== 'hat_fedora') {
        saveScoreToLeaderboardService(nicknameToSaveOnLeaderboard, finalWave, finalTime, playerRef.current.isAdmin);
    }

    saveCosmeticData();
    setGameState(GameState.GameOver);
    playSoundFromManager('/assets/sounds/event_game_over_01.wav', 0.8);
    stopMusic();
    if (revivePendingTimerRef.current) {
        clearInterval(revivePendingTimerRef.current);
        revivePendingTimerRef.current = null;
    }
  }, [nickname, saveScoreToLeaderboardService, saveCosmeticData, playSoundFromManager]);

  const initiateReviveSequence = useCallback(() => {
    if (playerRef.current.revives > 0) { 
        setIsSlowMotionActive(true);
        setPlayer(p => ({
            ...p,
            hp: p.maxHp, 
            revives: p.revives - 1, 
            isInvincible: true,
            lastHitTime: performance.now(),
            invincibilityDuration: 3000 
        }));
        setEnemyProjectiles([]); 
        triggerReviveAOEDamage(); 
        playSoundFromManager('/assets/sounds/player_revive_01.wav', 0.8);
        createParticleEffect(setParticles, playerRef.current.x + playerRef.current.width/2, playerRef.current.y + playerRef.current.height/2, 100, '#FFFFFF', 83, 600, 1.2, 'generic');
        setGameState(GameState.Playing); 
        lastFrameTimeRef.current = performance.now();

        if (slowMotionTimeoutRef.current) clearTimeout(slowMotionTimeoutRef.current);
        slowMotionTimeoutRef.current = setTimeout(() => {
            setIsSlowMotionActive(false);
            slowMotionTimeoutRef.current = null;
        }, SLOW_MOTION_DURATION_MS) as unknown as number;

    } else { 
        setGameState(GameState.RevivePending);
    }
  }, [setParticles, playSoundFromManager, triggerReviveAOEDamage]); 

  const handleMiniatureLogic = useCallback(() => {
    const player = playerRef.current;
    if (!player.miniatures || player.miniatures.count === 0 || enemiesRef.current.length === 0 || gameStateRef.current !== GameState.Playing) {
        return;
    }

    const miniaturesConfig = player.miniatures;
    const now = performance.now();
    const miniatureSizeScale = 0.35;

    let newMiniatureProjectiles: Projectile[] = [];

    for (let i = 0; i < miniaturesConfig.count; i++) {
        const miniatureAttackSpeed = player.attackSpeed * 0.5;
        if (miniatureAttackSpeed <= 0) continue; 
        const miniatureShootCooldownMs = 1000 / miniatureAttackSpeed;

        if (now - (miniaturesConfig.lastShotTimes[i] || 0) > miniatureShootCooldownMs) {
            const sideMultiplier = (i === 0) ? -1 : 1;
            const offsetXFromPlayerCenter = (player.width * 0.5 + (player.width * miniatureSizeScale * 0.5) + 15 * SPRITE_PIXEL_SIZE) * sideMultiplier;
            const offsetYFromPlayerCenter = -player.height * 0.45;

            const miniatureCenterX = player.x + player.width / 2 + offsetXFromPlayerCenter;
            const miniatureCenterY = player.y + player.height / 2 + offsetYFromPlayerCenter;

            let closestEnemy: Enemy | null = null;
            let minDistanceSq = Infinity;

            enemiesRef.current.forEach(enemy => {
                if (enemy.hp > 0) {
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;
                    const dx = enemyCenterX - miniatureCenterX;
                    const dy = enemyCenterY - miniatureCenterY;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        closestEnemy = enemy;
                    }
                }
            });

            if (closestEnemy) {
                miniaturesConfig.lastShotTimes[i] = now;

                const targetX = closestEnemy.x + closestEnemy.width / 2;
                const targetY = closestEnemy.y + closestEnemy.height / 2;
                const angle = Math.atan2(targetY - miniatureCenterY, targetX - miniatureCenterX);
                
                const miniatureDamage = player.maxProjectileDamage * 0.20; // Damage reduced to 20%
                const projectileSpeed = 600 * (1 + (player.projectileSpeedBonus || 0));
                const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE * 0.6; 
                const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE * 0.6;

                const staffItem = ALL_STAFFS_SHOP.find(s => s.id === player.selectedStaffId) || ALL_STAFFS_SHOP[0];

                newMiniatureProjectiles.push({
                    x: miniatureCenterX - projectileWidth / 2,
                    y: miniatureCenterY - projectileHeight / 2,
                    width: projectileWidth,
                    height: projectileHeight,
                    vx: Math.cos(angle) * projectileSpeed,
                    vy: Math.sin(angle) * projectileSpeed,
                    damage: miniatureDamage,
                    owner: 'player',
                    color: staffItem.projectileColor,
                    glowEffectColor: staffItem.projectileGlowColor,
                    appliedEffectType: 'standard',
                    hitsLeft: 1,
                    isHoming: false,
                    homingTargetId: null,
                    homingStrength: 0,
                    damagedEnemyIDs: [],
                    draw: () => {},
                    trailSpawnTimer: 0.05 + Math.random() * 0.05,
                });
                playSoundFromManager('/assets/sounds/player_shoot_magic_01.wav', 0.15);
            }
        }
    }
    if (newMiniatureProjectiles.length > 0) {
        setPlayerProjectiles(prev => [...prev, ...newMiniatureProjectiles]);
    }
    if(player.miniatures) { 
       setPlayer(p => ({ ...p, miniatures: { ...p.miniatures!, lastShotTimes: [...miniaturesConfig.lastShotTimes] }}));
    }
  }, [playerRef, enemiesRef, setPlayerProjectiles, playSoundFromManager, setPlayer]);


  const update = useCallback((deltaTime: number) => {
    if (gameStateRef.current !== GameState.Playing) {
      lastFrameTimeRef.current = performance.now(); 
      return;
    }
    const actualDeltaTime = isSlowMotionActive ? deltaTime * SLOW_MOTION_FACTOR : deltaTime;
    const currentDeltaTime = Math.min(actualDeltaTime, 0.1); 
    setGameTime(prev => prev + currentDeltaTime);

    if (centerScreenMessage) {
        setCenterScreenMessage(prevMsg => {
            if (!prevMsg) return null;
            const newDuration = prevMsg.duration - currentDeltaTime;
            if (newDuration <= 0) return null;
            return { ...prevMsg, duration: newDuration };
        });
    }

    const { updatedPlayer, newProjectiles: playerShotProjectiles, newLightningBolts } = updatePlayerState(
      playerRef.current, keysRef.current, mouseStateRef.current, currentDeltaTime, platforms, 
      canvasRef.current?.getBoundingClientRect() || null, CANVAS_WIDTH, CANVAS_HEIGHT, playSoundFromManager, 
      (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles, x,y,count,color,size,speed,life,type)
    );
    setPlayer(updatedPlayer);
    if (playerShotProjectiles.length > 0) setPlayerProjectiles(prev => [...prev, ...playerShotProjectiles]);
    if (newLightningBolts && gameContextForUpgrades.activateThunderbolts) {
        gameContextForUpgrades.activateThunderbolts(1, 0, newLightningBolts.mouseX, newLightningBolts.mouseY);
    }
    
    handleMiniatureLogic(); // Handle miniature shooting logic

    const { processedEnemies, newMinionsFromBoss } = runEnemyUpdateCycle(
        enemiesRef.current, playerRef.current, currentDeltaTime, gameContextForUpgrades.addEnemyProjectile,
        currentWaveRef.current, playerProjectilesRef.current, handleEnemyDeath, setFloatingTexts, playSoundFromManager,
        setCenterScreenMessage,
        (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles, x,y,count,color,size,speed,life,type) 
    );
    setEnemies(processedEnemies);
    if (newMinionsFromBoss.length > 0) setEnemies(prev => [...prev, ...newMinionsFromBoss]);


    setPlayerProjectiles(prev => updateProjectiles(prev, currentDeltaTime, true, enemiesRef.current, (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles,x,y,count,color,size,speed,life,type), (proj, maxT, dmgFactor) => handleExplosion(proj,maxT, dmgFactor, playerRef.current, enemiesRef.current, adminConfigRef.current, setEnemies, setPlayer, setFloatingTexts, handleEnemyDeath, (x,y,c,col,sV,s,l,t) => createParticleEffect(setParticles, x,y,c,col,sV,s,l,t) ), CANVAS_WIDTH, CANVAS_HEIGHT));
    setEnemyProjectiles(prev => updateProjectiles(prev, currentDeltaTime, false, [], (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles,x,y,count,color,size,speed,life,type), (proj, maxT, dmgFactor) => handleExplosion(proj,maxT, dmgFactor, playerRef.current, enemiesRef.current, adminConfigRef.current, setEnemies, setPlayer, setFloatingTexts, handleEnemyDeath, (x,y,c,col,sV,s,l,t) => createParticleEffect(setParticles, x,y,c,col,sV,s,l,t)), CANVAS_WIDTH, CANVAS_HEIGHT));
    
    setParticles(prev => updateParticleSystem(prev, currentDeltaTime, 1800)); 

    // Passive HP Regeneration
    if (playerRef.current.passiveHpRegenAmount && playerRef.current.passiveHpRegenAmount > 0 && playerRef.current.hp < playerRef.current.maxHp) {
        if (performance.now() - (playerRef.current.lastPassiveHpRegenTime || 0) > (playerRef.current.passiveHpRegenInterval || 5000)) {
            setPlayer(p => ({
                ...p,
                hp: Math.min(p.maxHp, p.hp + (p.passiveHpRegenAmount || 0)),
                lastPassiveHpRegenTime: performance.now()
            }));
        }
    }

    checkCollisions(
        playerProjectilesRef.current, setPlayerProjectiles, enemyProjectilesRef.current, setEnemyProjectiles,
        enemiesRef.current, setEnemies, playerRef.current, setPlayer, handleEnemyDeath,
        setFloatingTexts, setScreenShake, setBorderFlash, adminConfigRef.current, playSoundFromManager, 
        initiateReviveSequence, 
        setParticles, 
        coinDropsRef.current, setCoinDrops, playerCoins, setPlayerCoins 
    );
    
    // Coin attraction logic
    if (playerRef.current.hasCoinAttractionSkill && playerRef.current.coinAttractionRadius && playerRef.current.coinAttractionRadius > 0) {
      const attractionStrength = 0.08; // Slightly stronger pull
      const maxAttractionSpeed = 450 * SPRITE_PIXEL_SIZE; 

      setCoinDrops(prevCoins => prevCoins.map(coin => {
        const playerCenterX = playerRef.current.x + playerRef.current.width / 2;
        const playerCenterY = playerRef.current.y + playerRef.current.height / 2;
        const coinCenterX = coin.x + coin.width / 2;
        const coinCenterY = coin.y + coin.height / 2;

        const dx = playerCenterX - coinCenterX;
        const dy = playerCenterY - coinCenterY;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < (playerRef.current.coinAttractionRadius! * playerRef.current.coinAttractionRadius!)) {
          const distance = Math.sqrt(distanceSq);
          if (distance > 1) { 
            // Determine base pull velocity components
            let pullVx = (dx / distance) * maxAttractionSpeed * attractionStrength;
            let pullVy = (dy / distance) * maxAttractionSpeed * attractionStrength;
            
            // Combine with existing coin velocity
            let newVx = (coin.vx || 0) + pullVx;
            let newVy = coin.vy + pullVy; // Add to existing vy, which includes gravity

            // Cap total speed if it exceeds maxAttractionSpeed
            const currentTotalSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
            if (currentTotalSpeed > maxAttractionSpeed) {
              newVx = (newVx / currentTotalSpeed) * maxAttractionSpeed;
              newVy = (newVy / currentTotalSpeed) * maxAttractionSpeed;
            }
            return { ...coin, vx: newVx, vy: newVy };
          }
        }
        return coin; // Return coin as is if not in range or already at player
      }));
    }


    const waveUpdateResult = updateWaveSystem({
        deltaTime: currentDeltaTime, waveStatus, timeToNextWaveAction, currentWave: currentWaveRef.current,
        enemiesToSpawnThisWave, enemiesSpawnedThisWaveCount, currentWaveConfig: currentWaveConfigRef.current,
        player: playerRef.current, enemies: enemiesRef.current, lastClearedWave: lastClearedWaveRef.current,
        playSound: playSoundFromManager,
        createEnemyOrBossFn: (cw, pl, cWidth, ps) => createEnemyOrBoss(cw,pl,cWidth,ps),
        repositionPlatformsFn: () => setPlatforms(prevP => repositionAndResizeAllDynamicPlatforms(prevP)),
        setPlayerFn: setPlayer, setEnemiesFn: setEnemies, setPlayerProjectilesFn: setPlayerProjectiles,
        setEnemyProjectilesFn: setEnemyProjectiles, setCenterMessageFn: setCenterScreenMessage,
        handleGameOverFn: handleGameOver 
    });
    setWaveStatus(waveUpdateResult.newWaveStatus);
    setTimeToNextWaveAction(waveUpdateResult.newTimeToNextWaveAction);
    setCurrentWave(waveUpdateResult.newCurrentWave);
    setEnemiesToSpawnThisWave(waveUpdateResult.newEnemiesToSpawnThisWave);
    setEnemiesSpawnedThisWaveCount(waveUpdateResult.newEnemiesSpawnedThisWaveCount);
    currentWaveConfigRef.current = waveUpdateResult.newCurrentWaveConfig;
    lastClearedWaveRef.current = waveUpdateResult.newLastClearedWave;

    setActiveLightningBolts(prev => prev.map(b => ({ ...b, life: b.life - currentDeltaTime })).filter(b => b.life > 0));
    setFloatingTexts(prev => prev.map(ft => ({ ...ft, y: ft.y + ft.vy * currentDeltaTime, life: ft.life - currentDeltaTime })).filter(ft => ft.life > 0));
    
    setCoinDrops(prevDrops => prevDrops.map(cd => {
        let newVy = cd.vy + 1800 * currentDeltaTime; 
        let newY = cd.y + newVy * currentDeltaTime;
        let newVx = cd.vx || 0; // Preserve horizontal velocity for attraction
        let newOnGround = cd.onGround;
        const groundPlatformHeight = platforms.find(p=>p.id==='ground')?.height || 0;
        
        if (newY + cd.height > CANVAS_HEIGHT - groundPlatformHeight) {
            newY = CANVAS_HEIGHT - groundPlatformHeight - cd.height;
            newVy = 0; 
            newVx *= 0.9; // Friction on ground
            newOnGround = true;
        }
        
        // Apply horizontal movement from attraction (or existing vx if not attracted)
        let finalX = cd.x + newVx * currentDeltaTime;
        finalX = Math.max(0, Math.min(finalX, CANVAS_WIDTH - cd.width)); // Clamp to canvas X

        return {...cd, x: finalX, y:newY, vx: newVx, vy:newVy, onGround:newOnGround, life: cd.life - (newOnGround ? currentDeltaTime * 0.5 : currentDeltaTime)};
      }).filter(cd => cd.life > 0)
    );

    if (screenShake.active && performance.now() > screenShake.startTime + screenShake.duration) {
      setScreenShake({ ...screenShake, active: false });
    }

  }, [isSlowMotionActive, centerScreenMessage, waveStatus, timeToNextWaveAction, enemiesToSpawnThisWave, enemiesSpawnedThisWaveCount, handleEnemyDeath, handleGameOver, screenShake.active, screenShake.duration, screenShake.startTime, platforms, gameContextForUpgrades, playerCoins, initiateReviveSequence, playSoundFromManager, handleLevelUp, handleMiniatureLogic]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    if (screenShake.active) {
        const dx = (Math.random() - 0.5) * screenShake.intensity * 2;
        const dy = (Math.random() - 0.5) * screenShake.intensity * 2;
        ctx.translate(dx, dy);
    }
    
    drawBackground(ctx, stars, nebulae, gameTime, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawPlatforms(ctx, platforms, gameTime);
    drawPlayerAndAccessories(ctx, playerRef.current, gameTime, mouseStateRef.current, canvasRef.current.getBoundingClientRect(), CANVAS_WIDTH, CANVAS_HEIGHT, ALL_HATS_SHOP, ALL_STAFFS_SHOP);
    // drawMiniatures is now called within drawPlayerAndAccessories
    drawEnemies(ctx, enemiesRef.current, gameTime, (x,y,count,color,size,speed,life,type) => createParticleEffect(setParticles,x,y,count,color,size,speed,life,type));
    drawProjectilesRenderer(ctx, playerProjectilesRef.current, enemyProjectilesRef.current, gameTime);
    drawParticlesRenderer(ctx, particles, gameTime, PIXEL_FONT_FAMILY);
    drawCoinDrops(ctx, coinDropsRef.current, gameTime, PIXEL_FONT_FAMILY);
    drawActiveLightningBolts(ctx, activeLightningBolts);
    drawFloatingTextsRenderer(ctx, floatingTexts, PIXEL_FONT_FAMILY);
    
    const hudTools = { pixelFontFamily: PIXEL_FONT_FAMILY, canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT };
    drawHUD(ctx, playerRef.current, gameTime, currentWaveRef.current, waveStatus, enemiesToSpawnThisWave, enemiesRef.current.filter(e => !e.isSummonedByBoss).length, playerCoins, adminConfigRef.current, hudTools, displayedSkills, platforms, skillIconRectsOnCanvasRef);
    drawCenterScreenMessages(ctx, centerScreenMessage, PIXEL_FONT_FAMILY, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMouseCursor(ctx, canvasRef.current, mouseStateRef.current, gameStateRef.current, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawSkillTooltip(ctx, hoveredSkillTooltip, PIXEL_FONT_FAMILY, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore(); 
  }, [gameTime, stars, nebulae, platforms, particles, activeLightningBolts, floatingTexts, waveStatus, enemiesToSpawnThisWave, playerCoins, displayedSkills, centerScreenMessage, hoveredSkillTooltip, screenShake]);

  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = currentTime;
      update(deltaTime);
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    if (gameStateRef.current === GameState.Playing) {
      lastFrameTimeRef.current = performance.now(); 
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, update, draw]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'a') keysRef.current.a = true;
    if (event.key.toLowerCase() === 'd') keysRef.current.d = true;
    if (event.key.toLowerCase() === ' ') keysRef.current.space = true;
    if (event.key.toLowerCase() === 'shift') keysRef.current.shift = true;
    if (event.key.toLowerCase() === 'p' && gameStateRef.current === GameState.Playing) {
      setGameState(GameState.Paused);
    } else if (event.key.toLowerCase() === 'p' && gameStateRef.current === GameState.Paused) {
      setGameState(GameState.Playing);
    }
  }, []);
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'a') keysRef.current.a = false;
    if (event.key.toLowerCase() === 'd') keysRef.current.d = false;
    if (event.key.toLowerCase() === ' ') keysRef.current.space = false;
    if (event.key.toLowerCase() === 'shift') keysRef.current.shift = false;
  }, []);
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (canvasRef.current) {
        mouseStateRef.current.x = event.clientX;
        mouseStateRef.current.y = event.clientY;

        if (gameStateRef.current === GameState.Playing) {
            const rect = canvasRef.current.getBoundingClientRect();
            const canvasMouseX = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            const canvasMouseY = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
            let foundSkill: { name: string; x: number; y: number } | null = null;
            for (const skill of skillIconRectsOnCanvasRef.current) {
                if (canvasMouseX >= skill.rect.x && canvasMouseX <= skill.rect.x + skill.rect.w &&
                    canvasMouseY >= skill.rect.y && canvasMouseY <= skill.rect.y + skill.rect.h) {
                    foundSkill = { name: skill.name, x: skill.rect.x + skill.rect.w / 2, y: skill.rect.y };
                    break;
                }
            }
            setHoveredSkillTooltip(foundSkill);
        } else {
            setHoveredSkillTooltip(null); 
        }
    }
  }, []);
  const handleMouseDown = useCallback(() => { mouseStateRef.current.isDown = true; }, []);
  const handleMouseUp = useCallback(() => { mouseStateRef.current.isDown = false; }, []);
  const handleFocus = useCallback(() => { if (gameStateRef.current === GameState.Playing) lastFrameTimeRef.current = performance.now(); }, []);
  const handleBlur = useCallback(() => {}, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
        canvasElement.addEventListener('mousemove', handleMouseMove);
        canvasElement.addEventListener('mousedown', handleMouseDown);
        canvasElement.addEventListener('mouseup', handleMouseUp);
        canvasElement.addEventListener('focus', handleFocus);
        canvasElement.addEventListener('blur', handleBlur);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('mousemove', handleMouseMove);
        canvasElement.removeEventListener('mousedown', handleMouseDown);
        canvasElement.removeEventListener('mouseup', handleMouseUp);
        canvasElement.removeEventListener('focus', handleFocus);
        canvasElement.removeEventListener('blur', handleBlur);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
      if (revivePendingTimerRef.current) clearInterval(revivePendingTimerRef.current); 
      if (slowMotionTimeoutRef.current) clearTimeout(slowMotionTimeoutRef.current);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp, handleFocus, handleBlur]);

  const handleProceedToCharacterSelection = () => {
    if (!nickname.trim() || nickname.trim().split(',')[0].length === 0) { 
        setNicknameError("Apelido não pode ser vazio!"); return; 
    }
    setGameState(GameState.CharacterSelection);
  };
  const handleViewShop = () => setGameState(GameState.Shop);
  const handleViewShopFromPause = () => {
    previousGameStateRef.current = GameState.Paused;
    setGameState(GameState.Shop);
  };
  const handleViewAllSkills = () => setGameState(GameState.SkillsInfo);
  const handleViewLeaderboard = () => {
    if (gameStateRef.current === GameState.GameOver || gameStateRef.current === GameState.RevivePending) { 
        previousGameStateRef.current = GameState.GameOver; 
    }
    setGameState(GameState.Leaderboard);
  };
  const handleViewDebugPanel = () => setGameState(GameState.DebugMenu);
  const handleBackToPreviousState = () => setGameState(previousGameStateRef.current || GameState.StartMenu);
  const handleExitToMainMenu = () => { resetGame(false); setGameState(GameState.StartMenu); };
  
  const handlePurchaseCosmetic = (itemId: string, price: number) => {
    if (playerCoins >= price && !purchasedCosmeticIds.includes(itemId)) {
        setPlayerCoins(prev => prev - price);
        setPurchasedCosmeticIds(prev => [...prev, itemId]);
        playSoundFromManager('/assets/sounds/event_cosmetic_unlock_01.wav', 0.8);
    }
  };
  const handlePurchasePermanentSkill = (skillId: string, levelToBuy: number, price: number) => {
      if (playerCoins >= price) {
          setPlayerCoins(prevPlayerCoins => prevPlayerCoins - price);
          
          const newSkillsState = {
              ...purchasedPermanentSkillsState,
              [skillId]: {level: levelToBuy}
          };
          setPurchasedPermanentSkillsState(newSkillsState);

          // Immediately update the live player object with new skill effects
          setPlayer(currentPlayer => {
              let updatedLivePlayer = { ...currentPlayer };
              updatedLivePlayer.purchasedPermanentSkills = newSkillsState;
              
              updatedLivePlayer = applyPermanentSkillEffectsToPlayer(updatedLivePlayer, newSkillsState);
              updatedLivePlayer = applyHatEffect(updatedLivePlayer, updatedLivePlayer.selectedHatId);
              updatedLivePlayer = applyStaffEffectToPlayerBase(updatedLivePlayer, updatedLivePlayer.selectedStaffId);
              
              return updatedLivePlayer;
          });
          playSoundFromManager('/assets/sounds/event_cosmetic_unlock_01.wav', 0.8);
      }
  };
  const handleConfirmCharacterSelectionAndStart = () => { resetGame(false); setGameState(GameState.Playing); };
  const handleOpenCosmeticModal = () => setGameState(GameState.CosmeticSelectionModal);
  const handleConfirmCosmetics = () => setGameState(GameState.CharacterSelection); 
  
  const handleAdminConfigChange = (field: keyof AdminConfig, value: any) => {
    setAdminConfig(prev => ({...prev, [field]: value}));
  };
  const handleAdminSkillChange = (skillId: string, count: number) => {
      setAdminConfig(prev => ({ ...prev, selectedSkills: {...prev.selectedSkills, [skillId]: Math.max(0, count)}}));
  };
  const handleStartAdminGame = () => {
    if (!nickname.trim() || nickname.trim().split(',')[0].length === 0) {
      setNicknameError("Apelido Debug não pode ser vazio!"); return; 
    }
    resetGame(true);
    setGameState(GameState.Playing);
  };
  const handleRestartGameFromGameOver = () => { resetGame(false); setGameState(GameState.CharacterSelection); }; 
  const handleViewActivePlayerSkills = () => setGameState(GameState.ActiveSkillsDisplay);

  const handleCoinBasedRevive = useCallback(() => {
    const cost = BASE_REVIVE_COIN_COST + revivesUsedThisSession * REVIVE_COST_INCREMENT;
    if (playerCoins >= cost) {
        setPlayerCoins(prev => prev - cost);
        setPlayer(p => ({ 
            ...p, 
            hp: p.maxHp * 0.5, 
            isInvincible: true, 
            lastHitTime: performance.now(), 
            invincibilityDuration: 3000 
        }));
        setEnemyProjectiles([]); 
        triggerReviveAOEDamage();
        playSoundFromManager('/assets/sounds/player_revive_01.wav', 0.8);
        createParticleEffect(setParticles, playerRef.current.x + playerRef.current.width/2, playerRef.current.y + playerRef.current.height/2, 100, '#FFFFFF', 83, 600, 1.2, 'generic');
        setRevivesUsedThisSession(prev => prev + 1);
        
        if (revivePendingTimerRef.current) {
            clearInterval(revivePendingTimerRef.current);
            revivePendingTimerRef.current = null;
        }
        setGameState(GameState.Playing); 
        lastFrameTimeRef.current = performance.now();
    } else {
        handleGameOver();
    }
  }, [playerCoins, revivesUsedThisSession, handleGameOver, playSoundFromManager, triggerReviveAOEDamage]);


  const resetGame = useCallback((isAdminStart: boolean) => {
    setIsSlowMotionActive(false);
    if (slowMotionTimeoutRef.current) {
        clearTimeout(slowMotionTimeoutRef.current);
        slowMotionTimeoutRef.current = null;
    }
    if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
    if (revivePendingTimerRef.current) { 
        clearInterval(revivePendingTimerRef.current);
        revivePendingTimerRef.current = null;
    }
    setIsBossRewardMode(false); 

    const newGameConfig = initializeNewGameState(
        nickname || "Viajante", 
        isAdminStart ? adminConfigRef.current : undefined,
        selectedHatIdForSelectionScreen,
        selectedStaffIdForSelectionScreen,
        playerCoins, 
        purchasedPermanentSkillsState,
        gameContextForUpgrades
    );

    setPlayer(newGameConfig.player); 
    setEnemies(newGameConfig.enemies);
    setPlayerProjectiles(newGameConfig.playerProjectiles);
    setEnemyProjectiles(newGameConfig.enemyProjectiles);
    setParticles(newGameConfig.particles);
    setActiveLightningBolts(newGameConfig.activeLightningBolts);
    setFloatingTexts(newGameConfig.floatingTexts);
    setCoinDrops(newGameConfig.coinDrops);
    setPlatforms(newGameConfig.platforms);
    setAvailableUpgrades(newGameConfig.availableUpgrades);
    setCurrentOfferedUpgradesForSelection(newGameConfig.currentOfferedUpgradesForSelection);
    setCurrentPicksAllowedForSelection(newGameConfig.currentPicksAllowedForSelection);
    setGameTime(newGameConfig.gameTime);
    setCurrentWave(newGameConfig.currentWave);
    setWaveStatus(newGameConfig.waveStatus);
    setEnemiesToSpawnThisWave(newGameConfig.enemiesToSpawnThisWave);
    setEnemiesSpawnedThisWaveCount(newGameConfig.enemiesSpawnedThisWaveCount);
    currentWaveConfigRef.current = newGameConfig.currentWaveConfig;
    lastClearedWaveRef.current = newGameConfig.lastClearedWave;
    setCenterScreenMessage(newGameConfig.centerScreenMessage);
    setStars(newGameConfig.stars);
    setNebulae(newGameConfig.nebulae);
    setTimeToNextWaveAction(INITIAL_WAVE_CONFIG.intermissionTime);
    lastFrameTimeRef.current = performance.now();
    setRevivesUsedThisSession(0); 
  }, [nickname, selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen, playerCoins, purchasedPermanentSkillsState, gameContextForUpgrades]);

  const commonButtonClass = "pixel-button bg-gray-700 hover:bg-gray-600 text-cyan-200 border-2 border-cyan-500 hover:border-cyan-300 focus:border-yellow-400 focus:outline-none shadow-[0_0_8px_theme(colors.cyan.600)] hover:shadow-[0_0_12px_theme(colors.cyan.400)] font-mono text-sm py-2 px-4 rounded-md transition-all duration-150 ease-in-out transform hover:scale-105";
  const inputClass = "pixel-input bg-gray-700 border-2 border-cyan-600 text-cyan-100 placeholder-gray-400 text-sm rounded-md focus:ring-yellow-500 focus:border-yellow-500 block p-2.5 shadow-inner focus:outline-none focus:shadow-[0_0_10px_theme(colors.yellow.500)]"; 
  const adminInputClass = "pixel-input-admin bg-gray-600 border-yellow-700 text-yellow-200 placeholder-gray-500 text-xs rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5 focus:outline-none focus:shadow-[0_0_8px_theme(colors.orange.600)]";
  const adminLabelClass = "pixel-label-admin text-xs text-yellow-400 mb-1";
  const panelBaseClass = "pixel-panel absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center p-4 md:p-8 text-white z-10";
  const cosmeticItemButtonClass = "pixel-cosmetic-button text-left p-3 border-2 rounded-md transition-all duration-150 ease-in-out transform hover:scale-103 focus:outline-none";
  const cosmeticItemSelectedClass = "bg-cyan-700 border-cyan-400 shadow-[0_0_10px_theme(colors.cyan.400)]";
  const cosmeticItemUnselectedClass = "bg-gray-750 border-gray-600 hover:bg-gray-700 hover:border-cyan-500";
  const shopItemCardClass = "pixel-shop-card bg-gray-800 p-3 border-2 border-gray-700 rounded-md flex flex-col shadow-[0_0_5px_theme(colors.gray.700)] text-center";
  const leaderboardEntryCardClass = "pixel-leaderboard-entry bg-gray-800 p-2.5 mb-2 border border-green-700 rounded-md grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center shadow-[0_0_6px_theme(colors.green.700)]";

  const currentReviveCoinCost = BASE_REVIVE_COIN_COST + revivesUsedThisSession * REVIVE_COST_INCREMENT;

  return (
    <div ref={gameContainerRef} className="game-canvas-container" tabIndex={0} onFocus={handleFocus} onBlur={handleBlur}>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-label="Game Screen" />
      <GameUI
        gameState={gameState} player={playerRef.current} nickname={nickname} setNickname={setNickname} nicknameError={nicknameError} setNicknameError={setNicknameError}
        handleProceedToCharacterSelection={handleProceedToCharacterSelection} 
        handleViewShop={handleViewShop} 
        handleViewShopFromPause={handleViewShopFromPause}
        handleViewAllSkills={handleViewAllSkills}
        handleViewLeaderboard={handleViewLeaderboard} handleViewDebugPanel={handleViewDebugPanel} getPermanentSkillLevel={getPermanentSkillLevel} playerCoins={playerCoins}
        ALL_HATS_SHOP={ALL_HATS_SHOP} ALL_STAFFS_SHOP={ALL_STAFFS_SHOP} PERMANENT_SKILLS_SHOP={PERMANENT_SKILLS_SHOP}
        isCosmeticPurchased={isCosmeticPurchased} handlePurchaseCosmetic={handlePurchaseCosmetic} handlePurchasePermanentSkill={handlePurchasePermanentSkill}
        handleBackToPreviousState={handleBackToPreviousState} handleExitToMainMenu={handleExitToMainMenu} previewCanvasRef={previewCanvasRef}
        selectedHatIdForSelectionScreen={selectedHatIdForSelectionScreen} setSelectedHatIdForSelectionScreen={setSelectedHatIdForSelectionScreen}
        selectedStaffIdForSelectionScreen={selectedStaffIdForSelectionScreen} setSelectedStaffIdForSelectionScreen={setSelectedStaffIdForSelectionScreen}
        handleConfirmCharacterSelectionAndStart={handleConfirmCharacterSelectionAndStart} handleOpenCosmeticModal={handleOpenCosmeticModal}
        getSelectableCosmeticHats={getSelectableCosmeticHats} getPurchasableStaffs={getPurchasableStaffs} handleConfirmCosmetics={handleConfirmCosmetics}
        adminConfig={adminConfig} handleAdminConfigChange={handleAdminConfigChange} InitialUpgrades={InitialUpgradesConfig} UPGRADE_ICONS={UPGRADE_ICONS}
        handleAdminSkillChange={handleAdminSkillChange} handleStartAdminGame={handleStartAdminGame} leaderboardEntries={leaderboardEntries}
        displayedSkills={displayedSkills} currentOfferedUpgradesForSelection={currentOfferedUpgradesForSelection}
        currentPicksAllowedForSelection={currentPicksAllowedForSelection} availableUpgradesForSelection={availableUpgrades}
        handleApplyUpgradeForSelection={handleApplyUpgrade} 
        handleAllPicksMadeForSelection={handleAllPicksMade} 
        handleRequestRerollForSelection={handleRequestReroll}
        currentWaveForGameOver={currentWaveRef.current} gameTimeForGameOver={gameTimeRef.current} 
        handleRestartGameFromGameOver={handleRestartGameFromGameOver}
        handleCoinBasedRevive={handleCoinBasedRevive} 
        reviveCoinCost={currentReviveCoinCost}
        handleViewActivePlayerSkills={handleViewActivePlayerSkills}
        handleSetGameState={setGameState}
        reviveCountdown={reviveCountdown}
        handleGameOver={handleGameOver}
        isBossRewardMode={isBossRewardModeRef.current} 
        commonButtonClass={commonButtonClass} inputClass={inputClass} adminInputClass={adminInputClass} adminLabelClass={adminLabelClass}
        panelBaseClass={panelBaseClass} cosmeticItemButtonClass={cosmeticItemButtonClass} cosmeticItemSelectedClass={cosmeticItemSelectedClass}
        cosmeticItemUnselectedClass={cosmeticItemUnselectedClass} shopItemCardClass={shopItemCardClass} leaderboardEntryCardClass={leaderboardEntryCardClass}
      />
    </div>
  );
};

export default App;

export {};
