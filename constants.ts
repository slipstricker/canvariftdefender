
import { Platform, Upgrade, Player, Enemy, HatItem, StaffItem, CosmeticItem } from './types';

export const CANVAS_WIDTH = 1920; // FullHD width
export const CANVAS_HEIGHT = 1080; // FullHD height
export const GRAVITY = 1800; 
export const PLAYER_INITIAL_HP = 100;

// Pixel Art Sizing
export const SPRITE_PIXEL_SIZE = 3;
export const PREVIEW_SPRITE_PIXEL_SIZE = 6; 

// Player Art Dimensions (Front-Facing Magician - 20x32)
export const PLAYER_ART_WIDTH = 20; 
export const PLAYER_ART_HEIGHT = 32; 
export const PLAYER_WIDTH = PLAYER_ART_WIDTH * SPRITE_PIXEL_SIZE;
export const PLAYER_HEIGHT = PLAYER_ART_HEIGHT * SPRITE_PIXEL_SIZE;

export const PLAYER_ANIMATION_SPEED = 0.20; 

// Enemy Art Dimensions (Scaled proportionally to player's 11px to 32px art height change)
const ENEMY_SCALE_FACTOR = 32 / 11;
export const ENEMY_ART_WIDTH = Math.round(6 * ENEMY_SCALE_FACTOR); // Approx 17
export const ENEMY_ART_HEIGHT = Math.round(6 * ENEMY_SCALE_FACTOR); // Approx 17

export const SPLITTER_ART_WIDTH = Math.round(8 * ENEMY_SCALE_FACTOR); // Approx 23
export const SPLITTER_ART_HEIGHT = Math.round(8 * ENEMY_SCALE_FACTOR); // Approx 23

export const BOSS_ART_WIDTH = Math.round(12 * ENEMY_SCALE_FACTOR); // Approx 35
export const BOSS_ART_HEIGHT = Math.round(12 * ENEMY_SCALE_FACTOR); // Approx 35

// Projectile Art Dimensions
export const PROJECTILE_ART_WIDTH = Math.round(2.5 * ENEMY_SCALE_FACTOR); // Approx 7 
export const PROJECTILE_ART_HEIGHT = Math.round(3 * ENEMY_SCALE_FACTOR); // Approx 9

export const PLAYER_PROJECTILE_COLOR = '#FFA500'; // Default, will be overridden by staff
export const ENEMY_PROJECTILE_COLOR = '#C700C7'; // Deep Magenta

export const PLAYER_JUMP_HEIGHT = 820; // Reduced from 980, then from 820 
export const PLAYER_MOVEMENT_SPEED = 380; // Reduced from 550 
export const PLAYER_INITIAL_ATTACK_SPEED = 2;
export const PLAYER_INITIAL_PROJECTILE_DAMAGE = 12;
export const PLAYER_INITIAL_DEFENSE = 0;
export const PLAYER_INITIAL_CRIT_CHANCE = 0.05;

export const DEFAULT_PLATFORM_PADDING = 15;
// Platform Canvas Dimensions (scaled relative to player art size, then reduced by 30%)
const baseGroundPlatformHeight = Math.round(25 * ENEMY_SCALE_FACTOR); // Approx 73
const baseDynamicPlatformHeight = Math.round(15 * ENEMY_SCALE_FACTOR); // Approx 44

export const GROUND_PLATFORM_HEIGHT = Math.round(baseGroundPlatformHeight * 0.7); // Approx 51
export const DYNAMIC_PLATFORM_HEIGHT = Math.round(baseDynamicPlatformHeight * 0.7); // Approx 31


export const XP_PER_LEVEL_BASE = 100;
export const XP_LEVEL_MULTIPLIER = 1.20;

