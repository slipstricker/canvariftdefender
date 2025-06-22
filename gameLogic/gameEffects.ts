// gameLogic/gameEffects.ts
import React from 'react';
import { Player, Enemy, Projectile, Particle, ActiveLightningBolt, FloatingText, AppliedStatusEffect, ParticleType, AdminConfig, EnemyType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOSS_FURY_MODE_HP_THRESHOLD } from '../constants';
import { verticalLineIntersectsRect } from './utils'; // Ensure this path is correct

export function createParticleEffect(
    setParticlesFn: React.Dispatch<React.SetStateAction<Particle[]>>,
    x: number, y: number, count: number, color: string,
    sizeVariance = 17, speed = 440, life = 0.5, type: ParticleType = 'generic'
) {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        let currentSpeed = speed * (Math.random() * 0.5 + 0.5); // Randomize speed slightly
        let particleVy = Math.sin(angle) * currentSpeed;
        let particleVx = Math.cos(angle) * currentSpeed;
        let particleLife = life * (Math.random() * 0.5 + 0.5); // Randomize life slightly
        let particleWidth = Math.random() * (sizeVariance / 2) + (sizeVariance / 2); // Randomize size
        let particleHeight = particleWidth; // Assuming square particles for simplicity, can be changed

        // Type-specific adjustments
        if (type === 'player_double_jump') {
            particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.5) - Math.random() * speed * 0.3; // Upwards burst
            particleVx = (Math.random() - 0.5) * speed * 0.3; // Slight horizontal spread
            particleLife *= 0.8;
            particleWidth = sizeVariance * (0.5 + Math.random() * 0.3);
        } else if (type === 'player_land_dust') {
            particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.2); // Mostly upwards initially
            particleVx = (Math.random() - 0.5) * speed * 0.5; // Wider horizontal spread
            particleLife *= 0.7;
            particleWidth = sizeVariance * (0.6 + Math.random() * 0.4);
        } else if (type === 'coin_pickup') {
            particleVy = -Math.abs(Math.sin(angle) * currentSpeed * 0.3) - Math.random() * speed * 0.1; // Upwards, less forceful
            particleVx = (Math.random() - 0.5) * speed * 0.1; // Minimal horizontal spread
            particleLife *= 0.5;
            particleWidth = sizeVariance * (0.7 + Math.random() * 0.3);
        } else if (type === 'dash_trail') {
            particleVy = (Math.random() - 0.5) * speed * 0.2; // Small vertical spread
            particleVx = (Math.random() - 0.5) * speed * 0.2; // Small horizontal spread, directionally biased by dash later
            particleLife *= 0.6;
            particleWidth = sizeVariance * (0.4 + Math.random() * 0.3);
        }

        newParticles.push({
            x, y,
            width: particleWidth,
            height: particleHeight,
            vx: particleVx,
            vy: particleVy,
            life: particleLife,
            initialLife: particleLife, // Store initial life for effects like fading
            color,
            particleType: type,
            draw: () => { } // Placeholder, actual drawing is in entityRenderer
        });
    }
    setParticlesFn(prev => [...prev, ...newParticles]);
}

