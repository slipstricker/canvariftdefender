

import { Enemy, Player, Projectile, AppliedStatusEffect, EnemyType, AlienVisualVariant, EnemyUpdateResult, FloatingText, Particle, CenterScreenMessage, ParticleType, ProjectileEffectType } from '../types';
import { 
    CANVAS_HEIGHT, CANVAS_WIDTH, ENEMY_PROJECTILE_COLOR, GRAVITY,
    SPRITE_PIXEL_SIZE, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT, BOSS_ART_WIDTH, BOSS_ART_HEIGHT,
    PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT,
    BOSS_MINION_RESPAWN_COOLDOWN, BOSS_MINION_RESPAWN_WARNING_DURATION,
    BOSS_MAX_MINIONS_NORMAL, BOSS_MAX_MINIONS_FURY, BOSS_FURY_MINION_SPAWN_COOLDOWN,
    BOSS_SUMMON_WARNING_UPDATE_INTERVAL,
    HEALING_DRONE_RETREAT_Y_MIN_FACTOR, HEALING_DRONE_RETREAT_Y_MAX_FACTOR,
    HEALING_DRONE_MAX_TARGETS, HEALING_DRONE_STATE_DURATION_BASE, HEALING_DRONE_HEAL_PERCENTAGE,
    BOSS_TELEPORT_COOLDOWN_MS, BOSS_PREFERRED_Y_POSITION, BOSS_TELEPORT_MAX_Y_DESTINATION,
    BOSS_TELEPORT_MIN_Y_AFTER_TELEPORT_FOR_RETURN,
    BOSS_LASER_CHARGE_TIME_MS, BOSS_LASER_COOLDOWN_MS, BOSS_LASER_SPEED, BOSS_LASER_COLOR, BOSS_LASER_GLOW_COLOR, BOSS_LASER_WIDTH_FACTOR, BOSS_LASER_MAX_LENGTH, BOSS_LASER_PIERCE_COUNT, ENEMY_CONFIG, BOSS_LASER_DURATION_MS,
    BOSS_GLOBAL_SKILL_COOLDOWN_MS
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
  // const baseExp = 3 * waveMultiplier; // XP value for minions is now 0
  // const expPerPlayerLevel = 0.5 * waveMultiplier; // XP value for minions is now 0
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
  const enemyExp = 0; // Minions grant no XP
  let shootCooldownBase = Math.max(400, 2000 - currentWave * 40);
  shootCooldownBase *= 1.00; 

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
    expValue: enemyExp, // Set to 0
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
  addEnemyProjectileCallback: ( // Renamed from addEnemyProjectile for clarity
    x: number, y: number, vx: number, vy: number, damage: number, 
    owner: 'player' | 'enemy', color: string, glowColor?: string, 
    projectileEffectType?: ProjectileEffectType, hitsLeftOverride?: number, customWidth?: number, customHeight?: number
  ) => void,
  currentWave: number,
  playerProjectiles: Readonly<Projectile[]>,
  playSound: (soundName: string, volume?: number) => void,
  allEnemies?: Readonly<Enemy[]>, 
  setCenterMessageFn?: React.Dispatch<React.SetStateAction<CenterScreenMessage | null>>, 
  setFloatingTextsFn?: React.Dispatch<React.SetStateAction<FloatingText[]>>, 
  createParticleEffectFn?: (x: number, y: number, count: number, color: string, size?: number, speed?: number, life?: number, type?: ParticleType) => void 
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
  
  enemy.lastTeleportTime = enemy.lastTeleportTime || 0;
  enemy.teleportCooldownValue = enemy.teleportCooldownValue || BOSS_TELEPORT_COOLDOWN_MS;
  enemy.isReturningToTopAfterTeleport = enemy.isReturningToTopAfterTeleport || false;

  enemy.isHealingDrone = enemy.isHealingDrone || false;
  enemy.healCooldownValue = enemy.healCooldownValue || 5000;
  enemy.lastHealTime = enemy.lastHealTime || 0;
  enemy.healingTargetIds = enemy.healingTargetIds || [];
  enemy.healingRange = enemy.healingRange || 200 * SPRITE_PIXEL_SIZE;
  enemy.scanRange = enemy.scanRange || 400 * SPRITE_PIXEL_SIZE;
  enemy.droneState = enemy.droneState || 'IDLE_SCANNING';
  enemy.retreatPosition = enemy.retreatPosition || { x: Math.random() * CANVAS_WIDTH, y: CANVAS_HEIGHT * HEALING_DRONE_RETREAT_Y_MAX_FACTOR };
  enemy.timeInCurrentState = (enemy.timeInCurrentState || 0) + deltaTime;
  
  // Laser ability specific inits
  enemy.canUseLaser = enemy.canUseLaser || false;
  enemy.isChargingLaser = enemy.isChargingLaser || false;
  enemy.laserChargeTimer = enemy.laserChargeTimer || 0;
  enemy.laserCooldownValue = enemy.laserCooldownValue || BOSS_LASER_COOLDOWN_MS;
  enemy.lastLaserFireTime = enemy.lastLaserFireTime || 0;
  enemy.isPerformingChargeAbility = enemy.isPerformingChargeAbility || false;
  enemy.lastAbilityEndTime = enemy.lastAbilityEndTime || 0;


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

  if (enemy.isHealingDrone && allEnemies && setFloatingTextsFn && createParticleEffectFn) {
    vx = 0; vy = 0; 
    switch (enemy.droneState) {
        case 'IDLE_SCANNING':
            const potentialTargets = allEnemies
                .filter(e => e.id !== enemy.id && e.hp > 0 && e.hp < e.maxHp && e.enemyType !== 'healing_drone') 
                .map(e => {
                    const dx = e.x - enemy.x;
                    const dy = e.y - enemy.y;
                    return { ...e, distanceSq: dx * dx + dy * dy, hpPercentage: e.hp / e.maxHp };
                })
                .filter(e => e.distanceSq < (enemy.scanRange! * enemy.scanRange!))
                .sort((a, b) => a.hpPercentage - b.hpPercentage); 

            enemy.healingTargetIds = potentialTargets.slice(0, HEALING_DRONE_MAX_TARGETS).map(e => e.id);

            if (enemy.healingTargetIds.length > 0) {
                enemy.droneState = 'MOVING_TO_HEAL';
                enemy.timeInCurrentState = 0;
            } else { 
                const targetY = enemy.retreatPosition!.y;
                if (Math.abs(y - targetY) > effectiveSpeed * deltaTime) {
                    vy = (targetY - y > 0 ? 1 : -1) * effectiveSpeed * 0.5; 
                }
                const targetX = enemy.retreatPosition!.x;
                 if (Math.abs(x - targetX) > effectiveSpeed * deltaTime) {
                    vx = (targetX - x > 0 ? 1 : -1) * effectiveSpeed * 0.3;
                }
            }
            break;
        case 'MOVING_TO_HEAL':
            if (enemy.healingTargetIds!.length === 0) {
                enemy.droneState = 'RETREATING'; 
                enemy.timeInCurrentState = 0;
                break;
            }
            const validTargets = allEnemies.filter(e => enemy.healingTargetIds!.includes(e.id) && e.hp > 0);
            if (validTargets.length === 0) {
                 enemy.droneState = 'RETREATING'; enemy.timeInCurrentState = 0; break;
            }
            const avgTargetX = validTargets.reduce((sum, t) => sum + t.x + t.width/2, 0) / validTargets.length;
            const avgTargetY = validTargets.reduce((sum, t) => sum + t.y + t.height/2, 0) / validTargets.length;
            const dxToAvg = avgTargetX - (x + width/2);
            const dyToAvg = avgTargetY - (y + height/2);
            const distToAvg = Math.sqrt(dxToAvg * dxToAvg + dyToAvg * dyToAvg);
            if (distToAvg > 0) { vx = (dxToAvg / distToAvg) * effectiveSpeed; vy = (dyToAvg / distToAvg) * effectiveSpeed; }
            const allTargetsInRange = validTargets.every(t => {
                const dxt = (t.x + t.width/2) - (x + width/2); const dyt = (t.y + t.height/2) - (y + height/2);
                return (dxt * dxt + dyt * dyt) < (enemy.healingRange! * enemy.healingRange!);
            });
            if (allTargetsInRange || enemy.timeInCurrentState! > HEALING_DRONE_STATE_DURATION_BASE * 1.5) { 
                enemy.droneState = 'HEALING_PULSE'; enemy.timeInCurrentState = 0;
            }
            break;
        case 'HEALING_PULSE':
            if (performance.now() - (enemy.lastHealTime || 0) > enemy.healCooldownValue!) {
                enemy.lastHealTime = performance.now();
                const actualHealedTargets: Enemy[] = [];
                allEnemies.forEach(potentialTarget => {
                    if (enemy.healingTargetIds!.includes(potentialTarget.id) && potentialTarget.hp > 0 && potentialTarget.hp < potentialTarget.maxHp) {
                        const healVal = potentialTarget.maxHp * HEALING_DRONE_HEAL_PERCENTAGE;
                        potentialTarget.hp = Math.min(potentialTarget.maxHp, potentialTarget.hp + healVal);
                        actualHealedTargets.push(potentialTarget);
                        setFloatingTextsFn(prev => [...prev, {
                            id: `heal-${potentialTarget.id}-${performance.now()}`, text: `+${Math.round(healVal)}`,
                            x: potentialTarget.x + potentialTarget.width / 2, y: potentialTarget.y,
                            vy: -60, life: 0.7, initialLife: 0.7, color: "#90EE90", fontSize: 18,
                        }]);
                    }
                });
                if (actualHealedTargets.length > 0) {
                     playSound('/assets/sounds/player_revive_01.wav', 0.3); 
                    createParticleEffectFn(x + width/2, y + height/2, 18, '#ADFF2F', 40 * SPRITE_PIXEL_SIZE * 0.5, 80 * SPRITE_PIXEL_SIZE * 0.5, 0.5, 'heal_pulse'); 
                    actualHealedTargets.forEach(target => {
                         createParticleEffectFn(target.x + target.width/2, target.y + target.height/2, 13, '#98FB98', 35 * SPRITE_PIXEL_SIZE*0.5, 70 * SPRITE_PIXEL_SIZE*0.5, 0.4, 'heal_pulse'); 
                    });
                }
                enemy.retreatPosition = { x: Math.random() * (CANVAS_WIDTH - width), y: CANVAS_HEIGHT * (HEALING_DRONE_RETREAT_Y_MIN_FACTOR + Math.random() * (HEALING_DRONE_RETREAT_Y_MAX_FACTOR - HEALING_DRONE_RETREAT_Y_MIN_FACTOR)) };
                enemy.droneState = 'RETREATING'; enemy.timeInCurrentState = 0;
            } else if (enemy.timeInCurrentState! > (enemy.healCooldownValue! / 1000) + 0.5) { 
                 enemy.droneState = 'RETREATING'; enemy.timeInCurrentState = 0;
            }
            break;
        case 'RETREATING':
            const targetX = enemy.retreatPosition!.x; const targetY = enemy.retreatPosition!.y;
            const dxRetreat = targetX - (x + width/2); const dyRetreat = targetY - (y + height/2);
            const distRetreat = Math.sqrt(dxRetreat * dxRetreat + dyRetreat * dyRetreat);
            if (distRetreat > effectiveSpeed * deltaTime * 0.5) { vx = (dxRetreat / distRetreat) * effectiveSpeed; vy = (dyRetreat / distRetreat) * effectiveSpeed; } 
            else { enemy.droneState = 'IDLE_SCANNING'; enemy.timeInCurrentState = 0; }
            if (enemy.timeInCurrentState! > HEALING_DRONE_STATE_DURATION_BASE * 2) { 
                 enemy.droneState = 'IDLE_SCANNING'; enemy.timeInCurrentState = 0;
            }
            break;
    }
    y += vy * deltaTime; x += vx * deltaTime;
    const minYPos = CANVAS_HEIGHT * HEALING_DRONE_RETREAT_Y_MIN_FACTOR; const maxYPos = CANVAS_HEIGHT * 0.5; 
    y = Math.max(minYPos, Math.min(y, maxYPos - height)); x = Math.max(0, Math.min(x, CANVAS_WIDTH - width));
  } else if (enemyType === 'boss') {
    let didTeleportThisFrame = false;
    const now = performance.now();
    const canUseAnyAbility = (now - (enemy.lastAbilityEndTime || 0)) > BOSS_GLOBAL_SKILL_COOLDOWN_MS;

    // --- Boss Laser Ability ---
    if (enemy.canUseLaser) { 
        if (enemy.isChargingLaser) { // Already charging
            enemy.laserChargeTimer = (enemy.laserChargeTimer || 0) - deltaTime;
            enemy.isPerformingChargeAbility = true; // Ensure this is set
            if (createParticleEffectFn && Math.random() < 0.5) { 
                const chargeProgress = 1 - ((enemy.laserChargeTimer || 0) / (BOSS_LASER_CHARGE_TIME_MS / 1000));
                 createParticleEffectFn(
                    x + Math.random() * width, y + Math.random() * height,
                    1, `rgba(255, ${100 - chargeProgress * 100}, 0, ${0.3 + chargeProgress * 0.5})`,
                    width * 0.05 + chargeProgress * width * 0.1, -50 - chargeProgress * 100, 
                    0.2 + chargeProgress * 0.3, 'boss_laser_charge'
                );
            }

            if ((enemy.laserChargeTimer || 0) <= 0) { // Charge complete, fire laser
                playSound('/assets/sounds/enemy_boss_shoot_01.wav', 0.9); 
                const bossCenterX = x + width / 2; const bossCenterY = y + height / 2;
                const playerCenterX = player.x + player.width / 2; const playerCenterY = player.y + player.height / 2;
                const angleToPlayer = Math.atan2(playerCenterY - bossCenterY, playerCenterX - bossCenterX);
                const distanceToPlayer = Math.sqrt(Math.pow(playerCenterX - bossCenterX, 2) + Math.pow(playerCenterY - bossCenterY, 2));
                const laserDamage = enemyDamage * (ENEMY_CONFIG.boss.laserDamageFactor || 2.0); 
                const laserThickness = width * BOSS_LASER_WIDTH_FACTOR;
                const laserMaxLengthTrue = Math.min(BOSS_LASER_MAX_LENGTH, distanceToPlayer);

                addEnemyProjectileCallback( bossCenterX, bossCenterY, Math.cos(angleToPlayer), Math.sin(angleToPlayer),
                    laserDamage, 'enemy', BOSS_LASER_COLOR, BOSS_LASER_GLOW_COLOR, 'boss_laser',
                    BOSS_LASER_PIERCE_COUNT, laserThickness, laserMaxLengthTrue );
                
                enemy.isChargingLaser = false;
                enemy.isPerformingChargeAbility = false;
                enemy.lastLaserFireTime = now;
                enemy.laserChargeTimer = 0;
                enemy.lastAbilityEndTime = now; // Ability finished
            }
        } else if (canUseAnyAbility && now - (enemy.lastLaserFireTime || 0) > (enemy.laserCooldownValue || BOSS_LASER_COOLDOWN_MS)) {
            // Start Charging Laser (if global and specific cooldowns allow)
            enemy.isChargingLaser = true;
            enemy.isPerformingChargeAbility = true;
            enemy.laserChargeTimer = BOSS_LASER_CHARGE_TIME_MS / 1000; 
            enemy.lastShotTime = now; // Prevent normal shooting while charging
            if (setCenterMessageFn) setCenterMessageFn({ text: "Boss Carregando Laser!", duration: BOSS_LASER_CHARGE_TIME_MS/1000, initialDuration: BOSS_LASER_CHARGE_TIME_MS/1000, color: '#FF4500', fontSize: 18 });
        }
    }

    if (!enemy.isPerformingChargeAbility) { // If not in the middle of a charge-up for laser
        // Minion summoning logic
        if (enemy.canSummonMinions && allEnemies && canUseAnyAbility) { 
            const stillLivingMinionIdsBossOwns = (enemy.summonedMinionIds || []).filter(minionId => 
                allEnemies.some(e => e.id === minionId && e.hp > 0)
            );
            enemy.summonedMinionIds = stillLivingMinionIdsBossOwns;
            let minionsSummonedThisCycle = false;
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
                        minionsSummonedThisCycle = true;
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
                         minionsSummonedThisCycle = true;
                        enemy.showMinionSpawnedMessageTimer = 2;
                        enemy.showMinionWarningTimer = 0; 
                    }
                }
            }
            if (minionsSummonedThisCycle) {
                enemy.lastAbilityEndTime = now; // Minions summoned, ability "ended"
            }
        }
        
        // Teleport logic (gated by canTeleport and global cooldown)
        if (enemy.canTeleport && canUseAnyAbility && now - (enemy.lastTeleportTime || 0) > (enemy.teleportCooldownValue || BOSS_TELEPORT_COOLDOWN_MS)) {
            didTeleportThisFrame = true;
            const oldX = x; const oldY = y;
            if (createParticleEffectFn) { createParticleEffectFn(oldX + width / 2, oldY + height / 2, 35, '#6A0DAD', width * 0.6, -80, 0.4, 'generic'); }
            playSound('/assets/sounds/player_dash_01.wav', 0.5); 
            x = Math.random() * (CANVAS_WIDTH - width);
            y = Math.random() * (BOSS_TELEPORT_MAX_Y_DESTINATION - height); 
            y = Math.max(0, y); 
            enemy.lastTeleportTime = now; // Specific cooldown for teleport
            enemy.lastAbilityEndTime = now; // Global cooldown reset
            if (createParticleEffectFn) { createParticleEffectFn(x + width / 2, y + height / 2, 45, '#AFEEEE', width * 0.7, 120, 0.5, 'generic'); }
            if (y > BOSS_TELEPORT_MIN_Y_AFTER_TELEPORT_FOR_RETURN) { enemy.isReturningToTopAfterTeleport = true; } 
            else { enemy.isReturningToTopAfterTeleport = false; }
            enemy.isReturningToCenter = false; 
            enemy.directionChangeCounter = 0;
        }

        // Y-Position Management & Vertical Movement for Boss
        if (enemy.isReturningToTopAfterTeleport) {
            const targetY = BOSS_PREFERRED_Y_POSITION; const dyToTarget = targetY - y;
            if (Math.abs(dyToTarget) < effectiveSpeed * deltaTime * 0.8) { y = targetY; vy = 0; enemy.isReturningToTopAfterTeleport = false; } 
            else { vy = Math.sign(dyToTarget) * effectiveSpeed * 0.7; }
        } else if (!didTeleportThisFrame) { y = BOSS_PREFERRED_Y_POSITION; vy = 0; } 
        else { vy = 0; } 

        // X-Position Management (Evasion, Centering)
        let calculatedVx = 0;
        if (enemy.isReturningToCenter) {
          enemy.returnToCenterTimer -= deltaTime;
          const targetCenterX = CANVAS_WIDTH / 2 - width / 2;
          if (Math.abs(x - targetCenterX) < effectiveSpeed * deltaTime * 0.5 || enemy.returnToCenterTimer <= 0) { calculatedVx = 0; enemy.isReturningToCenter = false; enemy.directionChangeCounter = 0; } 
          else if (x < targetCenterX) { calculatedVx = effectiveSpeed; } 
          else { calculatedVx = -effectiveSpeed; }
        } else { 
          let closestThreatProjectile: Projectile | null = null; let minTimeToImpact = Infinity; 
          const THREAT_DETECTION_TIME_THRESHOLD = 1.8; 
          for (const proj of playerProjectiles) {
              if(proj.owner !== 'player' || !proj.vx) continue; 
              let actualTimeToCollision = Infinity; let isPotentialThreat = false;
              const bossY_Top = y; const bossY_Bottom = y + height;
              let timeToXEnter = Infinity, timeToXExit = Infinity;
              if (proj.vx > 0) { timeToXEnter = (x - (proj.x + proj.width)) / proj.vx; timeToXExit = ((x + width) - proj.x) / proj.vx; } 
              else { timeToXEnter = ((x + width) - proj.x) / proj.vx; timeToXExit = (x - (proj.x + proj.width)) / proj.vx; }
              if (timeToXEnter < 0 && timeToXExit > 0) timeToXEnter = 0; 
              if (timeToXEnter >= 0 && timeToXEnter < THREAT_DETECTION_TIME_THRESHOLD) {
                  const predictedProjYAtXEnter = proj.y + (proj.vy || 0) * timeToXEnter;
                  if (predictedProjYAtXEnter + proj.height > bossY_Top && predictedProjYAtXEnter < bossY_Bottom) { actualTimeToCollision = Math.min(actualTimeToCollision, timeToXEnter); isPotentialThreat = true; }
              }
              const currentXOverlap = (proj.x < x + width && proj.x + proj.width > x);
              if (currentXOverlap && proj.vy) {
                  let timeToYEnter = Infinity, timeToYExit = Infinity;
                  if (proj.vy > 0) { timeToYEnter = (y - (proj.y + proj.height)) / proj.vy; timeToYExit = ((y + height) - proj.y) / proj.vy; } 
                  else { timeToYEnter = ((y + height) - proj.y) / proj.vy; timeToYExit = (y - (proj.y + proj.height)) / proj.vy; }
                  if (timeToYEnter < 0 && timeToYExit > 0) timeToYEnter = 0;
                  if (timeToYEnter >=0 && timeToYEnter < THREAT_DETECTION_TIME_THRESHOLD) { actualTimeToCollision = Math.min(actualTimeToCollision, timeToYEnter); isPotentialThreat = true; }
              }
              if (isPotentialThreat && actualTimeToCollision < minTimeToImpact) { minTimeToImpact = actualTimeToCollision; closestThreatProjectile = proj; }
          }
          if (closestThreatProjectile) {
              const threatProjCenterX = closestThreatProjectile.x + closestThreatProjectile.width / 2;
              const bossCenterX = x + width / 2;
              let idealDodgeDirection = (threatProjCenterX < bossCenterX) ? 1 : (threatProjCenterX > bossCenterX ? -1 : ((x + width/2 < CANVAS_WIDTH/2) ? 1 : -1));
              calculatedVx = idealDodgeDirection * effectiveSpeed;
              if ((calculatedVx < 0 && x + calculatedVx * deltaTime <= BOSS_WALL_DODGE_BUFFER) || (calculatedVx > 0 && (x + width) + calculatedVx * deltaTime >= (CANVAS_WIDTH - BOSS_WALL_DODGE_BUFFER))) { calculatedVx *= -1; }
          } else { calculatedVx = 0; }
        }
        vx = calculatedVx;
        
        if (!enemy.isReturningToCenter && !didTeleportThisFrame) { 
          if (vx !== 0 && enemy.lastAppliedVx !== 0 && Math.sign(vx) !== Math.sign(enemy.lastAppliedVx)) { enemy.directionChangeCounter++; } 
          else if (Math.abs(vx) > 0.1 || Math.abs(enemy.lastAppliedVx) > 0.1) { enemy.directionChangeCounter = 0; }
          if (enemy.directionChangeCounter >= VIBRATION_THRESHOLD) { enemy.isReturningToCenter = true; enemy.returnToCenterTimer = RETURN_TO_CENTER_DURATION; enemy.directionChangeCounter = 0; }
        }
        enemy.lastAppliedVx = vx; 
    } // End of !isPerformingChargeAbility block for Teleport/Minions/Movement

    // Final position update for boss (only if not charging laser)
    if (!enemy.isPerformingChargeAbility) {
        x += vx * deltaTime;
        y += vy * deltaTime; 
    }
    
    // Boundary checks for boss (always apply)
    x = Math.max(0, Math.min(x, CANVAS_WIDTH - width)); 
    y = Math.max(0, Math.min(y, CANVAS_HEIGHT - height)); 

  } else { // Standard, Splitter, MiniSplitter (non-boss, non-healing drone)
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
        if (targetVy > 0 && (potentialY + height) > ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE) { y = ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE - height; vy = 0; } 
        else { vy = targetVy; y = potentialY; }
        x += vx * deltaTime;
      }
    } else { 
      vy = effectiveSpeed * 0.5; vx = 0; y += vy * deltaTime; x += vx * deltaTime;
       if ((y + height) > ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE) { y = ENEMY_LOWEST_Y_ALLOWED_FOR_BOTTOM_EDGE - height; vy = 0; isFollowingPlayer = true; }
    }
    if (x < 0) x = 0; if (x + width > CANVAS_WIDTH) x = CANVAS_WIDTH - width;
  }

  // Shooting logic (not for healing drone, and not if boss is charging laser)
  if (!enemy.isHealingDrone && isFollowingPlayer && (!enemy.isChargingLaser || enemy.enemyType !== 'boss') && performance.now() - lastShotTime > effectiveShootCooldown) {
    lastShotTime = performance.now();
    playSound(enemyType === 'boss' ? '/assets/sounds/enemy_boss_shoot_01.wav' : '/assets/sounds/enemy_shoot_generic_01.wav', 0.4);
    const angle = Math.atan2( player.y + player.height / 2 - (y + height / 2), player.x + player.width / 2 - (x + width / 2));
    const projectileSpeedBase = (enemyType === 'boss' ? 600 : (enemyType === 'miniSplitter' ? 389 : 356) ); 
    const projectileSpeed = (projectileSpeedBase + currentWave * 5) * (chillEffect && chillEffect.attackSpeedSlowFactor ? chillEffect.attackSpeedSlowFactor : 1); 
    let currentEnemyDamage = enemyDamage; 
    const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE;
    const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE;
    addEnemyProjectileCallback(
      x + width / 2 - projectileWidth / 2, y + height / 2 - projectileHeight / 2,
      Math.cos(angle) * projectileSpeed, Math.sin(angle) * projectileSpeed,
      currentEnemyDamage, 'enemy', ENEMY_PROJECTILE_COLOR, undefined
    );
  }
  
  enemy.x = x; enemy.y = y; enemy.vx = vx; enemy.vy = vy;
  enemy.isFollowingPlayer = isFollowingPlayer; enemy.lastShotTime = lastShotTime;
  enemy.isReturningToTopAfterTeleport = enemy.isReturningToTopAfterTeleport; 
  enemy.isChargingLaser = enemy.isChargingLaser;
  enemy.laserChargeTimer = enemy.laserChargeTimer;
  enemy.lastLaserFireTime = enemy.lastLaserFireTime;
  enemy.isPerformingChargeAbility = enemy.isPerformingChargeAbility;
  enemy.lastAbilityEndTime = enemy.lastAbilityEndTime;

  return { updatedEnemy: enemy, newProjectiles: [], enemiesToSpawn: enemiesToSpawnThisFrame };
}