// Wave System Configuration
export const INITIAL_WAVE_CONFIG = {
  enemies: 3,
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
export const PLATFORM_SAFE_SPAWN_ATTEMPTS = 20; // Increased attempts

// Leaderboard
export const LEADERBOARD_KEY = 'pixelRiftDefendersLeaderboard';
export const ADMIN_LEADERBOARD_KEY = 'pixelRiftAdminLeaderboard';
export const MAX_LEADERBOARD_ENTRIES = 10;

// Admin Mode
export const ADMIN_START_WAVE = 1;

// Boss Constants
export const BOSS_WAVE_NUMBER = 5; // First boss appears on this wave
export const ALL_BOSS_WAVES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
export const BOSS_HP = 3000;
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

// --- COSMETICS ---
export const COSMETIC_STORAGE_KEY = 'pixelRiftDefendersCosmetics';

// --- HAT DEFINITIONS (Redesigned for 20x32 Player) ---
// Player head top-center for hats is roughly art_x=10, art_y=3
const HAT_ART_SCALE_FACTOR = 32 / 11; // For reference if needed, but primarily new designs

// These artWidth and artHeight constants are used by ALL_HATS definition below.
// They are based on the sprite data that is now in spriteArt.ts.
// We need to keep these sizes or recalculate them based on imported sprite data if strictness is needed.
// For now, assuming these pre-calculated values based on old constants.ts are fine for ALL_HATS definition.
// Actual sprite data will be in spriteArt.ts.

// Example: If HAT_WIZARD_SPRITE was defined here, its dimensions would be:
const HAT_WIZARD_SPRITE_ART_WIDTH_CONST = Math.round(7 * HAT_ART_SCALE_FACTOR * 0.7);
const HAT_WIZARD_SPRITE_ART_HEIGHT_CONST = Math.round(6 * HAT_ART_SCALE_FACTOR * 0.8);
const HAT_HELMET_SPRITE_ART_WIDTH_CONST = Math.round(9 * HAT_ART_SCALE_FACTOR * 0.6);
const HAT_HELMET_SPRITE_ART_HEIGHT_CONST = Math.round(5 * HAT_ART_SCALE_FACTOR * 0.8);
const HAT_BASIC_CAP_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_BASIC_CAP_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_HEADBAND_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_HEADBAND_ART_HEIGHT_CONST = Math.round(1*HAT_ART_SCALE_FACTOR*0.8);
const HAT_PROPELLER_BEANIE_ART_WIDTH_CONST = Math.round(3*HAT_ART_SCALE_FACTOR*0.6);
const HAT_PROPELLER_BEANIE_ART_HEIGHT_CONST = Math.round(3*HAT_ART_SCALE_FACTOR*0.8);
const HAT_UNCOMMON_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_UNCOMMON_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_CHALLENGER_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_CHALLENGER_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_FEDORA_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_FEDORA_ART_HEIGHT_CONST = Math.round(3*HAT_ART_SCALE_FACTOR*0.8);
const HAT_CROWN_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_CROWN_ART_HEIGHT_CONST = Math.round(3*HAT_ART_SCALE_FACTOR*0.8);


// Adjusted Hat Offsets for 20x32 Player (head top-center approx art_x=10, art_y=3)
const calculateHatOffsetX = (hatArtWidth: number) => Math.floor((PLAYER_ART_WIDTH - hatArtWidth) / 2);
const calculateHatOffsetY = (hatArtHeight: number) => -(hatArtHeight) + 2; // Hat sits slightly lower on head

export const ALL_HATS: HatItem[] = [
  { id: 'hat_basic_cap', name: 'Boné Vermelho', description: 'Um boné esportivo vermelho.', unlockWave: 0, type: 'hat', spriteKey: 'HAT_BASIC_CAP_SPRITE', paletteKey: 'HAT_BASIC_CAP_PALETTE', artWidth: HAT_BASIC_CAP_ART_WIDTH_CONST, artHeight: HAT_BASIC_CAP_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_BASIC_CAP_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_BASIC_CAP_ART_HEIGHT_CONST), effectDescription: 'Visual apenas.' },
  { id: 'hat_headband', name: 'Faixa Verde', description: 'Mantém o suor longe dos seus olhos.', unlockWave: 0, type: 'hat', spriteKey: 'HAT_HEADBAND_SPRITE', paletteKey: 'HAT_HEADBAND_PALETTE', artWidth: HAT_HEADBAND_ART_WIDTH_CONST, artHeight: HAT_HEADBAND_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_HEADBAND_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_HEADBAND_ART_HEIGHT_CONST)+1, effectDescription: 'Visual apenas.' },
  { id: 'hat_wizard', name: 'Chapéu de Mago', description: 'Um chapéu pontudo para magos aspirantes.', unlockWave: 2, type: 'hat', spriteKey: 'HAT_WIZARD_SPRITE', paletteKey: 'HAT_WIZARD_PALETTE', artWidth: HAT_WIZARD_SPRITE_ART_WIDTH_CONST, artHeight: HAT_WIZARD_SPRITE_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_WIZARD_SPRITE_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_WIZARD_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Um chapéu estiloso e pontudo.' },
  { id: 'hat_helmet', name: 'Capacete', description: 'Proteção robusta.', unlockWave: 4, type: 'hat', spriteKey: 'HAT_HELMET_SPRITE', paletteKey: 'HAT_HELMET_PALETTE', artWidth: HAT_HELMET_SPRITE_ART_WIDTH_CONST, artHeight: HAT_HELMET_SPRITE_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_HELMET_SPRITE_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_HELMET_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: '+10% Defesa, -15% Vel. Movimento.' },
  { id: 'hat_propeller_beanie', name: 'Gorro de Hélice', description: 'Permite voar... um pouco.', unlockWave: 6, type: 'hat', spriteKey: 'HAT_PROPELLER_BEANIE_SPRITE', paletteKey: 'HAT_PROPELLER_BEANIE_PALETTE', artWidth: HAT_PROPELLER_BEANIE_ART_WIDTH_CONST, artHeight: HAT_PROPELLER_BEANIE_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_PROPELLER_BEANIE_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_PROPELLER_BEANIE_ART_HEIGHT_CONST)-1, effectDescription: 'Garante Pulo Duplo.' },
  { id: 'hat_uncommon', name: 'Chapéu Incomum', description: 'Atrai apenas o melhor.', unlockWave: 8, type: 'hat', spriteKey: 'HAT_UNCOMMON_SPRITE', paletteKey: 'HAT_UNCOMMON_PALETTE', artWidth: HAT_UNCOMMON_ART_WIDTH_CONST, artHeight: HAT_UNCOMMON_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_UNCOMMON_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_UNCOMMON_ART_HEIGHT_CONST), effectDescription: 'Apenas melhorias Incomuns são oferecidas.' },
  { id: 'hat_challenger', name: 'Chapéu do Desafiante', description: 'Dobre ou nada!', unlockWave: 10, type: 'hat', spriteKey: 'HAT_CHALLENGER_SPRITE', paletteKey: 'HAT_CHALLENGER_PALETTE', artWidth: HAT_CHALLENGER_ART_WIDTH_CONST, artHeight: HAT_CHALLENGER_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_CHALLENGER_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_CHALLENGER_ART_HEIGHT_CONST), effectDescription: '20% chance de escolher 2 melhorias. Ondas têm o dobro de inimigos.' },
  { id: 'hat_fedora', name: 'Fedora Misteriosa', description: 'Para aqueles que gostam de uma segunda chance.', unlockWave: 12, type: 'hat', spriteKey: 'HAT_FEDORA_SPRITE', paletteKey: 'HAT_FEDORA_PALETTE', artWidth: HAT_FEDORA_ART_WIDTH_CONST, artHeight: HAT_FEDORA_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_FEDORA_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_FEDORA_ART_HEIGHT_CONST)-1, effectDescription: 'Uma rerrolagem gratuita de melhorias por nível. Não entra no placar.' },
  { id: 'hat_crown', name: 'Coroa Dourada', description: 'Uma coroa digna de um rei ou rainha.', unlockWave: 15, type: 'hat', spriteKey: 'HAT_CROWN_SPRITE', paletteKey: 'HAT_CROWN_PALETTE', artWidth: HAT_CROWN_ART_WIDTH_CONST, artHeight: HAT_CROWN_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_CROWN_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_CROWN_ART_HEIGHT_CONST)-1, effectDescription: 'Apenas visual, mas muito prestigioso!' },
];

