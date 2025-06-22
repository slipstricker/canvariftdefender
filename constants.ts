

import { Platform, Upgrade, Player, Enemy, HatItem, StaffItem, CosmeticItem } from './types'; // Removed PermanentSkillItem

export const CANVAS_WIDTH = 1920; 
export const CANVAS_HEIGHT = 1080; 
export const GRAVITY = 1800; 
export const PLAYER_INITIAL_HP = 100;

export const PIXEL_FONT_FAMILY = "'Press Start 2P', monospace";


// Pixel Art Sizing
export const SPRITE_PIXEL_SIZE = 3;
export const PREVIEW_SPRITE_PIXEL_SIZE = 6; 

// Player Art Dimensions 
export const PLAYER_ART_WIDTH = 20; 
export const PLAYER_ART_HEIGHT = 32; 
export const PLAYER_WIDTH = PLAYER_ART_WIDTH * SPRITE_PIXEL_SIZE;
export const PLAYER_HEIGHT = PLAYER_ART_HEIGHT * SPRITE_PIXEL_SIZE;

export const PLAYER_ANIMATION_SPEED = 0.20; 

// Enemy Art Dimensions 
const ENEMY_SCALE_FACTOR = 32 / 11;
export const ENEMY_ART_WIDTH = Math.round(6 * ENEMY_SCALE_FACTOR); 
export const ENEMY_ART_HEIGHT = Math.round(6 * ENEMY_SCALE_FACTOR); 

export const SPLITTER_ART_WIDTH = Math.round(8 * ENEMY_SCALE_FACTOR); 
export const SPLITTER_ART_HEIGHT = Math.round(8 * ENEMY_SCALE_FACTOR); 

export const BOSS_ART_WIDTH = Math.round(12 * ENEMY_SCALE_FACTOR); 
export const BOSS_ART_HEIGHT = Math.round(12 * ENEMY_SCALE_FACTOR); 

export const HEALING_DRONE_ART_WIDTH = Math.round(5 * ENEMY_SCALE_FACTOR * 0.9); // Smaller drone
export const HEALING_DRONE_ART_HEIGHT = Math.round(5 * ENEMY_SCALE_FACTOR * 0.9);


// Projectile Art Dimensions
export const PROJECTILE_ART_WIDTH = Math.round(2.5 * ENEMY_SCALE_FACTOR); 
export const PROJECTILE_ART_HEIGHT = Math.round(3 * ENEMY_SCALE_FACTOR); 

export const PLAYER_PROJECTILE_COLOR = '#FFA500'; 
export const ENEMY_PROJECTILE_COLOR = '#C700C7'; 

export const PLAYER_JUMP_HEIGHT = 820; 
export const PLAYER_MOVEMENT_SPEED = 380; 
export const PLAYER_INITIAL_ATTACK_SPEED = 2.2;
export const PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE = 7;
export const PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE = 17;
export const PLAYER_INITIAL_DEFENSE = 0;
export const PLAYER_INITIAL_CRIT_CHANCE = 0.05;

// Base Dash Skill Constants (actual cooldown will be leveled)
export const SKILL_DASH_DURATION = 0.15; // seconds
export const SKILL_DASH_SPEED = 1500; // pixels per second
export const SKILL_DASH_INVINCIBILITY_DURATION = 1000; // 1 second in milliseconds


export const DEFAULT_PLATFORM_PADDING = 15;
// Platform Canvas Dimensions 
const baseGroundPlatformHeight = Math.round(25 * ENEMY_SCALE_FACTOR); 
const baseDynamicPlatformHeight = Math.round(15 * ENEMY_SCALE_FACTOR); 

export const GROUND_PLATFORM_HEIGHT = Math.round(baseGroundPlatformHeight * 0.7); 
export const DYNAMIC_PLATFORM_HEIGHT = Math.round(baseDynamicPlatformHeight * 0.7); 


export const XP_PER_LEVEL_BASE = 100;
export const XP_LEVEL_MULTIPLIER = 1.25;

// Wave System Configuration
export const INITIAL_WAVE_CONFIG = {
  enemies: 7,
  spawnInterval: 1.5,
  intermissionTime: 5,
};

export const WAVE_CONFIG_INCREMENTS = {
  enemiesPerWave: 2,
  spawnIntervalReduction: 0.05,
  minSpawnInterval: 0.3,
  intermissionTimeIncrease: 0.5,
};

