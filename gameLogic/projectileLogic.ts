

import { Player, MouseState, Projectile, ProjectileEffectType, Enemy, StaffItem, ParticleType } from '../types';
import {
  PLAYER_PROJECTILE_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT, PROJECTILE_ART_WIDTH,
  PROJECTILE_ART_HEIGHT, SPRITE_PIXEL_SIZE, PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BOSS_LASER_SPEED, BOSS_LASER_DURATION_MS
} from '../constants';
import { ALL_STAFFS_SHOP, DEFAULT_STAFF_ID } from './shopLogic'; 
import { hexToRgba } from './utils'; 

const RAINBOW_STAFF_EFFECT_TYPES: ProjectileEffectType[] = ['trident', 'boomstaff', 'thunder_staff', 'emerald_homing', 'frozen_tip', 'shadow_bolt'];
const TRIDENT_SPREAD_ANGLE = 0.25; 
const STAFF_VISUAL_EFFECTIVE_LENGTH_FACTOR = 0.85; 
const MAX_HOMING_TURN_RATE_RAD_PER_SEC = Math.PI * 4; // Max turn rate at homingStrength 1 (e.g., 720 deg/sec)


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
  playSound: (soundName: string, volume?: number) => void,
  createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void
): CreatePlayerProjectilesResult {
  const newProjectiles: Projectile[] = [];
  let newLightningBoltsTrigger: { mouseX: number, mouseY: number } | undefined = undefined;

  if (!canvasRect) return { projectiles: newProjectiles, newLightningBoltsTrigger };

  // Calculate hand position more accurately based on player model
  const playerBodyHeight = player.height * 0.7; // Assuming body is 70% of total height
  const playerBodyYOffset = player.height - playerBodyHeight; // Offset from top of player sprite to top of body
  const handOffsetFactorX = player.facingDirection === 'right' ? 0.65 : 0.35; // Hand slightly in front based on facing
  const handGlobalX = player.x + player.width * handOffsetFactorX;
  const handGlobalY = player.y + playerBodyYOffset + playerBodyHeight * 0.5; // Mid-body height

  // Convert mouse coordinates from screen space to internal canvas space
  const internalTargetMouseX = (mouse.x - canvasRect.left) * (internalCanvasWidth / canvasRect.width);
  const internalTargetMouseY = (mouse.y - canvasRect.top) * (internalCanvasHeight / canvasRect.height);

  // Angle from hand to mouse for staff visual rotation
  const staffAimAngle = Math.atan2(
    internalTargetMouseY - handGlobalY,
    internalTargetMouseX - handGlobalX
  );

  // Projectile spawn point at the tip of the staff
  const staffVisualLength = player.height * STAFF_VISUAL_EFFECTIVE_LENGTH_FACTOR; // Staff length relative to player height
  const projectileSpawnX = handGlobalX + staffVisualLength * Math.cos(staffAimAngle);
  const projectileSpawnY = handGlobalY + staffVisualLength * Math.sin(staffAimAngle);

  // Angle from projectile spawn point to mouse for projectile trajectory
  const baseAngle = Math.atan2(
    internalTargetMouseY - projectileSpawnY,
    internalTargetMouseX - projectileSpawnX
  );

  const baseProjectileSpeed = 750;
  const speed = baseProjectileSpeed * (1 + (player.projectileSpeedBonus || 0));
  const projectileWidth = PROJECTILE_ART_WIDTH * SPRITE_PIXEL_SIZE;
  const projectileHeight = PROJECTILE_ART_HEIGHT * SPRITE_PIXEL_SIZE;

  const playerAverageBaseDamage = (player.minProjectileDamage + player.maxProjectileDamage) / 2;
  let isHomingFromUpgrades = player.projectilesAreHoming || false;
  let homingStrengthFromUpgrades = player.projectileHomingStrength || 0;
  
  let finalPierceCount = player.projectilePierceCount || 0;

  // Start with player's current average damage, may be modified by staff
  let finalDamage = playerAverageBaseDamage; 
  let finalIsHoming = isHomingFromUpgrades;
  let finalHomingStrength = homingStrengthFromUpgrades;
  
  let staffEffectForShot: ProjectileEffectType = 'standard';
  let shootSound = '/assets/sounds/player_shoot_magic_01.wav';
  let shootVolume = 0.5;

  // Properties to be set on the projectile object later
  let projectileIsExplosiveForOffScreen = false; // Default: does not explode off-screen
  let projectileExplosionRadius: number | undefined = undefined;
  let projectileOnHitExplosionConfig: Projectile['onHitExplosionConfig'] = undefined;


  const activeStaffId = player.selectedStaffId || DEFAULT_STAFF_ID;
  const currentStaffItem = ALL_STAFFS_SHOP.find(s => s.id === activeStaffId) || ALL_STAFFS_SHOP.find(s => s.id === DEFAULT_STAFF_ID)!;
  let finalProjectileColor = currentStaffItem.projectileColor;
  let finalGlowEffectColor = currentStaffItem.projectileGlowColor;
  
  // Determine staff effect and projectile properties based on active staff
  if (activeStaffId === 'staff_emerald') staffEffectForShot = 'emerald_homing';
  else if (activeStaffId === 'staff_trident') staffEffectForShot = 'trident';
  else if (activeStaffId === 'staff_boom') staffEffectForShot = 'boomstaff';
  else if (activeStaffId === 'staff_thunder') staffEffectForShot = 'thunder_staff';
  else if (activeStaffId === 'staff_frozen_tip') staffEffectForShot = 'frozen_tip';
  else if (activeStaffId === 'staff_rainbow') {
    staffEffectForShot = RAINBOW_STAFF_EFFECT_TYPES[Math.floor(Math.random() * RAINBOW_STAFF_EFFECT_TYPES.length)];
    // Update color based on the randomly chosen effect's staff
    const effectStaff = ALL_STAFFS_SHOP.find(s => 
        (s.id === 'staff_trident' && staffEffectForShot === 'trident') ||
        (s.id === 'staff_boom' && staffEffectForShot === 'boomstaff') ||
        (s.id === 'staff_thunder' && staffEffectForShot === 'thunder_staff') ||
        (s.id === 'staff_emerald' && staffEffectForShot === 'emerald_homing') ||
        (s.id === 'staff_frozen_tip' && staffEffectForShot === 'frozen_tip') ||
        (s.id === 'staff_shadow_visual' && staffEffectForShot === 'shadow_bolt') // Assuming shadow_visual corresponds to shadow_bolt effect
    ) || currentStaffItem; // Fallback to rainbow staff's own color if no match
    finalProjectileColor = effectStaff.projectileColor;
    finalGlowEffectColor = effectStaff.projectileGlowColor;

  } 
  // Visual overrides (mainly for color, effect type drives mechanics)
  else if (activeStaffId === 'staff_fire_visual') staffEffectForShot = 'boomstaff'; // Fire visual -> boomstaff mechanics
  else if (activeStaffId === 'staff_ice_visual') staffEffectForShot = 'frozen_tip'; // Ice visual -> frozen_tip mechanics
  else if (activeStaffId === 'staff_shadow_visual') staffEffectForShot = 'shadow_bolt'; // Shadow visual -> shadow_bolt mechanics


  // Apply specific mechanics for chosen effect
  switch (staffEffectForShot) {
    case 'emerald_homing':
      if (!isHomingFromUpgrades) { // Only apply staff's homing if player doesn't have seeker rounds
        finalIsHoming = true;
        finalHomingStrength = 0.1; // Staff's specific homing strength
      }
      // Emerald staff has reduced damage
      finalDamage = ((player.baseMinProjectileDamage + player.baseMaxProjectileDamage) / 2) * 0.5; // Uses player's BASE damage for this calc
      shootSound = '/assets/sounds/player_shoot_magic_01.wav';
      shootVolume = 0.45;
      break;
    case 'boomstaff':
      projectileExplosionRadius = 60 * SPRITE_PIXEL_SIZE; // Example radius
      projectileOnHitExplosionConfig = { chance: 0.3, maxTargets: 4, damageFactor: 0.75 };
      projectileIsExplosiveForOffScreen = false; // Does not explode when going off-screen by default
      shootSound = '/assets/sounds/projectile_fire_shoot_01.wav';
      shootVolume = 0.6;
      break;
    case 'frozen_tip':
      finalPierceCount += 3; // Add pierce from staff
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
      // Standard projectile, additional effect (lightning bolt) handled outside
      shootSound = '/assets/sounds/player_shoot_magic_01.wav'; 
      shootVolume = 0.5;
      break;
  }
  playSound(shootSound, shootVolume);

  const createActualProjectile = (angle: number, individualProjectileEffectType: ProjectileEffectType, currentDamage: number, currentPierce: number, currentIsHoming: boolean, currentHomingStrength: number, color: string, glowColor?: string): Projectile => {
    return {
        x: projectileSpawnX - projectileWidth / 2,
        y: projectileSpawnY - projectileHeight / 2,
        width: projectileWidth,
        height: projectileHeight,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: currentDamage, // This is the (potentially staff-modified) average damage
        owner: 'player',
        color: color, 
        glowEffectColor: glowColor,
        hitsLeft: 1 + currentPierce, // Base hit + pierce count
        isHoming: currentIsHoming,
        homingTargetId: null, // Initialized to null
        homingStrength: currentHomingStrength,
        initialVx: Math.cos(angle) * speed, // Store for some homing types
        initialVy: Math.sin(angle) * speed,
        speed: speed, // Store the projectile's travel speed
        isExplosive: projectileIsExplosiveForOffScreen, 
        explosionRadius: projectileExplosionRadius,     
        onHitExplosionConfig: projectileOnHitExplosionConfig, 
        appliedEffectType: individualProjectileEffectType,
        damagedEnemyIDs: [], // Initialize empty
        draw: () => {}, // Placeholder, drawing handled by renderer
        trailSpawnTimer: 0.01 + Math.random() * 0.02, // For particle trails
    };
  };

  // Create projectiles based on effect type
  if (staffEffectForShot === 'trident') {
    const tridentDamage = finalDamage * 0.6; // Trident shots do less damage each
    newProjectiles.push(createActualProjectile(baseAngle, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalProjectileColor, finalGlowEffectColor));
    newProjectiles.push(createActualProjectile(baseAngle - TRIDENT_SPREAD_ANGLE, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalProjectileColor, finalGlowEffectColor));
    newProjectiles.push(createActualProjectile(baseAngle + TRIDENT_SPREAD_ANGLE, 'trident', tridentDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalProjectileColor, finalGlowEffectColor));
  } else if (staffEffectForShot === 'thunder_staff') {
    // Standard projectile
    newProjectiles.push(createActualProjectile(baseAngle, 'standard', finalDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalProjectileColor, finalGlowEffectColor));
    // Trigger lightning bolt effect (App.tsx will handle this via gameContext)
    newLightningBoltsTrigger = { mouseX: internalTargetMouseX, mouseY: internalTargetMouseY };
  } else {
    // Single projectile for other effects
    newProjectiles.push(createActualProjectile(baseAngle, staffEffectForShot, finalDamage, finalPierceCount, finalIsHoming, finalHomingStrength, finalProjectileColor, finalGlowEffectColor));
  }

  return { projectiles: newProjectiles, newLightningBoltsTrigger };
}


