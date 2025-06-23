







import React from 'react';
import { Player, Enemy, Projectile, FloatingText, AdminConfig, AppliedStatusEffect, ParticleType, Particle, CoinDrop } from '../types';
import { BOSS_FURY_MODE_HP_THRESHOLD, SPRITE_PIXEL_SIZE, SKILL_DASH_INVINCIBILITY_DURATION, BOSS_LASER_SPEED, ENEMY_CONFIG } from '../constants';
import { getDamageColor, lineIntersectsRect } from './utils';
import { applyBurnEffect, applyChillEffect, handleExplosion, createParticleEffect as createParticleEffectFromEffects } from './gameEffects';

interface ScreenShakeState {
  active: boolean;
  intensity: number;
  duration: number;
  startTime: number;
}

interface BorderFlashState {
  active: boolean;
  duration: number;
  startTime: number;
}


export function checkCollisions(
  playerProjectiles: Projectile[],
  setPlayerProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>,
  enemyProjectiles: Projectile[],
  setEnemyProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>,
  enemies: Enemy[],
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>,
  player: Player,
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  handleEnemyDeath: (enemy: Enemy) => void,
  setFloatingTexts: React.Dispatch<React.SetStateAction<FloatingText[]>>,
  setScreenShake: React.Dispatch<React.SetStateAction<ScreenShakeState>>,
  setBorderFlash: React.Dispatch<React.SetStateAction<BorderFlashState>>,
  adminConfig: AdminConfig,
  playSound: (soundName: string, volume?: number) => void,
  initiateReviveSequence: () => void, // Changed from handleGameOver
  setParticles: React.Dispatch<React.SetStateAction<Particle[]>>,
  coinDrops: CoinDrop[],
  setCoinDrops: React.Dispatch<React.SetStateAction<CoinDrop[]>>,
  currentPlayerCoins: number, 
  setPlayerCoins: React.Dispatch<React.SetStateAction<number>> 
) {
    const createParticleEffectFn = (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => {
        createParticleEffectFromEffects(setParticles, x, y, count, color, sizeVariance, speed, life, type);
    };
    const handleExplosionFn = (projectile: Projectile, maxTargets?: number, damageFactorOverride?: number) => {
        handleExplosion(projectile, maxTargets, damageFactorOverride, player, enemies, adminConfig, setEnemies, setPlayer, setFloatingTexts, handleEnemyDeath, createParticleEffectFn);
    };


    setPlayerProjectiles(prevProj => prevProj.filter(proj => {
      // This flag determines if the projectile should be removed after checking all enemies.
      // It's set if the projectile runs out of hits or is a single-hit type.
      let projectileNeedsDestroy = false;
      
      // This is not used for piercing logic directly but for other effects.
      let directHitOccurred = false; 

      // Initialize damagedEnemyIDs if it doesn't exist, to track enemies hit by this specific projectile instance.
      proj.damagedEnemyIDs = proj.damagedEnemyIDs || [];

      setEnemies(prevEnemies => prevEnemies.map(enemy => {
        if (!enemy || enemy.hp <= 0) return null; // Skip dead or null enemies.
        
        // If projectile is already marked for destruction (e.g., hit limit reached with a previous enemy in this frame)
        // OR if this specific projectile instance has already damaged this specific enemy, skip further interaction.
        if (projectileNeedsDestroy || proj.damagedEnemyIDs!.includes(enemy.id)) {
            return enemy;
        }

        // Standard AABB collision check.
        if (proj.x < enemy.x + enemy.width && proj.x + proj.width > enemy.x &&
            proj.y < enemy.y + enemy.height && proj.y + proj.height > enemy.y) {

          // Boss invulnerability during laser charge.
          if (enemy.enemyType === 'boss' && enemy.isChargingLaser) {
              createParticleEffectFn(
                  proj.x + proj.width / 2, proj.y + proj.height / 2,
                  15, '#9400D3', SPRITE_PIXEL_SIZE * 2.5, 100 * SPRITE_PIXEL_SIZE, 0.3, 'shield_hit'
              );
              playSound('/assets/sounds/shield_hit_01.wav', 0.6);

              // Consume projectile hit if it has hitsLeft, otherwise mark for destruction if single-hit.
              if (proj.hitsLeft !== undefined && proj.hitsLeft > 0) {
                  proj.hitsLeft--;
                  if (proj.hitsLeft <= 0) projectileNeedsDestroy = true;
              } else if (proj.hitsLeft === undefined) {
                  projectileNeedsDestroy = true;
              }
              return enemy; // Boss is invulnerable, enemy state doesn't change from this hit.
          }
          // End Invulnerability Check

          directHitOccurred = true; // Mark that a direct hit happened (used for some effects).
          proj.damagedEnemyIDs!.push(enemy.id); // Record that this projectile instance hit this enemy.

          let actualDamageDealt;
          let damageTextColor = "#FFFFFF";
          const isCrit = Math.random() < player.critChance;

          if (isCrit) {
            actualDamageDealt = proj.damage * player.critMultiplier;
            damageTextColor = "#FF00FF";
            const newCritText: FloatingText = {
              id: `crit-${performance.now()}-${Math.random()}`, text: "CRÍTICO!",
              x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 - 10, 
              vy: -88, life: 0.7, initialLife: 0.7, color: damageTextColor, fontSize: 24, 
            };
            setFloatingTexts(prev => [...prev, newCritText]);
          } else {
            actualDamageDealt = proj.damage;
            damageTextColor = getDamageColor(actualDamageDealt, player.minProjectileDamage, player.maxProjectileDamage);
          }
          
          if (player.isAdmin && adminConfig.damageMultiplier) {
            actualDamageDealt *= adminConfig.damageMultiplier;
          }
          
          let enemyAfterHit = { ...enemy };
          if (player.appliesBurn && Math.random() < player.appliesBurn.chance) {
             enemyAfterHit = applyBurnEffect(enemyAfterHit, player, adminConfig); 
          }
          if (player.appliesChill && Math.random() < player.appliesChill.chance) {
             enemyAfterHit = applyChillEffect(enemyAfterHit, player, setFloatingTexts); 
          }

          if (!isCrit) { 
             const damageText: FloatingText = {
                id: `dmg-${performance.now()}-${enemy.id}`, text: `${Math.round(actualDamageDealt)}`,
                x: enemy.x + enemy.width / 2, y: enemy.y, 
                vy: -77, life: 0.65, initialLife: 0.65, color: damageTextColor, fontSize: 22,
            };
            setFloatingTexts(prev => [...prev, damageText]);
          }

          createParticleEffectFn(
            proj.x + proj.width / 2, proj.y + proj.height / 2,
            6, proj.color, SPRITE_PIXEL_SIZE * 3, 90 * SPRITE_PIXEL_SIZE, 0.25, 'generic' 
          );
          
          let newHp = enemy.hp - actualDamageDealt;
          
          // Handle on-hit explosion if configured.
          if (proj.onHitExplosionConfig && proj.explosionRadius && Math.random() < proj.onHitExplosionConfig.chance) {
            handleExplosionFn(proj, proj.onHitExplosionConfig.maxTargets, proj.onHitExplosionConfig.damageFactor);
            proj.hitsLeft = 0; // Explosion consumes all remaining hits.
          }
          
          // Piercing / Multi-hit logic:
          // If the projectile has a hitsLeft counter and it's greater than 0, decrement it.
          // If hitsLeft becomes 0 or less after decrementing, mark the projectile for destruction.
          // If hitsLeft was undefined (meaning it's a standard single-hit projectile), mark for destruction.
          if (proj.hitsLeft !== undefined && proj.hitsLeft > 0) {
              proj.hitsLeft--; 
              if (proj.hitsLeft <= 0) { 
                  projectileNeedsDestroy = true;
              }
          } else if (proj.hitsLeft === undefined) { // Standard single-hit projectile
              projectileNeedsDestroy = true;
          }


          if (newHp <= 0) {
            handleEnemyDeath({...enemyAfterHit, hp: 0}); 
            return null; // Enemy is killed.
          }

          // Boss fury mode check.
          let updatedFuryMode = enemyAfterHit.inFuryMode;
          if (enemyAfterHit.enemyType === 'boss' && !enemyAfterHit.inFuryMode && newHp <= enemyAfterHit.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
            updatedFuryMode = true;
            enemyAfterHit.damage *= (ENEMY_CONFIG.boss.furyDamageMultiplier || 1);
            const furyText: FloatingText = {
              id: `fury-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
              x: enemyAfterHit.width > 0 ? enemyAfterHit.width / 2 : 500, 
              y: enemyAfterHit.height > 0 ? enemyAfterHit.height / 2 - 100 : 300, 
              vy: 0, life: 3, initialLife: 3, color: "#FF00FF", fontSize: 16, 
            };
            setFloatingTexts(prevFt => [...prevFt, furyText]);
          }
          
          if (player.lifeSteal > 0) {
            setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + actualDamageDealt * p.lifeSteal)}));
          }

          return { ...enemyAfterHit, hp: newHp, inFuryMode: updatedFuryMode };
        }
        return enemy; // No collision with this enemy.
      }).filter(Boolean) as Enemy[]); 
      
      // After checking all enemies, if projectileNeedsDestroy is true, it will be filtered out.
      // Otherwise (it pierced or missed all), it remains.
      return !projectileNeedsDestroy; 
    }));

    // Enemy Projectile Collision with Player
    setEnemyProjectiles(prevProj => prevProj.filter(proj => {
        const currentPlayer = player;
        let projectileHitPlayer = false;

        if (proj.appliedEffectType === 'boss_laser') {
            const isActiveLaser = proj.currentLength !== undefined && proj.maxLength !== undefined &&
                                 proj.currentLength >= proj.maxLength - (BOSS_LASER_SPEED * 0.016 * 2) && 
                                 proj.life !== undefined && proj.life > 0;

            if (isActiveLaser) {
                const laserStartX = proj.x;
                const laserStartY = proj.y;
                const laserEndX = proj.x + Math.cos(proj.angle!) * proj.currentLength!;
                const laserEndY = proj.y + Math.sin(proj.angle!) * proj.currentLength!;
                
                if (lineIntersectsRect(laserStartX, laserStartY, laserEndX, laserEndY, 
                                        currentPlayer.x, currentPlayer.y, currentPlayer.width, currentPlayer.height)) {
                    
                    if (!proj.damagedEnemyIDs || !proj.damagedEnemyIDs.includes("player_hit")) {
                        projectileHitPlayer = true; 
                        if (!proj.damagedEnemyIDs) proj.damagedEnemyIDs = [];
                        proj.damagedEnemyIDs.push("player_hit"); 
                    }
                }
            }
        } else {
            if (proj.x < currentPlayer.x + currentPlayer.width && proj.x + proj.width > currentPlayer.x &&
                proj.y < currentPlayer.y + currentPlayer.height && proj.y + proj.height > currentPlayer.y) {
                projectileHitPlayer = true;
                 createParticleEffectFn(proj.x, proj.y, 10, proj.color, 20, 150, 0.4, 'generic'); 
            }
        }

        if (projectileHitPlayer) {
             if (currentPlayer.isInvincible && currentPlayer.invincibilityDuration === (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION) && performance.now() < currentPlayer.lastHitTime + (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION)) {
                createParticleEffectFn(currentPlayer.x + currentPlayer.width/2, currentPlayer.y + currentPlayer.height/2, 25, '#FFFFFF', 30, 180, 0.5, 'shield_hit'); 
                return proj.appliedEffectType === 'boss_laser'; 
            }
            
            let effectiveDefense = currentPlayer.defense;
            if(currentPlayer.isAdmin && adminConfig.defenseBoost !== undefined) {
                effectiveDefense = Math.min(0.95, currentPlayer.defense + (adminConfig.defenseBoost || 0));
            }
            const damageTakenBase = Math.max(1, proj.damage * (1 - effectiveDefense));

            if (currentPlayer.shieldMaxHp && typeof currentPlayer.shieldCurrentHp === 'number' && currentPlayer.shieldCurrentHp > 0) {
                setPlayer(p => {
                  const newShieldHp = Math.max(0, (p.shieldCurrentHp || 0) - 1); 
                  return { ...p, shieldCurrentHp: newShieldHp, shieldLastDamagedTime: performance.now() }
                });
                createParticleEffectFn(currentPlayer.x + currentPlayer.width/2, currentPlayer.y + currentPlayer.height/2, 20, '#00FFFF', 25, 100 * 2.2, 0.4, 'shield_hit'); 
                return proj.appliedEffectType === 'boss_laser'; 
            }

            if (currentPlayer.isInvincible && performance.now() < currentPlayer.lastHitTime + currentPlayer.invincibilityDuration) {
                 return proj.appliedEffectType === 'boss_laser'; 
            }

            setPlayer(p => {
              const newHp = p.hp - damageTakenBase;
              let shouldTriggerDamageEffects = false;
              if (newHp < p.hp) { 
                shouldTriggerDamageEffects = true;
              }

              if (shouldTriggerDamageEffects) {
                setScreenShake({ active: true, intensity: 8, duration: 200, startTime: performance.now() });
                setBorderFlash({ active: true, duration: 300, startTime: performance.now() });
                playSound('/assets/sounds/player_hit_01.wav', 0.7);
              }
              
              if (newHp <= 0) {
                initiateReviveSequence(); 
                return { ...p, hp: 0 }; 
              }
              return { ...p, hp: newHp, isInvincible: true, lastHitTime: performance.now(), invincibilityDuration: 500 }; 
            });
            
            return proj.appliedEffectType === 'boss_laser'; 
        }
        return true; 
    }));


    // Player collecting coins
    const newCoinDrops = coinDrops.filter(coin => {
      if (player.x < coin.x + coin.width &&
          player.x + player.width > coin.x &&
          player.y < coin.y + coin.height &&
          player.y + player.height > coin.y) {
        
        setPlayerCoins(prevCoins => prevCoins + coin.value);
        playSound('/assets/sounds/event_cosmetic_unlock_01.wav', 0.5); 
        createParticleEffectFn(
            coin.x + coin.width / 2, 
            coin.y + coin.height / 2, 
            10, '#FFD700', 
            15, 80 * 1.5, 0.4, 'coin_pickup'
        );
        return false; 
      }
      return true; 
    });
    setCoinDrops(newCoinDrops);

    // Player direct contact with Enemy (for Damaging Aura)
    if (player.damagingAuraFactor && player.damagingAuraFactor > 0 &&
        !(player.isInvincible && player.invincibilityDuration === (player.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION) && performance.now() < player.lastHitTime + (player.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION) )
    ) {
        const auraDamageThisTick = ((player.minProjectileDamage + player.maxProjectileDamage) / 2) * player.damagingAuraFactor;
        const now = performance.now();

        setEnemies(prevEnemies => prevEnemies.map(enemy => {
            if (!enemy || enemy.hp <= 0 || (enemy.enemyType === 'boss' && enemy.isChargingLaser)) return null;

            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {

                if (now - (enemy.lastDamagedByAuraTime || 0) > 1000) { // 1 second cooldown
                    createParticleEffectFn(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        5, '#FF4500', 
                        enemy.width * 0.2, 
                        50 * SPRITE_PIXEL_SIZE,
                        0.3
                    );

                    const damageText: FloatingText = {
                        id: `auraDmg-${performance.now()}-${enemy.id}`,
                        text: `${Math.round(auraDamageThisTick)}`,
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y,
                        vy: -70, life: 0.6, initialLife: 0.6, color: "#FF6347", fontSize: 18,
                    };
                    setFloatingTexts(prev => [...prev, damageText]);

                    let newHp = enemy.hp - auraDamageThisTick;
                    let updatedFuryMode = enemy.inFuryMode;

                    if (enemy.enemyType === 'boss' && !enemy.inFuryMode && newHp <= enemy.maxHp * BOSS_FURY_MODE_HP_THRESHOLD) {
                        updatedFuryMode = true;
                        enemy.damage *= (ENEMY_CONFIG.boss.furyDamageMultiplier || 1);
                        const furyText: FloatingText = {
                            id: `fury-aura-${performance.now()}`, text: "CHEFE EM MODO FÚRIA!",
                            x: enemy.width > 0 ? enemy.width / 2 : 500, 
                            y: enemy.height > 0 ? enemy.height / 2 - 100 : 300, 
                            vy: 0, life: 3, initialLife: 3, color: "#FF00FF", fontSize: 16, 
                        };
                        setFloatingTexts(prevFt => [...prevFt, furyText]);
                    }

                    if (newHp <= 0) {
                        handleEnemyDeath(enemy);
                        return null;
                    }
                    return { ...enemy, hp: newHp, inFuryMode: updatedFuryMode, lastDamagedByAuraTime: now };
                }
            }
            return enemy;
        }).filter(Boolean) as Enemy[]);
    }
}