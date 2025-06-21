

import { Platform, Upgrade, Player, Enemy, HatItem, StaffItem, CosmeticItem } from './types'; // Removed PermanentSkillItem

export const CANVAS_WIDTH = 1920; 
export const CANVAS_HEIGHT = 1080; 
export const GRAVITY = 1800; 
export const PLAYER_INITIAL_HP = 100;

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

// Projectile Art Dimensions
export const PROJECTILE_ART_WIDTH = Math.round(2.5 * ENEMY_SCALE_FACTOR); 
export const PROJECTILE_ART_HEIGHT = Math.round(3 * ENEMY_SCALE_FACTOR); 

export const PLAYER_PROJECTILE_COLOR = '#FFA500'; 
export const ENEMY_PROJECTILE_COLOR = '#C700C7'; 

export const PLAYER_JUMP_HEIGHT = 820; 
export const PLAYER_MOVEMENT_SPEED = 380; 
export const PLAYER_INITIAL_ATTACK_SPEED = 2;
export const PLAYER_INITIAL_PROJECTILE_DAMAGE = 12;
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
export const XP_LEVEL_MULTIPLIER = 1.20;

// Wave System Configuration
export const INITIAL_WAVE_CONFIG = {
  enemies: 5,
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

// Boss Constants
export const BOSS_WAVE_NUMBER = 5; 
export const ALL_BOSS_WAVES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
export const BOSS_HP = 1500;
export const BOSS_STAT_REFERENCE_WAVE = 4; 
export const BOSS_DAMAGE_MULTIPLIER = 2;
export const BOSS_ATTACK_SPEED_MULTIPLIER = 2;
export const BOSS_XP_REWARD_MULTIPLIER = 5;
export const BOSS_FURY_MODE_HP_THRESHOLD = 0.25;
export const BOSS_FURY_DAMAGE_MULTIPLIER = 2;
export const BOSS_MINION_RESPAWN_COOLDOWN = 5; 
export const BOSS_FURY_MINION_SPAWN_COOLDOWN = 3; 
export const BOSS_MINION_RESPAWN_WARNING_DURATION = 2; 
export const BOSS_MAX_MINIONS_NORMAL = 3;
export const BOSS_MAX_MINIONS_FURY = 5;


// Splitter Enemy Constants
export const SPLITTER_MIN_WAVE = 3;
export const MINI_SPLITTER_COUNT_MIN = 2;
export const MINI_SPLITTER_COUNT_MAX = 3;


// Anti-Cheat Heuristics
export const MAX_LEVEL_CHEAT_BUFFER = 3;
export const MAX_SKILLS_CHEAT_BUFFER = 3;

// --- COSMETICS & SKILLS ---
export const COSMETIC_DATA_KEY = 'pixelRiftDefendersCosmeticData'; 
// DEFAULT_HAT_ID and DEFAULT_STAFF_ID moved to shopLogic.ts (items with price 0)
// ALL_HATS, ALL_STAFFS, PERMANENT_SKILLS moved to shopLogic.ts

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