export const PLAYER_INTERMISSION_HEAL_PERCENT = 0.1;
export const WAVE_ANNOUNCEMENT_DURATION = 5; 
export const INTERMISSION_COUNTDOWN_UPDATE_INTERVAL = 1.1; 
export const BOSS_SUMMON_WARNING_UPDATE_INTERVAL = 1;


// Dynamic Platform Configuration
export const DYNAMIC_PLATFORM_COUNT = 12; 
export const PLATFORM_MIN_WIDTH_FACTOR = 0.3;
export const PLATFORM_MIN_VISIBLE_TIME = 8;
export const PLATFORM_MAX_VISIBLE_TIME_VARIANCE = 4;
export const PLATFORM_MIN_INVISIBLE_TIME = 3;
export const PLATFORM_MAX_INVISIBLE_TIME_VARIANCE = 3;
export const PLATFORM_FADE_DURATION = 3;
export const PLATFORM_SAFE_SPAWN_ATTEMPTS = 20; 

// Leaderboard
export const LEADERBOARD_KEY = 'pixelRiftDefendersLeaderboard';
export const ADMIN_LEADERBOARD_KEY = 'pixelRiftAdminLeaderboard';
export const MAX_LEADERBOARD_ENTRIES = 10;

// Admin Mode
export const ADMIN_START_WAVE = 1;


// --- Enemy Stat Configuration ---
// Base values are for Wave 1, Player Level 1.
// Scaling applies multiplicatively or additively as described.
export const ENEMY_CONFIG = {
  standard: {
    hp: {
      base: 10,
      perPlayerLevel: 2,
      perWaveFactor: 0.15, // Total HP *= (1 + (wave - 1) * perWaveFactor)
    },
    damage: {
      base: 4,
      perPlayerLevel: 0.5,
      perWaveFactor: 0.15, // Total Damage *= (1 + (wave - 1) * perWaveFactor)
    },
    speed: { // FinalSpeed = baseSpeed * (1 + min(maxBonusFromWavesFactor, (wave-1)*increaseFactorPerWave))
      base: 75,
      increaseFactorPerWave: 0.07, 
      maxBonusFromWavesFactor: 0.30, 
    },
    shootCooldown: { // FinalCooldown = max(min, base - (wave-1)*reductionPerWave) * finalMultiplier
      base: 2500, // ms
      reductionPerWave: 50, // ms
      min: 300,     // ms
      finalMultiplier: 1.10,
    },
    xp: {
      base: 10,
      perPlayerLevel: 1,
      perWaveFactor: 0.10, // Total XP *= (1 + (wave - 1) * perWaveFactor)
    }
  },
  splitter: { // factors applied to Standard stats for the same wave/level
    hpFactor: 1.5,
    damageFactor: 1.0,
    speedFactor: 0.5,
    shootCooldownFactor: 1.2,
    xpFactor: 1.0,
  },
  miniSplitter: { // factors applied to Standard stats for the same wave/level
    hpFactor: 0.4,
    damageFactor: 0.6,
    speedFactor: 1.2,
    shootCooldownFactor: 0.7,
    xpFactor: 0.3,
  },
  healingDrone: { // factors applied to Standard stats for the same wave/level
    hpFactor: 0.6,    // Lower HP
    damageFactor: 0,  // No damage
    speedFactor: 0.9, // Moderate speed
    shootCooldownFactor: 1, // Irrelevant, doesn't shoot
    xpFactor: 0.4,    // Lower XP
  },
  boss: {
    statReferenceWave: 4, // Wave to use for standard enemy stat calculation as a base for the boss
    // Multipliers for "Standard Enemy @ statReferenceWave" stats:
    hpMultiplier: 20.0, // Example: If standard@refWave has 60 HP, boss gets 60*25. This sets the initial boss HP.
    damageMultiplier: 2.0,
    attackSpeedMultiplier: 2.0, // Cooldown is divided by this
    xpMultiplier: 5.0,
    speedMultiplier: 1.0, 

    // Scaling for subsequent boss waves (e.g. wave 15 boss vs wave 5 boss)
    // Applied per 10-wave increment beyond the FIRST_BOSS_WAVE_NUMBER.
    hpScalingFactorPer10Waves: 2.0,
    damageScalingFactorPer10Waves: 1.5,
    attackSpeedScalingFactorPer10Waves: 1.5, // Cooldown /= 1.5
    xpScalingFactorPer10Waves: 2.0,
    speedAdditiveFactorPer10Waves: 0.25, // Speed *= (1 + 0.25 * scalingSteps)
    
    // Limits for scaling
    minShootCooldownFactorOfInitialBoss: 1/3.0,
    maxSpeedFactorOfInitialBoss: 2.0,

    // Fury Mode
    furyDamageMultiplier: 2.0,
  }
};

