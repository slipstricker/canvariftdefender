
import { Player, Keys, MouseState, Platform, Projectile, ProjectileEffectType } from '../types';
import { GRAVITY, CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_ANIMATION_SPEED } from '../constants';
import { createPlayerProjectiles as createProjectilesFn } from './projectileLogic'; // Renamed to avoid conflict

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

  // Reset particle flags at the beginning of the update
  newPlayer.justDoubleJumped = false;
  newPlayer.justLanded = false;

  let newVx = 0;
  if (keys.a) newVx -= newPlayer.movementSpeed;
  if (keys.d) newVx += newPlayer.movementSpeed;

  if (keys.a && !keys.d) newPlayer.facingDirection = 'left';
  else if (keys.d && !keys.a) newPlayer.facingDirection = 'right';


  let newVy = newPlayer.vy + GRAVITY * deltaTime;
  let newX = newPlayer.x + newVx * deltaTime;
  let newY = newPlayer.y + newVy * deltaTime;
  let onGround = false;
  let previouslyOnGround = newPlayer.onGround;
  let isJumping = newPlayer.isJumping;
  let hasJumpedOnce = newPlayer.hasJumpedOnce;

  for (const platform of platforms) {
    if (!platform.isVisible || platform.currentAlpha < 0.5) continue;

    const playerPotentialRight = newX + newPlayer.width;
    const playerPotentialBottom = newY + newPlayer.height;

    if (newVy >= 0 && 
        playerPotentialRight > platform.x && newX < (platform.x + platform.width) &&
        (player.y + player.height) <= (platform.y + 1) && 
        playerPotentialBottom >= platform.y                
    ) {
        newY = platform.y - newPlayer.height;
        newVy = 0;
        onGround = true;
        isJumping = false;
        hasJumpedOnce = false;
        if (!previouslyOnGround) {
            newPlayer.justLanded = true;
        }
    }
  }

  if (newY + newPlayer.height > CANVAS_HEIGHT) {
    newY = CANVAS_HEIGHT - newPlayer.height;
    newVy = 0;
    onGround = true;
    isJumping = false;
    hasJumpedOnce = false;
    if (!previouslyOnGround) {
        newPlayer.justLanded = true;
    }
  }

  newPlayer.x = newX;
  newPlayer.y = newY;
  newPlayer.vx = newVx;
  newPlayer.vy = newVy;
  newPlayer.onGround = onGround;

  if (keys.space) {
    if (newPlayer.onGround && !isJumping) {
      playSound('/assets/sounds/player_jump_01.wav', 0.6);
      newPlayer.vy = -newPlayer.jumpHeight;
      isJumping = true;
      hasJumpedOnce = true;
      onGround = false; 
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

  if (onGround) {
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

  if (mouse.isDown && performance.now() - newPlayer.lastShotTime > 1000 / newPlayer.attackSpeed) {
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
