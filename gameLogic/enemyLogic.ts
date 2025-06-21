

import { Enemy, Player, Projectile, AppliedStatusEffect, EnemyType, AlienVisualVariant, EnemyUpdateResult } from '../types';
import { 
    CANVAS_HEIGHT, CANVAS_WIDTH, ENEMY_PROJECTILE_COLOR,
    BOSS_WAVE_NUMBER, BOSS_HP, BOSS_STAT_REFERENCE_WAVE, 
    BOSS_DAMAGE_MULTIPLIER, BOSS_ATTACK_SPEED_MULTIPLIER, 
    BOSS_XP_REWARD_MULTIPLIER, BOSS_FURY_DAMAGE_MULTIPLIER, ALL_BOSS_WAVES,
    SPRITE_PIXEL_SIZE, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT, BOSS_ART_WIDTH, BOSS_ART_HEIGHT,
    PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT,
    SPLITTER_ART_WIDTH, SPLITTER_ART_HEIGHT, SPLITTER_MIN_WAVE,
    BOSS_MINION_RESPAWN_COOLDOWN, BOSS_MINION_RESPAWN_WARNING_DURATION,
    BOSS_MAX_MINIONS_NORMAL, BOSS_MAX_MINIONS_FURY, BOSS_FURY_MINION_SPAWN_COOLDOWN
} from '../constants';


// Helper to create a standard minion for the boss
function _createStandardMinionForBoss(
    currentWave: number, 
    playerLevel: number, 
    bossX: number, 
    bossY: number, 
    bossWidth: number, 
    bossHeight: number,
    playSound: (soundName: string, volume?: number) => void
): Enemy {
  const waveMultiplier = 1 + (currentWave - 1) * 0.10; 
  const baseHp = 5 * waveMultiplier;
  const hpPerPlayerLevel = 1.5 * waveMultiplier;
  const baseDamage = 2 * waveMultiplier;
  const damagePerPlayerLevel = 0.2 * waveMultiplier;
  const baseExp = 3 * waveMultiplier; 
  const expPerPlayerLevel = 0.5 * waveMultiplier;
  const initialBaseSpeed = 65; 
  const speedBonusPerWaveFactor = 0.06;
  const maxSpeedBonusFactor = 0.25;
  let waveSpeedBonus = initialBaseSpeed * speedBonusPerWaveFactor * (currentWave - 1);
  waveSpeedBonus = Math.min(waveSpeedBonus, initialBaseSpeed * maxSpeedBonusFactor);
  const currentBaseSpeed = initialBaseSpeed + waveSpeedBonus;

  const enemyActualWidth = ENEMY_ART_WIDTH * SPRITE_PIXEL_SIZE;
  const enemyActualHeight = ENEMY_ART_HEIGHT * SPRITE_PIXEL_SIZE;
  const enemyHp = baseHp + playerLevel * hpPerPlayerLevel;
  const enemyDamage = baseDamage + playerLevel * damagePerPlayerLevel;
  const enemySpeed = (currentBaseSpeed + Math.random() * 15); 
  const enemyExp = Math.floor(baseExp + playerLevel * expPerPlayerLevel);
  let shootCooldownBase = Math.max(400, 2000 - currentWave * 40);
  shootCooldownBase *= 1.00; // Reduce attack speed by 10%

  const spawnOffsetX = (Math.random() - 0.5) * bossWidth * 1.5;
  const spawnOffsetY = (Math.random() * 50 + 20); 

  const visualVariantForMinion: AlienVisualVariant = Math.random() < 0.5 ? 'cyclops' : 'green_classic';
  playSound('/assets/sounds/enemy_spawn_alien_01.wav', 0.4);

  return {
    id: `minion-${performance.now()}-${Math.random().toString(36).substring(2, 9)}`,
    x: Math.max(0, Math.min(bossX + bossWidth / 2 + spawnOffsetX - enemyActualWidth / 2, CANVAS_WIDTH - enemyActualWidth)),
    y: Math.max(0, Math.min(bossY + bossHeight / 2 + spawnOffsetY, CANVAS_HEIGHT * 0.5 - enemyActualHeight)), 
    width: enemyActualWidth,
    height: enemyActualHeight,
    vx: 0,
    vy: 0,
    hp: enemyHp,
    maxHp: enemyHp,
    damage: enemyDamage,
    expValue: enemyExp,
    isFollowingPlayer: false, 
    shootCooldown: shootCooldownBase,
    lastShotTime: performance.now() + Math.random() * 1000,
    color: `hsl(0, 0%, 70%)`, 
    speed: enemySpeed,
    slowFactor: 1,
    enemyType: 'standard', 
    visualVariant: visualVariantForMinion,
    inFuryMode: false,
    statusEffects: [],
    draw: () => {},
    isSummonedByBoss: true, 
  };
}


