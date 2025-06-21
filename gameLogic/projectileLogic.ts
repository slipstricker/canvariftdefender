
import { Player, MouseState, Projectile, ProjectileEffectType, Enemy, StaffItem } from '../types';
import {
  PLAYER_PROJECTILE_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT, PROJECTILE_ART_WIDTH,
  PROJECTILE_ART_HEIGHT, SPRITE_PIXEL_SIZE, PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT
} from '../constants';
import { ALL_STAFFS_SHOP } from './shopLogic'; // Added import for ALL_STAFFS_SHOP
import { hexToRgba } from './canvasArt'; // Added import

const RAINBOW_STAFF_EFFECT_TYPES: ProjectileEffectType[] = ['trident', 'boomstaff', 'thunder_staff', 'emerald_homing', 'frozen_tip', 'shadow_bolt'];
const TRIDENT_SPREAD_ANGLE = 0.25; 
const STAFF_VISUAL_EFFECTIVE_LENGTH_FACTOR = 0.85; 


interface CreatePlayerProjectilesResult {
  projectiles: Projectile[];
  newLightningBoltsTrigger?: { mouseX: number, mouseY: number };
}

export function createPlayerProjectiles(
  player: Player,
  mouse: MouseState,
  canvasRect: { left: number, top: number, width: number, height: number } | null,
  internalCanvasWidth: number,
  internalCanvasHeight: number,
  playSound: (soundName: string, volume?: number) => void
): CreatePlayerProjectilesResult {
  const newProjectiles: Projectile[] = [];
  let newLightningBoltsTrigger: { mouseX: number, mouseY: number } | undefined = undefined;

  if (!canvasRect) return { projectiles: newProjectiles, newLightningBoltsTrigger };

  const playerBodyHeight = player.height * 0.7;
  const playerBodyYOffset = player.height - playerBodyHeight;
  const handOffsetFactorX = player.facingDirection === 'right' ? 0.65 : 0.35; 
  const handGlobalX = player.x + player.width * handOffsetFactorX;
  const handGlobalY = player.y + playerBodyYOffset + playerBodyHeight * 0.5;

  const internalTargetMouseX = (mouse.x - canvasRect.left) * (internalCanvasWidth / canvasRect.width);
  const internalTargetMouseY = (mouse.y - canvasRect.top) * (internalCanvasHeight / canvasRect.height);

  const staffAimAngle = Math.atan2(
    internalTargetMouseY - handGlobalY,
    internalTargetMouseX - handGlobalX
  );

  const staffVisualLength = player.height * STAFF_VISUAL_EFFECTIVE_LENGTH_FACTOR;
  const projectileSpawnX = handGlobalX + staffVisualLength * Math.cos(staffAimAngle);
  const projectileSpawnY = handGlobalY + staffVisualLength * Math.sin(staffAimAngle);

  const baseAngle = Math.atan2(
    internalTargetMouseY - projectileSpawnY,
    internalTargetMouseX - projectileSpawnX
  );

  const speed = 750;
  const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE;
  const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE;

  let projectileBasePlayerDamage = player.projectileDamage;
  let isHomingFromUpgrades = player.projectilesAreHoming || false;
  let homingStrengthFromUpgrades = player.projectileHomingStrength || 0;
  
  let finalPierceCount = player.projectilePierceCount || 0;

  let finalDamage = projectileBasePlayerDamage;
  let finalIsHoming = isHomingFromUpgrades;
  let finalHomingStrength = homingStrengthFromUpgrades;
  let finalIsExplosive = false;
  let finalExplosionRadius = 0;
  
  let staffEffectForShot: ProjectileEffectType = 'standard';
  let shootSound = '/assets/sounds/player_shoot_magic_01.wav';
  let shootVolume = 0.5;

  const activeStaffId = player.selectedStaffId;
  const currentStaffItem = ALL_STAFFS_SHOP.find(s => s.id === activeStaffId) || ALL_STAFFS_SHOP[0];
  let finalProjectileColor = currentStaffItem.projectileColor;
  let finalGlowEffectColor = currentStaffItem.projectileGlowColor;
  
  if (activeStaffId === 'staff_emerald') staffEffectForShot = 'emerald_homing';
  else if (activeStaffId === 'staff_trident') staffEffectForShot = 'trident';
  else if (activeStaffId === 'staff_boom') staffEffectForShot = 'boomstaff';
  else if (activeStaffId === 'staff_thunder') staffEffectForShot = 'thunder_staff';
  else if (activeStaffId === 'staff_frozen_tip') staffEffectForShot = 'frozen_tip';
  else if (activeStaffId === 'staff_rainbow') {
    staffEffectForShot = RAINBOW_STAFF_EFFECT_TYPES[Math.floor(Math.random() * RAINBOW_STAFF_EFFECT_TYPES.length)];
    // For rainbow, derive color from the chosen effect's staff
    const effectStaff = ALL_STAFFS_SHOP.find(s => 
        (s.id === 'staff_trident' && staffEffectForShot === 'trident') ||
        (s.id === 'staff_boom' && staffEffectForShot === 'boomstaff') ||
        (s.id === 'staff_thunder' && staffEffectForShot === 'thunder_staff') ||
        (s.id === 'staff_emerald' && staffEffectForShot === 'emerald_homing') ||
        (s.id === 'staff_frozen_tip' && staffEffectForShot === 'frozen_tip') ||
        (s.id === 'staff_shadow_visual' && staffEffectForShot === 'shadow_bolt')
    ) || currentStaffItem;
    finalProjectileColor = effectStaff.projectileColor;
    finalGlowEffectColor = effectStaff.projectileGlowColor;

  } 
  else if (activeStaffId === 'staff_fire_visual') staffEffectForShot = 'boomstaff'; 
  else if (activeStaffId === 'staff_ice_visual') staffEffectForShot = 'frozen_tip'; 
  else if (activeStaffId === 'staff_shadow_visual') staffEffectForShot = 'shadow_bolt'; 

  switch (staffEffectForShot) {
    case 'emerald_homing':
      if (!isHomingFromUpgrades) {
        finalIsHoming = true;
        finalHomingStrength = 0.1;
      }
      finalDamage = player.baseProjectileDamage * 0.5;
      shootSound = '/assets/sounds/player_shoot_magic_01.wav';
      shootVolume = 0.45;
      break;
    case 'boomstaff':
      finalIsExplosive = true;
      finalExplosionRadius = 60 * SPRITE_PIXEL_SIZE;
      shootSound = '/assets/sounds/projectile_fire_shoot_01.wav';
      shootVolume = 0.6;
      break;
    case 'frozen_tip':
      finalPierceCount += 3;
      shootSound = '/assets/sounds/projectile_ice_shoot_01.wav';
      shootVolume = 0.55;
      break;
    case 'shadow_bolt':
      shootSound = '/assets/sounds/projectile_shadow_shoot_01.wav';
      shootVolume = 0.5;
      break;
    case 'trident':
      shootSound = '/assets/sounds/projectile_water_shoot_01.wav';
      shootVolume = 0.6;
      break;
    case 'thunder_staff':
      shootSound = '/assets/sounds/player_shoot_magic_01.wav'; 
      shootVolume = 0.5;
      break;
    // default case uses the finalProjectileColor already set from currentStaffItem
  }
  playSound(shootSound, shootVolume);

  const createActualProjectile = (angle: number, individualProjectileEffectType: ProjectileEffectType, currentDamage: number, currentPierce: number, currentIsHoming: boolean, currentHomingStrength: number, currentIsExplosive: boolean, currentExplosionRadius: number, color: string, glowColor?: string): Projectile => {
    return {
        x: projectileSpawnX - projectileWidth / 2,
        y: projectileSpawnY - projectileHeight / 2,
        width: projectileWidth,
        height: projectileHeight,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: currentDamage,
        owner: 'player',
        color: color, 
        glowEffectColor: glowColor,
        hitsLeft: 1 + currentPierce,
        isHoming: currentIsHoming,
        homingTargetId: null,
        homingStrength: currentHomingStrength,
        initialVx: Math.cos(angle) * speed,
        initialVy: Math.sin(angle) * speed,
        isExplosive: currentIsExplosive,
        explosionRadius: currentExplosionRadius,
        appliedEffectType: individualProjectileEffectType,
        damagedEnemyIDs: [],
        draw: () => {},
        trailSpawnTimer: 0.01 + Math.random() * 0.02,
    };
  };

  if (staffEffectForShot === 'trident') {
    const tridentDamage = finalDamage * 0.6; 
    newProjectiles.push(createActualProjectile(baseAngle, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, false, 0, finalProjectileColor, finalGlowEffectColor));
    newProjectiles.push(createActualProjectile(baseAngle - TRIDENT_SPREAD_ANGLE, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, false, 0, finalProjectileColor, finalGlowEffectColor));
    newProjectiles.push(createActualProjectile(baseAngle + TRIDENT_SPREAD_ANGLE, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, false, 0, finalProjectileColor, finalGlowEffectColor));
  } else if (staffEffectForShot === 'thunder_staff') {
    newProjectiles.push(createActualProjectile(baseAngle, 'standard', finalDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalIsExplosive, finalExplosionRadius, finalProjectileColor, finalGlowEffectColor));
    newLightningBoltsTrigger = { mouseX: internalTargetMouseX, mouseY: internalTargetMouseY };
  } else {
    newProjectiles.push(createActualProjectile(baseAngle, staffEffectForShot, finalDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalIsExplosive, finalExplosionRadius, finalProjectileColor, finalGlowEffectColor));
  }

  return { projectiles: newProjectiles, newLightningBoltsTrigger };
}