interface RunEnemyUpdateCycleResult {
    processedEnemies: Enemy[];
    newMinionsFromBoss: Enemy[];
}

export function runEnemyUpdateCycle(
    currentEnemies: Enemy[],
    player: Player,
    deltaTime: number,
    addEnemyProjectileCallback: (x: number, y: number, vx: number, vy: number, damage: number, owner: 'player' | 'enemy', color: string, glowColor?: string, projectileEffectType?: ProjectileEffectType, hitsLeftOverride?: number, customWidth?: number, customHeight?: number) => void,
    currentWave: number,
    currentPlayerProjectiles: Readonly<Projectile[]>,
    handleEnemyDeathCallback: (killedEnemy: Enemy) => void,
    setFloatingTextsCallback: React.Dispatch<React.SetStateAction<FloatingText[]>>,
    playSound: (soundName: string, volume?: number) => void,
    setCenterMessageFn?: React.Dispatch<React.SetStateAction<CenterScreenMessage | null>>, 
    createParticleEffectFn?: (x: number, y: number, count: number, color: string, size?: number, speed?: number, life?: number, type?: ParticleType) => void 
): RunEnemyUpdateCycleResult {
    let processedEnemiesList: Enemy[] = [];
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
                        id: `burn-${effect.id}-${performance.now()}`, text: `${Math.round(damageFromBurn)}`,
                        x: enemy.x + enemy.width / 2, y: enemy.y,
                        vy: -66, life: 0.6, initialLife: 0.6, color: "#FFA500", fontSize: 20,
                    };
                    setFloatingTextsCallback(prev => [...prev, burnText]);
                    if (enemy.hp <= 0) { handleEnemyDeathCallback({ ...enemy }); enemyKilledByStatus = true; break; }
                }
            }
            remainingStatusEffects.push(effect);
        }
        enemy.statusEffects = remainingStatusEffects;
        if (enemyKilledByStatus) return; 

        const enemyUpdateResult: EnemyUpdateResult = updateEnemy(
            enemy, player, deltaTime, addEnemyProjectileCallback, currentWave, currentPlayerProjectiles,
            playSound, currentEnemies, setCenterMessageFn, setFloatingTextsCallback, createParticleEffectFn
        );
        
        if (enemyUpdateResult.updatedEnemy.y < CANVAS_HEIGHT + enemyUpdateResult.updatedEnemy.height) {
            processedEnemiesList.push(enemyUpdateResult.updatedEnemy);
        }
        if (enemyUpdateResult.enemiesToSpawn && enemyUpdateResult.enemiesToSpawn.length > 0) {
            newMinionsFromBoss.push(...enemyUpdateResult.enemiesToSpawn);
        }
    });

    // Enemy-to-enemy separation logic
    const separatedEnemies: Enemy[] = processedEnemiesList.map(e => ({ ...e })); // Create a mutable copy for this step

    for (let i = 0; i < separatedEnemies.length; i++) {
        const e1 = separatedEnemies[i];
        // Exclude bosses and healing drones from being pushed by this simple logic
        if (!e1 || e1.enemyType === 'boss' || e1.isHealingDrone) {
            continue;
        }

        for (let j = i + 1; j < separatedEnemies.length; j++) {
            const e2 = separatedEnemies[j];
            // Also exclude bosses and healing drones from pushing others in this specific logic
            if (!e2 || e2.enemyType === 'boss' || e2.isHealingDrone) {
                continue;
            }

            const dx = (e1.x + e1.width / 2) - (e2.x + e2.width / 2);
            const dy = (e1.y + e1.height / 2) - (e2.y + e2.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const minSeparationDistance = (e1.width / 2 + e2.width / 2) * 0.9; // Allow slight overlap

            if (distance < minSeparationDistance && distance > 0.001) { // distance > 0 to avoid division by zero
                const overlap = minSeparationDistance - distance;
                const pushAmount = overlap / 2; // Each enemy moves by half the overlap

                const pushX = (dx / distance) * pushAmount;
                const pushY = (dy / distance) * pushAmount;

                // Apply separation
                e1.x += pushX;
                e1.y += pushY;
                e2.x -= pushX;
                e2.y -= pushY;

                // Clamp to canvas boundaries (basic clamping, primary movement logic should handle "floor")
                e1.x = Math.max(0, Math.min(e1.x, CANVAS_WIDTH - e1.width));
                e1.y = Math.max(0, Math.min(e1.y, CANVAS_HEIGHT - e1.height));
                e2.x = Math.max(0, Math.min(e2.x, CANVAS_WIDTH - e2.width));
                e2.y = Math.max(0, Math.min(e2.y, CANVAS_HEIGHT - e2.height));
            }
        }
    }
    
    return { processedEnemies: separatedEnemies, newMinionsFromBoss: newMinionsFromBoss };
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
