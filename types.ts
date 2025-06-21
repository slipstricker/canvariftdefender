

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
  baseProjectileDamage: number; // For effects
  projectileDamage: number;
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
  revives: number;
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
    damageFactor: number; // e.g., 0.2 means 20% of projectileDamage
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
  // purchasedPermanentSkillIds: string[]; // For Dash, Double Jump, etc. - Replaced
  purchasedPermanentSkills: Record<string, { level: number }>; // e.g. { 'skill_dash': { level: 2 } }
  xpBonus: number; // e.g. 1.1 for +10%
  coinDropBonus: number; // e.g. 0.02 for +2% (additive to base 10% chance)


  // Hat/Staff Effects
  challengerHatMoreEnemies?: boolean; // For Challenger's Hat
  canFreeRerollUpgrades?: boolean; // For Fedora
  usedFreeRerollThisLevelUp?: boolean; // For Fedora

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
  dashInvincibilityDuration?: number; // Duration of invincibility granted by dash
}

export type EnemyType = 'standard' | 'boss' | 'splitter' | 'miniSplitter';
export type AlienVisualVariant = 'cyclops' | 'green_classic' | 'spiky' | 'multi_tentacle' | 'three_eyed_boss' | 'cosmic_energy_orb' | 'nebula_serpent'; // Added new variants for space theme

export interface Enemy extends GameObject {
  id: string; // Unique identifier for each enemy instance
  hp: number;
  maxHp: number;
  damage: number;
  expValue: number;
  isFollowingPlayer: boolean;
  shootCooldown: number; // Base cooldown, can be modified by effects like chill
  lastShotTime: number;
  color: string; // Base color for 'standard' and 'boss', or primary color for palette-drawn sprites. May be less used with specific canvas designs.
  speed: number; // Base speed, can be modified by effects like chill
  onDeathEffects?: (() => void)[]; // Kept for potential generic effects, splitter logic handled in App.tsx
  slowFactor: number; // 0-1, 1 is normal speed (used for other slow types, chill uses its own factors)
  enemyType: EnemyType;
  visualVariant?: AlienVisualVariant; // For distinct canvas-drawn alien looks
  inFuryMode?: boolean; // Indicates if the boss is in fury mode
  statusEffects: AppliedStatusEffect[];

  // Boss specific anti-vibration/stuck logic
  lastAppliedVx?: number;
  directionChangeCounter?: number;
  isReturningToCenter?: boolean;
  returnToCenterTimer?: number;

  // Boss minion summoning
  summonedMinionIds?: string[];
  minionRespawnTimer?: number; // Current cooldown timer for normal mode
  minionRespawnCooldown?: number; // Configured cooldown duration for normal mode
  furyMinionSpawnCooldownTimer?: number; // Current cooldown timer for fury mode
  maxMinionsNormal?: number;
  maxMinionsFury?: number;
  showMinionWarningTimer?: number; // Timer for "Spawning in X..." message
  showMinionSpawnedMessageTimer?: number; // Timer for "Minions spawned!" message
  isSummonedByBoss?: boolean; // Flag for minions to identify them

  distanceToExplosion?: number; // Used temporarily in explosion logic
}

export type ProjectileEffectType = 'standard' | 'trident' | 'boomstaff' | 'thunder_staff' | 'emerald_homing' | 'frozen_tip' | 'shadow_bolt' | 'star_shard' | 'plasma_ball' | 'comet_fragment'; // Added new space themed types

export interface Projectile extends GameObject {
  damage: number;
  owner: 'player' | 'enemy';
  color: string; // Base color of the projectile
  glowEffectColor?: string; // Optional glow color if the base color is dark
  hitsLeft?: number; // For piercing, includes initial hit. 0 means destroyed.
  // isExploded?: boolean; // Deprecated, explosion handled differently
  // Homing properties
  isHoming?: boolean;
  homingTargetId?: string | null;
  homingStrength?: number; // Factor determining turn rate
  initialVx?: number; // Store initial velocity for some homing calcs
  initialVy?: number;
  
  // Properties for explosions
  isExplosive?: boolean; // True if it explodes at end-of-life / off-screen.
  explosionRadius?: number; // Radius for any type of explosion this projectile might cause.
  onHitExplosionConfig?: { // Configuration for explosion specifically on enemy hit.
    chance: number;        // Probability (0-1) of exploding on hit.
    maxTargets: number;    // Maximum number of enemies affected by the on-hit explosion.
    damageFactor: number;  // Multiplier of projectile's base damage for the explosion.
  };

  appliedEffectType: ProjectileEffectType; // Made mandatory
  trailSpawnTimer?: number; // Timer for spawning trail particles
  damagedEnemyIDs?: string[]; // Tracks IDs of enemies already damaged by this projectile
  trailPoints?: { x: number, y: number, life: number, initialLife: number, size: number }[]; // Added trailPoints for advanced trails
}

export type ParticleType = 'generic' | 'explosion' | 'status_burn' | 'status_chill' | 'shield_hit' | 'player_double_jump' | 'player_land_dust' | 'projectile_trail_cosmic' | 'coin_pickup' | 'dash_trail';

export interface Particle extends GameObject {
  life: number;
  initialLife?: number; // For scaling alpha/size
  color: string;
  particleType?: ParticleType; // For specific behaviors or appearances
  rotation?: number;
  angularVelocity?: number;
}

export interface Platform {
  id: string; // Unique identifier
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number; // Max width for dynamic platforms
  isVisible: boolean;
  isBlinkingOut: boolean; // True if platform is currently fading out
  blinkTimer: number; // Timer for visibility state changes or duration
  currentAlpha: number; // For fade in/out effects
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  apply: (player: Player, game: any) => void; // 'any' for game context to avoid circular deps. Can be improved.
  tier: 'comum' | 'incomum' | 'raro'; // Translated tiers
  maxApplications?: number; // How many times this can be picked
}

export enum GameState {
  StartMenu,        // MenuInicial
  CharacterSelection, // SelecaoPersonagem
  Shop,             // Loja de Artefatos
  CosmeticSelectionModal, // Modal de Seleção de Cosméticos
  Playing,          // Jogando
  ChoosingUpgrade,  // EscolhendoMelhoria
  GameOver,         // FimDeJogo
  Paused,           // Pausado
  SkillsInfo,       // InfoHabilidades
  Leaderboard,      // PlacarLideres
  DebugMenu,        // Formerly AdminMenu
  ActiveSkillsDisplay, // ExibirHabilidadesAtivas
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
  life: number; // seconds
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
  selectedSkills: Record<string, number>; // Key: upgrade.id, Value: count
  startWave: number;
  xpMultiplier?: number;
  damageMultiplier?: number;
  defenseBoost?: number; // Represents a flat percentage boost, e.g., 0.1 for +10%
}

// Used for the state that prepares data for rendering acquired skills UI
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
  unlockWave?: CosmeticUnlockWave; // Made optional for shop-only items
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
  // Specific values for UI display, actual application happens in applyEffect
  dashCooldown?: number;
  xpBonus?: number; // e.g., 0.1 for +10%
  coinDropBonus?: number; // e.g., 0.02 for +2%
}

export interface LeveledSkill {
  id: `skill_${string}`;
  name: string;
  icon: string; // Icon for the shop UI
  baseDescription: string; // General description
  type: 'permanent_skill';
  levels: SkillLevel[];
}


export interface CosmeticUnlocksData {
  purchasedItemIds: string[];
  playerCoins: number;
  // purchasedPermanentSkillIds: string[]; // Replaced
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
  opacity: number;
  twinkleSpeed: number;
  baseOpacity: number;
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