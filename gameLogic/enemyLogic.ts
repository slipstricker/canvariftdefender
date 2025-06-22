


import { Enemy, Player, Projectile, AppliedStatusEffect, EnemyType, AlienVisualVariant, EnemyUpdateResult } from '../types';
import { 
    CANVAS_HEIGHT, CANVAS_WIDTH, ENEMY_PROJECTILE_COLOR,
    ENEMY_CONFIG, FIRST_BOSS_WAVE_NUMBER, ALL_BOSS_WAVES, 
    SPRITE_PIXEL_SIZE, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT, BOSS_ART_WIDTH, BOSS_ART_HEIGHT,
    PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT,
    SPLITTER_MIN_WAVE, SPLITTER_ART_WIDTH, SPLITTER_ART_HEIGHT,
    BOSS_MINION_RESPAWN_COOLDOWN, BOSS_MINION_RESPAWN_WARNING_DURATION,
    BOSS_MAX_MINIONS_NORMAL, BOSS_MAX_MINIONS_FURY, BOSS_FURY_MINION_SPAWN_COOLDOWN,
    HEALING_DRONE_MIN_WAVE, HEALING_DRONE_SPAWN_CHANCE, HEALING_DRONE_ART_WIDTH, HEALING_DRONE_ART_HEIGHT,
    HEALING_DRONE_HEAL_COOLDOWN_MS,
    HEALING_DRONE_MAX_TARGETS, HEALING_DRONE_HEAL_RANGE, HEALING_DRONE_SCAN_RANGE, HEALING_DRONE_RETREAT_Y_MAX_FACTOR,
    BOSS_TELEPORT_COOLDOWN_MS, BOSS_ABILITY_WAVE_CONFIG,
    BOSS_LASER_CHARGE_TIME_MS, BOSS_LASER_COOLDOWN_MS
} from '../constants';
import { parseAbilityWaveConfig } from './utils';


// Helper to calculate standard enemy stats based on wave and player level using ENEMY_CONFIG
function calculateStandardStats(wave: number, playerLevel: number, configKey: 'standard' | 'bossStatRef' | 'healingDroneRef') {
  const stdCfg = ENEMY_CONFIG.standard;
  let waveForCalc = wave;
  if (configKey === 'bossStatRef') waveForCalc = ENEMY_CONFIG.boss.statReferenceWave;
  if (configKey === 'healingDroneRef') waveForCalc = wave; // Drones scale with current wave directly for base

  const waveMultiplier = 1 + Math.max(0, waveForCalc - 1) * stdCfg.hp.perWaveFactor; // Generic multiplier for HP-like stats

  const hp = (stdCfg.hp.base + playerLevel * stdCfg.hp.perPlayerLevel) * waveMultiplier;
  const damage = (stdCfg.damage.base + playerLevel * stdCfg.damage.perPlayerLevel) * waveMultiplier;
  const xp = (stdCfg.xp.base + playerLevel * stdCfg.xp.perPlayerLevel) * waveMultiplier;
  
  const speedBonusFromWaves = stdCfg.speed.base * Math.min(stdCfg.speed.maxBonusFromWavesFactor, Math.max(0, waveForCalc - 1) * stdCfg.speed.increaseFactorPerWave);
  const speed = stdCfg.speed.base + speedBonusFromWaves;

  const shootCooldown = Math.max(stdCfg.shootCooldown.min, stdCfg.shootCooldown.base - Math.max(0, waveForCalc - 1) * stdCfg.shootCooldown.reductionPerWave) * stdCfg.shootCooldown.finalMultiplier;

  return { hp, damage, speed, shootCooldown, xp };
}


