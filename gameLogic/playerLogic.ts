

import { Player, Keys, MouseState, Platform, Projectile, ProjectileEffectType } from '../types';
import { GRAVITY, CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_ANIMATION_SPEED, SKILL_DASH_SPEED, SKILL_DASH_DURATION, SKILL_DASH_INVINCIBILITY_DURATION } from '../constants'; // Removed SKILL_DASH_COOLDOWN
import { createPlayerProjectiles as createProjectilesFn } from './projectileLogic'; 

interface PlayerUpdateResult {
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
  playSound: (soundName: string, volume?: number) => void
): PlayerUpdateResult {
  let newPlayer = { ...player };
  let newProjectiles: Projectile[] = [];
  let newLightningBoltsTrigger: {mouseX: number, mouseY: number} | undefined = undefined;

  newPlayer.justDoubleJumped = false;
  newPlayer.justLanded = false;
  newPlayer.justDashed = false; 

  let newVx = 0; 
  let newVy = newPlayer.vy; 
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
    
    // playSound('/assets/sounds/player_dash_01.wav', 0.7); 
  }

  if (newPlayer.isDashing) {
    newPlayer.dashTimer = (newPlayer.dashTimer || 0) + deltaTime;
    newPlayer.vx = (newPlayer.dashDirection === 'right' ? 1 : -1) * (newPlayer.dashSpeedValue || SKILL_DASH_SPEED);
    newPlayer.vy = 0; 

    newX = newPlayer.x + newPlayer.vx * deltaTime;
    newY = newPlayer.y; // Y position doesn't change during horizontal dash

    if ((newPlayer.dashTimer || 0) >= (newPlayer.dashDurationTime || SKILL_DASH_DURATION)) { 
        newPlayer.isDashing = false;
        newPlayer.vx = 0; 
    }
  } else { 
    if (keys.a) newVx -= newPlayer.movementSpeed;
    if (keys.d) newVx += newPlayer.movementSpeed;
    newPlayer.vx = newVx;

    newVy += GRAVITY * deltaTime;
    
    newX = newPlayer.x + newPlayer.vx * deltaTime;
    newY = newPlayer.y + newVy * deltaTime;
  }
  
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
                hasJumpedOnce = false;
                if (!previouslyOnGround && !newPlayer.isDashing) {
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


  if (newPlayer.y + newPlayer.height > CANVAS_HEIGHT) {
    newPlayer.y = CANVAS_HEIGHT - newPlayer.height;
    newPlayer.vy = 0;
    newPlayer.onGround = true;
    isJumping = false; 
    hasJumpedOnce = false;
    if (!previouslyOnGround && !newPlayer.isDashing) {
        newPlayer.justLanded = true;
    }
  }
  if (newPlayer.y < 0) {
    newPlayer.y = 0;
    if (newPlayer.vy < 0) newPlayer.vy = 0; 
  }


  if (keys.space && !newPlayer.isDashing) { 
    if (newPlayer.onGround && !isJumping) { 
      playSound('/assets/sounds/player_jump_01.wav', 0.6);
      newPlayer.vy = -newPlayer.jumpHeight;
      isJumping = true;
      hasJumpedOnce = true;
      newPlayer.onGround = false; 
    } else if (newPlayer.canDoubleJump && hasJumpedOnce && !newPlayer.onGround && newPlayer.vy > -newPlayer.jumpHeight * 0.5) { 
      playSound('/assets/sounds/player_double_jump_01.wav', 0.7);
      newPlayer.vy = -newPlayer.jumpHeight * 0.8; 
      hasJumpedOnce = false; 
      newPlayer.justDoubleJumped = true;
    }
  }
  newPlayer.isJumping = isJumping;
  newPlayer.hasJumpedOnce = hasJumpedOnce;

  newPlayer.x = Math.max(0, Math.min(newPlayer.x, CANVAS_WIDTH - newPlayer.width));


  if (newPlayer.isDashing) {
    newPlayer.animationState = 'idle'; 
  } else if (newPlayer.onGround) {
    if (Math.abs(newPlayer.vx) > 0.1) {
      newPlayer.animationState = 'walking';
    } else {
      newPlayer.animationState = 'idle';
    }
  } else { 
    newPlayer.animationState = 'idle'; 
  }

  newPlayer.animationTimer += deltaTime;
  if (newPlayer.animationTimer > 1000) newPlayer.animationTimer = 0; 

  if (mouse.isDown && (!newPlayer.isDashing || !(newPlayer.hasDashSkill)) && performance.now() - newPlayer.lastShotTime > 1000 / newPlayer.attackSpeed) {
    newPlayer.lastShotTime = performance.now();
    
    const projectileCreationResult = createProjectilesFn(
        newPlayer, 
        mouse,
        canvasRect,
        internalCanvasWidth,
        internalCanvasHeight,
        playSound 
    );
    newProjectiles = projectileCreationResult.projectiles;
    newLightningBoltsTrigger = projectileCreationResult.newLightningBoltsTrigger;
  }

  if (newPlayer.isInvincible && performance.now() - newPlayer.lastHitTime > newPlayer.invincibilityDuration) {
    newPlayer.isInvincible = false;
    // Reset invincibility duration to default if it was changed by dash
    if (newPlayer.invincibilityDuration === (newPlayer.dashInvincibilityDuration || SKILL_DASH_INVINCIBILITY_DURATION)) {
        newPlayer.invincibilityDuration = 500; // Default hit invincibility
    }
  }


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

  return { updatedPlayer: newPlayer, newProjectiles, newLightningBolts: newLightningBoltsTrigger };
}