export function updateProjectiles(
  projectiles: Projectile[],
  deltaTime: number,
  isPlayerProjectileList: boolean,
  enemies: Readonly<Enemy[]>,
  createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number) => void,
  handleExplosionFn: (projectile: Projectile) => void,
  canvasWidth: number,
  canvasHeight: number
): Projectile[] {
  return projectiles.map(p => {
    let newVx = p.vx ?? 0;
    let newVy = p.vy ?? 0;

    if (isPlayerProjectileList && p.isHoming && p.homingStrength && enemies.length > 0) {
        let target: Enemy | null = null;
        if (p.homingTargetId) {
            target = enemies.find(e => e.id === p.homingTargetId && e.hp > 0) || null;
        }
        if (!target) { 
            let closestDistSq = Infinity;
            enemies.forEach(enemy => {
                if (enemy.hp > 0) {
                    const projCenterX = p.x + p.width / 2;
                    const projCenterY = p.y + p.height / 2;
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;
                    
                    const distSq = (enemyCenterX - projCenterX) ** 2 + (enemyCenterY - projCenterY) ** 2;
                    if (distSq < closestDistSq) {
                        closestDistSq = distSq;
                        target = enemy;
                    }
                }
            });
            if (target) p.homingTargetId = target.id;
        }

        if (target) { 
            const angleToTarget = Math.atan2(
                (target.y + target.height / 2) - (p.y + p.height / 2),
                (target.x + target.width / 2) - (p.x + p.width / 2)
            );
            const currentAngle = Math.atan2(newVy, newVx);
            let angleDiff = angleToTarget - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const turnRate = p.homingStrength * 2 * Math.PI * deltaTime; 
            const turnAmount = Math.max(-turnRate, Math.min(turnRate, angleDiff));

            const newAngle = currentAngle + turnAmount;
            const speed = Math.sqrt(newVx * newVx + newVy * newVy);
            newVx = Math.cos(newAngle) * speed;
            newVy = Math.sin(newAngle) * speed;
        }
    }
    
    if (isPlayerProjectileList && p.trailSpawnTimer !== undefined) {
      p.trailSpawnTimer -= deltaTime;
      if (p.trailSpawnTimer <= 0) {
          let trailColor = p.glowEffectColor || p.color; // Use glow color for trail if available
          // For specific effects, can override again if needed, but glowEffectColor should handle dark cases
          if (p.appliedEffectType === 'frozen_tip') trailColor = p.glowEffectColor || '#AED6F1';
          else if (p.appliedEffectType === 'emerald_homing') trailColor = p.glowEffectColor ||'#2ECC71';
          
          createParticleEffectFn(
              p.x + p.width / 2,
              p.y + p.height / 2,
              1, 
              hexToRgba(trailColor, 0.4 + Math.random() * 0.3), // Apply alpha to the trail color
              SPRITE_PIXEL_SIZE * 1.5, 
              15 * SPRITE_PIXEL_SIZE,  
              0.40 + Math.random() * 0.20 
          );
          p.trailSpawnTimer = 0.03 + Math.random() * 0.04; 
      }
    }

    return {
      ...p,
      x: p.x + newVx * deltaTime,
      y: p.y + newVy * deltaTime,
      vx: newVx,
      vy: newVy,
    };
  }).filter(p => {
    const isOnScreen = p.x > -p.width && p.x < canvasWidth && p.y > -p.height && p.y < canvasHeight;
    
    if (!isOnScreen) { 
        if (p.owner === 'player' && p.isExplosive) {
            handleExplosionFn(p); 
        }
        return false; 
    }

    if (p.owner === 'player') {
        return (p.hitsLeft !== undefined && p.hitsLeft > 0);
    }
    
    return true; 
  });
}