function createBossEnemy(
    currentWave: number, 
    playerLevel: number, 
    canvasWidth: number,
    playSound: (soundName: string, volume?: number) => void
): Enemy {
  const bossActualWidth = BOSS_ART_WIDTH * SPRITE_PIXEL_SIZE;
  const bossActualHeight = BOSS_ART_HEIGHT * SPRITE_PIXEL_SIZE;

  const refWaveMultiplier = 1 + (BOSS_STAT_REFERENCE_WAVE - 1) * 0.15;
  const refBaseDamage = 5 * refWaveMultiplier;
  const refDamagePerPlayerLevel = 0.5 * refWaveMultiplier;
  const wave5BossActualDamage = (refBaseDamage + playerLevel * refDamagePerPlayerLevel) * BOSS_DAMAGE_MULTIPLIER;

  const refBaseShootCooldown = Math.max(300, 1800 - BOSS_STAT_REFERENCE_WAVE * 50);
  const wave5BossActualShootCooldown = refBaseShootCooldown / BOSS_ATTACK_SPEED_MULTIPLIER;
  
  const refBaseExp = 15 * refWaveMultiplier;
  const refExpPerPlayerLevel = 1 * refWaveMultiplier;
  const wave5BossActualExp = Math.floor((refBaseExp + playerLevel * refExpPerPlayerLevel) * BOSS_XP_REWARD_MULTIPLIER);

  const initialBaseSpeedRef = 75; 
  const speedBonusPerWaveFactorRef = 0.07;
  const maxSpeedBonusFactorRef = 0.30;
  let waveSpeedBonusRef = initialBaseSpeedRef * speedBonusPerWaveFactorRef * (BOSS_STAT_REFERENCE_WAVE - 1);
  waveSpeedBonusRef = Math.min(waveSpeedBonusRef, initialBaseSpeedRef * maxSpeedBonusFactorRef);
  const wave5BossActualMoveSpeed = initialBaseSpeedRef + waveSpeedBonusRef + Math.random() * 20; 
  const wave5BossActualHp = BOSS_HP;

  let currentHp = wave5BossActualHp;
  let currentDamage = wave5BossActualDamage;
  let currentShootCooldown = wave5BossActualShootCooldown;
  let currentMoveSpeed = wave5BossActualMoveSpeed;
  let currentExpValue = wave5BossActualExp;

  if (currentWave > BOSS_WAVE_NUMBER) {
    const scalingSteps = (currentWave - BOSS_WAVE_NUMBER) / 10; 

    currentHp = wave5BossActualHp * Math.pow(2, scalingSteps);
    currentDamage = wave5BossActualDamage * Math.pow(1.5, scalingSteps);
    currentShootCooldown = wave5BossActualShootCooldown / Math.pow(1.5, scalingSteps);
    currentShootCooldown = Math.max(currentShootCooldown, wave5BossActualShootCooldown / 3.0); 

    const speedIncreasePercentage = 0.25 * scalingSteps; 
    currentMoveSpeed = wave5BossActualMoveSpeed * (1 + speedIncreasePercentage);
    currentMoveSpeed = Math.min(currentMoveSpeed, wave5BossActualMoveSpeed * 2.0); 
    currentExpValue = Math.floor(wave5BossActualExp * Math.pow(2, scalingSteps));
  }
  currentShootCooldown *= 1.10; // Reduce attack speed by 10%
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
    summonedMinionIds: [],
    minionRespawnTimer: 0,
    minionRespawnCooldown: BOSS_MINION_RESPAWN_COOLDOWN,
    furyMinionSpawnCooldownTimer: 0,
    maxMinionsNormal: BOSS_MAX_MINIONS_NORMAL,
    maxMinionsFury: BOSS_MAX_MINIONS_FURY,
    showMinionWarningTimer: 0,
    showMinionSpawnedMessageTimer: 0,
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

  const waveMultiplier = 1 + (currentWave - 1) * 0.15; 
  const baseHp = 15 * waveMultiplier;
  const hpPerPlayerLevel = 2 * waveMultiplier; 
  const baseDamage = 5 * waveMultiplier;
  const damagePerPlayerLevel = 0.5 * waveMultiplier;
  const baseExp = 15 * waveMultiplier;
  const expPerPlayerLevel = 1 * waveMultiplier;
  const initialBaseSpeed = 75; 
  const speedBonusPerWaveFactor = 0.07;
  const maxSpeedBonusFactor = 0.30;
  let waveSpeedBonus = initialBaseSpeed * speedBonusPerWaveFactor * (currentWave - 1);
  waveSpeedBonus = Math.min(waveSpeedBonus, initialBaseSpeed * maxSpeedBonusFactor);
  const currentBaseSpeed = initialBaseSpeed + waveSpeedBonus;

  let enemyActualWidth, enemyActualHeight: number;
  let enemyHp, enemyDamage, enemySpeed, enemyExp, enemyColor: string;
  let enemyType: EnemyType = 'standard';
  let visualVariant: AlienVisualVariant;
  let shootCooldownBase = Math.max(300, 1800 - currentWave * 50);

  if (isSplitter) {
    enemyType = 'splitter';
    visualVariant = 'multi_tentacle';
    enemyActualWidth = SPLITTER_ART_WIDTH * SPRITE_PIXEL_SIZE;
    enemyActualHeight = SPLITTER_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    enemyHp = (baseHp + playerLevel * hpPerPlayerLevel) * 1.5; 
    enemyDamage = (baseDamage + playerLevel * damagePerPlayerLevel) * 1.0;
    enemySpeed = (currentBaseSpeed + Math.random() * 20) * 0.8; 
    enemyExp = Math.floor((baseExp + playerLevel * expPerPlayerLevel) * 1.0); 
    enemyColor = `hsl(30, 90%, 60%)`; 
    shootCooldownBase *= 1.2; 
  } else {
    enemyType = 'standard';
    visualVariant = Math.random() < 0.5 ? 'cyclops' : 'green_classic';
    enemyActualWidth = ENEMY_ART_WIDTH * SPRITE_PIXEL_SIZE;
    enemyActualHeight = ENEMY_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    enemyHp = baseHp + playerLevel * hpPerPlayerLevel;
    enemyDamage = baseDamage + playerLevel * damagePerPlayerLevel;
    enemySpeed = (currentBaseSpeed + Math.random() * 20) * 1.1; 
    enemyExp = Math.floor(baseExp + playerLevel * expPerPlayerLevel);
    enemyColor = visualVariant === 'cyclops' ? `hsl(200, 70%, 60%)` : `hsl(120, 60%, 45%)`; 
    shootCooldownBase /= 0.9; 
  }
  shootCooldownBase *= 1.10; // Reduce attack speed by 10%
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
    expValue: enemyExp,
    isFollowingPlayer: false,
    shootCooldown: shootCooldownBase,
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

  const waveMultiplier = 1 + (currentWave - 1) * 0.15;
  const baseHp = 15 * waveMultiplier;
  const hpPerPlayerLevel = 2 * waveMultiplier;
  const baseDamage = 5 * waveMultiplier;
  const damagePerPlayerLevel = 0.5 * waveMultiplier;
  const baseExp = 15 * waveMultiplier;
  const expPerPlayerLevel = 1 * waveMultiplier;
  
  const initialBaseSpeed = 75; 
  const speedBonusPerWaveFactor = 0.07;
  const maxSpeedBonusFactor = 0.30;
  let waveSpeedBonus = initialBaseSpeed * speedBonusPerWaveFactor * (currentWave - 1);
  waveSpeedBonus = Math.min(waveSpeedBonus, initialBaseSpeed * maxSpeedBonusFactor);
  const currentBaseSpeed = initialBaseSpeed + waveSpeedBonus;

  const miniHp = (baseHp + playerLevel * hpPerPlayerLevel) * 0.4;
  const miniDamage = (baseDamage + playerLevel * damagePerPlayerLevel) * 0.6;
  const miniSpeed = ((currentBaseSpeed + Math.random() * 10) * 1.2) * 1.1; 
  const miniExp = Math.floor((baseExp + playerLevel * expPerPlayerLevel) * 0.3);
  let miniShootCooldown = Math.max(250, (1800 - currentWave * 50) * 0.8);
  miniShootCooldown /= 0.9; 
  miniShootCooldown *= 1.10; // Reduce attack speed by 10%
  // Sound played in App.tsx after all minis are created for the batch

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
    expValue: miniExp,
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


export function updateEnemy(
  enemyInput: Enemy, 
  player: Player,
  deltaTime: number,
  addEnemyProjectile: (
    x: number, y: number, vx: number, vy: number, damage: number, 
    owner: 'player' | 'enemy', color: string, glowColor?: string
  ) => void,
  currentWave: number,
  playerProjectiles: Readonly<Projectile[]>,
  playSound: (soundName: string, volume?: number) => void,
  allEnemies?: Readonly<Enemy[]> 
): EnemyUpdateResult {
  let enemy = { ...enemyInput }; 
  
  enemy.summonedMinionIds = enemy.summonedMinionIds || [];
  enemy.minionRespawnTimer = enemy.minionRespawnTimer || 0;
  enemy.minionRespawnCooldown = enemy.minionRespawnCooldown || BOSS_MINION_RESPAWN_COOLDOWN;
  enemy.furyMinionSpawnCooldownTimer = enemy.furyMinionSpawnCooldownTimer || 0;
  enemy.maxMinionsNormal = enemy.maxMinionsNormal || BOSS_MAX_MINIONS_NORMAL;
  enemy.maxMinionsFury = enemy.maxMinionsFury || BOSS_MAX_MINIONS_FURY;
  enemy.showMinionWarningTimer = enemy.showMinionWarningTimer || 0;
  enemy.showMinionSpawnedMessageTimer = enemy.showMinionSpawnedMessageTimer || 0;
  enemy.lastAppliedVx = enemy.lastAppliedVx || 0;
  enemy.directionChangeCounter = enemy.directionChangeCounter || 0;
  enemy.isReturningToCenter = enemy.isReturningToCenter || false;
  enemy.returnToCenterTimer = enemy.returnToCenterTimer || 0;

  let { 
    x, y, vx, vy, isFollowingPlayer, lastShotTime, speed, slowFactor, shootCooldown, 
    damage: enemyDamage, width, height, enemyType, inFuryMode, statusEffects
  } = enemy; 
  
  let effectiveSpeed = speed * slowFactor; 
  let effectiveShootCooldown = shootCooldown;
  const enemiesToSpawnThisFrame: Enemy[] = [];

  const chillEffect = statusEffects.find(se => se.type === 'chill' && se.duration > 0);
  if (chillEffect && chillEffect.movementSlowFactor && chillEffect.attackSpeedSlowFactor) {
    effectiveSpeed *= chillEffect.movementSlowFactor;
    effectiveShootCooldown /= chillEffect.attackSpeedSlowFactor; 
  }
  
  const ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE = CANVAS_HEIGHT * 0.65;
  const BOSS_WALL_DODGE_BUFFER = SPRITE_PIXEL_SIZE * 3;
  const VIBRATION_THRESHOLD = 5;
  const RETURN_TO_CENTER_DURATION = 1.2;

  if (enemy.showMinionWarningTimer > 0) {
    enemy.showMinionWarningTimer -= deltaTime;
    if (enemy.showMinionWarningTimer < 0) enemy.showMinionWarningTimer = 0;
  }
  if (enemy.showMinionSpawnedMessageTimer > 0) {
    enemy.showMinionSpawnedMessageTimer -= deltaTime;
    if (enemy.showMinionSpawnedMessageTimer < 0) enemy.showMinionSpawnedMessageTimer = 0;
  }

  if (enemyType === 'boss') {
    y = CANVAS_HEIGHT * 0.10; 
    vy = 0;
    let calculatedVx = 0;

    if (allEnemies) {
        const stillLivingMinionIdsBossOwns = (enemy.summonedMinionIds || []).filter(minionId => 
            allEnemies.some(e => e.id === minionId && e.hp > 0)
        );
        enemy.summonedMinionIds = stillLivingMinionIdsBossOwns;

        if (inFuryMode) {
            if (enemy.furyMinionSpawnCooldownTimer && enemy.furyMinionSpawnCooldownTimer > 0) {
                enemy.furyMinionSpawnCooldownTimer -= deltaTime;
            } else {
                const currentLivingBossMinionsCount = enemy.summonedMinionIds.length;
                const numberOfMinionsToSpawn = (enemy.maxMinionsFury || BOSS_MAX_MINIONS_FURY) - currentLivingBossMinionsCount;

                if (numberOfMinionsToSpawn > 0) {
                    for (let i = 0; i < numberOfMinionsToSpawn; i++) {
                        const newMinion = _createStandardMinionForBoss(currentWave, player.level, x, y, width, height, playSound);
                        enemiesToSpawnThisFrame.push(newMinion);
                        enemy.summonedMinionIds.push(newMinion.id); 
                    }
                    enemy.showMinionSpawnedMessageTimer = 2; 
                    enemy.furyMinionSpawnCooldownTimer = BOSS_FURY_MINION_SPAWN_COOLDOWN; 
                }
            }
        } else { 
            if (enemy.summonedMinionIds.length === 0 && (enemy.minionRespawnTimer || 0) <= 0) {
                enemy.minionRespawnTimer = enemy.minionRespawnCooldown || BOSS_MINION_RESPAWN_COOLDOWN;
            }
            if (enemy.minionRespawnTimer && enemy.minionRespawnTimer > 0) {
                enemy.minionRespawnTimer -= deltaTime;
                if (enemy.minionRespawnTimer <= BOSS_MINION_RESPAWN_WARNING_DURATION && (enemy.showMinionWarningTimer || 0) <= 0 && enemy.minionRespawnTimer > 0.1) {
                    enemy.showMinionWarningTimer = BOSS_MINION_RESPAWN_WARNING_DURATION;
                }

                if (enemy.minionRespawnTimer <= 0) {
                    for (let i = 0; i < (enemy.maxMinionsNormal || BOSS_MAX_MINIONS_NORMAL); i++) {
                        const newMinion = _createStandardMinionForBoss(currentWave, player.level, x, y, width, height, playSound);
                        enemiesToSpawnThisFrame.push(newMinion);
                        enemy.summonedMinionIds.push(newMinion.id);
                    }
                    enemy.showMinionSpawnedMessageTimer = 2;
                    enemy.showMinionWarningTimer = 0; 
                }
            }
        }
    }


    if (enemy.isReturningToCenter) {
      enemy.returnToCenterTimer -= deltaTime;
      const targetCenterX = CANVAS_WIDTH / 2 - width / 2;
      if (Math.abs(x - targetCenterX) < effectiveSpeed * deltaTime * 0.5 || enemy.returnToCenterTimer <= 0) {
        calculatedVx = 0;
        enemy.isReturningToCenter = false;
        enemy.directionChangeCounter = 0; 
      } else if (x < targetCenterX) {
        calculatedVx = effectiveSpeed;
      } else {
        calculatedVx = -effectiveSpeed;
      }
    } else {
      let closestThreatProjectile: Projectile | null = null;
      let minTimeToImpact = Infinity; 
      const THREAT_DETECTION_TIME_THRESHOLD = 1.8; 

      for (const proj of playerProjectiles) {
          if(proj.owner !== 'player' || !proj.vx) continue; 

          let actualTimeToCollision = Infinity;
          let isPotentialThreat = false;
          
          const bossY_Top = y;
          const bossY_Bottom = y + height;

          let timeToXEnter = Infinity, timeToXExit = Infinity;
          if (proj.vx > 0) { 
              timeToXEnter = (x - (proj.x + proj.width)) / proj.vx;
              timeToXExit = ((x + width) - proj.x) / proj.vx;
          } else { 
              timeToXEnter = ((x + width) - proj.x) / proj.vx; 
              timeToXExit = (x - (proj.x + proj.width)) / proj.vx;
          }

          if (timeToXEnter < 0 && timeToXExit > 0) timeToXEnter = 0; 

          if (timeToXEnter >= 0 && timeToXEnter < THREAT_DETECTION_TIME_THRESHOLD) {
              const predictedProjYAtXEnter = proj.y + (proj.vy || 0) * timeToXEnter;
              const predictedProjTopAtXEnter = predictedProjYAtXEnter;
              const predictedProjBottomAtXEnter = predictedProjYAtXEnter + proj.height;

              if (predictedProjBottomAtXEnter > bossY_Top && predictedProjTopAtXEnter < bossY_Bottom) {
                  actualTimeToCollision = Math.min(actualTimeToCollision, timeToXEnter);
                  isPotentialThreat = true;
              }
          }
          
          const currentXOverlap = (proj.x < x + width && proj.x + proj.width > x);
          if (currentXOverlap && proj.vy) {
              let timeToYEnter = Infinity, timeToYExit = Infinity;
              if (proj.vy > 0) { 
                  timeToYEnter = (y - (proj.y + proj.height)) / proj.vy;
                  timeToYExit = ((y + height) - proj.y) / proj.vy;
              } else { 
                  timeToYEnter = ((y + height) - proj.y) / proj.vy; 
                  timeToYExit = (y - (proj.y + proj.height)) / proj.vy;
              }
              if (timeToYEnter < 0 && timeToYExit > 0) timeToYEnter = 0;

              if (timeToYEnter >=0 && timeToYEnter < THREAT_DETECTION_TIME_THRESHOLD) {
                  actualTimeToCollision = Math.min(actualTimeToCollision, timeToYEnter);
                  isPotentialThreat = true;
              }
          }

          if (isPotentialThreat && actualTimeToCollision < minTimeToImpact) {
              minTimeToImpact = actualTimeToCollision;
              closestThreatProjectile = proj;
          }
      }

      if (closestThreatProjectile) {
          const threatProjCenterX = closestThreatProjectile.x + closestThreatProjectile.width / 2;
          const bossCenterX = x + width / 2;
          let idealDodgeDirectionFromProjectile = 0;
          
          if (threatProjCenterX < bossCenterX) idealDodgeDirectionFromProjectile = 1; 
          else if (threatProjCenterX > bossCenterX) idealDodgeDirectionFromProjectile = -1;
          else idealDodgeDirectionFromProjectile = (x + width / 2 < CANVAS_WIDTH / 2) ? 1 : -1;

          calculatedVx = idealDodgeDirectionFromProjectile * effectiveSpeed;

          const isNearLeftWall = x + calculatedVx * deltaTime <= BOSS_WALL_DODGE_BUFFER;
          const isNearRightWall = (x + width) + calculatedVx * deltaTime >= (CANVAS_WIDTH - BOSS_WALL_DODGE_BUFFER);

          if (calculatedVx < 0 && isNearLeftWall) { 
              calculatedVx = effectiveSpeed; 
          } else if (calculatedVx > 0 && isNearRightWall) { 
              calculatedVx = -effectiveSpeed; 
          }
      } else {
          calculatedVx = 0; 
      }
    }
    
    vx = calculatedVx; 
    x += vx * deltaTime;
    x = Math.max(0, Math.min(x, CANVAS_WIDTH - width)); 

    if (!enemy.isReturningToCenter) { 
      if (vx !== 0 && enemy.lastAppliedVx !== 0 && Math.sign(vx) !== Math.sign(enemy.lastAppliedVx)) {
        enemy.directionChangeCounter++;
      } else if (Math.abs(vx) > 0.1 || Math.abs(enemy.lastAppliedVx) > 0.1) { 
        enemy.directionChangeCounter = 0; 
      }
      
      if (enemy.directionChangeCounter >= VIBRATION_THRESHOLD) {
        enemy.isReturningToCenter = true;
        enemy.returnToCenterTimer = RETURN_TO_CENTER_DURATION;
        enemy.directionChangeCounter = 0; 
      }
    }
    enemy.lastAppliedVx = vx; 

  } else { 
    if (!isFollowingPlayer && y > CANVAS_HEIGHT * 0.15) { 
      isFollowingPlayer = true;
    }

    if (isFollowingPlayer) {
      const dx = player.x + player.width / 2 - (x + width / 2);
      const dy = player.y + player.height / 2 - (y + height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        vx = (vx * 0.95) + (dx / dist * effectiveSpeed * 0.05); 
        
        let targetVy = (vy * 0.95) + (dy / dist * effectiveSpeed * 0.05); 
        let potentialY = y + targetVy * deltaTime;

        if (targetVy > 0 && (potentialY + height) > ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE) {
          y = ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE - height; 
          vy = 0; 
        } else {
          vy = targetVy;
          y = potentialY;
        }
        x += vx * deltaTime;
      }
    } else { 
      vy = effectiveSpeed * 0.5; 
      vx = 0;
      y += vy * deltaTime;
      x += vx * deltaTime;

       if ((y + height) > ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE) {
          y = ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE - height;
          vy = 0;
          isFollowingPlayer = true; 
      }
    }
    
    if (x < 0) x = 0;
    if (x + width > CANVAS_WIDTH) x = CANVAS_WIDTH - width;
  }

  if (isFollowingPlayer && performance.now() - lastShotTime > effectiveShootCooldown) {
    lastShotTime = performance.now();
    playSound(enemyType === 'boss' ? '/assets/sounds/enemy_boss_shoot_01.wav' : '/assets/sounds/enemy_shoot_generic_01.wav', 0.4);
    const angle = Math.atan2(
      player.y + player.height / 2 - (y + height / 2),
      player.x + player.width / 2 - (x + width / 2)
    );
    const projectileSpeedBase = (enemyType === 'boss' ? 600 : (enemyType === 'miniSplitter' ? 480 : 440) ); 
    const projectileSpeed = (projectileSpeedBase + currentWave * 5) * (chillEffect && chillEffect.attackSpeedSlowFactor ? chillEffect.attackSpeedSlowFactor : 1); 

    let currentEnemyDamage = enemyDamage;
    if (enemyType === 'boss' && inFuryMode) {
        currentEnemyDamage *= BOSS_FURY_DAMAGE_MULTIPLIER; 
    }
    
    const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE;
    const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE;

    addEnemyProjectile(
      x + width / 2 - projectileWidth / 2, 
      y + height / 2 - projectileHeight / 2,
      Math.cos(angle) * projectileSpeed,
      Math.sin(angle) * projectileSpeed,
      currentEnemyDamage,
      'enemy',
      ENEMY_PROJECTILE_COLOR,
      undefined // No glow for default enemy projectiles
    );
  }
  
  enemy.x = x;
  enemy.y = y;
  enemy.vx = vx;
  enemy.vy = vy;
  enemy.isFollowingPlayer = isFollowingPlayer;
  enemy.lastShotTime = lastShotTime;

  return {
    updatedEnemy: enemy, 
    newProjectiles: [], 
    enemiesToSpawn: enemiesToSpawnThisFrame
  };
}