export const FIRST_BOSS_WAVE_NUMBER = 5; 
export const ALL_BOSS_WAVES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];

// Boss Ability Wave Configuration
export const BOSS_ABILITY_WAVE_CONFIG = {
  teleport: "all", // "all" or "5,15,25" (comma-separated wave numbers)
  summonMinions: "all", // "all" or "10,20,30"
  // Example for future:
  // specialAttackX: "15,30,45" 
};


// Boss Minion constants remain, as they are not primary stats like HP/damage
export const BOSS_MINION_RESPAWN_COOLDOWN = 5; 
export const BOSS_FURY_MINION_SPAWN_COOLDOWN = 5; 
export const BOSS_MINION_RESPAWN_WARNING_DURATION = 2; 
export const BOSS_MAX_MINIONS_NORMAL = 3;
export const BOSS_MAX_MINIONS_FURY = 5;
export const BOSS_FURY_MODE_HP_THRESHOLD = 0.25; // Keeping this, as it's a gameplay threshold

// Boss Teleport Ability Constants
export const BOSS_TELEPORT_COOLDOWN_MS = 10000; // 10 seconds
export const BOSS_PREFERRED_Y_POSITION = CANVAS_HEIGHT * 0.10; // Preferred Y position (e.g., 10% from top)
export const BOSS_TELEPORT_MAX_Y_DESTINATION = CANVAS_HEIGHT * 0.70; // Max Y boss can teleport to (e.g. 70% from top)
export const BOSS_TELEPORT_MIN_Y_AFTER_TELEPORT_FOR_RETURN = CANVAS_HEIGHT * 0.40; // If Y > this after teleport, return to preferred Y

// Splitter Enemy Constants
export const SPLITTER_MIN_WAVE = 3;
export const MINI_SPLITTER_COUNT_MIN = 2;
export const MINI_SPLITTER_COUNT_MAX = 3;

// Healing Drone Constants
export const HEALING_DRONE_MIN_WAVE = 4;
export const HEALING_DRONE_SPAWN_CHANCE = 0.12; // 12% chance per enemy spawn slot, if wave condition met
export const HEALING_DRONE_HEAL_PERCENTAGE = 0.20; 
export const HEALING_DRONE_HEAL_COOLDOWN_MS = 5000;
export const HEALING_DRONE_MAX_TARGETS = 3;
export const HEALING_DRONE_HEAL_RANGE = 140 * SPRITE_PIXEL_SIZE; 
export const HEALING_DRONE_SCAN_RANGE = 450 * SPRITE_PIXEL_SIZE;
export const HEALING_DRONE_RETREAT_Y_MIN_FACTOR = 0.05; 
export const HEALING_DRONE_RETREAT_Y_MAX_FACTOR = 0.20; 
export const HEALING_DRONE_STATE_DURATION_BASE = 2.0; 
export const HEALING_DRONE_BLINK_SPEED = 3; 


// --- COSMETICS & SKILLS ---
export const COSMETIC_DATA_KEY = 'pixelRiftDefendersCosmeticData'; 

// --- SKILL IDS (for reference if needed elsewhere) ---
export const SKILL_ID_DOUBLE_JUMP = 'skill_double_jump';
export const SKILL_ID_DASH = 'skill_dash';
export const SKILL_ID_XP_BOOST = 'skill_xp_boost';
export const SKILL_ID_COIN_MAGNET = 'skill_coin_magnet';


// Ground Platform Art Dimensions
export const GROUND_PLATFORM_SPRITE_ART_WIDTH = 6;
export const GROUND_PLATFORM_SPRITE_ART_HEIGHT = Math.round(GROUND_PLATFORM_HEIGHT / SPRITE_PIXEL_SIZE); 

// Dynamic Platform Art Dimensions
export const DYNAMIC_PLATFORM_SPRITE_ART_WIDTH = 5;
export const DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT = Math.round(DYNAMIC_PLATFORM_HEIGHT / SPRITE_PIXEL_SIZE);
