

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx?: number;
  vy?: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  update?: (deltaTime: number, ...args: any[]) => void;
}

export type StatusEffectType = 'burn' | 'chill'; // Extensible for future effects like 'poison'

export interface AppliedStatusEffect {
  id: string; // Unique ID for this specific application instance
  type: StatusEffectType;
  duration: number; // remaining duration in seconds
  initialDuration: number;
  // For 'burn'
  damagePerTick?: number; // actual damage value per tick
  tickInterval?: number; // seconds
  lastTickTime?: number; // timestamp of the last tick
  stacks?: number;
  // For 'chill'
  movementSlowFactor?: number; // e.g., 0.7 for 30% slow
  attackSpeedSlowFactor?: number; // e.g., 0.7 means enemy attacks are 30% slower (cooldown is 1/0.7 times longer)
}

export interface Player extends GameObject {
  nickname: string;
  hp: number;
  maxHp: number;
  exp: number;
  level: number;
  xpToNextLevel: number;
  baseMovementSpeed: number; // For effects like Helmet
  movementSpeed: number;
  jumpHeight: number;
  baseAttackSpeed: number; // For effects
  attackSpeed: number; // projectiles per second
  baseMinProjectileDamage: number; 
  baseMaxProjectileDamage: number; 
  minProjectileDamage: number;
  maxProjectileDamage: number;
  critChance: number; // 0-1
  critMultiplier: number;
  baseDefense: number; // For effects like Helmet
  defense: number; // 0-1, percentage damage reduction
  isJumping: boolean;
  isInvincible: boolean;
  lastHitTime: number;
  invincibilityDuration: number;
  shootCooldown: number;
  lastShotTime: number;
  upgrades: string[];
  lifeSteal: number; // 0-1
  revives: number; // Immortal revives
  appraisalChoices: number; // Number of upgrade choices
  onGround: boolean;
  canDoubleJump?: boolean; // Now a permanent skill
  hasJumpedOnce?: boolean;
  thunderboltEffectiveBolts?: number;
  isAdmin?: boolean; // Flag for admin mode

  // Animation State
  currentFrame: number; // May be repurposed for canvas animation timing/state
  animationTimer: number; // General timer for animation
  animationState: 'idle' | 'walking';
  facingDirection: 'left' | 'right';

  // Properties for applying burn status effect
  appliesBurn?: {
    chance: number;
    damageFactor: number; // e.g., 0.2 means 20% of average projectileDamage
    duration: number;
    baseStacks: number; // Initial stacks applied
    maxStacks: number;
    tickInterval: number; // How often burn ticks, in seconds
  };
  // Properties for applying chill status effect
  appliesChill?: {
    chance: number;
    duration: number;
    movementSlowFactor: number;
    attackSpeedSlowFactor: number; // Lower means slower attack speed (higher cooldown)
  };

  // Piercing Shots
  projectilePierceCount?: number;

  // Homing Projectiles
  projectilesAreHoming?: boolean;
  projectileHomingStrength?: number;

  // Energy Shield
  shieldMaxHp?: number;
  shieldCurrentHp?: number;
  shieldRechargeDelay?: number; // seconds
  shieldRechargeRate?: number; // hp per second, only when not recently hit
  shieldLastDamagedTime?: number; // timestamp when shield was last hit or broken
  
  // Character Customization & Shop
  selectedHatId: string | null; 
  selectedStaffId: string | null;
  coins: number;
  purchasedPermanentSkills: Record<string, { level: number }>; // e.g. { 'skill_dash': { level: 2 } }
  xpBonus: number; // e.g. 1.1 for +10%
  coinDropBonus: number; // e.g. 0.02 for +2% (additive to base 10% chance)
  coinCheatActiveAmount?: number; // Amount for the one-time coin drop cheat


  // Hat/Staff Effects
  challengerHatMoreEnemies?: boolean; 
  canFreeRerollUpgrades?: boolean; 
  usedFreeRerollThisLevelUp?: boolean; 

  // Particle effect flags
  justDoubleJumped?: boolean;
  justLanded?: boolean;
  justDashed?: boolean; 

