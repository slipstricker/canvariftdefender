

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Enemy, Projectile, Particle, Platform, Upgrade, GameState, Keys, MouseState, ActiveLightningBolt, LeaderboardEntry, AdminConfig, DisplayedSkillInfo, FloatingText, AppliedStatusEffect, EnemyType, CosmeticUnlocksData, HatItem, StaffItem, CosmeticItem, ProjectileEffectType, EnemyUpdateResult, AlienVisualVariant, Star, Nebula, ParticleType, LeveledSkill } from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_INITIAL_HP, PLAYER_WIDTH, PLAYER_HEIGHT,
  XP_PER_LEVEL_BASE, XP_LEVEL_MULTIPLIER, GRAVITY,
  INITIAL_WAVE_CONFIG, WAVE_CONFIG_INCREMENTS, PLAYER_INTERMISSION_HEAL_PERCENT,
  GROUND_PLATFORM_HEIGHT, DYNAMIC_PLATFORM_HEIGHT, DEFAULT_PLATFORM_PADDING,
  PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_ATTACK_SPEED, PLAYER_INITIAL_CRIT_CHANCE, PLAYER_INITIAL_PROJECTILE_DAMAGE, PLAYER_INITIAL_DEFENSE,
  SKILL_DASH_DURATION, SKILL_DASH_SPEED, SKILL_DASH_INVINCIBILITY_DURATION,
  ADMIN_START_WAVE,
  BOSS_WAVE_NUMBER, BOSS_FURY_MODE_HP_THRESHOLD, BOSS_FURY_DAMAGE_MULTIPLIER, ALL_BOSS_WAVES,
  SPRITE_PIXEL_SIZE, PLAYER_PROJECTILE_COLOR, ENEMY_PROJECTILE_COLOR, 
  PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT,
  SPLITTER_ART_WIDTH, SPLITTER_ART_HEIGHT, MINI_SPLITTER_COUNT_MIN, MINI_SPLITTER_COUNT_MAX, BOSS_ART_WIDTH, BOSS_ART_HEIGHT,
  COSMETIC_DATA_KEY,
  PLAYER_ART_WIDTH as PLAYER_ART_WIDTH_CONST_REF, 
  PLAYER_ART_HEIGHT as PLAYER_ART_HEIGHT_CONST_REF, 
  PREVIEW_SPRITE_PIXEL_SIZE, 
  MAX_LEVEL_CHEAT_BUFFER, MAX_SKILLS_CHEAT_BUFFER,
  SKILL_ID_DOUBLE_JUMP, SKILL_ID_DASH, SKILL_ID_XP_BOOST, SKILL_ID_COIN_MAGNET
} from './constants';
import {
  ALL_HATS_SHOP, ALL_STAFFS_SHOP, PERMANENT_SKILLS_SHOP, DEFAULT_HAT_ID, DEFAULT_STAFF_ID,
  applyHatEffect, applyStaffEffectToPlayerBase
} from './gameLogic/shopLogic';
import { PLATFORMS as InitialStaticPlatforms, repositionAndResizeAllDynamicPlatforms } from './gameLogic/platformLogic';
import { UPGRADES as InitialUpgrades } from './gameLogic/upgradeLogic';
import { updatePlayerState } from './gameLogic/playerLogic';
import { createPlayerProjectiles, updateProjectiles } from './gameLogic/projectileLogic';
import { createEnemyOrBoss, updateEnemy, createMiniSplitterEnemy } from './gameLogic/enemyLogic';
import { 
    hexToRgba,
    drawPlayerCanvas, drawHatCanvas, drawStaffCanvas, drawProjectileCanvas,
    drawCyclopsAlienCanvas, drawGreenClassicAlienCanvas, drawSpikyAlienCanvas,
    drawMultiTentacleAlienCanvas, drawThreeEyedBossAlienCanvas,
    drawGroundPlatformCanvas, drawDynamicPlatformCanvas
} from './gameLogic/canvasArt';
import UpgradeCard from './components/UpgradeCard';
import SkillsInfoScreen from './components/SkillsInfoScreen';
import { fetchLeaderboard, submitScore } from './onlineLeaderboardService';
import { 
} from './gameLogic/audioManager'; 


type WaveStatus = 'intermissao' | 'surgindo' | 'lutando';

const UPGRADE_ICONS: Record<string, string> = {
  catalyst: "🔥", growth: "❤️", resonance: "⚡", swift: "👟", renew: "✚", leech: "🩸",
  fragmentation: "💥", thunderbolt: "🌩️", appraisal: "📜", immortal: "😇", eyesight: "👁️",
  scorchedRounds: "♨️", cryoRounds: "❄️", piercingRounds: "🎯", seekerRounds: "🛰️", energyShield: "🛡️",
};
// SKILL_ICONS are now part of LeveledSkill in shopLogic.ts

const getDefaultPlayerState = (nickname: string = "Jogador", selectedHatId: string | null = null, selectedStaffId: string | null = null): Player => ({
  nickname: nickname,
  x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
  y: CANVAS_HEIGHT - PLAYER_HEIGHT - GROUND_PLATFORM_HEIGHT,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  hp: PLAYER_INITIAL_HP,
  maxHp: PLAYER_INITIAL_HP,
  exp: 0,
  level: 1,
  xpToNextLevel: XP_PER_LEVEL_BASE,
  baseMovementSpeed: PLAYER_MOVEMENT_SPEED,
  movementSpeed: PLAYER_MOVEMENT_SPEED,
  jumpHeight: 820,
  baseAttackSpeed: PLAYER_INITIAL_ATTACK_SPEED,
  attackSpeed: PLAYER_INITIAL_ATTACK_SPEED,
  baseProjectileDamage: PLAYER_INITIAL_PROJECTILE_DAMAGE,
  projectileDamage: PLAYER_INITIAL_PROJECTILE_DAMAGE,
  critChance: PLAYER_INITIAL_CRIT_CHANCE,
  critMultiplier: 1.5,
  baseDefense: PLAYER_INITIAL_DEFENSE,
  defense: PLAYER_INITIAL_DEFENSE,
  isJumping: false,
  isInvincible: false,
  lastHitTime: 0,
  invincibilityDuration: 1000, // Default hit invincibility
  shootCooldown: 0,
  lastShotTime: 0,
  upgrades: [],
  lifeSteal: 0,
  revives: 0,
  appraisalChoices: 3,
  onGround: true,
  canDoubleJump: false, 
  hasJumpedOnce: false,
  thunderboltEffectiveBolts: 0,
  isAdmin: false,
  currentFrame: 0, 
  animationTimer: 0, 
  animationState: 'idle',
  facingDirection: 'right',
  appliesBurn: undefined,
  appliesChill: undefined,
  projectilePierceCount: 0,
  projectilesAreHoming: false,
  projectileHomingStrength: 0,
  shieldMaxHp: undefined,
  shieldCurrentHp: undefined,
  shieldRechargeDelay: undefined, 
  shieldRechargeRate: undefined, 
  shieldLastDamagedTime: 0,
  selectedHatId,
  selectedStaffId,
  coins: 0,
  purchasedPermanentSkills: {}, // Initialize empty record for leveled skills
  xpBonus: 1, // Default 100% XP (no bonus)
  coinDropBonus: 0, // Default 0% bonus coin drop
  challengerHatMoreEnemies: false,
  canFreeRerollUpgrades: false,
  usedFreeRerollThisLevelUp: false,
  draw: () => {},
  justDoubleJumped: false,
  justLanded: false,
  justDashed: false,
  hasDashSkill: false,
  dashCooldownTime: 30, // Default will be overridden by skill
  lastDashTimestamp: 0,
  isDashing: false,
  dashDurationTime: SKILL_DASH_DURATION,
  dashTimer: 0,
  dashSpeedValue: SKILL_DASH_SPEED,
  dashDirection: 'right',
  dashInvincibilityDuration: SKILL_DASH_INVINCIBILITY_DURATION,
});

function verticalLineIntersectsRect(lineX: number, rect: {x: number, y: number, width: number, height: number}): boolean {
    return lineX >= rect.x && lineX <= rect.x + rect.width;
}

interface CenterScreenMessage {
    text: string;
    duration: number;
    initialDuration: number;
    color?: string;
    fontSize?: number;
}