// --- STAFF DEFINITIONS (Redesigned for 20x32 Player) ---
// Player Art Hand (Right) on 20x32 sprite: art_px_player_hand_center approx X:17, Y:20
// Staff handle should align with this. Staff tip for projectile spawn is different.
const PLAYER_HAND_ART_X = 17; // Center of player's right hand (X)
const PLAYER_HAND_ART_Y = 20; // Center of player's right hand (Y)

// Similar to hats, keeping these dimensions for ALL_STAFFS definition.
const STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST = Math.round(4 * HAT_ART_SCALE_FACTOR * 0.8); // Approx 9
const STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST = Math.round(9 * HAT_ART_SCALE_FACTOR * 0.9); // Approx 24

// Staff handle art X is assumed to be mid-width of staff sprite, staff handle art Y approx 70-80% down staff height
const calculateStaffOffsetX = (staffArtWidth: number) => PLAYER_HAND_ART_X - Math.floor(staffArtWidth / 2);
const calculateStaffOffsetY = (staffArtHeight: number) => PLAYER_HAND_ART_Y - Math.floor(staffArtHeight * 0.75);


export const ALL_STAFFS: StaffItem[] = [
  { id: 'staff_wizard', name: 'Cajado de Mago', description: 'Um cajado básico.', unlockWave: 0, type: 'staff', spriteKey: 'STAFF_WIZARD_STAFF_SPRITE', paletteKey: 'STAFF_WIZARD_STAFF_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Dispara um projétil em linha reta.', projectileColor: '#8E44AD', projectileGlowColor: '#E0FFFF' },
  { id: 'staff_emerald', name: 'Cajado de Esmeralda', description: 'Magia teleguiada e veloz.', unlockWave: 3, type: 'staff', spriteKey: 'STAFF_EMERALD_SPRITE', paletteKey: 'STAFF_EMERALD_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis teleguiados, +20% Vel. Ataque, -50% Dano.', projectileColor: '#2ECC71', projectileGlowColor: '#A9DFBF' },
  { id: 'staff_trident', name: 'Tridente Aquático', description: 'Dispara uma saraivada de magia.', unlockWave: 5, type: 'staff', spriteKey: 'STAFF_TRIDENT_SPRITE', paletteKey: 'STAFF_TRIDENT_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: 'Dispara 3 projéteis em ângulo.', projectileColor: '#3498DB', projectileGlowColor: '#AED6F1' },
  { id: 'staff_boom', name: 'Cajado Explosivo', description: 'Faz um grande estrondo!', unlockWave: 7, type: 'staff', spriteKey: 'STAFF_BOOM_SPRITE', paletteKey: 'STAFF_BOOM_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis explodem ao atingir, causando dano em área.', projectileColor: '#F39C12', projectileGlowColor: '#FAD7A0' },
  { id: 'staff_thunder', name: 'Cajado Trovejante', description: 'Invoca a fúria dos céus.', unlockWave: 9, type: 'staff', spriteKey: 'STAFF_THUNDER_SPRITE', paletteKey: 'STAFF_THUNDER_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Cada disparo também invoca um raio.', projectileColor: '#F1C40F', projectileGlowColor: '#FDEBD0' },
  { id: 'staff_frozen_tip', name: 'Ponta Congelada', description: 'Atravessa as defesas inimigas.', unlockWave: 11, type: 'staff', spriteKey: 'STAFF_FROZEN_TIP_SPRITE', paletteKey: 'STAFF_FROZEN_TIP_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis perfuram 3 inimigos.', projectileColor: '#AED6F1', projectileGlowColor: '#EBF5FB' },
  { id: 'staff_rainbow', name: 'Cajado Arco-Íris', description: 'Caos e cor!', unlockWave: 14, type: 'staff', spriteKey: 'STAFF_RAINBOW_SPRITE', paletteKey: 'STAFF_RAINBOW_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: 'Dispara projéteis com efeitos aleatórios de outros cajados.', projectileColor: '#FF69B4' /* Default pink, actual color varies in logic */ },
  { id: 'staff_fire_visual', name: 'Cajado de Fogo (Visual)', description: 'Canaliza o poder das chamas (aparência).', unlockWave: 0, type: 'staff', spriteKey: 'STAFF_FIRE_STAFF_SPRITE', paletteKey: 'STAFF_FIRE_STAFF_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: "Visual apenas.", projectileColor: '#F39C12', projectileGlowColor: '#FAD7A0'},
  { id: 'staff_ice_visual', name: 'Cajado de Gelo (Visual)', description: 'Congela inimigos com rajadas gélidas (aparência).', unlockWave: 0, type: 'staff', spriteKey: 'STAFF_ICE_STAFF_SPRITE', paletteKey: 'STAFF_ICE_STAFF_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: "Visual apenas.", projectileColor: '#AED6F1', projectileGlowColor: '#EBF5FB' },
  { id: 'staff_shadow_visual', name: 'Cajado Sombrio (Visual)', description: 'Empunha energias escuras e misteriosas (aparência).', unlockWave: 0, type: 'staff', spriteKey: 'STAFF_SHADOW_STAFF_SPRITE', paletteKey: 'STAFF_SHADOW_STAFF_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: "Visual apenas.", projectileColor: '#4B0082', projectileGlowColor: '#DA70D6' },
];

export const ORDERED_UNLOCKABLE_COSMETICS: CosmeticItem[] = [...ALL_HATS, ...ALL_STAFFS]
  .filter(item => item.unlockWave > 0) // Exclude items that start unlocked (unlockWave === 0)
  .sort((a, b) => a.unlockWave - b.unlockWave); // Order by original unlockWave to maintain some progression

// Ground Platform Art Dimensions
export const GROUND_PLATFORM_SPRITE_ART_WIDTH = 6;
export const GROUND_PLATFORM_SPRITE_ART_HEIGHT = Math.round(GROUND_PLATFORM_HEIGHT / SPRITE_PIXEL_SIZE); // Approx 17

// Dynamic Platform Art Dimensions
export const DYNAMIC_PLATFORM_SPRITE_ART_WIDTH = 5;
export const DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT = Math.round(DYNAMIC_PLATFORM_HEIGHT / SPRITE_PIXEL_SIZE); // Approx 10