export function triggerThunderboltStrikes(
    boltCount: number,
    fixedTargetX: number | undefined,
    fixedTargetY: number | undefined,
    player: Player, // Current player state
    enemies: Readonly<Enemy[]>, // Current enemies state
    adminConfig: AdminConfig,
    setActiveLightningBoltsFn: React.Dispatch<React.SetStateAction<ActiveLightningBolt[]>>,
    setEnemiesFn: React.Dispatch<React.SetStateAction<Enemy[]>>,
    setFloatingTextsFn: React.Dispatch<React.SetStateAction<FloatingText[]>>,
    handleEnemyDeathCallback: (enemy: Enemy) => void,
    createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void
) {
    if (enemies.length === 0 && fixedTargetX === undefined) { // Only return if no enemies AND no fixed target
        return;
    }

    const newBoltVisuals: ActiveLightningBolt[] = [];
    const damagesToApply = new Map<string, { enemy: Enemy, damage: number, enemyType: EnemyType, maxHp: number, inFuryMode?: boolean }>();

    for (let i = 0; i < boltCount; i++) {
        let strikeX = fixedTargetX !== undefined ? fixedTargetX : Math.random() * CANVAS_WIDTH;
        let strikeYEnd = fixedTargetY !== undefined ? fixedTargetY : CANVAS_HEIGHT; // Strike down to this Y or ground

        const boltLifetime = 0.45; // seconds
        const avgPlayerDamage = (player.minProjectileDamage + player.maxProjectileDamage) / 2;
        let boltDamage = 30 + player.level * 5 + avgPlayerDamage * 0.5; // Base damage calculation

        if (player.isAdmin && adminConfig.damageMultiplier) {
            boltDamage *= adminConfig.damageMultiplier;
        }

        newBoltVisuals.push({
            id: `bolt-${performance.now()}-${Math.random()}-${i}`,
            startX: strikeX,
            startY: 0, // Start from top of screen
            endX: strikeX,
            endY: strikeYEnd,
            life: boltLifetime,
            initialLife: boltLifetime,
        });

        // Check collision with enemies
        enemies.forEach(enemy => {
            if (verticalLineIntersectsRect(strikeX, enemy)) {
                const existingDamageEntry = damagesToApply.get(enemy.id);
                const existingDamage = existingDamageEntry ? existingDamageEntry.damage : 0;
                damagesToApply.set(enemy.id, {
                    enemy: enemy, // Store original enemy data for handleEnemyDeath
                    damage: existingDamage + boltDamage,
                    enemyType: enemy.enemyType, // Store these for fury mode check
                    maxHp: enemy.maxHp,
                    inFuryMode: enemy.inFuryMode
                });
                // Particle effect on hit enemy
                createParticleEffectFn(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFFF00', 20, 100 * 2.2, 0.35);
            }
        });
        // Particle effect at impact point
        createParticleEffectFn(strikeX, strikeYEnd - 10, 30, '#ADD8E6', 50, 150 * 2.2, 0.55);
    }

    if (newBoltVisuals.length > 0) {
        setActiveLightningBoltsFn(prev => [...prev, ...newBoltVisuals]);
    }

    // Apply accumulated damage
    if (damagesToApply.size > 0) {
        setEnemiesFn(prevEnemies =>
            prevEnemies.map(enemyInState => {
                if (damagesToApply.has(enemyInState.id)) {
                    const { enemy: originalEnemyData, damage: totalDamageToApply, enemyType: currentEnemyType, maxHp: enemyMaxHp, inFuryMode: currentFuryMode } = damagesToApply.get(enemyInState.id)!;
                    let newHp = enemyInState.hp - totalDamageToApply;
                    let updatedFuryMode = currentFuryMode;

                    // Fury mode check
                    if (currentEnemyType === 'boss' && !currentFuryMode && newHp <= enemyMaxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
                        updatedFuryMode = true;
                        const furyText: FloatingText = {
                            id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                            x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100, // Central message
                            vy: 0, life: 3, initialLife: 3, color: "red", fontSize: 16,
                        };
                        setFloatingTextsFn(prevFt => [...prevFt, furyText]);
                    }

                    if (newHp <= 0) {
                        handleEnemyDeathCallback(originalEnemyData); // Use original data for consistent death processing
                        return null; // Remove enemy
                    }
                    return { ...enemyInState, hp: newHp, inFuryMode: updatedFuryMode };
                }
                return enemyInState;
            }).filter(Boolean) as Enemy[] // Filter out nulls (killed enemies)
        );
    }
}


export function applyBurnEffect(
    enemyToAffect: Enemy,
    currentPlayer: Player,
    adminConfig: AdminConfig // Assuming adminConfig might affect burn damage
): Enemy {
    if (!currentPlayer.appliesBurn) return enemyToAffect;

    const burnConfig = currentPlayer.appliesBurn;
    const existingBurn = enemyToAffect.statusEffects.find(se => se.type === 'burn');
    const avgPlayerDamage = (currentPlayer.minProjectileDamage + currentPlayer.maxProjectileDamage) / 2;
    let damagePerTick = avgPlayerDamage * burnConfig.damageFactor;

    if (currentPlayer.isAdmin && adminConfig.damageMultiplier) {
        damagePerTick *= adminConfig.damageMultiplier;
    }

    if (existingBurn) {
        existingBurn.duration = burnConfig.duration; // Refresh duration
        existingBurn.initialDuration = burnConfig.duration;
        existingBurn.stacks = Math.min((existingBurn.stacks || 0) + burnConfig.baseStacks, burnConfig.maxStacks); // Add stacks, cap at max
        existingBurn.damagePerTick = damagePerTick; // Update damage per tick (might change if player damage changes)
        existingBurn.lastTickTime = performance.now(); // Reset tick timer for immediate effect if interval passed
    } else {
        const newBurn: AppliedStatusEffect = {
            id: `burn-${performance.now()}-${Math.random()}`,
            type: 'burn',
            duration: burnConfig.duration,
            initialDuration: burnConfig.duration,
            damagePerTick: damagePerTick,
            tickInterval: burnConfig.tickInterval,
            lastTickTime: performance.now(), // Start ticking now
            stacks: burnConfig.baseStacks,
        };
        enemyToAffect.statusEffects.push(newBurn);
    }
    return { ...enemyToAffect }; // Return a new object to ensure state update
}

export function applyChillEffect(
    enemyToAffect: Enemy,
    currentPlayer: Player,
    setFloatingTextsFn: React.Dispatch<React.SetStateAction<FloatingText[]>> // For "CHILLED!" text
): Enemy {
    if (!currentPlayer.appliesChill) return enemyToAffect;

    const chillConfig = currentPlayer.appliesChill;
    const existingChill = enemyToAffect.statusEffects.find(se => se.type === 'chill');

    if (existingChill) {
        existingChill.duration = chillConfig.duration; // Refresh duration
        existingChill.initialDuration = chillConfig.duration;
        // Update slow factors if they can change (e.g., from different chill sources)
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
        // Show "CHILLED!" text
        const chillText: FloatingText = {
            id: `chilltext-${newChill.id}`,
            text: "CONGELADO!",
            x: enemyToAffect.x + enemyToAffect.width / 2,
            y: enemyToAffect.y - 5, // Slightly above the enemy
            vy: -55, life: 0.8, initialLife: 0.8, color: "#00FFFF", fontSize: 20,
        };
        setFloatingTextsFn(prev => [...prev, chillText]);
    }
    return { ...enemyToAffect }; // Return new object
}


export function handleExplosion(
    projectile: Projectile,
    maxTargets: number | undefined, // From onHitExplosionConfig or general explosion
    damageFactorOverride: number | undefined, // From onHitExplosionConfig
    player: Player, // Current player state
    enemies: Readonly<Enemy[]>, // Current enemies state
    adminConfig: AdminConfig,
    setEnemiesFn: React.Dispatch<React.SetStateAction<Enemy[]>>,
    setPlayerFn: React.Dispatch<React.SetStateAction<Player>>, // For lifesteal
    setFloatingTextsFn: React.Dispatch<React.SetStateAction<FloatingText[]>>,
    handleEnemyDeathCallback: (enemy: Enemy) => void,
    createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void
) {
    if (!projectile.explosionRadius) return;

    // Visual effect for explosion
    createParticleEffectFn(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2, 50, '#FF8000', 50, 250 * 2.2, 0.7, 'explosion');

    const damageFactor = damageFactorOverride ?? 0.75; // Use override if present, else default
    let explosionDamage = projectile.damage * damageFactor; // Projectile.damage is avg base damage

    if (player.isAdmin && adminConfig.damageMultiplier) {
        explosionDamage *= adminConfig.damageMultiplier;
    }

    const explosionCenterX = projectile.x + projectile.width / 2;
    const explosionCenterY = projectile.y + projectile.height / 2;

    const enemiesInRadius: Enemy[] = [];
    enemies.forEach(enemy => {
        if (!enemy || enemy.hp <= 0) return; // Skip dead or null enemies
        // Simple circular collision check for explosion
        const dx = (enemy.x + enemy.width / 2) - explosionCenterX;
        const dy = (enemy.y + enemy.height / 2) - explosionCenterY;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < projectile.explosionRadius! * projectile.explosionRadius!) {
            // Store distance for sorting, if needed, though simple iteration is fine for moderate numbers
            enemiesInRadius.push({ ...enemy, distanceToExplosion: Math.sqrt(distanceSq) });
        }
    });

    // Sort by distance if specific targeting logic is needed (e.g. closest first)
    enemiesInRadius.sort((a, b) => (a.distanceToExplosion || 0) - (b.distanceToExplosion || 0));
    const targetsToHit = maxTargets ? enemiesInRadius.slice(0, maxTargets) : enemiesInRadius;
    const hitEnemyIds = new Set<string>(targetsToHit.map(e => e.id));

    setEnemiesFn(prevEnemies => prevEnemies.map(enemy => {
        if (!enemy || enemy.hp <= 0 || !hitEnemyIds.has(enemy.id)) return enemy; // Not hit or already dead

        let newHp = enemy.hp - explosionDamage;
        let updatedFuryMode = enemy.inFuryMode;

        // Display damage text
        const damageText: FloatingText = {
            id: `expDmg-${performance.now()}-${enemy.id}`,
            text: `${Math.round(explosionDamage)}`,
            x: enemy.x + enemy.width / 2,
            y: enemy.y,
            vy: -77, life: 0.65, initialLife: 0.65, color: "#FF8C00", fontSize: 18,
        };
        setFloatingTextsFn(prev => [...prev, damageText]);

        // Fury mode check for bosses
        if (enemy.enemyType === 'boss' && !enemy.inFuryMode && newHp <= enemy.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
            updatedFuryMode = true;
            const furyText: FloatingText = {
                id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100,
                vy: 0, life: 3, initialLife: 3, color: "red", fontSize: 16,
            };
            setFloatingTextsFn(prevFt => [...prevFt, furyText]);
        }

        // Apply lifesteal
        if (player.lifeSteal > 0) {
            setPlayerFn(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + explosionDamage * p.lifeSteal) }));
        }

        if (newHp <= 0) {
            handleEnemyDeathCallback(enemy); // Pass original enemy for consistency
            return null; // Mark for removal
        }
        return { ...enemy, hp: newHp, inFuryMode: updatedFuryMode };
    }).filter(Boolean) as Enemy[]); // Remove nulls
}