function createBossEnemy(
    currentWave: number, 
    playerLevel: number, 
    canvasWidth: number,
    playSound: (soundName: string, volume?: number) => void
): Enemy {
  const bossActualWidth = BOSS_ART_WIDTH * SPRITE_PIXEL_SIZE;
  const bossActualHeight = BOSS_ART_HEIGHT * SPRITE_PIXEL_SIZE;
  const bossCfg = ENEMY_CONFIG.boss;

  // Calculate base stats for the boss as if it were a standard enemy at the reference wave
  const refStats = calculateStandardStats(bossCfg.statReferenceWave, playerLevel, 'bossStatRef');

  // Apply boss-specific multipliers to these reference stats to get INITIAL boss stats (for FIRST_BOSS_WAVE_NUMBER)
  let initialBossHp = refStats.hp * bossCfg.hpMultiplier; 
  let initialBossDamage = refStats.damage * bossCfg.damageMultiplier;
  let initialBossShootCooldown = refStats.shootCooldown / bossCfg.attackSpeedMultiplier; 
  let initialBossExp = refStats.xp * bossCfg.xpMultiplier;
  let initialBossSpeed = refStats.speed * bossCfg.speedMultiplier;

  // Scale stats for subsequent boss waves
  let currentHp = initialBossHp;
  let currentDamage = initialBossDamage;
  let currentShootCooldown = initialBossShootCooldown;
  let currentMoveSpeed = initialBossSpeed;
  let currentExpValue = initialBossExp;

  if (currentWave > FIRST_BOSS_WAVE_NUMBER) {
    const scalingSteps = (currentWave - FIRST_BOSS_WAVE_NUMBER) / 10; 

    currentHp *= Math.pow(bossCfg.hpScalingFactorPer10Waves, scalingSteps);
    currentDamage *= Math.pow(bossCfg.damageScalingFactorPer10Waves, scalingSteps);
    currentShootCooldown /= Math.pow(bossCfg.attackSpeedScalingFactorPer10Waves, scalingSteps);
    currentShootCooldown = Math.max(currentShootCooldown, initialBossShootCooldown * bossCfg.minShootCooldownFactorOfInitialBoss); 

    const speedIncreasePercentage = bossCfg.speedAdditiveFactorPer10Waves * scalingSteps; 
    currentMoveSpeed *= (1 + speedIncreasePercentage);
    currentMoveSpeed = Math.min(currentMoveSpeed, initialBossSpeed * bossCfg.maxSpeedFactorOfInitialBoss); 
    currentExpValue = Math.floor(currentExpValue * Math.pow(bossCfg.xpScalingFactorPer10Waves, scalingSteps));
  }
  
  playSound('/assets/sounds/enemy_spawn_alien_01.wav', 0.8);

  return {
    id: `boss-${currentWave}-${performance.now()}`,
    x: canvasWidth / 2 - bossActualWidth / 2,
    y: CANVAS_HEIGHT * 0.10, 
    width: bossActualWidth,
    height: bossActualHeight,
    vx: 0,
    vy: 0,
    hp: currentHp,
    maxHp: currentHp, 
    damage: currentDamage,
    expValue: currentExpValue,
    isFollowingPlayer: true, 
    shootCooldown: currentShootCooldown,
    lastShotTime: performance.now() + Math.random() * 500, 
    color: `hsl(${280 + (currentWave/10)*20}, 80%, 60%)`, 
    speed: currentMoveSpeed, 
    slowFactor: 1,
    enemyType: 'boss',
    visualVariant: 'three_eyed_boss',
    inFuryMode: false,
    statusEffects: [],
    draw: () => {},
    lastAppliedVx: 0,
    directionChangeCounter: 0,
    isReturningToCenter: false,
    returnToCenterTimer: 0,
    canSummonMinions: parseAbilityWaveConfig(BOSS_ABILITY_WAVE_CONFIG.summonMinions, currentWave),
    summonedMinionIds: [],
    minionRespawnTimer: 0,
    minionRespawnCooldown: BOSS_MINION_RESPAWN_COOLDOWN,
    furyMinionSpawnCooldownTimer: 0,
    maxMinionsNormal: BOSS_MAX_MINIONS_NORMAL,
    maxMinionsFury: BOSS_MAX_MINIONS_FURY,
    showMinionWarningTimer: 0,
    showMinionSpawnedMessageTimer: 0,
    canTeleport: parseAbilityWaveConfig(BOSS_ABILITY_WAVE_CONFIG.teleport, currentWave), 
    lastTeleportTime: performance.now() + Math.random() * BOSS_TELEPORT_COOLDOWN_MS / 2, 
    teleportCooldownValue: BOSS_TELEPORT_COOLDOWN_MS,
    isReturningToTopAfterTeleport: false,
    canUseLaser: parseAbilityWaveConfig(BOSS_ABILITY_WAVE_CONFIG.laser, currentWave),
    isChargingLaser: false,
    laserChargeTimer: 0,
    laserCooldownValue: BOSS_LASER_COOLDOWN_MS,
    lastLaserFireTime: 0,
    isPerformingChargeAbility: false,
    lastAbilityEndTime: 0, // Initialize global skill cooldown timer
  };
}