const WAVE_ANNOUNCEMENT_DURATION = 5; 
const BOSS_SUMMON_WARNING_UPDATE_INTERVAL = 1; 
const INTERMISSION_COUNTDOWN_UPDATE_INTERVAL = 1.1; 

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.StartMenu);
  const previousGameStateRef = useRef<GameState>(GameState.StartMenu);

  const [nickname, setNickname] = useState<string>("");
  const [nicknameError, setNicknameError] = useState<string>("");
  const [player, setPlayer] = useState<Player>(getDefaultPlayerState());
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    isAdminEnabled: false,
    selectedSkills: {},
    startWave: ADMIN_START_WAVE,
    xpMultiplier: 1,
    damageMultiplier: 1,
    defenseBoost: 0,
  });
  const adminConfigRef = useRef(adminConfig);
   useEffect(() => { adminConfigRef.current = adminConfig; }, [adminConfig]);

  const [playerCoins, setPlayerCoins] = useState<number>(0);
  const [purchasedCosmeticIds, setPurchasedCosmeticIds] = useState<string[]>([DEFAULT_HAT_ID, DEFAULT_STAFF_ID]);
  const [purchasedPermanentSkillsState, setPurchasedPermanentSkillsState] = useState<Record<string, { level: number }>>({});

  const [selectedHatIdForSelectionScreen, setSelectedHatIdForSelectionScreen] = useState<string | null>(DEFAULT_HAT_ID);
  const [selectedStaffIdForSelectionScreen, setSelectedStaffIdForSelectionScreen] = useState<string | null>(DEFAULT_STAFF_ID);
  
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [playerProjectiles, setPlayerProjectiles] = useState<Projectile[]>([]);
  const [enemyProjectiles, setEnemyProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeLightningBolts, setActiveLightningBolts] = useState<ActiveLightningBolt[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const [platforms, setPlatforms] = useState<Platform[]>(
    repositionAndResizeAllDynamicPlatforms(InitialStaticPlatforms.map(p => ({...p})))
  );
  const [availableUpgrades, setAvailableUpgrades] = useState<Upgrade[]>(InitialUpgrades);
  const [currentUpgradeChoices, setCurrentUpgradeChoices] = useState<Upgrade[]>([]);
  const [canPickMultipleUpgrades, setCanPickMultipleUpgrades] = useState(0);

  const [gameTime, setGameTime] = useState(0); 

  const [currentWave, setCurrentWave] = useState(0);
  const [waveStatus, setWaveStatus] = useState<WaveStatus>('intermissao');
  const [enemiesToSpawnThisWave, setEnemiesToSpawnThisWave] = useState(0);
  const [enemiesSpawnedThisWaveCount, setEnemiesSpawnedThisWaveCount] = useState(0);
  const [timeToNextWaveAction, setTimeToNextWaveAction] = useState(INITIAL_WAVE_CONFIG.intermissionTime);
  const [centerScreenMessage, setCenterScreenMessage] = useState<CenterScreenMessage | null>(null);

  const currentWaveConfigRef = useRef(INITIAL_WAVE_CONFIG);

  const [stars, setStars] = useState<Star[]>([]);
  const [nebulae, setNebulae] = useState<Nebula[]>([]);


  const keysRef = useRef<Keys>({ a: false, d: false, space: false, shift: false });
  const mouseStateRef = useRef<MouseState>({ x: 0, y: 0, isDown: false });
  const lastFrameTimeRef = useRef<number>(performance.now());

  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  const enemiesRef = useRef(enemies);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);

  const playerProjectilesRef = useRef(playerProjectiles);
  useEffect(() => { playerProjectilesRef.current = playerProjectiles; }, [playerProjectiles]);

  const gameStateRef = useRef(gameState);
 useEffect(() => {
    const oldGameState = gameStateRef.current;
    gameStateRef.current = gameState;
    if (gameState === GameState.Playing) {
      canvasRef.current?.focus();
    } 
    if (gameState !== oldGameState) {
        const statesThatCanSetPrevious = [
            GameState.StartMenu, GameState.Paused, GameState.CharacterSelection, 
            GameState.DebugMenu, GameState.Shop
        ];
        const statesThatNeedPrevious = [
            GameState.SkillsInfo, GameState.Leaderboard, GameState.ActiveSkillsDisplay,
            GameState.DebugMenu, GameState.CharacterSelection, GameState.Shop, GameState.CosmeticSelectionModal
        ];

        if (statesThatCanSetPrevious.includes(oldGameState) && statesThatNeedPrevious.includes(gameState)) {
            previousGameStateRef.current = oldGameState;
        }
        if (oldGameState === GameState.CosmeticSelectionModal && gameState === GameState.CharacterSelection) {
            previousGameStateRef.current = GameState.Shop; 
        }
    }
  }, [gameState]);

  const [screenShake, setScreenShake] = useState({ active: false, intensity: 0, duration: 0, startTime: 0 });
  const [borderFlash, setBorderFlash] = useState({ active: false, duration: 0, startTime: 0 });

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


  const [displayedSkills, setDisplayedSkills] = useState<DisplayedSkillInfo[]>([]);
  const [hoveredSkillTooltip, setHoveredSkillTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const skillIconRectsOnCanvasRef = useRef<Array<{ id: string, name: string, rect: {x:number, y:number, w:number, h:number} }>>([]);

  const lastClearedWaveRef = useRef<number>(0);
  const hasSkippedWaveRef = useRef<boolean>(false);

  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(0); 
  const [isDraggingVolumeSlider, setIsDraggingVolumeSlider] = useState(false);

  useEffect(() => {
  }, []);

  const handleToggleMute = useCallback(() => {
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
  }, []);

  const PIXEL_FONT_FAMILY = "'Press Start 2P', monospace";

  const saveCosmeticData = useCallback(() => {
    const data: CosmeticUnlocksData = {
      playerCoins: playerCoins,
      purchasedItemIds: purchasedCosmeticIds,
      purchasedPermanentSkills: purchasedPermanentSkillsState,
    };
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


  useEffect(() => {
    loadCosmeticData();
  }, [loadCosmeticData]);

  useEffect(() => {
    saveCosmeticData();
  }, [playerCoins, purchasedCosmeticIds, purchasedPermanentSkillsState, saveCosmeticData]);


  const isCosmeticPurchased = useCallback((itemId: string): boolean => {
    return purchasedCosmeticIds.includes(itemId);
  }, [purchasedCosmeticIds]);

  const getPermanentSkillLevel = useCallback((skillId: string): number => {
    return purchasedPermanentSkillsState[skillId]?.level || 0;
  }, [purchasedPermanentSkillsState]);
  
  // For shop screen to list hats that give gameplay effects and are purchasable
  const getPurchasableHatsForShop = useCallback((): HatItem[] => {
    return ALL_HATS_SHOP.filter(hat => hat.effectDescription !== 'Visual apenas.');
  }, []);

  // For cosmetic selection modal, to list all owned hats for visual selection
  const getSelectableCosmeticHats = useCallback((): HatItem[] => {
    return ALL_HATS_SHOP.filter(hat => isCosmeticPurchased(hat.id));
  }, [isCosmeticPurchased]);


  const getPurchasableStaffs = useCallback((): StaffItem[] => {
    return ALL_STAFFS_SHOP.filter(staff => isCosmeticPurchased(staff.id) && staff.effectDescription !== 'Dispara um projétil em linha reta.');
  }, [isCosmeticPurchased]);


  const drawPlayerPreview = useCallback(() => {
    const ctx = previewCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const previewScaleFactor = 3.8; 
    const previewPlayerRenderWidth = PLAYER_WIDTH * previewScaleFactor;
    const previewPlayerRenderHeight = PLAYER_HEIGHT * previewScaleFactor;

    const canvasWidthForPreview = 400; 
    const canvasHeightForPreview = 500; 
    const playerFeetFromBottomOffset = 60; 

    if (previewCanvasRef.current) {
        previewCanvasRef.current.width = canvasWidthForPreview; 
        previewCanvasRef.current.height = canvasHeightForPreview;
    }
    
    ctx.imageSmoothingEnabled = true; 
    ctx.fillStyle = '#0A0F1A'; 
    ctx.fillRect(0,0, canvasWidthForPreview, canvasHeightForPreview);
    for(let i=0; i<30; i++) {
        ctx.fillStyle = `rgba(200, 200, 255, ${Math.random()*0.5 + 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random()*canvasWidthForPreview, Math.random()*canvasHeightForPreview, Math.random()*1.5, 0, Math.PI*2);
        ctx.fill();
    }

    const previewPlayer: Player = {
        ...getDefaultPlayerState("Preview"),
        x: (canvasWidthForPreview - previewPlayerRenderWidth) / 2, 
        y: canvasHeightForPreview - previewPlayerRenderHeight - playerFeetFromBottomOffset, 
        width: previewPlayerRenderWidth,
        height: previewPlayerRenderHeight,
        animationState: 'idle',
        facingDirection: 'right', 
        selectedHatId: selectedHatIdForSelectionScreen,
        selectedStaffId: selectedStaffIdForSelectionScreen,
    };

    drawPlayerCanvas(ctx, previewPlayer, 0); 

    if (previewPlayer.selectedHatId) {
        const hatItem = ALL_HATS_SHOP.find(h => h.id === previewPlayer.selectedHatId);
        if (hatItem) {
            drawHatCanvas(ctx, hatItem, previewPlayer, 0);
        }
    }

    if (previewPlayer.selectedStaffId) {
        const staffItem = ALL_STAFFS_SHOP.find(s => s.id === previewPlayer.selectedStaffId);
        if (staffItem) {
            drawStaffCanvas(ctx, staffItem, previewPlayer, 0, null, null, canvasWidthForPreview, canvasHeightForPreview);
        }
    }

  }, [selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen]);

  useEffect(() => {
    if (gameState === GameState.CharacterSelection || gameState === GameState.CosmeticSelectionModal || gameState === GameState.Shop) {
        drawPlayerPreview();
    }
  }, [gameState, selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen, drawPlayerPreview]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    player.upgrades.forEach(upgradeId => {
        counts[upgradeId] = (counts[upgradeId] || 0) + 1;
    });

    const skillsToShow: DisplayedSkillInfo[] = Object.entries(counts)
        .map(([id, count]) => {
            const upgradeDetails = InitialUpgrades.find(u => u.id === id);
            return {
                id,
                name: upgradeDetails?.name || id,
                icon: UPGRADE_ICONS[id] || '✨', 
                count,
                description: upgradeDetails?.description || "Sem descrição disponível."
            };
        })
        .sort((a,b) => {
            const indexA = InitialUpgrades.findIndex(u => u.id === a.id);
            const indexB = InitialUpgrades.findIndex(u => u.id === b.id);
            return indexA - indexB;
        });
    setDisplayedSkills(skillsToShow);
  }, [player.upgrades]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasMouseMove = (event: MouseEvent) => {
      if (gameStateRef.current !== GameState.Playing) {
        setHoveredSkillTooltip(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let foundSkill = null;
      for (const skillIcon of skillIconRectsOnCanvasRef.current) {
        if (
          mouseX >= skillIcon.rect.x &&
          mouseX <= skillIcon.rect.x + skillIcon.rect.w &&
          mouseY >= skillIcon.rect.y &&
          mouseY <= skillIcon.rect.y + skillIcon.rect.h
        ) {
          foundSkill = { name: skillIcon.name, x: mouseX + 15, y: mouseY + 15 };
          break;
        }
      }
      setHoveredSkillTooltip(foundSkill);
    };

    const handleCanvasMouseLeave = () => {
        setHoveredSkillTooltip(null);
    }

    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
    };
  }, []);

  const loadLeaderboardFromService = useCallback(async (isDebugLeaderboard = false) => {
    try {
        const scores = await fetchLeaderboard(isDebugLeaderboard);
        setLeaderboardEntries(scores);
    } catch (error) {
        console.error("Falha ao carregar placar do serviço:", error);
        setLeaderboardEntries([]);
    }
  }, []);

  useEffect(() => {
    if (gameState === GameState.StartMenu || gameState === GameState.DebugMenu || gameState === GameState.GameOver || gameState === GameState.Shop) {
        loadLeaderboardFromService(playerRef.current.isAdmin && (gameState === GameState.DebugMenu || gameState === GameState.GameOver) );
    }
  }, [gameState, loadLeaderboardFromService]);

  const isPlayerProgressValid = useCallback((playerState: Player, wavePlayerDiedOn: number, totalSkillsAcquired: number): boolean => {
    if (playerState.isAdmin) return true;
    if (playerState.selectedHatId === 'hat_fedora') return true;

    let bossLevelBonusCount = 0;
    for (const bossWave of ALL_BOSS_WAVES) {
        if (wavePlayerDiedOn > bossWave) {
            bossLevelBonusCount++;
        } else if (wavePlayerDiedOn === bossWave && enemiesRef.current.length === 0 && enemiesSpawnedThisWaveCount >= enemiesToSpawnThisWave) {
            bossLevelBonusCount++;
        }
    }
    const expectedLevelsFromWaves = wavePlayerDiedOn;
    const maxExpectedLevel = expectedLevelsFromWaves + bossLevelBonusCount + MAX_LEVEL_CHEAT_BUFFER;

    const skillsFromRegularLevels = Math.max(0, playerState.level - 1 - bossLevelBonusCount);
    const maxExpectedSkills = skillsFromRegularLevels + bossLevelBonusCount + MAX_SKILLS_CHEAT_BUFFER;

    if (playerState.level > maxExpectedLevel) {
        console.warn(`Anti-Cheat: Nível do jogador ${playerState.level} excede o máximo esperado ${maxExpectedLevel} para a wave ${wavePlayerDiedOn}.`);
        return false;
    }
    if (totalSkillsAcquired > maxExpectedSkills) {
        console.warn(`Anti-Cheat: Habilidades do jogador ${totalSkillsAcquired} excede o máximo esperado ${maxExpectedSkills} para o nível ${playerState.level}.`);
        return false;
    }
    return true;
  }, [enemiesSpawnedThisWaveCount, enemiesToSpawnThisWave]);

  const saveScoreToLeaderboardService = useCallback(async (nicknameToSave: string, wave: number, time: number, isAdminPlayer: boolean) => {
    if (!nicknameToSave.trim()) return;

    if (hasSkippedWaveRef.current && !isAdminPlayer) {
        console.warn("Anti-Cheat: Pulo de wave detectado. Pontuação não salva.");
        return;
    }

    if (!isPlayerProgressValid(playerRef.current, wave, playerRef.current.upgrades.length)) {
        console.warn("Anti-Cheat: Validação do progresso do jogador falhou. Pontuação não salva.");
        return;
    }

    const newEntry: LeaderboardEntry = {
        nickname: nicknameToSave,
        wave,
        time: Math.floor(time),
        date: new Date().toLocaleDateString()
    };

    try {
        await submitScore(newEntry, isAdminPlayer);
        console.log("Pontuação enviada com sucesso (simulado).");
        loadLeaderboardFromService(isAdminPlayer);
    } catch (error) {
        console.error("Falha ao salvar pontuação via serviço:", error);
    }
  }, [isPlayerProgressValid, loadLeaderboardFromService]);

  const handleGameOver = useCallback(() => {
    if (playerRef.current.selectedHatId !== 'hat_fedora' && !playerRef.current.isAdmin) {
      saveScoreToLeaderboardService(playerRef.current.nickname, currentWave, gameTime, false);
    } else if (playerRef.current.isAdmin) {
      saveScoreToLeaderboardService(playerRef.current.nickname, currentWave, gameTime, true);
    }
    // playerCoins state is already updated live, player.coins stores the start-of-session coins
    saveCosmeticData(); 
    setGameState(GameState.GameOver);
  }, [currentWave, gameTime, saveScoreToLeaderboardService, saveCosmeticData]);

  const gameContextForUpgrades = useRef({
    enableFragmentation: null as ((enemy: Enemy) => void) | null,
    activateThunderbolts: null as ((boltCountAttribute: number, interval: number, targetX?: number, targetY?: number) => void) | null,
    removeUpgradeFromPool: (upgradeId: string) => {
      if (!playerRef.current.isAdmin) {
         setAvailableUpgrades(prev => prev.filter(u => u.id !== upgradeId));
      }
    },
    addEnemyProjectile: (
        x: number, y: number, vx: number, vy: number, damage: number, 
        owner: 'player' | 'enemy', color: string, glowColor?: string
    ) => {
       const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE;
       const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE;
       const newProjectile: Projectile = {
        x: x - projectileWidth / 2,
        y: y - projectileHeight / 2,
        width: projectileWidth,
        height: projectileHeight,
        vx, vy, damage,
        owner, 
        color,
        glowEffectColor: glowColor,
        appliedEffectType: 'standard', // Fragmentation projectiles are standard type by default
        damagedEnemyIDs: [],
        draw: () => {},
        // For player-owned fragmentation, add pierce and homing if player has them
        hitsLeft: owner === 'player' ? 1 + (playerRef.current.projectilePierceCount || 0) : 1,
        isHoming: owner === 'player' ? playerRef.current.projectilesAreHoming : false,
        homingStrength: owner === 'player' ? playerRef.current.projectileHomingStrength : undefined,
        trailSpawnTimer: owner === 'player' ? (0.01 + Math.random() * 0.02) : undefined,
      };
      if (owner === 'player') {
        setPlayerProjectiles(prev => [...prev, newProjectile]);
      } else {
        setEnemyProjectiles(prev => [...prev, newProjectile]);
      }
    }
  }).current;

  const thunderboltIntervalRef = useRef<number | null>(null);

  const createParticleEffect = useCallback((x: number, y: number, count: number, color: string, sizeVariance = 17, speed = 440, life = 0.5, type: ParticleType = 'generic') => { 
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      let currentSpeed = speed * (Math.random() * 0.5 + 0.5);
      let particleVy = Math.sin(angle) * currentSpeed;
      let particleVx = Math.cos(angle) * currentSpeed;
      let particleLife = life * (Math.random() * 0.5 + 0.5);
      let particleWidth = Math.random() * (sizeVariance/2) + (sizeVariance/2); 
      let particleHeight = particleWidth; 

      if (type === 'player_double_jump') {
        particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.5) - Math.random() * speed * 0.3; 
        particleVx = (Math.random() - 0.5) * speed * 0.3; 
        particleLife *= 0.8;
        particleWidth = sizeVariance * (0.5 + Math.random() * 0.3);
      } else if (type === 'player_land_dust') {
        particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.2); 
        particleVx = (Math.random() - 0.5) * speed * 0.5; 
        particleLife *= 0.7;
        particleWidth = sizeVariance * (0.6 + Math.random() * 0.4);
      } else if (type === 'coin_pickup') {
        particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.3) - Math.random() * speed * 0.1;
        particleVx = (Math.random() - 0.5) * speed * 0.1;
        particleLife *= 0.5;
        particleWidth = sizeVariance * (0.7 + Math.random() * 0.3);
      } else if (type === 'dash_trail') {
        particleVy = (Math.random() - 0.5) * speed * 0.2; 
        particleVx = (Math.random() - 0.5) * speed * 0.2; 
        particleLife *= 0.6;
        particleWidth = sizeVariance * (0.4 + Math.random()*0.3);
      }


      newParticles.push({
        x, y,
        width: particleWidth, 
        height: particleHeight, 
        vx: particleVx,
        vy: particleVy,
        life: particleLife,
        initialLife: particleLife,
        color,
        particleType: type,
        draw: () => {}
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const handleLevelUp = useCallback(() => {
    setGameState(GameState.ChoosingUpgrade);
    // Reset key states to prevent sticky movement/actions
    keysRef.current.a = false;
    keysRef.current.d = false;
    keysRef.current.space = false;
    keysRef.current.shift = false;
    mouseStateRef.current.isDown = false; // Also reset mouse down state

    setPlayer(p => ({...p, usedFreeRerollThisLevelUp: false}));

    const currentAppraisalChoices = playerRef.current.appraisalChoices;
    let actualChoicesToOffer = currentAppraisalChoices;
    setCanPickMultipleUpgrades(1);

    if (playerRef.current.selectedHatId === 'hat_challenger' && Math.random() < 0.2) {
        setCanPickMultipleUpgrades(2);
        actualChoicesToOffer = Math.max(currentAppraisalChoices, 4);
    }

    const chosenUpgrades: Upgrade[] = [];
    let filteredAvailable = availableUpgrades.filter(u => {
        const timesApplied = playerRef.current.upgrades.filter(uid => uid === u.id).length;
        return !u.maxApplications || timesApplied < u.maxApplications;
    });

    if (playerRef.current.selectedHatId === 'hat_uncommon') {
        const uncommonAndRare = filteredAvailable.filter(u => u.tier === 'incomum' || u.tier === 'raro');
        if (uncommonAndRare.length > 0) {
            filteredAvailable = uncommonAndRare;
        } // If no uncommon/rare, fallback to common
    }


    for (let i = 0; i < actualChoicesToOffer && filteredAvailable.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * filteredAvailable.length);
      chosenUpgrades.push(filteredAvailable[randomIndex]);
      filteredAvailable.splice(randomIndex, 1);
    }
    setCurrentUpgradeChoices(chosenUpgrades);
  }, [availableUpgrades]);

  const handleEnemyDeath = useCallback((killedEnemy: Enemy) => {
    const randomHue = Math.random() * 360;
    const particleColor = `hsl(${randomHue}, 90%, 70%)`; 

    createParticleEffect(
        killedEnemy.x + killedEnemy.width/2, 
        killedEnemy.y + killedEnemy.height/2, 
        killedEnemy.enemyType === 'boss' ? 80 : (killedEnemy.enemyType === 'splitter' ? 40 : 30), 
        particleColor, 
        killedEnemy.enemyType === 'boss' ? 83 : (killedEnemy.enemyType === 'splitter' ? 33 : 33), 
        500, 
        0.8, 
        'generic'
    ); 
    
    if (gameContextForUpgrades.enableFragmentation) {
        gameContextForUpgrades.enableFragmentation(killedEnemy);
    }

    if (killedEnemy.enemyType === 'splitter') {
        const numToSpawn = MINI_SPLITTER_COUNT_MIN + Math.floor(Math.random() * (MINI_SPLITTER_COUNT_MAX - MINI_SPLITTER_COUNT_MIN + 1));
        const newMiniSplitters: Enemy[] = [];
        for (let i = 0; i < numToSpawn; i++) {
            newMiniSplitters.push(createMiniSplitterEnemy(
                currentWave,
                playerRef.current.level,
                killedEnemy.x + killedEnemy.width / 2 + (Math.random() - 0.5) * killedEnemy.width * 0.5,
                killedEnemy.y + killedEnemy.height / 2 + (Math.random() - 0.5) * killedEnemy.height * 0.5,
                () => {} 
            ));
        }
        setEnemies(prev => [...prev, ...newMiniSplitters]);
    }

    if (killedEnemy.enemyType === 'boss' && !playerRef.current.isAdmin) {
        setEnemyProjectiles([]);
        setEnemies(prevEnemies => prevEnemies.filter(e => !e.isSummonedByBoss));
        
        const bossIndexInSequence = ALL_BOSS_WAVES.indexOf(currentWave);
        if (bossIndexInSequence !== -1) { 
            const coinsDropped = (bossIndexInSequence + 1) * 10; 
            setPlayerCoins(prevCoins => prevCoins + coinsDropped);
            const coinText: FloatingText = {
                id: `bossCoin-${performance.now()}`,
                text: `+${coinsDropped} Moedas!`,
                x: killedEnemy.x + killedEnemy.width / 2,
                y: killedEnemy.y - 20,
                vy: -90, life: 2, initialLife: 2, color: "#FFDF00", fontSize: 14,
            };
            setFloatingTexts(prevFt => [...prevFt, coinText]);
            createParticleEffect(killedEnemy.x + killedEnemy.width / 2, killedEnemy.y + killedEnemy.height / 2, coinsDropped * 2, '#FFDF00', 15, 200, 1.0, 'coin_pickup');
        }
    } else if (!killedEnemy.isSummonedByBoss && !playerRef.current.isAdmin) { 
        const baseDropChance = 0.15;
        const totalDropChance = baseDropChance + (playerRef.current.coinDropBonus || 0);
        if (Math.random() < totalDropChance) { 
            setPlayerCoins(prevCoins => prevCoins + 1);
             const coinText: FloatingText = {
                id: `coin-${performance.now()}`,
                text: "+1 Moeda!",
                x: killedEnemy.x + killedEnemy.width / 2,
                y: killedEnemy.y - 10,
                vy: -80, life: 1, initialLife: 1, color: "#FFD700", fontSize: 10,
            };
            setFloatingTexts(prevFt => [...prevFt, coinText]);
            createParticleEffect(killedEnemy.x + killedEnemy.width / 2, killedEnemy.y + killedEnemy.height / 2, 5, '#FFD700', 10, 100, 0.7, 'coin_pickup');
        }
    }


    if (!killedEnemy.isSummonedByBoss) {
        setPlayer(p => {
            let xpEarned = killedEnemy.expValue;
            xpEarned *= (p.xpBonus || 1); // Apply XP bonus
            if (p.isAdmin && adminConfigRef.current.xpMultiplier) {
                xpEarned *= adminConfigRef.current.xpMultiplier;
            }
            let updatedPlayerState = { ...p, exp: p.exp + xpEarned };

            if (killedEnemy.enemyType === 'boss') {
                const newLevelBoss = updatedPlayerState.level + 1;
                updatedPlayerState = {
                   ...updatedPlayerState,
                   level: newLevelBoss,
                   xpToNextLevel: Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, newLevelBoss -1 ))
                };
                 handleLevelUp();
            } else {
                let hasLeveledUpThisCycle = false;
                while (updatedPlayerState.exp >= updatedPlayerState.xpToNextLevel) {
                    hasLeveledUpThisCycle = true;
                    const newLevel = updatedPlayerState.level + 1;
                    const previousXpThreshold = updatedPlayerState.xpToNextLevel;
                    updatedPlayerState = {
                        ...updatedPlayerState,
                        exp: updatedPlayerState.exp - previousXpThreshold,
                        level: newLevel,
                        xpToNextLevel: Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, newLevel -1 )),
                    };
                }
                if (hasLeveledUpThisCycle) {
                    handleLevelUp();
                }
            }
            return updatedPlayerState;
        });
    }
  }, [gameContextForUpgrades, handleLevelUp, createParticleEffect, currentWave, adminConfigRef]);

  gameContextForUpgrades.activateThunderbolts = (boltCountFromApply: number, interval: number, targetX?: number, targetY?: number) => {
    if (interval > 0 && !targetX && !targetY) {
        if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
        if (boltCountFromApply <= 0) return;

        thunderboltIntervalRef.current = setInterval(() => {
            triggerThunderboltStrikes(playerRef.current.thunderboltEffectiveBolts || 0, undefined, undefined);
        }, interval) as unknown as number;
    } else if (targetX !== undefined && targetY !== undefined) {
        triggerThunderboltStrikes(1, targetX, targetY);
    }
  };

  const triggerThunderboltStrikes = (boltCount: number, fixedTargetX?: number, fixedTargetY?: number) => {
     if (gameStateRef.current !== GameState.Playing || enemiesRef.current.length === 0 && !fixedTargetX) {
        return;
      }

      const currentPlayer = playerRef.current;
      const currentEnemies = enemiesRef.current;
      const newBoltVisuals: ActiveLightningBolt[] = [];
      const damagesToApply = new Map<string, {enemy: Enemy, damage: number, enemyType: EnemyType, maxHp: number, inFuryMode?: boolean}>();

      for (let i = 0; i < boltCount; i++) {
        let strikeX = fixedTargetX !== undefined ? fixedTargetX : Math.random() * CANVAS_WIDTH;
        let strikeYEnd = fixedTargetY !== undefined ? fixedTargetY : CANVAS_HEIGHT;

        const boltLifetime = 0.45; 
        let boltDamage = 30 + currentPlayer.level * 5 + currentPlayer.projectileDamage * 0.5;
        if (currentPlayer.isAdmin && adminConfigRef.current.damageMultiplier) {
            boltDamage *= adminConfigRef.current.damageMultiplier;
        }


        newBoltVisuals.push({
          id: `bolt-${performance.now()}-${Math.random()}-${i}`,
          startX: strikeX,
          startY: 0,
          endX: strikeX,
          endY: strikeYEnd,
          life: boltLifetime,
          initialLife: boltLifetime,
        });

        currentEnemies.forEach(enemy => {
          if (verticalLineIntersectsRect(strikeX, enemy)) {
             const existingDamage = damagesToApply.get(enemy.id)?.damage || 0;
             damagesToApply.set(enemy.id, {
                enemy: enemy,
                damage: existingDamage + boltDamage,
                enemyType: enemy.enemyType,
                maxHp: enemy.maxHp,
                inFuryMode: enemy.inFuryMode
            });
             createParticleEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFFF00', 20, 100 * 2.2, 0.35); 
          }
        });
        createParticleEffect(strikeX, strikeYEnd - 10, 30, '#ADD8E6', 50, 150 * 2.2, 0.55); 
      }

      if (newBoltVisuals.length > 0) {
        setActiveLightningBolts(prev => [...prev, ...newBoltVisuals]);
      }

      if (damagesToApply.size > 0) {
        setEnemies(prevEnemies =>
          prevEnemies.map(enemyInState => {
            if (damagesToApply.has(enemyInState.id)) {
              const {enemy: originalEnemyData, damage: totalDamageToApply, enemyType: currentEnemyType, maxHp: enemyMaxHp, inFuryMode: currentFuryMode} = damagesToApply.get(enemyInState.id)!;
              let newHp = enemyInState.hp - totalDamageToApply;
              let updatedFuryMode = currentFuryMode;

              if (currentEnemyType === 'boss' && !currentFuryMode && newHp <= enemyMaxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
                updatedFuryMode = true;
                const furyText: FloatingText = {
                    id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                    x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100,
                    vy: 0, life: 3, initialLife: 3, color: "red", fontSize: 16,
                };
                setFloatingTexts(prevFt => [...prevFt, furyText]);
              }

              if (newHp <= 0) {
                handleEnemyDeath(originalEnemyData);
                return null;
              }
              return { ...enemyInState, hp: newHp, inFuryMode: updatedFuryMode };
            }
            return enemyInState;
          }).filter(Boolean) as Enemy[]
        );
      }
  };

  const applyUpgrade = useCallback((upgrade: Upgrade) => {
    let newPlayerState = { ...playerRef.current, upgrades: [...playerRef.current.upgrades, upgrade.id] };
    upgrade.apply(newPlayerState, gameContextForUpgrades);

    if (!newPlayerState.isAdmin) { 
        const xpToNextLevel = Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, newPlayerState.level - 1));
        newPlayerState = { ...newPlayerState, xpToNextLevel };
    }

    setPlayer(newPlayerState);

    if (canPickMultipleUpgrades > 1) {
        setCanPickMultipleUpgrades(prev => prev -1);
        setCurrentUpgradeChoices(prevChoices => prevChoices.filter(u => u.id !== upgrade.id));
    } else {
        setGameState(GameState.Playing);
        setCurrentUpgradeChoices([]);
        setCanPickMultipleUpgrades(0);
    }
    lastFrameTimeRef.current = performance.now();
  }, [gameContextForUpgrades, canPickMultipleUpgrades]);

  const applyBurnEffect = useCallback((enemyToAffect: Enemy, currentPlayer: Player): Enemy => {
    if (!currentPlayer.appliesBurn) return enemyToAffect;

    const burnConfig = currentPlayer.appliesBurn;
    const existingBurn = enemyToAffect.statusEffects.find(se => se.type === 'burn');
    let damagePerTick = currentPlayer.projectileDamage * burnConfig.damageFactor;
    if(currentPlayer.isAdmin && adminConfigRef.current.damageMultiplier){
        damagePerTick *= adminConfigRef.current.damageMultiplier;
    }


    if (existingBurn) {
        existingBurn.duration = burnConfig.duration;
        existingBurn.initialDuration = burnConfig.duration;
        existingBurn.stacks = Math.min((existingBurn.stacks || 0) + burnConfig.baseStacks, burnConfig.maxStacks);
        existingBurn.damagePerTick = damagePerTick;
        existingBurn.lastTickTime = performance.now();
    } else {
        const newBurn: AppliedStatusEffect = {
            id: `burn-${performance.now()}-${Math.random()}`,
            type: 'burn',
            duration: burnConfig.duration,
            initialDuration: burnConfig.duration,
            damagePerTick: damagePerTick,
            tickInterval: burnConfig.tickInterval,
            lastTickTime: performance.now(),
            stacks: burnConfig.baseStacks,
        };
        enemyToAffect.statusEffects.push(newBurn);
    }
    return {...enemyToAffect};
  }, [adminConfigRef]);

  const applyChillEffect = useCallback((enemyToAffect: Enemy, currentPlayer: Player): Enemy => {
    if (!currentPlayer.appliesChill) return enemyToAffect;

    const chillConfig = currentPlayer.appliesChill;
    const existingChill = enemyToAffect.statusEffects.find(se => se.type === 'chill');

    if (existingChill) {
        existingChill.duration = chillConfig.duration;
        existingChill.initialDuration = chillConfig.duration;
        existingChill.movementSlowFactor = chillConfig.movementSlowFactor;
        existingChill.attackSpeedSlowFactor = chillConfig.attackSpeedSlowFactor;
    } else {
        const newChill: AppliedStatusEffect = {
            id: `chill-${performance.now()}-${Math.random()}`,
            type: 'chill',
            duration: chillConfig.duration,
            initialDuration: chillConfig.duration,
            movementSlowFactor: chillConfig.movementSlowFactor,
            attackSpeedSlowFactor: chillConfig.attackSpeedSlowFactor,
        };
        enemyToAffect.statusEffects.push(newChill);
        const chillText: FloatingText = {
            id: `chilltext-${newChill.id}`,
            text: "CONGELADO!",
            x: enemyToAffect.x + enemyToAffect.width / 2,
            y: enemyToAffect.y - 5,
            vy: -55, life: 0.8, initialLife: 0.8, color: "#00FFFF", fontSize: 10, 
        };
        setFloatingTexts(prev => [...prev, chillText]);
    }
    return {...enemyToAffect};
  }, []);

  const handleExplosion = useCallback((projectile: Projectile, maxTargets?: number, damageFactorOverride?: number) => {
    if (!projectile.explosionRadius) return;

    createParticleEffect(projectile.x + projectile.width/2, projectile.y + projectile.height/2, 50, '#FF8000', 50, 250 * 2.2, 0.7, 'explosion'); 

    const damageFactor = damageFactorOverride ?? 0.75; // Default factor if not provided
    let explosionDamage = projectile.damage * damageFactor;

    if(playerRef.current.isAdmin && adminConfigRef.current.damageMultiplier){
        explosionDamage *= adminConfigRef.current.damageMultiplier;
    }

    const explosionCenterX = projectile.x + projectile.width / 2;
    const explosionCenterY = projectile.y + projectile.height / 2;

    const enemiesInRadius: Enemy[] = [];
    enemiesRef.current.forEach(enemy => {
        if (!enemy || enemy.hp <= 0) return;
        const dx = (enemy.x + enemy.width / 2) - explosionCenterX;
        const dy = (enemy.y + enemy.height / 2) - explosionCenterY;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < projectile.explosionRadius! * projectile.explosionRadius!) {
            enemiesInRadius.push({...enemy, distanceToExplosion: Math.sqrt(distanceSq)}); // Add distance for sorting
        }
    });

    enemiesInRadius.sort((a, b) => (a as any).distanceToExplosion - (b as any).distanceToExplosion);
    const targetsToHit = maxTargets ? enemiesInRadius.slice(0, maxTargets) : enemiesInRadius;

    const hitEnemyIds = new Set<string>();

    targetsToHit.forEach(enemyToDamage => {
        hitEnemyIds.add(enemyToDamage.id);
    });

    setEnemies(prevEnemies => prevEnemies.map(enemy => {
        if (!enemy || enemy.hp <= 0 || !hitEnemyIds.has(enemy.id)) return enemy;

        let newHp = enemy.hp - explosionDamage;
        let updatedFuryMode = enemy.inFuryMode;

        const damageText: FloatingText = {
            id: `expDmg-${performance.now()}-${enemy.id}`,
            text: `${Math.round(explosionDamage)}`,
            x: enemy.x + enemy.width / 2,
            y: enemy.y,
            vy: -77, life: 0.65, initialLife: 0.65, color: "#FF8C00", fontSize: 9, 
        };
        setFloatingTexts(prev => [...prev, damageText]);

        if (enemy.enemyType === 'boss' && !enemy.inFuryMode && newHp <= enemy.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
            updatedFuryMode = true;
             const furyText: FloatingText = {
                id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100,
                vy: 0, life: 3, initialLife: 3, color: "red", fontSize: 16,
            };
            setFloatingTexts(prevFt => [...prevFt, furyText]);
        }

        if (playerRef.current.lifeSteal > 0) {
            setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + explosionDamage * p.lifeSteal)}));
        }

        if (newHp <= 0) {
            handleEnemyDeath(enemy);
            return null;
        }
        return { ...enemy, hp: newHp, inFuryMode: updatedFuryMode };
    }).filter(Boolean) as Enemy[]);

  }, [handleEnemyDeath, createParticleEffect, adminConfigRef]);

  const checkCollisions = useCallback(() => {
    setPlayerProjectiles(prevProj => prevProj.filter(proj => {
      let projectileNeedsDestroy = false;
      let directHitOccurred = false; // To track if any direct hit happened with this projectile this frame

      proj.damagedEnemyIDs = proj.damagedEnemyIDs || [];

      setEnemies(prevEnemies => prevEnemies.map(enemy => {
        if (!enemy || enemy.hp <= 0) return null;
        
        // If projectile already marked for destruction (e.g. by explosion) and not pierceable further, or already damaged this enemy
        if (projectileNeedsDestroy || proj.damagedEnemyIDs!.includes(enemy.id)) {
            return enemy;
        }

        if (proj.x < enemy.x + enemy.width && proj.x + proj.width > enemy.x &&
            proj.y < enemy.y + enemy.height && proj.y + proj.height > enemy.y) {

          directHitOccurred = true;
          proj.damagedEnemyIDs!.push(enemy.id); 

          let damageDealt = proj.damage;
          if (playerRef.current.isAdmin && adminConfigRef.current.damageMultiplier) {
            damageDealt *= adminConfigRef.current.damageMultiplier;
          }

          const isCrit = Math.random() < playerRef.current.critChance;
          let damageTextColor = "#FFFFFF";
          let showDamageNumber = true;

          if (isCrit) {
            damageDealt *= playerRef.current.critMultiplier;
            const newCritText: FloatingText = {
              id: `crit-${performance.now()}-${Math.random()}`,
              text: "CRÍTICO!",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2 - 10,
              vy: -88, life: 0.7, initialLife: 0.7, color: "#FF00FF", fontSize: 12, 
            };
            setFloatingTexts(prev => [...prev, newCritText]);
            showDamageNumber = false; 
          }
          
          let enemyAfterHit = { ...enemy };
          if (playerRef.current.appliesBurn && Math.random() < playerRef.current.appliesBurn.chance) {
             enemyAfterHit = applyBurnEffect(enemyAfterHit, playerRef.current);
             showDamageNumber = false; 
          }
          if (playerRef.current.appliesChill && Math.random() < playerRef.current.appliesChill.chance) {
             enemyAfterHit = applyChillEffect(enemyAfterHit, playerRef.current);
             showDamageNumber = false; 
          }

          if (showDamageNumber) {
             const damageText: FloatingText = {
                id: `dmg-${performance.now()}-${enemy.id}`,
                text: `${Math.round(damageDealt)}`,
                x: enemy.x + enemy.width / 2,
                y: enemy.y,
                vy: -77, life: 0.65, initialLife: 0.65, color: damageTextColor, fontSize: 11,
            };
            setFloatingTexts(prev => [...prev, damageText]);
          }

          createParticleEffect(
            proj.x + proj.width / 2,
            proj.y + proj.height / 2,
            6, proj.color, SPRITE_PIXEL_SIZE * 3, 90 * SPRITE_PIXEL_SIZE, 0.25, 'generic' 
          );
          
          let newHp = enemy.hp - damageDealt;
          
          // Handle on-hit explosion chance
          if (proj.onHitExplosionConfig && proj.explosionRadius && Math.random() < proj.onHitExplosionConfig.chance) {
            handleExplosion(proj, proj.onHitExplosionConfig.maxTargets, proj.onHitExplosionConfig.damageFactor);
            proj.hitsLeft = 0; // Explosion consumes the projectile, overrides pierce
          }
          
          if (proj.hitsLeft !== undefined && proj.hitsLeft > 0) {
              proj.hitsLeft--; 
              if (proj.hitsLeft <= 0) { 
                  projectileNeedsDestroy = true;
              }
          } else if (proj.hitsLeft === undefined) { // No pierce capability, destroy on first hit
              projectileNeedsDestroy = true;
          }


          if (newHp <= 0) {
            handleEnemyDeath({...enemyAfterHit, hp: 0});
            return null;
          }

          let updatedFuryMode = enemyAfterHit.inFuryMode;
          if (enemyAfterHit.enemyType === 'boss' && !enemyAfterHit.inFuryMode && newHp <= enemyAfterHit.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
            updatedFuryMode = true;
            const furyText: FloatingText = {
              id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
              x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100,
              vy: 0, life: 3, initialLife: 3, color: "#FF00FF", fontSize: 16, 
            };
            setFloatingTexts(prevFt => [...prevFt, furyText]);
          }
          
          if (playerRef.current.lifeSteal > 0) {
            setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + damageDealt * p.lifeSteal)}));
          }

          return { ...enemyAfterHit, hp: newHp, inFuryMode: updatedFuryMode };
        }
        return enemy;
      }).filter(Boolean) as Enemy[]);

      // Note: The logic for `proj.isExplosive` (for off-screen explosions) is handled in `updateProjectiles`.
      // Here, we are concerned with direct hits and on-hit effects.
      
      return !projectileNeedsDestroy; 
    }));

    setEnemyProjectiles(prevProj => prevProj.filter(proj => {
      const currentPlayer = playerRef.current;
      if (proj.x < currentPlayer.x + currentPlayer.width && proj.x + proj.width > currentPlayer.x &&
          proj.y < currentPlayer.y + currentPlayer.height && proj.y + proj.height > currentPlayer.y) {

        createParticleEffect(proj.x, proj.y, 10, proj.color, 20, 150, 0.4, 'generic'); 
        
        if (currentPlayer.isInvincible && currentPlayer.invincibilityDuration === (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION) && performance.now() < currentPlayer.lastHitTime + (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION)) {
            createParticleEffect(currentPlayer.x + currentPlayer.width/2, currentPlayer.y + currentPlayer.height/2, 25, '#FFFFFF', 30, 180, 0.5, 'shield_hit');
            return false;
        }
        
        let effectiveDefense = currentPlayer.defense;
        if(currentPlayer.isAdmin && adminConfigRef.current.defenseBoost !== undefined) {
            effectiveDefense = Math.min(0.95, currentPlayer.defense + (adminConfigRef.current.defenseBoost || 0));
        }
        const damageTakenBase = Math.max(1, proj.damage * (1 - effectiveDefense));


        if (currentPlayer.shieldMaxHp && currentPlayer.shieldCurrentHp && currentPlayer.shieldCurrentHp > 0) {
            setPlayer(p => {
              const newShieldHp = Math.max(0, (p.shieldCurrentHp || 0) - 1); // Shield takes 1 "hit point" per projectile
              return { ...p, shieldCurrentHp: newShieldHp, shieldLastDamagedTime: performance.now() }
            });
            createParticleEffect(currentPlayer.x + currentPlayer.width/2, currentPlayer.y + currentPlayer.height/2, 20, '#00FFFF', 25, 100 * 2.2, 0.4, 'shield_hit'); 
            return false;
        }

        if (currentPlayer.isInvincible && performance.now() < currentPlayer.lastHitTime + currentPlayer.invincibilityDuration) return true;

        setPlayer(p => {
          const newHp = p.hp - damageTakenBase;
          let shouldTriggerDamageEffects = false;
          if (newHp < p.hp) { 
            shouldTriggerDamageEffects = true;
          }

          if (shouldTriggerDamageEffects) {
            setScreenShake({ active: true, intensity: 8, duration: 200, startTime: performance.now() });
            setBorderFlash({ active: true, duration: 300, startTime: performance.now() });
          }
          
          if (newHp <= 0) {
            if (p.revives > 0) {
              createParticleEffect(p.x + p.width/2, p.y + p.height/2, 100, '#FFFFFF', 83, 600, 1.2, 'generic'); 
              return {...p, hp: p.maxHp / 2, revives: p.revives - 1, isInvincible: true, lastHitTime: performance.now(), invincibilityDuration: 500 };
            }
            handleGameOver();
            return { ...p, hp: 0 };
          }
          return { ...p, hp: newHp, isInvincible: true, lastHitTime: performance.now(), invincibilityDuration: 500 };
        });
        return false;
      }
      return true;
    }));
  }, [handleEnemyDeath, applyBurnEffect, applyChillEffect, createParticleEffect, handleGameOver, handleExplosion, adminConfigRef]);

  const update = useCallback((deltaTime: number) => {
    if (gameStateRef.current !== GameState.Playing) {
        lastFrameTimeRef.current = performance.now(); 
        return;
    }

    const currentDeltaTime = Math.min(deltaTime, 0.1); 
    setGameTime(prev => prev + currentDeltaTime);

    if (centerScreenMessage) {
        const newDuration = centerScreenMessage.duration - currentDeltaTime;
        if (newDuration <= 0) {
            setCenterScreenMessage(null);
        } else {
            setCenterScreenMessage(prev => prev ? ({ ...prev, duration: newDuration }) : null);
        }
    }

    const playerUpdateResult = updatePlayerState(
        playerRef.current,
        keysRef.current,
        mouseStateRef.current,
        currentDeltaTime,
        platforms,
        canvasRef.current ? canvasRef.current.getBoundingClientRect() : null,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        () => {} 
    );
    setPlayer(playerUpdateResult.updatedPlayer);

    if (playerUpdateResult.updatedPlayer.justDoubleJumped) {
        createParticleEffect(playerUpdateResult.updatedPlayer.x + playerUpdateResult.updatedPlayer.width / 2, playerUpdateResult.updatedPlayer.y + playerUpdateResult.updatedPlayer.height - 5, 15, '#B0C4DE', 10, 80, 0.6, 'player_double_jump'); 
    }
    if (playerUpdateResult.updatedPlayer.justLanded) {
        createParticleEffect(playerUpdateResult.updatedPlayer.x + playerUpdateResult.updatedPlayer.width / 2, playerUpdateResult.updatedPlayer.y + playerUpdateResult.updatedPlayer.height, 20, '#606470', 12, 100, 0.5, 'player_land_dust'); 
    }
    if (playerUpdateResult.updatedPlayer.justDashed) {
        const dashDirectionVec = playerUpdateResult.updatedPlayer.dashDirection === 'right' ? 1 : -1;
        for (let i = 0; i < 15; i++) {
            const angleOffset = (Math.random() - 0.5) * Math.PI * 0.4; 
            const angle = Math.atan2(Math.sin(angleOffset), -dashDirectionVec * Math.cos(angleOffset) );
            const speed = 250 + Math.random() * 150;
            createParticleEffect(
                playerUpdateResult.updatedPlayer.x + playerUpdateResult.updatedPlayer.width / 2,
                playerUpdateResult.updatedPlayer.y + playerUpdateResult.updatedPlayer.height / 2,
                1, 
                `rgba(173, 216, 230, ${0.6 + Math.random() * 0.3})`, 
                10 + Math.random() * 7,
                speed,
                0.35 + Math.random() * 0.25,
                'dash_trail'
            );
        }
    }
    if (playerUpdateResult.updatedPlayer.isDashing && Math.random() < 0.8) { 
        createParticleEffect(
            playerUpdateResult.updatedPlayer.x + playerUpdateResult.updatedPlayer.width / 2,
            playerUpdateResult.updatedPlayer.y + playerUpdateResult.updatedPlayer.height / 2,
            1,
            `rgba(200, 220, 255, ${0.4 + Math.random() * 0.2})`,
            7 + Math.random() * 5,
            120 + Math.random() * 60, 
            0.25 + Math.random() * 0.15,
            'dash_trail'
        );
    }


    if (playerUpdateResult.newProjectiles.length > 0) {
      setPlayerProjectiles(prev => [...prev, ...playerUpdateResult.newProjectiles]);
    }
    if (playerUpdateResult.newLightningBolts && gameContextForUpgrades.activateThunderbolts) {
        triggerThunderboltStrikes(1, playerUpdateResult.newLightningBolts.mouseX, playerUpdateResult.newLightningBolts.mouseY);
    }

    const updatedEnemiesList: Enemy[] = [];
    const newEnemiesFromBoss: Enemy[] = [];

    enemiesRef.current.forEach(baseEnemy => {
      if(!baseEnemy || baseEnemy.hp <= 0) return;

      let enemy = {...baseEnemy};

      const remainingStatusEffects: AppliedStatusEffect[] = [];
      let enemyKilledByStatus = false;
      for (const effect of enemy.statusEffects) {
          effect.duration -= currentDeltaTime;
          if (effect.duration <= 0) continue;

          if (effect.type === 'burn' && effect.damagePerTick && effect.tickInterval && effect.stacks) {
              if (performance.now() - (effect.lastTickTime || 0) >= effect.tickInterval * 1000) {
                  const damageFromBurn = effect.damagePerTick * effect.stacks;
                  enemy.hp -= damageFromBurn;
                  effect.lastTickTime = performance.now();

                  const burnText: FloatingText = {
                      id: `burn-${effect.id}-${performance.now()}`,
                      text: `${Math.round(damageFromBurn)}`,
                      x: enemy.x + enemy.width / 2,
                      y: enemy.y,
                      vy: -66, life: 0.6, initialLife: 0.6, color: "#FFA500", fontSize: 10,
                  };
                  setFloatingTexts(prev => [...prev, burnText]);

                  if (enemy.hp <= 0) {
                      handleEnemyDeath({...enemy});
                      enemyKilledByStatus = true;
                      break;
                  }
              }
          }
          remainingStatusEffects.push(effect);
      }
      enemy.statusEffects = remainingStatusEffects;
      if (enemyKilledByStatus) return;

      const enemyUpdateResult: EnemyUpdateResult = updateEnemy(
        enemy,
        playerRef.current,
        currentDeltaTime,
        gameContextForUpgrades.addEnemyProjectile,
        currentWave,
        playerProjectilesRef.current,
        () => {}, 
        enemy.enemyType === 'boss' ? enemiesRef.current : undefined
      );

      if (enemyUpdateResult.updatedEnemy.y < CANVAS_HEIGHT + enemyUpdateResult.updatedEnemy.height) {
        updatedEnemiesList.push(enemyUpdateResult.updatedEnemy);
      }
      if (enemyUpdateResult.enemiesToSpawn && enemyUpdateResult.enemiesToSpawn.length > 0) {
        newEnemiesFromBoss.push(...enemyUpdateResult.enemiesToSpawn);
      }
    });
    setEnemies(updatedEnemiesList);
    if (newEnemiesFromBoss.length > 0) {
      setEnemies(prev => [...prev, ...newEnemiesFromBoss]);
    }

    setTimeToNextWaveAction(prev => prev - currentDeltaTime);
    
    const activeBoss = enemiesRef.current.find(e => e.enemyType === 'boss');
    if (activeBoss) {
        if (activeBoss.showMinionWarningTimer && activeBoss.showMinionWarningTimer > 0) {
            setCenterScreenMessage({ text: `Chefe invocando em ${Math.ceil(activeBoss.showMinionWarningTimer)}s...`, duration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, initialDuration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, color: '#FFA500', fontSize: 20 });
        } else if (activeBoss.showMinionSpawnedMessageTimer && activeBoss.showMinionSpawnedMessageTimer > 0) {
             setCenterScreenMessage({ text: `Chefe invocou reforços!`, duration: WAVE_ANNOUNCEMENT_DURATION, initialDuration: WAVE_ANNOUNCEMENT_DURATION, color: '#FFA500', fontSize: 20 });
        }
    }


    if (waveStatus === 'intermissao') {
      if (timeToNextWaveAction <= 0) {
        const newWaveNumber = currentWave + 1;

        if (newWaveNumber > lastClearedWaveRef.current + 1 && lastClearedWaveRef.current !== 0 && !playerRef.current.isAdmin) {
            console.warn("Anti-Cheat: Pulo de wave detectado!");
            hasSkippedWaveRef.current = true;
            handleGameOver();
            return;
        }

        setCurrentWave(newWaveNumber);

        let numEnemies = INITIAL_WAVE_CONFIG.enemies + (newWaveNumber - 1) * WAVE_CONFIG_INCREMENTS.enemiesPerWave;
        if (playerRef.current.challengerHatMoreEnemies) {
            numEnemies *= 2;
        }
        if (ALL_BOSS_WAVES.includes(newWaveNumber)) {
            numEnemies = playerRef.current.challengerHatMoreEnemies ? 2 : 1;
        }
        setEnemiesToSpawnThisWave(numEnemies);

        setEnemiesSpawnedThisWaveCount(0);
        const spawnInterval = Math.max(
            WAVE_CONFIG_INCREMENTS.minSpawnInterval,
            INITIAL_WAVE_CONFIG.spawnInterval - (newWaveNumber - 1) * WAVE_CONFIG_INCREMENTS.spawnIntervalReduction
        );
        currentWaveConfigRef.current = { ...currentWaveConfigRef.current, spawnInterval };
        setTimeToNextWaveAction(spawnInterval);
        setWaveStatus('surgindo');
        setCenterScreenMessage({ text: `Wave ${newWaveNumber} Chegando...`, duration: WAVE_ANNOUNCEMENT_DURATION, initialDuration: WAVE_ANNOUNCEMENT_DURATION, color: '#00FFFF', fontSize: 24 });
      } else {
        setCenterScreenMessage({ text: `Próxima Wave em ${Math.ceil(timeToNextWaveAction)}s`, duration: INTERMISSION_COUNTDOWN_UPDATE_INTERVAL, initialDuration: INTERMISSION_COUNTDOWN_UPDATE_INTERVAL, color: '#00DDDD', fontSize: 20 });
      }
    } else if (waveStatus === 'surgindo') {
      if (timeToNextWaveAction <= 0 && enemiesSpawnedThisWaveCount < enemiesToSpawnThisWave) {
        const newEnemy = createEnemyOrBoss(currentWave, playerRef.current.level, CANVAS_WIDTH, () => {}); 
        setEnemies(prevE => [...prevE, newEnemy]);
        setEnemiesSpawnedThisWaveCount(prev => prev + 1);
        setTimeToNextWaveAction(currentWaveConfigRef.current.spawnInterval);
      }
      if (enemiesSpawnedThisWaveCount >= enemiesToSpawnThisWave) {
        setWaveStatus('lutando');
      }
    } else if (waveStatus === 'lutando') {
      const nonSummonedEnemies = enemiesRef.current.filter(e => !e.isSummonedByBoss).length;
      if (nonSummonedEnemies === 0 && enemiesSpawnedThisWaveCount >= enemiesToSpawnThisWave) {
        const newlyClearedWave = currentWave;
        setWaveStatus('intermissao');
        lastClearedWaveRef.current = newlyClearedWave;
        
        const intermission = INITIAL_WAVE_CONFIG.intermissionTime + (newlyClearedWave - 1) * WAVE_CONFIG_INCREMENTS.intermissionTimeIncrease;
        setTimeToNextWaveAction(intermission);
        setCenterScreenMessage({text: `Wave ${newlyClearedWave} Neutralizada!`, duration: WAVE_ANNOUNCEMENT_DURATION, initialDuration: WAVE_ANNOUNCEMENT_DURATION, color: '#39FF14', fontSize: 22 });
        setPlatforms(prevPlatforms => repositionAndResizeAllDynamicPlatforms(prevPlatforms));
        setPlayerProjectiles([]);
        setEnemyProjectiles([]);
          setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + p.maxHp * PLAYER_INTERMISSION_HEAL_PERCENT)}));
      }
    }

    setPlayerProjectiles(prev => updateProjectiles(prev, currentDeltaTime, true, enemiesRef.current, createParticleEffect, handleExplosion, CANVAS_WIDTH, CANVAS_HEIGHT));
    setEnemyProjectiles(prev => updateProjectiles(prev, currentDeltaTime, false, enemiesRef.current, createParticleEffect, handleExplosion, CANVAS_WIDTH, CANVAS_HEIGHT));

    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + (p.vx ?? 0) * currentDeltaTime,
      y: p.y + (p.vy ?? 0) * currentDeltaTime,
      life: p.life - currentDeltaTime,
      vy: (p.vy ?? 0) + (GRAVITY/ (p.particleType === 'player_double_jump' || p.particleType === 'player_land_dust' || p.particleType === 'coin_pickup' || p.particleType === 'dash_trail' ? 8 : 4) ) * currentDeltaTime 
    })).filter(p => p.life > 0));

    setFloatingTexts(prevTexts =>
      prevTexts.map(ft => ({
        ...ft,
        y: ft.y + ft.vy * currentDeltaTime,
        life: ft.life - currentDeltaTime,
      })).filter(ft => ft.life > 0)
    );

    setActiveLightningBolts(prevBolts =>
      prevBolts.map(bolt => ({...bolt, life: bolt.life - currentDeltaTime}))
               .filter(bolt => bolt.life > 0)
    );
    checkCollisions();
  }, [gameStateRef, checkCollisions, handleEnemyDeath, gameContextForUpgrades.addEnemyProjectile, currentWave, waveStatus, enemiesToSpawnThisWave, enemiesSpawnedThisWaveCount, timeToNextWaveAction, createParticleEffect, handleGameOver, handleExplosion, adminConfigRef, centerScreenMessage]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let shakeX = 0;
    let shakeY = 0;
    if (screenShake.active && canvasRef.current) {
        const elapsed = performance.now() - screenShake.startTime;
        if (elapsed < screenShake.duration) {
            const progress = elapsed / screenShake.duration;
            const currentIntensity = screenShake.intensity * (1 - progress); 
            shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
            shakeY = (Math.random() - 0.5) * 2 * currentIntensity;
            ctx.save(); // Save before shake translation
            ctx.translate(shakeX, shakeY);
        } else {
            setScreenShake(prev => ({ ...prev, active: false }));
        }
    }


    skillIconRectsOnCanvasRef.current = [];
    ctx.imageSmoothingEnabled = true; 

    ctx.fillStyle = '#030712'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    nebulae.forEach(nebula => {
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation + gameTime * 0.005); 
        const grad = ctx.createRadialGradient(0,0,0, 0,0, Math.max(nebula.radiusX, nebula.radiusY));
        grad.addColorStop(0, hexToRgba(nebula.color1, nebula.opacity * 0.7));
        grad.addColorStop(0.5, hexToRgba(nebula.color1, nebula.opacity * 0.4));
        grad.addColorStop(1, hexToRgba(nebula.color2, nebula.opacity * 0.1));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0,0, nebula.radiusX, nebula.radiusY, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });

    stars.forEach(star => {
        const currentOpacity = star.baseOpacity + Math.sin(gameTime * star.twinkleSpeed + star.x) * (star.baseOpacity * 0.5);
        ctx.fillStyle = `rgba(220, 220, 255, ${Math.max(0.1, currentOpacity)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });


    if (gameStateRef.current !== GameState.StartMenu &&
        gameStateRef.current !== GameState.SkillsInfo &&
        gameStateRef.current !== GameState.Leaderboard &&
        gameStateRef.current !== GameState.DebugMenu &&
        gameStateRef.current !== GameState.ActiveSkillsDisplay &&
        gameStateRef.current !== GameState.CharacterSelection &&
        gameStateRef.current !== GameState.Shop &&
        gameStateRef.current !== GameState.CosmeticSelectionModal
      ) {
        platforms.forEach(p => { 
            if (!p.isVisible || p.currentAlpha < 0.1) return; 
            ctx.globalAlpha = p.currentAlpha;
            ctx.imageSmoothingEnabled = true;

            if (p.id === 'ground') {
                drawGroundPlatformCanvas(ctx, p, gameTime);
            } else {
                drawDynamicPlatformCanvas(ctx, p, gameTime);
            }
            ctx.globalAlpha = 1;
        });

        if (gameStateRef.current === GameState.Playing && displayedSkills.length > 0) {
            const groundPlatform = platforms.find(p => p.id === 'ground');
            if (groundPlatform) {
                let currentX = groundPlatform.x + 30; 
                const iconCharSize = 26; 
                const internalPadding = 6; 
                const iconBoxBorder = 2; 
                const spacingBetweenIconAndCount = 7;
                const spacingBetweenSkills = 14;
                const skillBgColor = 'rgba(10, 20, 40, 0.7)'; 
                const skillBorderColor = '#00FFFF'; 
                const countTextColor = '#F0E68C'; 
                const countFontSize = 11; 

                displayedSkills.forEach(skill => {
                    ctx.textAlign = 'left';
                    ctx.font = `${iconCharSize}px Arial`; 
                    const iconMetrics = ctx.measureText(skill.icon);
                    const iconCharActualWidth = iconMetrics.width;

                    let countText = "";
                    let countTextActualWidth = 0;
                    if (skill.count > 1) {
                        countText = `x${skill.count}`;
                        ctx.font = `bold ${countFontSize}px ${PIXEL_FONT_FAMILY}`;
                        const countTextMetrics = ctx.measureText(countText);
                        countTextActualWidth = countTextMetrics.width;
                    }

                    const baseContentActualWidth = iconCharActualWidth + (countTextActualWidth > 0 ? spacingBetweenIconAndCount + countTextActualWidth : 0);
                    const grayBgWidth = baseContentActualWidth + internalPadding * 2;
                    const grayBgHeight = iconCharSize + 2 * internalPadding;

                    const totalElementWidth = grayBgWidth + 2 * iconBoxBorder;
                    const totalElementHeight = grayBgHeight + 2 * iconBoxBorder;

                    const overallElementY = groundPlatform.y + Math.round((groundPlatform.height - totalElementHeight) / 2) - 5; 

                    ctx.shadowColor = skillBorderColor;
                    ctx.shadowBlur = 5;
                    ctx.strokeStyle = skillBorderColor;
                    ctx.lineWidth = iconBoxBorder;
                    ctx.strokeRect(currentX, overallElementY, totalElementWidth, totalElementHeight);
                    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;


                    ctx.fillStyle = skillBgColor;
                    ctx.fillRect(currentX + iconBoxBorder, overallElementY + iconBoxBorder, grayBgWidth, grayBgHeight);

                    ctx.font = `${iconCharSize}px Arial`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = 'white';
                    const iconRenderX = currentX + iconBoxBorder + internalPadding;
                    const contentRenderY = overallElementY + iconBoxBorder + grayBgHeight / 2;
                    ctx.fillText(skill.icon, iconRenderX, contentRenderY);

                    if (countTextActualWidth > 0) {
                        ctx.font = `bold ${countFontSize}px ${PIXEL_FONT_FAMILY}`;
                        ctx.textAlign = 'left';
                        ctx.fillStyle = countTextColor;
                        const countRenderX = iconRenderX + iconCharActualWidth + spacingBetweenIconAndCount;
                        ctx.fillText(countText, countRenderX, contentRenderY);
                    }

                    const iconRectForHover = {
                        x: currentX,
                        y: overallElementY,
                        w: totalElementWidth,
                        h: totalElementHeight
                    };
                    skillIconRectsOnCanvasRef.current.push({ id: skill.id, name: skill.name, rect: iconRectForHover });

                    currentX += totalElementWidth + spacingBetweenSkills;
                });
            }
        }

        const currentPlayer = playerRef.current;

        ctx.save(); // Save before potential player alpha change for blinking
        if (currentPlayer.isInvincible && currentPlayer.invincibilityDuration === 500) { // Standard hit invincibility
            if (Math.floor(gameTime * 15) % 2 === 0) { // Blink ~7.5 times per second
                ctx.globalAlpha = 0.35; 
            } else {
                ctx.globalAlpha = 0.85; 
            }
        } else {
            ctx.globalAlpha = 1.0;
        }

        drawPlayerCanvas(ctx, currentPlayer, gameTime); 

        if (currentPlayer.selectedHatId) {
            const hatItem = ALL_HATS_SHOP.find(h => h.id === currentPlayer.selectedHatId);
            if (hatItem) {
                drawHatCanvas(ctx, hatItem, currentPlayer, gameTime); 
            }
        }
        
        if (currentPlayer.selectedStaffId) {
            const staffItem = ALL_STAFFS_SHOP.find(s => s.id === currentPlayer.selectedStaffId);
            if (staffItem) {
                drawStaffCanvas(
                    ctx, 
                    staffItem, 
                    currentPlayer, 
                    gameTime, 
                    mouseStateRef.current, 
                    canvasRef.current ? canvasRef.current.getBoundingClientRect() : null,
                    CANVAS_WIDTH,
                    CANVAS_HEIGHT
                ); 
            }
        }

        ctx.restore(); // Restore alpha after player, hat, staff

        if (currentPlayer.shieldMaxHp && currentPlayer.shieldCurrentHp && currentPlayer.shieldCurrentHp > 0) {
            const shieldCenterX = currentPlayer.x + currentPlayer.width / 2;
            const shieldCenterY = currentPlayer.y + currentPlayer.height / 2;
            const shieldRadius = Math.max(currentPlayer.width, currentPlayer.height) * 0.7;
            const shieldStrengthAlpha = 0.5 + (currentPlayer.shieldCurrentHp / currentPlayer.shieldMaxHp) * 0.5;

            const pulse = Math.sin(gameTime * 5) * 0.1 + 0.9;
            ctx.strokeStyle = `rgba(0, 220, 255, ${shieldStrengthAlpha * 0.9 * pulse})`; 
            ctx.lineWidth = 3 + Math.sin(gameTime*5 + Math.PI/2)*1; 
            ctx.shadowColor = `rgba(0, 220, 255, ${shieldStrengthAlpha * 0.7})`;
            ctx.shadowBlur = 10 + Math.sin(gameTime*5)*3;
            ctx.beginPath();
            ctx.arc(shieldCenterX, shieldCenterY, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            const gradient = ctx.createRadialGradient(
                shieldCenterX, shieldCenterY, shieldRadius * 0.5, 
                shieldCenterX, shieldCenterY, shieldRadius       
            );
            gradient.addColorStop(0, `rgba(0, 180, 220, ${shieldStrengthAlpha * 0.1 * pulse})`);
            gradient.addColorStop(1, `rgba(0, 180, 220, ${shieldStrengthAlpha * 0.3 * pulse})`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(shieldCenterX, shieldCenterY, shieldRadius, 0, Math.PI * 2);
            ctx.fill();
             ctx.lineWidth = 1; 
        }

        enemiesRef.current.forEach(enemy => {
          if (!enemy) return;
          const centerX = enemy.x + enemy.width / 2;
          const centerY = enemy.y + enemy.height / 2;
          let effectiveEnemyColor = enemy.color; 
          const isChilled = enemy.statusEffects.some(se => se.type === 'chill' && se.duration > 0);
        
          if (isChilled) effectiveEnemyColor = '#00FFFF'; 
          if (enemy.isSummonedByBoss) effectiveEnemyColor = '#7777AA'; 

          ctx.save(); 
          ctx.translate(centerX, centerY);
          ctx.imageSmoothingEnabled = true; 

          switch (enemy.visualVariant) {
            case 'cyclops':
                drawCyclopsAlienCanvas(ctx, enemy, effectiveEnemyColor);
                break;
            case 'green_classic':
                drawGreenClassicAlienCanvas(ctx, enemy, effectiveEnemyColor);
                break;
            case 'spiky':
                drawSpikyAlienCanvas(ctx, enemy, effectiveEnemyColor);
                break;
            case 'multi_tentacle':
                drawMultiTentacleAlienCanvas(ctx, enemy, effectiveEnemyColor);
                break;
            case 'three_eyed_boss':
                drawThreeEyedBossAlienCanvas(ctx, enemy, effectiveEnemyColor);
                break;
            default: 
                ctx.fillStyle = effectiveEnemyColor;
                ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                break;
          }
          ctx.restore(); 

          const hpBarY = enemy.y - (enemy.enemyType === 'boss' ? 18 : 12); 
          const hpBarWidth = enemy.width;
          const hpBarHeight = enemy.enemyType === 'boss' ? 9 : 6;
          ctx.fillStyle = 'rgba(0,0,20,0.7)'; 
          ctx.fillRect(enemy.x, hpBarY, hpBarWidth, hpBarHeight);
          ctx.fillStyle = enemy.inFuryMode ? '#FF00FF' : (isChilled ? '#00FFFF' : '#39FF14'); 
          ctx.fillRect(enemy.x, hpBarY, hpBarWidth * (enemy.hp / enemy.maxHp), hpBarHeight);
          ctx.strokeStyle = '#00AAAA'; 
          ctx.strokeRect(enemy.x, hpBarY, hpBarWidth, hpBarHeight);

          enemy.statusEffects.forEach(effect => {
            if (effect.type === 'burn' && Math.random() < 0.2) {
                 createParticleEffect(
                    enemy.x + Math.random() * enemy.width,
                    enemy.y + Math.random() * enemy.height,
                    1,
                    `rgba(255, ${Math.random()*100 + 100}, 0, ${0.6 + Math.random()*0.3})`, 
                    10, 30 * 2.2, 0.25 + Math.random() * 0.2, 'status_burn'
                );
            } else if (effect.type === 'chill' && Math.random() < 0.15) {
                 createParticleEffect(
                    enemy.x + Math.random() * enemy.width,
                    enemy.y + Math.random() * enemy.height,
                    1,
                     `rgba(0, 220, 255, ${0.5 + Math.random()*0.3})`, 
                    12, 20 * 2.2, 0.35 + Math.random() * 0.2, 'status_chill'
                );
            }
          });
        });

        playerProjectiles.forEach(p => {
          drawProjectileCanvas(ctx, p, gameTime);
        });

        enemyProjectiles.forEach(p => {
          const eCenterX = p.x + p.width / 2;
          const eCenterY = p.y + p.height / 2;
          const coreRadius = p.width * 0.25; 
          const glowRadius = p.width * 0.45; 
          
          const enemyProjColor = '#FF00AA'; 
          ctx.shadowColor = enemyProjColor; ctx.shadowBlur = 5;
          ctx.fillStyle = hexToRgba(enemyProjColor, 0.5);
          ctx.beginPath();
          ctx.arc(eCenterX, eCenterY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = enemyProjColor;
          ctx.beginPath();
          ctx.arc(eCenterX, eCenterY, coreRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        });

        particles.forEach(p => {
            const alpha = Math.max(0, (p.initialLife && p.life > 0 ? p.life / p.initialLife : 0.5));
            const radius = p.width / 2; 
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
        
            switch (p.particleType) {
                case 'explosion':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius * (1 + (1 - alpha) * 2), 0, Math.PI * 2); 
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                    break;
                case 'status_burn':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius * (0.5 + Math.random() * 0.5), 0, Math.PI * 2); 
                    ctx.fill();
                    break;
                case 'status_chill':
                    const numShards = 3 + Math.floor(Math.random() * 2);
                    ctx.beginPath();
                    for(let i=0; i < numShards; i++){
                        const angle = (i/numShards) * Math.PI*2 + p.rotation!;
                        const length = radius * (0.7 + Math.random()*0.3);
                        ctx.moveTo(p.x + Math.cos(angle)*length*0.3, p.y + Math.sin(angle)*length*0.3);
                        ctx.lineTo(p.x + Math.cos(angle)*length, p.y + Math.sin(angle)*length);
                    }
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = radius*0.2;
                    ctx.stroke();
                    break;
                case 'coin_pickup':
                    ctx.font = `bold ${radius*2}px ${PIXEL_FONT_FAMILY}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💰', p.x, p.y);
                    break;
                case 'dash_trail':
                     ctx.beginPath();
                     ctx.ellipse(p.x, p.y, radius * (1 + Math.random()*0.5), radius * (0.5 + Math.random()*0.3), Math.random() * Math.PI, 0, Math.PI * 2);
                     ctx.fill();
                    break;
                case 'player_double_jump':
                case 'player_land_dust':
                case 'shield_hit':
                case 'generic': 
                default:
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            ctx.globalAlpha = 1;
        });

        activeLightningBolts.forEach(bolt => {
            const alpha = Math.max(0, bolt.life / bolt.initialLife);
            const numSegments = 5; 
            const segmentLengthX = (bolt.endX - bolt.startX) / numSegments;
            const segmentLengthY = (bolt.endY - bolt.startY) / numSegments;
            const maxPerpendicularOffset = 15; 

            ctx.lineCap = 'round'; 
            const boltPath = new Path2D();
            boltPath.moveTo(bolt.startX, bolt.startY);
            for (let i = 1; i < numSegments; i++) {
                const nodeX = bolt.startX + segmentLengthX * i;
                const nodeY = bolt.startY + segmentLengthY * i;
                let dxSeg = segmentLengthX; let dySeg = segmentLengthY;
                const lenSeg = Math.sqrt(dxSeg*dxSeg + dySeg*dySeg) || 1;
                dxSeg /= lenSeg; dySeg /= lenSeg;
                const perpX = -dySeg; const perpY = dxSeg;
                const offsetMagnitude = (Math.random() - 0.5) * 2 * maxPerpendicularOffset * (1 - Math.abs(i - numSegments/2)/(numSegments/2));
                boltPath.lineTo(nodeX + perpX * offsetMagnitude, nodeY + perpY * offsetMagnitude);
            }
            boltPath.lineTo(bolt.endX, bolt.endY);
            
            ctx.lineWidth = 18 + Math.random() * 12;
            ctx.strokeStyle = `rgba(0, 220, 255, ${alpha * 0.15 * (0.4 + Math.random() * 0.4)})`; 
            ctx.stroke(boltPath);
            ctx.lineWidth = 7 + Math.random() * 5; 
            ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.4 * (0.5 + Math.random() * 0.4)})`; 
            ctx.stroke(boltPath);
            ctx.lineWidth = 2.5 + Math.random() * 2; 
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9 * (0.7 + Math.random() * 0.3)})`;
            ctx.stroke(boltPath);
        });

        floatingTexts.forEach(ft => {
          const alpha = Math.max(0, ft.life / ft.initialLife);
          ctx.font = `bold ${ft.fontSize}px ${PIXEL_FONT_FAMILY}`;
          ctx.textAlign = 'center';
          let r = 255, g = 255, b = 255; 
            if (ft.color === 'red' || ft.color === '#FF00FF') { r = 255; g = 0; b = 255; } 
            else if (ft.color === '#FFA500' || ft.color === '#FF8C00') { r = 255; g = 165; b = 0; } 
            else if (ft.color === '#00FFFF' || ft.color === '#ADD8E6') { r = 0; g = 255; b = 255; } 
            else if (ft.color === '#FFD700' || ft.color === '#FFDF00') { r = 255; g = 215; b = 0; }
            else if (ft.color === '#FFFFFF') { r = 255; g = 255; b = 255; }
          ctx.fillStyle = `rgba(${r},${g},${b}, ${alpha})`;
          ctx.shadowColor = `rgba(${r},${g},${b}, ${alpha*0.7})`;
          ctx.shadowBlur = 3;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        });

        const BAR_WIDTH = 200 * (CANVAS_WIDTH / 1100);
        const BAR_HEIGHT = 18 * (CANVAS_HEIGHT / 650);
        const BAR_X = 20 * (CANVAS_WIDTH / 1100);
        const BAR_Y_OFFSET_HP = 15 * (CANVAS_HEIGHT / 650);
        const BAR_Y_OFFSET_EXP = 45 * (CANVAS_HEIGHT / 650);
        const BAR_BORDER = 2;
        const FONT_SIZE_SMALL = Math.round(9 * Math.min(CANVAS_WIDTH / 1100, CANVAS_HEIGHT / 650));
        const FONT_SIZE_MEDIUM = Math.round(11 * Math.min(CANVAS_WIDTH / 1100, CANVAS_HEIGHT / 650));
        const FONT_SIZE_LARGE = Math.round(18 * Math.min(CANVAS_WIDTH / 1100, CANVAS_HEIGHT / 650));
        const HUD_TEXT_COLOR = '#E0FFFF'; 
        const HP_BAR_COLOR = '#FF007F'; 
        const EXP_BAR_COLOR = '#00FFFF'; 
        const BAR_BG_COLOR = 'rgba(10, 20, 50, 0.7)'; 
        const BAR_BORDER_COLOR = '#4A00E0'; 

        ctx.fillStyle = BAR_BG_COLOR;
        ctx.fillRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_HP - BAR_BORDER, BAR_WIDTH + BAR_BORDER*2, BAR_HEIGHT + BAR_BORDER*2);
        ctx.fillStyle = HP_BAR_COLOR;
        ctx.fillRect(BAR_X, BAR_Y_OFFSET_HP, BAR_WIDTH * (currentPlayer.hp / currentPlayer.maxHp), BAR_HEIGHT);
        ctx.strokeStyle = BAR_BORDER_COLOR; ctx.lineWidth = BAR_BORDER;
        ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = 4;
        ctx.strokeRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_HP - BAR_BORDER, BAR_WIDTH + BAR_BORDER*2, BAR_HEIGHT + BAR_BORDER*2);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.fillStyle = HUD_TEXT_COLOR; ctx.font = `${FONT_SIZE_SMALL}px ${PIXEL_FONT_FAMILY}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(currentPlayer.hp)} / ${currentPlayer.maxHp}`, BAR_X + BAR_WIDTH / 2, BAR_Y_OFFSET_HP + BAR_HEIGHT / 2);

        ctx.fillStyle = BAR_BG_COLOR;
        ctx.fillRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_EXP - BAR_BORDER, BAR_WIDTH + BAR_BORDER*2, BAR_HEIGHT + BAR_BORDER*2);
        ctx.fillStyle = EXP_BAR_COLOR;
        ctx.fillRect(BAR_X, BAR_Y_OFFSET_EXP, BAR_WIDTH * (currentPlayer.exp / currentPlayer.xpToNextLevel), BAR_HEIGHT);
        ctx.strokeStyle = BAR_BORDER_COLOR; ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = 4;
        ctx.strokeRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_EXP - BAR_BORDER, BAR_WIDTH + BAR_BORDER*2, BAR_HEIGHT + BAR_BORDER*2);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.fillStyle = '#0A0F1A'; 
        ctx.fillText(`EXP: ${currentPlayer.exp}/${currentPlayer.xpToNextLevel}`, BAR_X + BAR_WIDTH / 2, BAR_Y_OFFSET_EXP + BAR_HEIGHT / 2);
        
        const COIN_TEXT_Y = 120 * (CANVAS_HEIGHT / 650);
        ctx.font = `bold ${FONT_SIZE_MEDIUM}px ${PIXEL_FONT_FAMILY}`;
        ctx.fillStyle = '#FFD700'; 
        ctx.textAlign = 'left';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 3;
        ctx.fillText(`Moedas: ${playerCoins} 💰`, BAR_X, COIN_TEXT_Y);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;


        const TEXT_Y_LEVEL = 75 * (CANVAS_HEIGHT / 650);
        const TEXT_Y_NICKNAME = 90 * (CANVAS_HEIGHT / 650);
        const TEXT_Y_ADMIN_TAG = 105 * (CANVAS_HEIGHT / 650);
        const DASH_COOLDOWN_BAR_Y = TEXT_Y_ADMIN_TAG + 30 * (CANVAS_HEIGHT / 650); 

        ctx.textBaseline = 'alphabetic'; ctx.fillStyle = HUD_TEXT_COLOR;
        ctx.font = `${FONT_SIZE_MEDIUM}px ${PIXEL_FONT_FAMILY}`; ctx.textAlign = 'left';
        ctx.shadowColor = HUD_TEXT_COLOR; ctx.shadowBlur = 3;
        ctx.fillText(`Nvl: ${currentPlayer.level}`, BAR_X, TEXT_Y_LEVEL);
        ctx.fillText(`${currentPlayer.nickname}`, BAR_X, TEXT_Y_NICKNAME);
        if (currentPlayer.isAdmin) {
          ctx.fillStyle = '#FFD700'; 
          ctx.shadowColor = '#FFD700';
          ctx.fillText(`(Debug)`, BAR_X, TEXT_Y_ADMIN_TAG);
        }
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        if (currentPlayer.hasDashSkill) {
            const dashCooldownBarWidth = BAR_WIDTH * 0.6; 
            const dashCooldownBarHeight = BAR_HEIGHT * 0.8;

            ctx.fillStyle = BAR_BG_COLOR;
            ctx.fillRect(BAR_X - BAR_BORDER, DASH_COOLDOWN_BAR_Y - BAR_BORDER, dashCooldownBarWidth + BAR_BORDER * 2, dashCooldownBarHeight + BAR_BORDER * 2);

            const dashReady = performance.now() - (currentPlayer.lastDashTimestamp || 0) > (currentPlayer.dashCooldownTime || 30) * 1000;
            let dashProgress = 1;
            if (!dashReady) {
                dashProgress = (performance.now() - (currentPlayer.lastDashTimestamp || 0)) / ((currentPlayer.dashCooldownTime || 30) * 1000);
            }

            ctx.fillStyle = dashReady ? '#00FF7F' : '#FFD700'; 
            ctx.fillRect(BAR_X, DASH_COOLDOWN_BAR_Y, dashCooldownBarWidth * dashProgress, dashCooldownBarHeight);

            ctx.strokeStyle = BAR_BORDER_COLOR; ctx.lineWidth = BAR_BORDER;
            ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = 3;
            ctx.strokeRect(BAR_X - BAR_BORDER, DASH_COOLDOWN_BAR_Y - BAR_BORDER, dashCooldownBarWidth + BAR_BORDER * 2, dashCooldownBarHeight + BAR_BORDER * 2);
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            ctx.fillStyle = dashReady ? '#0A0F1A' : HUD_TEXT_COLOR;
            ctx.font = `${FONT_SIZE_SMALL -1}px ${PIXEL_FONT_FAMILY}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const dashCooldownRemaining = (((currentPlayer.dashCooldownTime || 30) * 1000 - (performance.now() - (currentPlayer.lastDashTimestamp || 0)))/1000);
            ctx.fillText(dashReady ? "Dash!" : `Espera: ${Math.max(0, dashCooldownRemaining).toFixed(1)}s`, BAR_X + dashCooldownBarWidth / 2, DASH_COOLDOWN_BAR_Y + dashCooldownBarHeight / 2);
        }


        const TEXT_Y_WAVE_INFO_TOP = 28 * (CANVAS_HEIGHT / 650);
        const TEXT_Y_TIME_INFO_TOP = 50 * (CANVAS_HEIGHT / 650);
        ctx.textAlign = 'right'; ctx.fillStyle = HUD_TEXT_COLOR;
        ctx.font = `${FONT_SIZE_MEDIUM}px ${PIXEL_FONT_FAMILY}`;
        ctx.shadowColor = HUD_TEXT_COLOR; ctx.shadowBlur = 3;
        ctx.fillText(`Wave: ${currentWave > 0 ? currentWave : '-'}`, CANVAS_WIDTH - 20 * (CANVAS_WIDTH/1100), TEXT_Y_WAVE_INFO_TOP);
        ctx.fillText(`Tempo: ${Math.floor(gameTime)}s`, CANVAS_WIDTH - 20 * (CANVAS_WIDTH/1100), TEXT_Y_TIME_INFO_TOP);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        if (centerScreenMessage) {
            const FONT_SIZE_CENTER = centerScreenMessage.fontSize || FONT_SIZE_LARGE;
            ctx.font = `bold ${FONT_SIZE_CENTER}px ${PIXEL_FONT_FAMILY}`;
            ctx.textAlign = 'center';
            const alpha = Math.min(1, Math.max(0, centerScreenMessage.duration / centerScreenMessage.initialDuration));
            const messageColor = centerScreenMessage.color || '#00FFFF'; 
            ctx.fillStyle = hexToRgba(messageColor, 0.9 * alpha);
            ctx.shadowColor = hexToRgba(messageColor, 0.7 * alpha); 
            ctx.shadowBlur = 5;
            ctx.fillText(centerScreenMessage.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60 * (CANVAS_HEIGHT / 650));
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        }

        const WAVE_PROGRESS_BAR_WIDTH = CANVAS_WIDTH * 0.4;
        const WAVE_PROGRESS_BAR_HEIGHT = 18 * (CANVAS_HEIGHT / 650);
        const WAVE_PROGRESS_BAR_X = (CANVAS_WIDTH - WAVE_PROGRESS_BAR_WIDTH) / 2;
        const WAVE_PROGRESS_BAR_Y = 15 * (CANVAS_HEIGHT / 650); 
        const WAVE_PROGRESS_BAR_BG_COLOR = 'rgba(10, 20, 50, 0.7)';
        const WAVE_PROGRESS_BAR_FILL_COLOR = '#00FFFF'; 
        const WAVE_PROGRESS_BAR_BORDER_COLOR = '#4A00E0'; 
        const WAVE_PROGRESS_BAR_BORDER_WIDTH = 2;
        const WAVE_PROGRESS_TEXT_COLOR = '#E0FFFF';
        const WAVE_PROGRESS_FONT_SIZE = FONT_SIZE_SMALL;

        if (waveStatus === 'lutando' && currentWave > 0) {
            const totalNonSummonedEnemiesInWave = enemiesToSpawnThisWave;
            const currentNonSummonedEnemies = enemiesRef.current.filter(e => !e.isSummonedByBoss).length;
            let waveProgressPercentage = 0;
            if (totalNonSummonedEnemiesInWave > 0) {
                waveProgressPercentage = (totalNonSummonedEnemiesInWave - currentNonSummonedEnemies) / totalNonSummonedEnemiesInWave;
            }
            waveProgressPercentage = Math.max(0, Math.min(1, waveProgressPercentage));

            ctx.fillStyle = WAVE_PROGRESS_BAR_BG_COLOR;
            ctx.fillRect(WAVE_PROGRESS_BAR_X, WAVE_PROGRESS_BAR_Y, WAVE_PROGRESS_BAR_WIDTH, WAVE_PROGRESS_BAR_HEIGHT);

            ctx.fillStyle = WAVE_PROGRESS_BAR_FILL_COLOR;
            ctx.fillRect(WAVE_PROGRESS_BAR_X, WAVE_PROGRESS_BAR_Y, WAVE_PROGRESS_BAR_WIDTH * waveProgressPercentage, WAVE_PROGRESS_BAR_HEIGHT);

            ctx.strokeStyle = WAVE_PROGRESS_BAR_BORDER_COLOR;
            ctx.lineWidth = WAVE_PROGRESS_BAR_BORDER_WIDTH;
            ctx.shadowColor = WAVE_PROGRESS_BAR_BORDER_COLOR;
            ctx.shadowBlur = 5;
            ctx.strokeRect(WAVE_PROGRESS_BAR_X - WAVE_PROGRESS_BAR_BORDER_WIDTH / 2, 
                           WAVE_PROGRESS_BAR_Y - WAVE_PROGRESS_BAR_BORDER_WIDTH / 2, 
                           WAVE_PROGRESS_BAR_WIDTH + WAVE_PROGRESS_BAR_BORDER_WIDTH, 
                           WAVE_PROGRESS_BAR_HEIGHT + WAVE_PROGRESS_BAR_BORDER_WIDTH);
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
            ctx.lineWidth = 1; 

            ctx.font = `${WAVE_PROGRESS_FONT_SIZE}px ${PIXEL_FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = WAVE_PROGRESS_TEXT_COLOR;
            ctx.fillText(`Progresso da Wave: ${Math.round(waveProgressPercentage * 100)}%`, WAVE_PROGRESS_BAR_X + WAVE_PROGRESS_BAR_WIDTH / 2, WAVE_PROGRESS_BAR_Y + WAVE_PROGRESS_BAR_HEIGHT / 2);
            ctx.textBaseline = 'alphabetic'; 

        } 
        
        if(canvasRef.current && gameStateRef.current === GameState.Playing) {
            const rect = canvasRef.current.getBoundingClientRect();
            const displayMouseX = (mouseStateRef.current.x - rect.left) * (canvasRef.current.width / rect.width);
            const displayMouseY = (mouseStateRef.current.y - rect.top) * (canvasRef.current.height / rect.height);

            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; 
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(displayMouseX - 10, displayMouseY);
            ctx.lineTo(displayMouseX + 10, displayMouseY);
            ctx.moveTo(displayMouseX, displayMouseY - 10);
            ctx.lineTo(displayMouseX, displayMouseY + 10);
            ctx.stroke();
        }

        if (hoveredSkillTooltip && gameStateRef.current === GameState.Playing) {
          ctx.font = `bold ${FONT_SIZE_SMALL}px ${PIXEL_FONT_FAMILY}`;
          const textMetrics = ctx.measureText(hoveredSkillTooltip.name);
          const tooltipWidth = textMetrics.width + 10 * (CANVAS_WIDTH/1100);
          const tooltipHeight = 18 * (CANVAS_HEIGHT/650);
          let tooltipX = hoveredSkillTooltip.x;
          let tooltipY = hoveredSkillTooltip.y - tooltipHeight - 5 * (CANVAS_HEIGHT/650);

          if (tooltipX + tooltipWidth > CANVAS_WIDTH) tooltipX = CANVAS_WIDTH - tooltipWidth - 2;
          if (tooltipY < 0) tooltipY = hoveredSkillTooltip.y + 15 * (CANVAS_HEIGHT/650);

          ctx.fillStyle = 'rgba(5, 10, 30, 0.9)'; 
          ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#E0FFFF'; 
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(hoveredSkillTooltip.name, tooltipX + 5 * (CANVAS_WIDTH/1100), tooltipY + tooltipHeight / 2);
      }
      ctx.textBaseline = 'alphabetic';
    }

    if (screenShake.active && (shakeX !== 0 || shakeY !== 0)) {
        ctx.restore(); // Restore from shake translation
    }

  }, [gameTime, gameStateRef, platforms, centerScreenMessage, currentWave, stars, nebulae, timeToNextWaveAction, waveStatus, playerProjectiles, enemyProjectiles, particles, activeLightningBolts, displayedSkills, hoveredSkillTooltip, floatingTexts, createParticleEffect, isMuted, volume, enemiesToSpawnThisWave, playerCoins, screenShake]); 

  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      if (gameStateRef.current === GameState.Playing) {
        update(deltaTime); 
      } else {
        lastFrameTimeRef.current = performance.now();
      }
      draw();

      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [update, draw]);

  useEffect(() => {
    const s: Star[] = [];
    for (let i = 0; i < 200 * (CANVAS_WIDTH/1100); i++) { 
        const baseOpacity = Math.random() * 0.4 + 0.2;
        s.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 0.5, 
            opacity: baseOpacity, 
            baseOpacity: baseOpacity, 
            twinkleSpeed: Math.random() * 2 + 0.5 
        });
    }
    setStars(s);

    const n: Nebula[] = [];
    const nebulaColors = [
        {c1: '#4A00E0', c2: '#8E44AD'}, 
        {c1: '#004D40', c2: '#00796B'}, 
        {c1: '#880E4F', c2: '#C2185B'}, 
    ];
    for (let i=0; i < 3; i++) { 
        const colorPair = nebulaColors[i % nebulaColors.length];
        n.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            radiusX: CANVAS_WIDTH * (0.2 + Math.random()*0.3),
            radiusY: CANVAS_HEIGHT * (0.2 + Math.random()*0.3),
            color1: colorPair.c1,
            color2: colorPair.c2,
            opacity: 0.1 + Math.random() * 0.1,
            rotation: Math.random() * Math.PI * 2,
        });
    }
    setNebulae(n);

  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCanvasFocused = document.activeElement === canvasRef.current;

      if (e.key === ' ' || e.key.toLowerCase() === 'shift') {
        if (gameStateRef.current === GameState.Playing || isCanvasFocused) {
          e.preventDefault();
        }
      }

      if (e.key.toLowerCase() === 'p') { 
        if (gameStateRef.current === GameState.Playing || gameStateRef.current === GameState.Paused) {
            previousGameStateRef.current = gameStateRef.current; 
            setGameState(prev => {
              if (prev === GameState.Playing) return GameState.Paused;
              if (prev === GameState.Paused) return GameState.Playing;
              return prev;
            });
        }
        return; 
      }
      
      if (!isCanvasFocused && gameStateRef.current === GameState.Playing) return;

      if (gameStateRef.current === GameState.Playing) {
        if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
        if (e.key === 'd' || e.key === 'D') keysRef.current.d = true;
        if (e.key === ' ' && isCanvasFocused) keysRef.current.space = true;
        if (e.key.toLowerCase() === 'shift' && isCanvasFocused && playerRef.current.hasDashSkill) keysRef.current.shift = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const isCanvasFocused = document.activeElement === canvasRef.current;
      if (!isCanvasFocused && gameStateRef.current === GameState.Playing && e.key.toLowerCase() !== 'p') return;

      if (gameStateRef.current === GameState.Playing || e.key.toLowerCase() === 'p') { 
        if (e.key === 'a' || e.key === 'A') keysRef.current.a = false;
        if (e.key === 'd' || e.key === 'D') keysRef.current.d = false;
        if (e.key === ' ') keysRef.current.space = false;
        if (e.key.toLowerCase() === 'shift') keysRef.current.shift = false;
      }
    };

    const handleCanvasMouseInteraction = (e: MouseEvent, isDown: boolean) => {
        if (e.target !== canvasRef.current) return;

        if (isDown) { 
            mouseStateRef.current.x = e.clientX; 
            mouseStateRef.current.y = e.clientY;
            if (gameStateRef.current === GameState.Playing) {
                 mouseStateRef.current.isDown = true;
            }
        } else { 
            mouseStateRef.current.isDown = false;
        }
    };
    
    const handleCanvasMouseMove = (e: MouseEvent) => {
        mouseStateRef.current.x = e.clientX; 
        mouseStateRef.current.y = e.clientY;
    };
    
    const onMouseDown = (e: MouseEvent) => handleCanvasMouseInteraction(e, true);
    const onMouseUp = (e: MouseEvent) => handleCanvasMouseInteraction(e, false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleCanvasMouseMove); 
    canvasRef.current?.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
    };
  }, [isDraggingVolumeSlider, handleToggleMute, handleVolumeChange]); 

  const applyPermanentSkillEffectsToPlayer = (p: Player): Player => {
    let tempPlayer = {...p};
    // Reset effects that might be from skills before reapplying
    tempPlayer.canDoubleJump = false;
    tempPlayer.hasDashSkill = false;
    tempPlayer.dashCooldownTime = 30; // Default if somehow no skill level found
    tempPlayer.xpBonus = 1; // Default 100%
    tempPlayer.coinDropBonus = 0; // Default 0%

    // Double Jump
    const doubleJumpLevel = getPermanentSkillLevel(SKILL_ID_DOUBLE_JUMP);
    if (doubleJumpLevel > 0) {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s => s.id === SKILL_ID_DOUBLE_JUMP);
        skillDef?.levels[0]?.applyEffect(tempPlayer);
    }

    // Dash
    const dashLevel = getPermanentSkillLevel(SKILL_ID_DASH);
    if (dashLevel > 0) {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s => s.id === SKILL_ID_DASH);
        const levelDef = skillDef?.levels.find(l => l.level === dashLevel);
        levelDef?.applyEffect(tempPlayer);
    }
    
    // XP Boost
    const xpBoostLevel = getPermanentSkillLevel(SKILL_ID_XP_BOOST);
    if (xpBoostLevel > 0) {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s => s.id === SKILL_ID_XP_BOOST);
        const levelDef = skillDef?.levels.find(l => l.level === xpBoostLevel);
        levelDef?.applyEffect(tempPlayer);
    }

    // Coin Magnet
    const coinMagnetLevel = getPermanentSkillLevel(SKILL_ID_COIN_MAGNET);
    if (coinMagnetLevel > 0) {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s => s.id === SKILL_ID_COIN_MAGNET);
        const levelDef = skillDef?.levels.find(l => l.level === coinMagnetLevel);
        levelDef?.applyEffect(tempPlayer);
    }

    return tempPlayer;
  }

  const resetGame = (
    playerNickname: string,
    currentAdminConfig?: AdminConfig,
    selectedHat?: string | null,
    selectedStaff?: string | null
  ) => {
    let newPlayerState = getDefaultPlayerState(playerNickname, selectedHat, selectedStaff);
    newPlayerState = applyHatEffect(newPlayerState, selectedHat);
    newPlayerState = applyStaffEffectToPlayerBase(newPlayerState, selectedStaff);
    
    // Apply permanent skills based on current state, not refs
    newPlayerState.purchasedPermanentSkills = purchasedPermanentSkillsState;
    newPlayerState = applyPermanentSkillEffectsToPlayer(newPlayerState); 
    
    // Set initial coins for the game session
    newPlayerState.coins = playerCoins; // Use current global playerCoins


    if (currentAdminConfig?.isAdminEnabled) {
        newPlayerState.isAdmin = true;
        newPlayerState.xpToNextLevel = XP_PER_LEVEL_BASE; 

        if(currentAdminConfig.damageMultiplier && currentAdminConfig.damageMultiplier > 0){
            newPlayerState.projectileDamage *= currentAdminConfig.damageMultiplier;
        }
        if(currentAdminConfig.defenseBoost !== undefined && currentAdminConfig.defenseBoost >= 0){
            newPlayerState.defense = Math.min(0.95, newPlayerState.defense + (currentAdminConfig.defenseBoost || 0));
        }

        Object.entries(currentAdminConfig.selectedSkills).forEach(([skillId, count]) => {
            const upgrade = InitialUpgrades.find(u => u.id === skillId);
            if (upgrade) {
                for (let i = 0; i < count; i++) {
                    if (upgrade.maxApplications && newPlayerState.upgrades.filter(uid => uid === skillId).length >= upgrade.maxApplications) {
                        break;
                    }
                    upgrade.apply(newPlayerState, gameContextForUpgrades);
                    newPlayerState.upgrades.push(skillId);
                }
            }
        });
    }

    setPlayer(newPlayerState);
    setEnemies([]);
    setPlayerProjectiles([]);
    setEnemyProjectiles([]);
    setParticles([]);
    setActiveLightningBolts([]);
    setFloatingTexts([]);
    setAvailableUpgrades(InitialUpgrades.map(u => ({...u})));
    setCurrentUpgradeChoices([]);
    setCanPickMultipleUpgrades(0);
    setGameTime(0);

    const basePlatforms = InitialStaticPlatforms.map(p => ({
      ...p,
      isVisible: p.id === 'ground' ? true : false,
      currentAlpha: p.id === 'ground' ? 1 : 0,
      isBlinkingOut: false,
      blinkTimer: p.id === 'ground' ? Infinity : 0,
      height: p.id === 'ground' ? GROUND_PLATFORM_HEIGHT : DYNAMIC_PLATFORM_HEIGHT,
    }));
    setPlatforms(repositionAndResizeAllDynamicPlatforms(basePlatforms));

    const startWaveForReset = currentAdminConfig?.isAdminEnabled ? currentAdminConfig.startWave : 0;
    setCurrentWave(startWaveForReset);
    setWaveStatus('intermissao');
    setTimeToNextWaveAction(INITIAL_WAVE_CONFIG.intermissionTime);
    setEnemiesToSpawnThisWave(0);
    setEnemiesSpawnedThisWaveCount(0);
    currentWaveConfigRef.current = INITIAL_WAVE_CONFIG;
    setCenterScreenMessage(null);

    lastClearedWaveRef.current = currentAdminConfig?.isAdminEnabled ? Math.max(0, currentAdminConfig.startWave - 1) : 0;
    hasSkippedWaveRef.current = false;

    if (thunderboltIntervalRef.current) clearInterval(thunderboltIntervalRef.current);
    thunderboltIntervalRef.current = null;

    if (newPlayerState.thunderboltEffectiveBolts && newPlayerState.thunderboltEffectiveBolts > 0 && gameContextForUpgrades.activateThunderbolts) {
      gameContextForUpgrades.activateThunderbolts(newPlayerState.thunderboltEffectiveBolts, 5000);
    }

    gameContextForUpgrades.enableFragmentation = null;
    if (newPlayerState.upgrades.includes('fragmentation') && gameContextForUpgrades.enableFragmentation !== undefined) {
      const fragUpgrade = InitialUpgrades.find(u => u.id === 'fragmentation');
      fragUpgrade?.apply(newPlayerState, gameContextForUpgrades);
    }

    previousGameStateRef.current = GameState.StartMenu; 
    setGameState(GameState.Playing);
    lastFrameTimeRef.current = performance.now();
  };

  const handleProceedToCharacterSelection = () => {
    if (!nickname.trim()) {
        setNicknameError("Por favor, insira um apelido para começar.");
        return;
    }
    setNicknameError("");
    const currentSelectableHats = getSelectableCosmeticHats();

    if (!selectedHatIdForSelectionScreen || !currentSelectableHats.find(h => h.id === selectedHatIdForSelectionScreen)) {
        setSelectedHatIdForSelectionScreen(currentSelectableHats[0]?.id || DEFAULT_HAT_ID);
    }
    
    const currentUnlockedStaffs = getPurchasableStaffs(); // Assuming this list is fine for staff
    if (!selectedStaffIdForSelectionScreen || !currentUnlockedStaffs.find(s => s.id === selectedStaffIdForSelectionScreen)) {
        setSelectedStaffIdForSelectionScreen(currentUnlockedStaffs[0]?.id || DEFAULT_STAFF_ID);
    }
    previousGameStateRef.current = GameState.StartMenu;
    setGameState(GameState.CharacterSelection);
  };

  const handleConfirmCharacterSelectionAndStart = () => {
    resetGame(nickname.trim(), undefined, selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen);
  };

  const handleStartAdminGame = () => {
    if (!nickname.trim()) {
        setNicknameError("Por favor, insira um apelido para o jogo debug.");
        return;
    }
    setNicknameError("");
    resetGame(nickname.trim(), adminConfig, selectedHatIdForSelectionScreen, selectedStaffIdForSelectionScreen);
  };

  const handleViewAllSkills = () => {
    previousGameStateRef.current = GameState.StartMenu;
    setGameState(GameState.SkillsInfo);
  };
  
  const handleViewShop = () => {
    previousGameStateRef.current = GameState.StartMenu;
    setGameState(GameState.Shop);
  };

  const handleViewActivePlayerSkills = () => {
    previousGameStateRef.current = GameState.Paused; 
    setGameState(GameState.ActiveSkillsDisplay);
  }

  const handleViewLeaderboard = () => {
    previousGameStateRef.current = gameStateRef.current; 
    loadLeaderboardFromService(playerRef.current.isAdmin && (gameStateRef.current === GameState.DebugMenu || gameStateRef.current === GameState.GameOver));
    setGameState(GameState.Leaderboard);
  };

  const handleViewDebugPanel = () => {
    previousGameStateRef.current = GameState.StartMenu;
    setGameState(GameState.DebugMenu);
  };

  const handleOpenCosmeticModal = () => {
    previousGameStateRef.current = GameState.CharacterSelection;
    setGameState(GameState.CosmeticSelectionModal);
  };

  const handleConfirmCosmetics = () => {
    setGameState(GameState.CharacterSelection); 
  };

  const handleBackToPreviousState = () => {
    setGameState(previousGameStateRef.current);
  };

  const handleExitToMainMenu = () => {
    setGameState(GameState.StartMenu);
  };

  const handleRestartGameFromGameOver = () => {
    resetGame(player.nickname, undefined, player.selectedHatId, player.selectedStaffId);
  }

  const handleAdminConfigChange = (field: keyof AdminConfig, value: any) => {
    setAdminConfig(prev => {
        let processedValue = value;
        if (field === 'xpMultiplier' || field === 'damageMultiplier') {
            processedValue = Math.max(0.1, parseFloat(value) || 1);
        } else if (field === 'defenseBoost') {
            processedValue = Math.max(0, Math.min(0.9, parseFloat(value) || 0));
        } else if (field === 'startWave') {
            processedValue = Math.max(1, parseInt(value, 10) || 1);
        }
        return { ...prev, [field]: processedValue };
    });
  };

  const handleAdminSkillChange = (skillId: string, count: number) => {
    const upgrade = InitialUpgrades.find(u => u.id === skillId);
    let newCount = Math.max(0, count);
    if (upgrade?.maxApplications !== undefined) {
        newCount = Math.min(newCount, upgrade.maxApplications);
    }

    setAdminConfig(prev => ({
        ...prev,
        selectedSkills: {
            ...prev.selectedSkills,
            [skillId]: newCount,
        }
    }));
  };

  const handleRerollUpgrades = () => {
    if (playerRef.current.selectedHatId === 'hat_fedora' && playerRef.current.canFreeRerollUpgrades && !playerRef.current.usedFreeRerollThisLevelUp) {
        setPlayer(p => ({...p, usedFreeRerollThisLevelUp: true}));
        const currentAppraisalChoices = playerRef.current.appraisalChoices;
        const chosenUpgrades: Upgrade[] = [];
        let filteredAvailable = availableUpgrades.filter(u => {
            const timesApplied = playerRef.current.upgrades.filter(uid => uid === u.id).length;
            return !u.maxApplications || timesApplied < u.maxApplications;
        });
        for (let i = 0; i < currentAppraisalChoices && filteredAvailable.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * filteredAvailable.length);
            chosenUpgrades.push(filteredAvailable[randomIndex]);
            filteredAvailable.splice(randomIndex, 1);
        }
        setCurrentUpgradeChoices(chosenUpgrades);
    }
  };

  const handlePurchaseCosmetic = (itemId: string, price: number) => {
    if (playerCoins >= price && !purchasedCosmeticIds.includes(itemId)) {
      setPlayerCoins(prevCoins => prevCoins - price);
      setPurchasedCosmeticIds(prevIds => [...prevIds, itemId]);
    }
  };

  const handlePurchasePermanentSkill = (skillId: string, levelToBuy: number, price: number) => {
    if (playerCoins >= price) {
        setPlayerCoins(prevCoins => prevCoins - price);
        setPurchasedPermanentSkillsState(prevSkills => ({
            ...prevSkills,
            [skillId]: { level: levelToBuy }
        }));
    }
  };
  
  const commonButtonClass = "px-4 py-2 text-cyan-200 font-semibold border-2 border-cyan-500 hover:border-cyan-300 transition duration-150 ease-in-out focus:outline-none focus:border-white focus:shadow-[0_0_10px_theme(colors.cyan.400)] text-sm md:text-base bg-indigo-900 hover:bg-indigo-800 shadow-[0_0_8px_theme(colors.indigo.700)] rounded-md";
  const inputClass = "px-3 py-2 mb-2 text-cyan-100 bg-gray-800 border-2 border-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_theme(colors.cyan.500)] w-64 md:w-80 text-center text-sm rounded-md placeholder-gray-500";
  const adminInputClass = "px-2 py-1 text-cyan-100 bg-gray-800 border-2 border-gray-600 focus:outline-none focus:border-cyan-400 w-20 text-center text-xs rounded-sm";
  const adminLabelClass = "text-xs text-yellow-300 mb-1 mr-2";
  const panelBaseClass = "absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center p-4 md:p-6 backdrop-blur-sm"; 
  const cosmeticItemButtonClass = "p-2 border-2 text-xs hover:bg-gray-700 w-full text-left rounded-md";
  const cosmeticItemSelectedClass = "border-yellow-400 bg-gray-600 shadow-[0_0_8px_theme(colors.yellow.400)]";
  const cosmeticItemUnselectedClass = "border-gray-500 bg-gray-800";
  const shopItemCardClass = "bg-gray-800 p-3 border-2 border-gray-700 rounded-md flex flex-col shadow-[0_0_5px_theme(colors.gray.700)]";
  const leaderboardEntryCardClass = "bg-gray-800 border-2 border-cyan-700 rounded-md grid grid-cols-4 gap-2 items-center text-xs shadow-[0_0_8px_theme(colors.cyan.600)] py-3 px-3 mb-2";


  return (
    <div className="flex flex-col items-center justify-start py-4 bg-gray-900 text-cyan-100 min-h-screen w-full" role="application">

      <div ref={gameContainerRef} className="game-canvas-container">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          aria-label="Tela de jogo Pixel Rift Defenders"
          tabIndex={0} 
        />

        {gameState === GameState.StartMenu && (
            <div className={`${panelBaseClass} justify-center text-center`} role="dialog" aria-labelledby="startMenuTitle">
                <h2 id="startMenuTitle" className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Pixel Rift Defenders</h2>
                <input
                    type="text"
                    placeholder="Insira seu Apelido Cósmico"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value.slice(0, 15));
                        if (nicknameError) setNicknameError("");
                    }}
                    className={`${inputClass} mb-1`}
                    maxLength={15}
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
                  <p className="mb-1">Controles: A/D para mover, Espaço para pular, {playerRef.current.hasDashSkill && getPermanentSkillLevel(SKILL_ID_DASH) > 0 ? "Shift para Dash, " : ""}Mouse para mirar e atirar. P para Pausar.</p>
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
                        {ALL_HATS_SHOP.sort((a,b) => a.price - b.price).map(hat => ( // Display all hats, not just gameplay effect ones
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
                                        <p className="font-semibold text-purple-200 text-sm">{skill.name} {currentLevel > 0 ? `(Nível ${currentLevel})` : ''}</p>
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
            <div className={`${panelBaseClass} justify-start overflow-y-auto`} role="dialog" aria-labelledby="characterSelectionTitle">
                <h2 id="characterSelectionTitle" className="text-2xl font-bold my-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400 sticky top-0 bg-black bg-opacity-80 py-2 z-10">Confirme seu Avatar</h2>

                 <div className="my-2 p-1 border border-cyan-700 bg-gray-900 shadow-[0_0_15px_theme(colors.cyan.700)] flex items-center justify-center rounded-lg" style={{ width: '400px', height: '500px' }}>
                     <canvas ref={previewCanvasRef} aria-label="Pré-visualização do personagem" />
                </div>
                <p className="text-center text-sm mb-1 text-cyan-200">Chapéu: {ALL_HATS_SHOP.find(h=>h.id === selectedHatIdForSelectionScreen)?.name || "Nenhum"}</p>
                <p className="text-center text-sm mb-4 text-cyan-200">Cajado: {ALL_STAFFS_SHOP.find(s=>s.id === selectedStaffIdForSelectionScreen)?.name || "Nenhum"}</p>

                <div className="flex flex-col md:flex-row gap-3 mt-auto sticky bottom-4">
                    <button onClick={handleConfirmCharacterSelectionAndStart} className={`${commonButtonClass}`}>
                        Confirmar e Iniciar
                    </button>
                    <button onClick={handleOpenCosmeticModal} className={`${commonButtonClass}`}>
                        Customizar Aparência
                    </button>
                     <button onClick={() => { previousGameStateRef.current = GameState.CharacterSelection; setGameState(GameState.Shop);}} className={`${commonButtonClass}`}>
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
                    {/* Hat Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-3 text-center">Chapéus Galácticos</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-900 border border-cyan-600 rounded-md shadow-[0_0_10px_theme(colors.cyan.600)]">
                            {getSelectableCosmeticHats().map(hat => (
                                <button
                                    key={hat.id}
                                    onClick={() => {
                                        setSelectedHatIdForSelectionScreen(hat.id);
                                    }}
                                    className={`${cosmeticItemButtonClass} ${selectedHatIdForSelectionScreen === hat.id ? cosmeticItemSelectedClass : cosmeticItemUnselectedClass}`}
                                    aria-pressed={selectedHatIdForSelectionScreen === hat.id}
                                >
                                    <p className="font-semibold text-cyan-200">{hat.name}</p>
                                    <p className="text-gray-400 text-xxs mt-1">{hat.effectDescription || hat.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="flex flex-col items-center justify-center">
                         <div className="my-2 p-1 border border-cyan-700 bg-gray-900 shadow-[0_0_15px_theme(colors.cyan.700)] flex items-center justify-center rounded-lg" style={{ width: '400px', height: '500px' }}>
                            <canvas ref={previewCanvasRef} aria-label="Pré-visualização do personagem com cosméticos" />
                        </div>
                    </div>

                    {/* Staff Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-3 text-center">Cajados Astrais</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-900 border border-cyan-600 rounded-md shadow-[0_0_10px_theme(colors.cyan.600)]">
                            {getPurchasableStaffs().map(staff => (
                                <button
                                    key={staff.id}
                                    onClick={() => {
                                        setSelectedStaffIdForSelectionScreen(staff.id);
                                    }}
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
                    placeholder="Apelido Debug"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value.slice(0, 15));
                        if (nicknameError) setNicknameError("");
                    }}
                    className={`${inputClass} mb-1`}
                    maxLength={15}
                    aria-label="Apelido do Jogador Debug"
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
                    <label htmlFor="enableDebugMode" className="text-base text-yellow-300">Habilitar Modo Debug</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                        <label htmlFor="debugStartWave" className={`${adminLabelClass} block text-center`}>Wave Inicial:</label>
                        <input type="number" id="debugStartWave" value={adminConfig.startWave} onChange={(e) => handleAdminConfigChange('startWave', e.target.value)} className={adminInputClass} aria-label="Wave Inicial Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugXpMultiplier" className={`${adminLabelClass} block text-center`}>Multiplicador XP:</label>
                        <input type="number" id="debugXpMultiplier" value={adminConfig.xpMultiplier} step="0.1" onChange={(e) => handleAdminConfigChange('xpMultiplier', e.target.value)} className={adminInputClass} aria-label="Multiplicador de XP Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugDamageMultiplier" className={`${adminLabelClass} block text-center`}>Multiplicador Dano:</label>
                        <input type="number" id="debugDamageMultiplier" value={adminConfig.damageMultiplier} step="0.1" onChange={(e) => handleAdminConfigChange('damageMultiplier', e.target.value)} className={adminInputClass} aria-label="Multiplicador de Dano Debug"/>
                    </div>
                    <div>
                        <label htmlFor="debugDefenseBoost" className={`${adminLabelClass} block text-center`}>Bônus Defesa (0-0.9):</label>
                        <input type="number" id="debugDefenseBoost" value={adminConfig.defenseBoost} step="0.05" min="0" max="0.9" onChange={(e) => handleAdminConfigChange('defenseBoost', e.target.value)} className={adminInputClass} aria-label="Bônus de Defesa Debug"/>
                    </div>
                </div>


                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Pré-aplicar Habilidades:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-4">
                    {InitialUpgrades.map(upgrade => (
                        <div key={upgrade.id} className="bg-gray-800 p-2 border border-gray-700 rounded-md flex flex-col items-center">
                            <div className="flex items-center mb-1">
                                <span className="text-xl mr-2" role="img" aria-label={upgrade.name}>{UPGRADE_ICONS[upgrade.id] || '✨'}</span>
                                <h4 className="text-xs font-semibold text-indigo-300">{upgrade.name}</h4>
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
             onBack={() => {
                handleBackToPreviousState();
             }}
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
                    {displayedSkills.map(skill => (
                        <div key={skill.id} className="bg-gray-800 p-3 border-2 border-gray-700 rounded-md flex flex-col shadow-[0_0_5px_theme(colors.gray.700)]">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-2" role="img" aria-label={skill.name}>{skill.icon}</span>
                                <h3 className="text-sm font-bold text-purple-300">{skill.name}</h3>
                                {skill.count > 1 && <span className="ml-2 text-xs font-semibold text-yellow-300">(x{skill.count})</span>}
                            </div>
                            <p className="text-gray-300 text-xs mb-2 flex-grow">{skill.description}</p>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={() => {
                handleBackToPreviousState();
            }} className={`${commonButtonClass} mt-4 sticky bottom-4`}>
                Voltar ao Menu de Pausa
            </button>
          </div>
        )}

        {gameState === GameState.ChoosingUpgrade && (
          <div className={`${panelBaseClass} justify-center text-center`} role="dialog" aria-labelledby="upgradeTitle">
                <h2 id="upgradeTitle" className="text-xl md:text-2xl font-bold mb-3 text-yellow-300">
                    {canPickMultipleUpgrades > 1 ? `Escolha ${canPickMultipleUpgrades} Melhorias Cósmicas:` : `Aprimoramento Detectado! Escolha Melhoria:`}
                </h2>
                {currentUpgradeChoices.length > 0 ? (
                    <div className="flex flex-wrap justify-center items-start">
                        {currentUpgradeChoices.map(upgrade => (
                            <UpgradeCard key={upgrade.id} upgrade={upgrade} onSelect={() => applyUpgrade(upgrade)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">Nenhuma melhoria cósmica disponível.</p>
                )}
                {playerRef.current.selectedHatId === 'hat_fedora' && playerRef.current.canFreeRerollUpgrades && !playerRef.current.usedFreeRerollThisLevelUp && currentUpgradeChoices.length > 0 && (
                     <button onClick={handleRerollUpgrades} className={`${commonButtonClass} mt-4`}>
                        Rerrolar (Grátis)
                    </button>
                )}
                 {currentUpgradeChoices.length === 0 && (
                     <button onClick={() => { setGameState(GameState.Playing); setCanPickMultipleUpgrades(0);}} className={`${commonButtonClass} mt-6`}>
                        Continuar
                    </button>
                 )}
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
                            <span className="text-yellow-300 font-semibold">{currentWave}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-300">Tempo de Sobrevivência:</span>
                            <span className="text-yellow-300 font-semibold">{Math.floor(gameTime)}s</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Moedas Coletadas na Partida:</span>
                            <span className="text-yellow-300 font-semibold">{playerCoins - player.coins} 💰</span>
                        </div>
                         {player.selectedHatId === 'hat_fedora' && 
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
                <button onClick={() => { setGameState(GameState.Playing); }} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Continuar
                </button>
                 <button onClick={handleViewActivePlayerSkills} className={`${commonButtonClass} mb-3 w-64 md:w-80`}>
                    Minhas Habilidades
                </button>
                <button onClick={handleExitToMainMenu} className={`${commonButtonClass} w-64 md:w-80`}>
                    Sair para Menu Principal
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
export default App;
