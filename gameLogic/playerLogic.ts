
import { Player, Keys, MouseState, Platform, Projectile, ProjectileEffectType, ParticleType } from '../types';
import { GRAVITY, CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_ANIMATION_SPEED, SKILL_DASH_SPEED, SKILL_DASH_DURATION, SKILL_DASH_INVINCIBILITY_DURATION } from '../constants'; // Removed SKILL_DASH_COOLDOWN
import { createPlayerProjectiles as createProjectilesFn } from './projectileLogic'; 

export interface PlayerUpdateResult {
  updatedPlayer: Player;
  newProjectiles: Projectile[];
  newLightningBolts?: {mouseX: number, mouseY: number};
}


export function updatePlayerState(
  player: Player,
  keys: Keys,
  mouse: MouseState,
  deltaTime: number,
  platforms: Platform[],
  canvasRect: { left: number, top: number, width: number, height: number } | null,
  internalCanvasWidth: number,
  internalCanvasHeight: number,
  playSound: (soundName: string, volume?: number) => void,
  createParticleEffectFn: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void
): PlayerUpdateResult {
  let newPlayer = { ...player };
  let newProjectiles: Projectile[] = [];
  let newLightningBoltsTrigger: {mouseX: number, mouseY: number} | undefined = undefined;

  newPlayer.justDoubleJumped = false;
  newPlayer.justLanded = false;
  newPlayer.justDashed = false; 

  let newVx = 0; 
  let newVy = newPlayer.vy || 0; 
  let newX = newPlayer.x; 
  let newY = newPlayer.y; 


  // --- Dash Input & State Update (Conditional) ---
  if (newPlayer.hasDashSkill && keys.shift && !newPlayer.isDashing && performance.now() - (newPlayer.lastDashTimestamp || 0) > (newPlayer.dashCooldownTime || 30) * 1000) { // Default to 30s if not set
    newPlayer.isDashing = true;
    newPlayer.dashTimer = 0;
    newPlayer.lastDashTimestamp = performance.now();
    newPlayer.dashDirection = newPlayer.facingDirection;
    newPlayer.justDashed = true; 
    
    // Grant Dash Invincibility
    newPlayer.isInvincible = true;
    newPlayer.lastHitTime = performance.now(); // Start invincibility now
    newPlayer.invincibilityDuration = newPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION; // 1 second
    
    playSound('/assets/sounds/player_dash_01.wav', 0.7); 
  }

  if (newPlayer.isDashing) {
    newPlayer.dashTimer = (newPlayer.dashTimer || 0) + deltaTime;
    newPlayer.vx = (newPlayer.dashDirection === 'right' ? 1 : -1) * (newPlayer.dashSpeedValue || SKILL_DASH_SPEED);
    newPlayer.vy = 0; // No vertical movement during dash

    newX = newPlayer.x + (newPlayer.vx || 0) * deltaTime;
    newY = newPlayer.y; // Y position doesn't change during horizontal dash

    if ((newPlayer.dashTimer || 0) >= (newPlayer.dashDurationTime || SKILL_DASH_DURATION)) { 
        newPlayer.isDashing = false;
        newPlayer.vx = 0; // Reset horizontal velocity after dash
    }
  } else { // Not Dashing
    if (keys.a) newVx -= newPlayer.movementSpeed;
    if (keys.d) newVx += newPlayer.movementSpeed;
    newPlayer.vx = newVx;

    newVy += GRAVITY * deltaTime;
    
    newX = newPlayer.x + (newPlayer.vx || 0) * deltaTime;
    newY = newPlayer.y + newVy * deltaTime;
  }
  
  // Update facing direction if not dashing
  if (!newPlayer.isDashing) {
    if (keys.a && !keys.d) newPlayer.facingDirection = 'left';
    else if (keys.d && !keys.a) newPlayer.facingDirection = 'right';
  }


  let onGround = false;
  let previouslyOnGround = newPlayer.onGround;
  let isJumping = newPlayer.isJumping;
  let hasJumpedOnce = newPlayer.hasJumpedOnce;

  // --- Platform Collision Resolution ---
  for (const platform of platforms) {
    if (!platform.isVisible || platform.currentAlpha < 0.5) continue;

    // Y-axis collision (landing on platform)
    // Player can pass through from below and sides. Only land if falling onto it.
    if (newVy > 0) { // Moving Down
        // Check for horizontal overlap using the calculated newX
        if (newX + newPlayer.width > platform.x && newX < platform.x + platform.width) {
            // Was player's bottom edge above or at platform's top edge in previous frame?
            // And will player's bottom edge be at or below platform's top edge in new frame?
            if ((player.y + player.height) <= (platform.y + 1) && (newY + newPlayer.height) >= platform.y) {
                newY = platform.y - newPlayer.height; // Snap to top of platform
                newVy = 0; // Stop vertical movement
                onGround = true;
                isJumping = false;
                hasJumpedOnce = false; // Reset double jump capability
                if (!previouslyOnGround && !newPlayer.isDashing) { // Check dashing state here too
                    newPlayer.justLanded = true;
                }
            }
        }
    }
    // Lateral and "hitting head" collisions are removed to allow pass-through
  }


  newPlayer.x = newX;
  newPlayer.y = newY;
  newPlayer.vy = newVy; 
  newPlayer.onGround = onGround;


  // Check canvas bottom boundary AFTER platform checks
  if (newPlayer.y + newPlayer.height > CANVAS_HEIGHT) {
    newPlayer.y = CANVAS_HEIGHT - newPlayer.height;
    newPlayer.vy = 0;
    newPlayer.onGround = true; // Landed on canvas bottom
    isJumping = false; // Reset jumping state
    hasJumpedOnce = false; // Reset double jump
    if (!previouslyOnGround && !newPlayer.isDashing) {
        newPlayer.justLanded = true;
    }
  }
  // Check canvas top boundary
  if (newPlayer.y < 0) {
    newPlayer.y = 0;
    if (newPlayer.vy < 0) newPlayer.vy = 0; // Stop upward movement if hitting ceiling
  }


  // Jumping logic
  if (keys.space && !newPlayer.isDashing) { // Can't jump while dashing
    if (newPlayer.onGround && !isJumping) { // Standard jump from ground
      playSound('/assets/sounds/player_jump_01.wav', 0.6);
      newPlayer.vy = -newPlayer.jumpHeight;
      isJumping = true;
      hasJumpedOnce = true; // Used one jump
      newPlayer.onGround = false; // No longer on ground
    } else if (newPlayer.canDoubleJump && hasJumpedOnce && !newPlayer.onGround && newPlayer.vy > -newPlayer.jumpHeight * 0.5) { // Double jump conditions
      playSound('/assets/sounds/player_double_jump_01.wav', 0.7);
      newPlayer.vy = -newPlayer.jumpHeight * 0.8; // Double jump is slightly less high
      hasJumpedOnce = false; // Used second jump, cannot jump again until landing
      newPlayer.justDoubleJumped = true;
    }
  }
  newPlayer.isJumping = isJumping;
  newPlayer.hasJumpedOnce = hasJumpedOnce;

  // Clamp player to canvas horizontal boundaries
  newPlayer.x = Math.max(0, Math.min(newPlayer.x, CANVAS_WIDTH - newPlayer.width));


  // Animation state determination
  if (newPlayer.isDashing) {
    newPlayer.animationState = 'idle'; // Or a specific 'dashing' animation if available
  } else if (newPlayer.onGround) {
    if (Math.abs(newPlayer.vx || 0) > 0.1) {
      newPlayer.animationState = 'walking';
    } else {
      newPlayer.animationState = 'idle';
    }
  } else { // In air
    newPlayer.animationState = 'idle'; // Or a 'jumping'/'falling' animation
  }

  // Animation timer for frame updates (if using sprite sheets)
  newPlayer.animationTimer += deltaTime;
  if (newPlayer.animationTimer > 1000) newPlayer.animationTimer = 0; // Reset timer, or use for frame index logic

  // Shooting logic
  if (mouse.isDown && (!newPlayer.isDashing || !(newPlayer.hasDashSkill)) && performance.now() - newPlayer.lastShotTime > 1000 / newPlayer.attackSpeed) {
    newPlayer.lastShotTime = performance.now();
    
    const projectileCreationResult = createProjectilesFn(
        newPlayer, 
        mouse,
        canvasRect,
        internalCanvasWidth,
        internalCanvasHeight,
        playSound,
        createParticleEffectFn // Pass the function directly
    );
    newProjectiles = projectileCreationResult.projectiles;
    newLightningBoltsTrigger = projectileCreationResult.newLightningBoltsTrigger;
  }

  // Invincibility timer
  if (newPlayer.isInvincible && performance.now() - newPlayer.lastHitTime > newPlayer.invincibilityDuration) {
    newPlayer.isInvincible = false;
    // Reset invincibility duration to default if it was changed by dash
    if (newPlayer.invincibilityDuration === (newPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION)) {
        newPlayer.invincibilityDuration = 500; // Default hit invincibility
    }
  }


  // Shield recharge logic
  if (newPlayer.shieldMaxHp && newPlayer.shieldRechargeDelay && newPlayer.shieldRechargeRate) {
    if ((newPlayer.shieldCurrentHp || 0) < newPlayer.shieldMaxHp) {
      if (performance.now() - (newPlayer.shieldLastDamagedTime || 0) > newPlayer.shieldRechargeDelay * 1000) {
        newPlayer.shieldCurrentHp = Math.min(
          newPlayer.shieldMaxHp,
          (newPlayer.shieldCurrentHp || 0) + newPlayer.shieldRechargeRate * deltaTime
        );
      }
    }
  }

  // Visual effects tied to player actions
   if (newPlayer.justDoubleJumped) {
        createParticleEffectFn(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height - 5, 15, '#B0C4DE', 10, 80, 0.6, 'player_double_jump');
    }
    if (newPlayer.justLanded) {
        createParticleEffectFn(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height, 20, '#606470', 12, 100, 0.5, 'player_land_dust');
    }
    if (newPlayer.justDashed) {
        const dashDirectionVec = newPlayer.dashDirection === 'right' ? 1 : -1;
        // Create a burst of particles in the opposite direction of the dash
        for (let i = 0; i < 35; i++) {
            // Angle particles slightly upwards/downwards from the opposite dash direction
            const angleOffset = (Math.random() - 0.5) * Math.PI * 0.4; // +/- 36 degrees from horizontal
            const angle = Math.atan2(Math.sin(angleOffset), -dashDirectionVec * Math.cos(angleOffset)); // Opposite direction +/- offset
            const speed = 250 + Math.random() * 150;
             createParticleEffectFn(
                newPlayer.x + newPlayer.width / 2, // Start from player center
                newPlayer.y + newPlayer.height / 2,
                20, // Create one particle at a time for variety
                `rgba(173, 216, 230, ${0.6 + Math.random() * 0.3})`, // Light blue, varied alpha
                10 + Math.random() * 7, // Varied size
                speed, // Varied speed
                0.35 + Math.random() * 0.25, // Varied lifespan
                'dash_trail'
            );
        }
    }
    // Continuous trail while dashing
    if (newPlayer.isDashing && Math.random() < 0.8) { // 80% chance each frame to spawn trail particles
         createParticleEffectFn(
            newPlayer.x + newPlayer.width / 2,
            newPlayer.y + newPlayer.height / 2,
            50, // Fewer particles for continuous trail
            `rgba(200, 220, 255, ${0.4 + Math.random() * 0.2})`, // Slightly different color/alpha
            7 + Math.random() * 5,
            120 + Math.random() * 60, // Slower speed for trailing effect
            0.25 + Math.random() * 0.15,
            'dash_trail'
        );
    }


  return { updatedPlayer: newPlayer, newProjectiles, newLightningBolts: newLightningBoltsTrigger };
}
