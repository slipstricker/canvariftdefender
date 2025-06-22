


import React from 'react';
import { Player, Enemy, Projectile, FloatingText, AdminConfig, AppliedStatusEffect, ParticleType, Particle, CoinDrop } from '../types';
import { BOSS_FURY_MODE_HP_THRESHOLD, SPRITE_PIXEL_SIZE, SKILL_DASH_INVINCIBILITY_DURATION, BOSS_LASER_SPEED } from '../constants';
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
      let projectileNeedsDestroy = false;
      let directHitOccurred = false; 

      proj.damagedEnemyIDs = proj.damagedEnemyIDs || [];

      setEnemies(prevEnemies => prevEnemies.map(enemy => {
        if (!enemy || enemy.hp <= 0) return null;
        
        if (projectileNeedsDestroy || proj.damagedEnemyIDs!.includes(enemy.id)) {
            return enemy;
        }

        if (proj.x < enemy.x + enemy.width && proj.x + proj.width > enemy.x &&
            proj.y < enemy.y + enemy.height && proj.y + proj.height > enemy.y) {

          // Invulnerability Check for Boss during Laser Charge
          if (enemy.enemyType === 'boss' && enemy.isChargingLaser) {
              // Boss is invulnerable
              createParticleEffectFn(
                  proj.x + proj.width / 2,
                  proj.y + proj.height / 2,
                  15, // Particle count
                  '#9400D3', // DarkViolet color for invulnerability deflection
                  SPRITE_PIXEL_SIZE * 2.5, // sizeVariance
                  100 * SPRITE_PIXEL_SIZE, // speed
                  0.3, // life
                  'shield_hit' // Can reuse shield_hit type
              );
              playSound('/assets/sounds/shield_hit_01.wav', 0.6); // Sound for deflection

              // Consume projectile or decrement hitsLeft
              if (proj.hitsLeft !== undefined && proj.hitsLeft > 0) {
                  proj.hitsLeft--;
                  if (proj.hitsLeft <= 0) {
                      projectileNeedsDestroy = true;
                  }
              } else if (proj.hitsLeft === undefined) { // Piercing not defined, single hit projectile
                  projectileNeedsDestroy = true;
              }
              // Return the enemy unchanged, as it's invulnerable
              return enemy;
          }
          // END Invulnerability Check

          directHitOccurred = true;
          proj.damagedEnemyIDs!.push(enemy.id); 

          let actualDamageDealt;
          let damageTextColor = "#FFFFFF";
          let showDamageNumber = true;
          const isCrit = Math.random() < player.critChance;

          if (isCrit) {
            actualDamageDealt = player.maxProjectileDamage * player.critMultiplier;
            const newCritText: FloatingText = {
              id: `crit-${performance.now()}-${Math.random()}`,
              text: "CRÍTICO!",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2 - 10, 
              vy: -88, life: 0.7, initialLife: 0.7, color: "#FF00FF", fontSize: 24, 
            };
            setFloatingTexts(prev => [...prev, newCritText]);
            showDamageNumber = false; 
          } else {
            actualDamageDealt = Math.floor(Math.random() * (player.maxProjectileDamage - player.minProjectileDamage + 1)) + player.minProjectileDamage;
            damageTextColor = getDamageColor(actualDamageDealt, player.minProjectileDamage, player.maxProjectileDamage);
          }
          
          if (player.isAdmin && adminConfig.damageMultiplier) {
            actualDamageDealt *= adminConfig.damageMultiplier;
          }
          
          let enemyAfterHit = { ...enemy };
          if (player.appliesBurn && Math.random() < player.appliesBurn.chance) {
             enemyAfterHit = applyBurnEffect(enemyAfterHit, player, adminConfig); 
             showDamageNumber = isCrit ? false : true; 
          }
          if (player.appliesChill && Math.random() < player.appliesChill.chance) {
             enemyAfterHit = applyChillEffect(enemyAfterHit, player, setFloatingTexts); 
             showDamageNumber = isCrit ? false : true; 
          }

          if (showDamageNumber) { 
             const damageText: FloatingText = {
                id: `dmg-${performance.now()}-${enemy.id}`,
                text: `${Math.round(actualDamageDealt)}`,
                x: enemy.x + enemy.width / 2,
                y: enemy.y, 
                vy: -77, life: 0.65, initialLife: 0.65, color: damageTextColor, fontSize: 22,
            };
            setFloatingTexts(prev => [...prev, damageText]);
          }

          createParticleEffectFn(
            proj.x + proj.width / 2, 
            proj.y + proj.height / 2,
            6, proj.color, SPRITE_PIXEL_SIZE * 3, 90 * SPRITE_PIXEL_SIZE, 0.25, 'generic' 
          );
          
          let newHp = enemy.hp - actualDamageDealt;
          
          if (proj.onHitExplosionConfig && proj.explosionRadius && Math.random() < proj.onHitExplosionConfig.chance) {
            handleExplosionFn(proj, proj.onHitExplosionConfig.maxTargets, proj.onHitExplosionConfig.damageFactor);
            proj.hitsLeft = 0; 
          }
          
          if (proj.hitsLeft !== undefined && proj.hitsLeft > 0) {
              proj.hitsLeft--; 
              if (proj.hitsLeft <= 0) { 
                  projectileNeedsDestroy = true;
              }
          } else if (proj.hitsLeft === undefined) { 
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
        return enemy;
      }).filter(Boolean) as Enemy[]); 
      
      return !projectileNeedsDestroy; 
    }));

    // Enemy Projectile Collision with Player
    setEnemyProjectiles(prevProj => prevProj.filter(proj => {
        const currentPlayer = player;
        let projectileHitPlayer = false;

        if (proj.appliedEffectType === 'boss_laser') {
            // Laser is active if fully extended (or close to it) and life > 0
            const isActiveLaser = proj.currentLength !== undefined && proj.maxLength !== undefined &&
                                 proj.currentLength >= proj.maxLength - (BOSS_LASER_SPEED * 0.016 * 2) && // Check if almost or fully extended (0.016 is approx deltaTime for 60fps)
                                 proj.life !== undefined && proj.life > 0;

            if (isActiveLaser) {
                const laserStartX = proj.x;
                const laserStartY = proj.y;
                const laserEndX = proj.x + Math.cos(proj.angle!) * proj.currentLength!;
                const laserEndY = proj.y + Math.sin(proj.angle!) * proj.currentLength!;
                
                // Using the lineIntersectsRect for the centerline of the laser
                if (lineIntersectsRect(laserStartX, laserStartY, laserEndX, laserEndY, 
                                        currentPlayer.x, currentPlayer.y, currentPlayer.width, currentPlayer.height)) {
                    
                    if (!proj.damagedEnemyIDs || !proj.damagedEnemyIDs.includes("player_hit")) {
                        projectileHitPlayer = true; // Mark that this specific projectile hit
                        if (!proj.damagedEnemyIDs) proj.damagedEnemyIDs = [];
                        proj.damagedEnemyIDs.push("player_hit"); // Prevent multiple hits from same laser beam
                    }
                }
            }
            // Laser projectile is not destroyed by collision, it lives out its 'life'
            // The filter at the end of updateProjectiles handles its removal. So, always return true here for lasers.
        } else {
            // Standard AABB collision for other enemy projectiles
            if (proj.x < currentPlayer.x + currentPlayer.width && proj.x + proj.width > currentPlayer.x &&
                proj.y < currentPlayer.y + currentPlayer.height && proj.y + proj.height > currentPlayer.y) {
                projectileHitPlayer = true;
                 createParticleEffectFn(proj.x, proj.y, 10, proj.color, 20, 150, 0.4, 'generic'); 
            }
        }

        if (projectileHitPlayer) {
             if (currentPlayer.isInvincible && currentPlayer.invincibilityDuration === (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION) && performance.now() < currentPlayer.lastHitTime + (currentPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION)) {
                createParticleEffectFn(currentPlayer.x + currentPlayer.width/2, currentPlayer.y + currentPlayer.height/2, 25, '#FFFFFF', 30, 180, 0.5, 'shield_hit'); 
                return proj.appliedEffectType === 'boss_laser'; // Laser is not destroyed on hit
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
                return proj.appliedEffectType === 'boss_laser'; // Laser is not destroyed on hit
            }

            if (currentPlayer.isInvincible && performance.now() < currentPlayer.lastHitTime + currentPlayer.invincibilityDuration) {
                 return proj.appliedEffectType === 'boss_laser'; // Laser is not destroyed on hit
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
            
            return proj.appliedEffectType === 'boss_laser'; // Destroy non-laser projectile, keep laser
        }
        return true; // Projectile did not hit or is a laser, keep it for now
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
}