export function updateProjectiles(
  projectiles: Projectile[],
  deltaTime: number,
  isPlayerProjectileList: boolean, // To differentiate logic if needed, e.g., homing only for player
  enemies: Readonly<Enemy[]>, // Needed for player projectile homing
  createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void,
  handleExplosionFn: (projectile: Projectile, maxTargets?: number, damageFactorOverride?: number) => void,
  canvasWidth: number,
  canvasHeight: number
): Projectile[] {
  return projectiles.map(p => {
    let newVx = p.vx ?? 0;
    let newVy = p.vy ?? 0;

    // Homing logic for player projectiles
    if (isPlayerProjectileList && p.isHoming && p.homingStrength && enemies.length > 0) {
        let target: Enemy | null = null;
        // If already has a target, check if it's still valid (alive)
        if (p.homingTargetId) {
            target = enemies.find(e => e.id === p.homingTargetId && e.hp > 0) || null;
        }
        // If no target or target is invalid, find a new one
        if (!target) { 
            let closestDistSq = Infinity;
            enemies.forEach(enemy => {
                if (enemy.hp > 0) { // Only target living enemies
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
            if (target) p.homingTargetId = target.id; // Assign new target
        }

        // If a valid target exists, adjust projectile velocity
        if (target) { 
            const targetX = target.x + target.width / 2;
            const targetY = target.y + target.height / 2;
            const projectileX = p.x + p.width / 2;
            const projectileY = p.y + p.height / 2;

            const dirX = targetX - projectileX;
            const dirY = targetY - projectileY;
            
            const currentAngle = Math.atan2(newVy, newVx);
            const angleToTarget = Math.atan2(dirY, dirX);

            let angleDiff = angleToTarget - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const actualTurnRateRadPerSec = MAX_HOMING_TURN_RATE_RAD_PER_SEC * p.homingStrength;
            const turnAmountThisFrame = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), actualTurnRateRadPerSec * deltaTime);
            
            const newAngle = currentAngle + turnAmountThisFrame;
            const projectileSpeed = Math.sqrt(newVx * newVx + newVy * newVy); // Maintain current speed
            newVx = Math.cos(newAngle) * projectileSpeed;
            newVy = Math.sin(newAngle) * projectileSpeed;
        }
    } else if (p.appliedEffectType === 'boss_laser') {
        // Boss laser logic: origin (p.x, p.y) is fixed.
        // currentLength increases, then life ticks down.
        newVx = 0; // Origin doesn't move
        newVy = 0;

        if (p.currentLength === undefined) p.currentLength = 0;
        if (p.angle === undefined) p.angle = 0; // Should be set at creation
        
        const maxLen = p.maxLength !== undefined ? p.maxLength : p.height; // Use maxLength if available, else height
        const currentExtensionSpeed = p.speed || BOSS_LASER_SPEED; // Use projectile's own speed or fallback

        if (p.currentLength < maxLen) {
            p.currentLength = Math.min(maxLen, p.currentLength + currentExtensionSpeed * deltaTime);
            if (p.currentLength >= maxLen && p.life === undefined) {
                p.life = BOSS_LASER_DURATION_MS / 1000; // Start linger timer
            }
        } else { // Already at max length, or p.maxLength was 0 initially
            if (p.life === undefined) { // Max length reached or was 0, start linger
                 p.life = BOSS_LASER_DURATION_MS / 1000;
            } else {
                p.life -= deltaTime;
            }
        }
    }
    
    // Particle trail logic for player projectiles
    if (isPlayerProjectileList && p.trailSpawnTimer !== undefined) {
      p.trailSpawnTimer -= deltaTime;
      if (p.trailSpawnTimer <= 0) {
          let trailColor = p.glowEffectColor || p.color; // Use glow color if available for better visibility
          // Customize trail color based on effect type
          if (p.appliedEffectType === 'frozen_tip') trailColor = p.glowEffectColor || '#AED6F1';
          else if (p.appliedEffectType === 'emerald_homing') trailColor = p.glowEffectColor ||'#2ECC71';
          
          createParticleEffectFn(
              p.x + p.width / 2, // Emit from center of projectile
              p.y + p.height / 2,
              1, // Number of particles per trail emission
              hexToRgba(trailColor, 0.4 + Math.random() * 0.3), // Semi-transparent, varied alpha
              SPRITE_PIXEL_SIZE * 1.5, // Base size of trail particles
              15 * SPRITE_PIXEL_SIZE,  // Speed of trail particles (usually slower, moving away)
              0.40 + Math.random() * 0.20, // Lifespan of trail particles
              'projectile_trail_cosmic' // Specific particle type for trails
          );
          p.trailSpawnTimer = 0.03 + Math.random() * 0.04; // Reset timer for next emission
      }
    }

    return {
      ...p,
      x: p.x + newVx * deltaTime,
      y: p.y + newVy * deltaTime,
      vx: newVx,
      vy: newVy,
      currentLength: p.currentLength, // Ensure currentLength is passed through
      life: p.life, // Ensure life is passed through
      speed: p.speed // Ensure speed is passed through
    };
  }).filter(p => {
    const isOnScreen = p.x > -p.width && p.x < canvasWidth && p.y > -p.height && p.y < canvasHeight;
    
    if (!isOnScreen) { 
        if (p.owner === 'player' && p.isExplosive && p.explosionRadius) {
            handleExplosionFn(p); 
        }
        return false; 
    }

    if (p.appliedEffectType === 'boss_laser') {
        return p.life === undefined || p.life > 0; 
    }
    
    if (p.owner === 'player') {
        return (p.hitsLeft !== undefined && p.hitsLeft > 0);
    }
    
    return true; 
  });
}