export function createEnemyOrBoss(
  currentWave: number,
  playerLevel: number,
  canvasWidth: number,
  playSound: (soundName: string, volume?: number) => void
): Enemy {
  if (ALL_BOSS_WAVES.includes(currentWave)) {
    return createBossEnemy(currentWave, playerLevel, canvasWidth, playSound);
  }

  const isSplitter = currentWave >= SPLITTER_MIN_WAVE && Math.random() < 0.25; 
  const isHealingDrone = currentWave >= HEALING_DRONE_MIN_WAVE && Math.random() < HEALING_DRONE_SPAWN_CHANCE && !isSplitter;

  const stdStats = calculateStandardStats(currentWave, playerLevel, 'standard');

  let enemyActualWidth, enemyActualHeight: number;
  let enemyHp = stdStats.hp;
  let enemyDamage = stdStats.damage;
  let enemySpeed = stdStats.speed + Math.random() * 20; 
  let enemyExp = stdStats.xp;
  let enemyShootCooldown = stdStats.shootCooldown;
  let enemyColor: string;
  let enemyType: EnemyType = 'standard';
  let visualVariant: AlienVisualVariant;
  
  if (isSplitter) {
    const splitterCfg = ENEMY_CONFIG.splitter;
    enemyType = 'splitter';
    visualVariant = 'multi_tentacle';
    enemyActualWidth = SPLITTER_ART_WIDTH * SPRITE_PIXEL_SIZE;
    enemyActualHeight = SPLITTER_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    enemyHp *= splitterCfg.hpFactor;
    enemyDamage *= splitterCfg.damageFactor;
    enemySpeed *= splitterCfg.speedFactor;
    enemyExp *= splitterCfg.xpFactor;
    enemyShootCooldown *= splitterCfg.shootCooldownFactor;
    enemyColor = `hsl(30, 90%, 60%)`; 
  } else if (isHealingDrone) {
    const droneCfg = ENEMY_CONFIG.healingDrone;
    enemyType = 'healing_drone';
    visualVariant = 'healing_drone';
    enemyActualWidth = HEALING_DRONE_ART_WIDTH * SPRITE_PIXEL_SIZE;
    enemyActualHeight = HEALING_DRONE_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    enemyHp *= droneCfg.hpFactor;
    enemyDamage = 0; 
    enemySpeed *= droneCfg.speedFactor;
    enemyExp *= droneCfg.xpFactor;
    enemyShootCooldown = Infinity; 
    enemyColor = `hsl(130, 70%, 50%)`; 

    const newEnemy: Enemy = {
        id: `${enemyType}-${performance.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: Math.random() * (canvasWidth - enemyActualWidth),
        y: -enemyActualHeight, 
        width: enemyActualWidth,
        height: enemyActualHeight,
        vx: 0,
        vy: 0,
        hp: enemyHp,
        maxHp: enemyHp,
        damage: enemyDamage,
        expValue: Math.floor(enemyExp),
        isFollowingPlayer: false, 
        shootCooldown: enemyShootCooldown,
        lastShotTime: 0, 
        color: enemyColor,
        speed: enemySpeed,
        slowFactor: 1, 
        enemyType: enemyType,
        visualVariant: visualVariant,
        inFuryMode: false,
        statusEffects: [],
        draw: () => {},
        isHealingDrone: true,
        healCooldownValue: HEALING_DRONE_HEAL_COOLDOWN_MS,
        lastHealTime: 0,
        healingTargetIds: [],
        healingRange: HEALING_DRONE_HEAL_RANGE,
        scanRange: HEALING_DRONE_SCAN_RANGE,
        droneState: 'IDLE_SCANNING',
        retreatPosition: { x: Math.random() * canvasWidth, y: CANVAS_HEIGHT * HEALING_DRONE_RETREAT_Y_MAX_FACTOR },
        timeInCurrentState: 0,
    };
    playSound('/assets/sounds/enemy_spawn_alien_01.wav', 0.4); 
    return newEnemy;

  } else {
    enemyType = 'standard';
    visualVariant = Math.random() < 0.5 ? 'cyclops' : 'green_classic';
    enemyActualWidth = ENEMY_ART_WIDTH * SPRITE_PIXEL_SIZE;
    enemyActualHeight = ENEMY_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    enemyColor = visualVariant === 'cyclops' ? `hsl(200, 70%, 60%)` : `hsl(120, 60%, 45%)`; 
  }
  
  playSound('/assets/sounds/enemy_spawn_alien_01.wav', 0.6); 

  const newEnemy: Enemy = {
    id: `${enemyType}-${performance.now()}-${Math.random().toString(36).substring(2, 9)}`,
    x: Math.random() * (canvasWidth - enemyActualWidth),
    y: -enemyActualHeight, 
    width: enemyActualWidth,
    height: enemyActualHeight,
    vx: 0,
    vy: 0,
    hp: enemyHp,
    maxHp: enemyHp,
    damage: enemyDamage,
    expValue: Math.floor(enemyExp),
    isFollowingPlayer: false,
    shootCooldown: enemyShootCooldown,
    lastShotTime: performance.now() + Math.random() * 1000, 
    color: enemyColor,
    speed: enemySpeed,
    slowFactor: 1, 
    enemyType: enemyType,
    visualVariant: visualVariant,
    inFuryMode: false,
    statusEffects: [],
    draw: () => {},
  };
  return newEnemy;
}

export function createMiniSplitterEnemy(
  currentWave: number, 
  playerLevel: number, 
  positionX: number,
  positionY: number,
  playSound: (soundName: string, volume?: number) => void
): Enemy {
  const miniActualWidth = ENEMY_ART_WIDTH * SPRITE_PIXEL_SIZE; 
  const miniActualHeight = ENEMY_ART_HEIGHT * SPRITE_PIXEL_SIZE;
  const stdStats = calculateStandardStats(currentWave, playerLevel, 'standard');
  const miniCfg = ENEMY_CONFIG.miniSplitter;

  const miniHp = stdStats.hp * miniCfg.hpFactor;
  const miniDamage = stdStats.damage * miniCfg.damageFactor;
  const miniSpeed = (stdStats.speed + Math.random() * 10) * miniCfg.speedFactor; 
  const miniExp = stdStats.xp * miniCfg.xpFactor;
  let miniShootCooldown = stdStats.shootCooldown * miniCfg.shootCooldownFactor;

  
  if (ENEMY_CONFIG.standard.shootCooldown.min && miniCfg.shootCooldownFactor < 1) { 
     
     const effectiveMinCoolddown = ENEMY_CONFIG.standard.shootCooldown.min * miniCfg.shootCooldownFactor;
     miniShootCooldown = Math.max(miniShootCooldown, effectiveMinCoolddown);
  }
  
  return {
    id: `miniSplitter-${performance.now()}-${Math.random().toString(36).substring(2, 9)}`,
    x: positionX,
    y: positionY,
    width: miniActualWidth,
    height: miniActualHeight,
    vx: (Math.random() - 0.5) * 100, 
    vy: (Math.random() - 0.5) * 50,  
    hp: miniHp,
    maxHp: miniHp,
    damage: miniDamage,
    expValue: Math.floor(miniExp),
    isFollowingPlayer: true, 
    shootCooldown: miniShootCooldown, 
    lastShotTime: performance.now() + Math.random() * 500,
    color: `hsl(100, 75%, 50%)`, 
    speed: miniSpeed,
    slowFactor: 1,
    enemyType: 'miniSplitter',
    visualVariant: 'spiky',
    inFuryMode: false,
    statusEffects: [],
    draw: () => {},
  };
}
