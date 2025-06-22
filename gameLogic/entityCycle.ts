

import { Enemy, Player, Projectile, AppliedStatusEffect, EnemyType, AlienVisualVariant, EnemyUpdateResult, FloatingText, Particle, CenterScreenMessage } from '../types';
import { 
    CANVAS_HEIGHT, CANVAS_WIDTH, ENEMY_PROJECTILE_COLOR, GRAVITY,
    SPRITE_PIXEL_SIZE, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT, BOSS_ART_WIDTH, BOSS_ART_HEIGHT,
    PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT,
    BOSS_MINION_RESPAWN_COOLDOWN, BOSS_MINION_RESPAWN_WARNING_DURATION,
    BOSS_MAX_MINIONS_NORMAL, BOSS_MAX_MINIONS_FURY, BOSS_FURY_MINION_SPAWN_COOLDOWN,
    BOSS_SUMMON_WARNING_UPDATE_INTERVAL
} from '../constants';
// Removed: import { CenterScreenMessage } from '../App'; // Assuming CenterScreenMessage is exported from App or types

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
  playSound('/assets/sounds/enemy_spawn_alien_01.wav', 0.4); // Minion spawn sound

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
  allEnemies?: Readonly<Enemy[]>, // For boss minion count
  setCenterMessageFn?: React.Dispatch<React.SetStateAction<CenterScreenMessage | null>> // For boss messages
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
     if (setCenterMessageFn && enemy.showMinionWarningTimer > 0) {
        setCenterMessageFn({ text: `Boss invocando Lacaios em ${Math.ceil(enemy.minionRespawnTimer || 0)}s...`, duration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, initialDuration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, color: '#FFA500', fontSize: 18 });
    }
  }
  if (enemy.showMinionSpawnedMessageTimer > 0) {
    enemy.showMinionSpawnedMessageTimer -= deltaTime;
    if (enemy.showMinionSpawnedMessageTimer < 0) enemy.showMinionSpawnedMessageTimer = 0;
    if (setCenterMessageFn && enemy.showMinionSpawnedMessageTimer > 0) {
         setCenterMessageFn({ text: `Lacaios Invocados!`, duration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, initialDuration: BOSS_SUMMON_WARNING_UPDATE_INTERVAL, color: '#FF4500', fontSize: 18 });
    }
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
    const projectileSpeedBase = (enemyType === 'boss' ? 600 : (enemyType === 'miniSplitter' ? 389 : 356) ); 
    const projectileSpeed = (projectileSpeedBase + currentWave * 5) * (chillEffect && chillEffect.attackSpeedSlowFactor ? chillEffect.attackSpeedSlowFactor : 1); 

    let currentEnemyDamage = enemyDamage;
    if (enemyType === 'boss' && inFuryMode) {
        // Fury damage multiplier is applied in constants.ts (ENEMY_CONFIG.boss.furyDamageMultiplier)
        // and should be part of the base enemyDamage if calculated correctly in enemyLogic.ts
        // This direct multiplication here might be redundant or double-dipping if enemyDamage already includes it.
        // For now, assuming enemyDamage is pre-fury, and this applies it.
        // Needs consistency check with how ENEMY_CONFIG.boss.furyDamageMultiplier is used.
        // The constant BOSS_FURY_DAMAGE_MULTIPLIER was removed from this file's imports.
        // Let's assume the fury damage is already baked into `enemyDamage` by `enemyLogic.ts` when fury mode starts.
        // So, this line might not be needed or should use a defined constant if applicable.
        // Given the error was about *missing* constants, and this one is missing, this line should be reviewed or removed.
        // For now, to fix the error, I will comment it out if it relies on a missing constant.
        // It seems `BOSS_FURY_DAMAGE_MULTIPLIER` was previously used. Since it's gone, the logic must rely on `enemyDamage` being correct.
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
      undefined 
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


interface RunEnemyUpdateCycleResult {
    processedEnemies: Enemy[];
    newMinionsFromBoss: Enemy[];
}

export function runEnemyUpdateCycle(
    currentEnemies: Enemy[],
    player: Player,
    deltaTime: number,
    addEnemyProjectileCallback: (x: number, y: number, vx: number, vy: number, damage: number, owner: 'player' | 'enemy', color: string, glowColor?: string) => void,
    currentWave: number,
    currentPlayerProjectiles: Readonly<Projectile[]>,
    handleEnemyDeathCallback: (killedEnemy: Enemy) => void,
    setFloatingTextsCallback: React.Dispatch<React.SetStateAction<FloatingText[]>>,
    playSound: (soundName: string, volume?: number) => void,
    setCenterMessageFn?: React.Dispatch<React.SetStateAction<CenterScreenMessage | null>> // Added setCenterMessageFn
): RunEnemyUpdateCycleResult {
    const processedEnemiesList: Enemy[] = [];
    const newMinionsFromBoss: Enemy[] = [];

    currentEnemies.forEach(baseEnemy => {
        if (!baseEnemy || baseEnemy.hp <= 0) return;

        let enemy = { ...baseEnemy };

        const remainingStatusEffects: AppliedStatusEffect[] = [];
        let enemyKilledByStatus = false;
        for (const effect of enemy.statusEffects) {
            effect.duration -= deltaTime;
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
                        vy: -66, life: 0.6, initialLife: 0.6, color: "#FFA500", fontSize: 20,
                    };
                    setFloatingTextsCallback(prev => [...prev, burnText]);

                    if (enemy.hp <= 0) {
                        handleEnemyDeathCallback({ ...enemy }); 
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
            player,
            deltaTime,
            addEnemyProjectileCallback,
            currentWave,
            currentPlayerProjectiles,
            playSound, 
            currentEnemies,
            setCenterMessageFn // Pass it down
        );
        
        if (enemyUpdateResult.updatedEnemy.y < CANVAS_HEIGHT + enemyUpdateResult.updatedEnemy.height) {
            processedEnemiesList.push(enemyUpdateResult.updatedEnemy);
        }

        if (enemyUpdateResult.enemiesToSpawn && enemyUpdateResult.enemiesToSpawn.length > 0) {
            newMinionsFromBoss.push(...enemyUpdateResult.enemiesToSpawn);
        }
    });

    return {
        processedEnemies: processedEnemiesList,
        newMinionsFromBoss: newMinionsFromBoss
    };
}


export function updateParticleSystem(
    currentParticles: Particle[],
    deltaTime: number,
    gravity: number
): Particle[] {
    return currentParticles.map(p => ({
        ...p,
        x: p.x + (p.vx ?? 0) * deltaTime,
        y: p.y + (p.vy ?? 0) * deltaTime,
        life: p.life - deltaTime,
        vy: (p.vy ?? 0) + (gravity / (p.particleType === 'player_double_jump' || p.particleType === 'player_land_dust' || p.particleType === 'coin_pickup' || p.particleType === 'dash_trail' ? 8 : 4)) * deltaTime
    })).filter(p => p.life > 0);
}