  // Dash properties (conditional on skill purchase)
  hasDashSkill?: boolean;
  dashCooldownTime?: number;
  lastDashTimestamp?: number;
  isDashing?: boolean;
  dashDurationTime?: number;
  dashTimer?: number;
  dashSpeedValue?: number;
  dashDirection?: 'left' | 'right';
  dashInvincibilityDuration?: number; 
}

export type EnemyType = 'standard' | 'boss' | 'splitter' | 'miniSplitter' | 'healing_drone';
export type AlienVisualVariant = 'cyclops' | 'green_classic' | 'spiky' | 'multi_tentacle' | 'three_eyed_boss' | 'cosmic_energy_orb' | 'nebula_serpent' | 'healing_drone'; 

export interface Enemy extends GameObject {
  id: string; 
  hp: number;
  maxHp: number;
  damage: number;
  expValue: number;
  isFollowingPlayer: boolean;
  shootCooldown: number; 
  lastShotTime: number;
  color: string; 
  speed: number; 
  onDeathEffects?: (() => void)[]; 
  slowFactor: number; 
  enemyType: EnemyType;
  visualVariant?: AlienVisualVariant; 
  inFuryMode?: boolean; 
  statusEffects: AppliedStatusEffect[];

  lastAppliedVx?: number;
  directionChangeCounter?: number;
  isReturningToCenter?: boolean;
  returnToCenterTimer?: number;

  // Boss Minion specific properties
  canSummonMinions?: boolean; // New flag for boss ability configuration
  summonedMinionIds?: string[];
  minionRespawnTimer?: number; 
  minionRespawnCooldown?: number; 
  furyMinionSpawnCooldownTimer?: number; 
  maxMinionsNormal?: number;
  maxMinionsFury?: number;
  showMinionWarningTimer?: number; 
  showMinionSpawnedMessageTimer?: number; 
  isSummonedByBoss?: boolean; 

  distanceToExplosion?: number; 

  // Healing Drone specific properties
  isHealingDrone?: boolean;
  healCooldownValue?: number; // Configurable cooldown
  lastHealTime?: number;
  healingTargetIds?: string[]; // IDs of enemies currently being targeted for healing
  healingRange?: number;
  scanRange?: number;
  droneState?: 'IDLE_SCANNING' | 'MOVING_TO_HEAL' | 'HEALING_PULSE' | 'RETREATING';
  retreatPosition?: { x: number, y: number };
  timeInCurrentState?: number;

  // Boss Teleport specific properties
  canTeleport?: boolean; // Will be set dynamically based on wave config
  lastTeleportTime?: number;
  teleportCooldownValue?: number;
  isReturningToTopAfterTeleport?: boolean;
}

export type ProjectileEffectType = 'standard' | 'trident' | 'boomstaff' | 'thunder_staff' | 'emerald_homing' | 'frozen_tip' | 'shadow_bolt' | 'star_shard' | 'plasma_ball' | 'comet_fragment'; 

export interface Projectile extends GameObject {
  damage: number; 
  owner: 'player' | 'enemy';
  color: string; 
  glowEffectColor?: string; 
  hitsLeft?: number; 
  isHoming?: boolean;
  homingTargetId?: string | null;
  homingStrength?: number; 
  initialVx?: number; 
  initialVy?: number;
  
  isExplosive?: boolean; 
  explosionRadius?: number; 
  onHitExplosionConfig?: { 
    chance: number;        
    maxTargets: number;    
    damageFactor: number;  
  };

  appliedEffectType: ProjectileEffectType; 
  trailSpawnTimer?: number; 
  damagedEnemyIDs?: string[]; 
  trailPoints?: { x: number, y: number, life: number, initialLife: number, size: number }[]; 
}

export type ParticleType = 'generic' | 'explosion' | 'status_burn' | 'status_chill' | 'shield_hit' | 'player_double_jump' | 'player_land_dust' | 'projectile_trail_cosmic' | 'coin_pickup' | 'dash_trail' | 'heal_pulse';

export interface Particle extends GameObject {
  life: number;
  initialLife?: number; 
  color: string;
  particleType?: ParticleType; 
  rotation?: number;
  angularVelocity?: number;
}

export interface Platform {
  id: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number; 
  isVisible: boolean;
  isBlinkingOut: boolean; 
  blinkTimer: number; 
  currentAlpha: number; 
}

export interface Upgrade {
  id: string;
  numericId: string; // New field for cheat system
  name: string;
  description: string;
  apply: (player: Player, game: any) => void; 
  tier: 'comum' | 'incomum' | 'raro'; 
  maxApplications?: number; 
}

export enum GameState {
  StartMenu,        
  CharacterSelection, 
  Shop,             
  CosmeticSelectionModal, 
  Playing,          
  ChoosingUpgrade,  
  RevivePending, 
  GameOver,         
  Paused,           
  SkillsInfo,       
  Leaderboard,      
  DebugMenu,        
  ActiveSkillsDisplay, 
}

export interface Keys {
  a: boolean;
  d: boolean;
  space: boolean;
  shift: boolean; 
}

export interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
}

export interface ActiveLightningBolt {
  id:string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number; 
  initialLife: number;
}

export interface LeaderboardEntry {
  nickname: string;
  wave: number;
  time: number;
  date: string;
}

export interface AdminConfig {
  isAdminEnabled: boolean;
  selectedSkills: Record<string, number>; 
  startWave: number;
  xpMultiplier?: number;
  damageMultiplier?: number;
  defenseBoost?: number; 
}

export interface DisplayedSkillInfo {
  id: string;
  name: string;
  icon: string;
  count: number;
  description: string; 
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  initialLife: number;
  color: string;
  fontSize: number;
}

export type CosmeticUnlockWave = number; 

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  unlockWave?: CosmeticUnlockWave; 
  price: number; 
  type: 'hat' | 'staff';
  spriteKey: string; 
  paletteKey: string; 
  artWidth: number; 
  artHeight: number; 
  offsetX?: number; 
  offsetY?: number; 
  effectDescription?: string; 
}

export interface HatItem extends CosmeticItem {
  type: 'hat';
}

export interface StaffItem extends CosmeticItem {
  type: 'staff';
  projectileColor: string; 
  projectileGlowColor?: string; 
}

export interface SkillLevel {
  level: number;
  price: number;
  effectDescription: string;
  applyEffect: (player: Player) => void;
  dashCooldown?: number;
  xpBonus?: number; 
  coinDropBonus?: number; 
}

export interface LeveledSkill {
  id: `skill_${string}`;
  numericId: string; // New field for cheat system
  name: string;
  icon: string; 
  baseDescription: string; 
  type: 'permanent_skill';
  levels: SkillLevel[];
}


export interface CosmeticUnlocksData {
  purchasedItemIds: string[];
  playerCoins: number;
  purchasedPermanentSkills: Record<string, { level: number }>;
}

export interface EnemyUpdateResult {
  updatedEnemy: Enemy;
  newProjectiles: Projectile[];
  enemiesToSpawn?: Enemy[]; 
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
}

export interface Nebula {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color1: string;
  color2: string;
  opacity: number;
  rotation: number;
}

export interface CoinDrop extends GameObject {
  id: string;
  value: number;
  life: number; 
  initialLife: number;
  vy: number; 
  vx: number; 
  onGround: boolean;
}

export type WaveStatus = 'intermissao' | 'surgindo' | 'lutando';

export interface CenterScreenMessage {
    text: string;
    duration: number; 
    initialDuration: number; 
    color?: string;
    fontSize?: number;
}

export interface ScreenShakeState {
  active: boolean;
  intensity: number;
  duration: number; 
  startTime: number; 
}

export interface BorderFlashState {
  active: boolean;
  duration: number; 
  startTime: number; 
}

// This constant is defined in constants.ts but used in App.tsx directly.
// Ideally, App.tsx should import it from constants.ts.
// Adding it here for type completeness if directly used from App.tsx in a way that bypasses constants.ts import.
export const BOSS_FURY_MODE_HP_THRESHOLD = 0.25;

// Cheat System specific types
export interface CheatCode { // Specifically for skill cheats
  skillNumericId: string; // The 3-digit numeric ID
  level: number; // 1 or 2 typically
}

export interface ParsedNickname {
  baseNickname: string;
  skillCheats: CheatCode[]; // Array of skill cheats
  coinCheatAmount: number;   // Total amount from coin cheats, defaults to 0
}
