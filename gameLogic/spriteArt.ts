import { PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, ENEMY_ART_WIDTH, ENEMY_ART_HEIGHT, SPLITTER_ART_WIDTH, SPLITTER_ART_HEIGHT, BOSS_ART_WIDTH, BOSS_ART_HEIGHT, PROJECTILE_ART_WIDTH, PROJECTILE_ART_HEIGHT, GROUND_PLATFORM_SPRITE_ART_WIDTH, GROUND_PLATFORM_SPRITE_ART_HEIGHT, DYNAMIC_PLATFORM_SPRITE_ART_WIDTH, DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT, GROUND_PLATFORM_HEIGHT, SPRITE_PIXEL_SIZE, DYNAMIC_PLATFORM_HEIGHT } from "../constants";

// --- PLAYER (Pixel art deprecated for canvas rendering) ---
/*
export const PLAYER_BASE_PALETTE = {
  'S': '#FFDBAC', // Skin
  'R': '#5D3FD3', // Robe (Deep Purple)
  'B': '#FFD700', // Belt/Sash (Gold)
  'H': '#2F1B0C', // Hair (Darker Brown)
  'E': '#FFFFFF', // Eyes (White sclera)
  'P': '#000000', // Pupil (Black)
  'F': '#6D4C41', // Feet/Shoes (Darker Brown)
  'A': '#4A235A', // Robe Shadow/Accent (Darker Purple)
  'L': '#7E57C2', // Robe Highlight (Lighter Purple)
  'C': '#D4AF37', // Belt Buckle (Old Gold)
  'X': 'transparent'
};

export const PLAYER_IDLE_FRAMES = [
  // ... (frames data)
];
export const PLAYER_WALK_FRAMES = [
  // ... (frames data)
];
export const PLAYER_ANIMATIONS = {
    idle: PLAYER_IDLE_FRAMES,
    walking: PLAYER_WALK_FRAMES,
};
*/

// --- HATS (Pixel art deprecated for canvas rendering) ---
/*
const HAT_ART_SCALE_FACTOR_SPRITE = 32 / 11;
export const HAT_WIZARD_PALETTE = { 'P': '#3A0078', 'S': '#F0E68C', 'B': '#2A0050', 'X': 'transparent' };
export const HAT_WIZARD_SPRITE_ART_WIDTH = Math.round(7 * HAT_ART_SCALE_FACTOR_SPRITE * 0.7); 
export const HAT_WIZARD_SPRITE_ART_HEIGHT = Math.round(6 * HAT_ART_SCALE_FACTOR_SPRITE * 0.8);
export const HAT_WIZARD_SPRITE = [ 
  // ... (sprite data)
].map(r => r.slice(0, HAT_WIZARD_SPRITE_ART_WIDTH)).slice(0, HAT_WIZARD_SPRITE_ART_HEIGHT);
// ... Other hat sprites and palettes
*/

// --- STAFFS (Pixel art deprecated for canvas rendering) ---
/*
export const STAFF_WIZARD_STAFF_PALETTE = { 'W': '#8B4513', 'G': '#CD853F', 'C': '#AFEEEE', 'X': 'transparent' };
export const STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH = Math.round(4 * HAT_ART_SCALE_FACTOR_SPRITE * 0.8);
export const STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT = Math.round(9 * HAT_ART_SCALE_FACTOR_SPRITE * 0.9);
export const STAFF_WIZARD_STAFF_SPRITE = [
  // ... (sprite data
].map(r => r.slice(0, STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH)).slice(0, STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT);
// ... Other staff sprites and palettes
*/

// --- COSMETIC COLLECTIONS (Pixel art deprecated for canvas rendering) ---
/*
export const COSMETIC_SPRITES: Record<string, string[]> = {
  // ... (hat and staff sprite keys)
};
export const COSMETIC_PALETTES: Record<string, Record<string, string>> = {
  // ... (hat and staff palette keys)
};
*/


// --- ENEMIES (Pixel art deprecated for canvas rendering) ---
/*
export const MINI_ALIEN_PALETTE = {
  'B': '#6A5ACD', 'W': '#4B0082', 'E': '#FFD700', 'P': '#8B0000', 'T': '#A9A9A9', 'X': 'transparent'
};
export const MINI_ALIEN_SPRITE = [
  "XXXXXWWWWXXXXXXX", "XXXXWWWWWXXXXXXX", "XXXWWBBWWWXXXXXX", "XXWWBBBBWWWXXXXX", "XXWBBBBBBWWXXXXX",
  "XWBBEPPBBBWXXXXX", "XWBBEPPBBBWWXXXX", "XWBBTTTBBBWXXXXX", "XXWBBBBBBWWXXXXX", "XXWWBBBBWWWXXXXX",
  "XXXWWBBWWWXXXXXX", "XXXXWWWWWXXXXXXX", "XXXXXWWWWXXXXXXX", "XXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXX",
].map(r => r.slice(0, ENEMY_ART_WIDTH)).slice(0, ENEMY_ART_HEIGHT);

export const SPLITTER_PALETTE = {
  'C': '#A855F7', 'S': '#FBBF24', 'O': '#7C3AED', 'X': 'transparent'
};
export const SPLITTER_SPRITE = [
  "XXXXXXXXSSSXXXXXXXXXXXX", "XXXXXXSOOOOOSXXXXXX", "XXXXXOOOOOOOOOXXXXX", "XXXXOOOOOOOOOOOXXXX",
  "XXXOOOOCOOOOOOOOOXXX",  "XXSOOOCCCOOOOOOOSXX", "XXOOOOCCCCOOOOOOOXX", "XXOOOCCCCCCOOOOOOXX",
  "XXSOOCCCCCCOOOOOSXX", "XXXOOOCCCCCCOOOOXXX", "XXXXOOCCCCCOOOOXXXX", "XXXXXOOCCCOOOXXXXX",
  "XXXXXXSOOOSXXXXXX",   "XXXXXXXXSXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXXXXXXXXX",
].map(r => r.slice(0, SPLITTER_ART_WIDTH)).slice(0, SPLITTER_ART_HEIGHT);

export const SUPER_ALIEN_PALETTE = {
  'B': '#8B0000', 'A': '#A52A2A', 'H': '#FF8C00', 'E': '#FFFF00', 'P': '#000000', 'W': '#D2691E', 'X': 'transparent'
};
export const SUPER_ALIEN_SPRITE = Array(BOSS_ART_HEIGHT).fill("X".repeat(BOSS_ART_WIDTH)).map((rowStr, r) => {
    let row = Array.from(rowStr);
    if (r > 2 && r < BOSS_ART_HEIGHT - 3) { for(let c = 5; c < BOSS_ART_WIDTH - 5; c++) row[c] = 'B'; }
    if (r > 4 && r < BOSS_ART_HEIGHT - 5) { for(let c = 7; c < BOSS_ART_WIDTH - 7; c+=3) { row[c] = 'A'; if(row[c+1]) row[c+1] = 'A';} }
    if (r >= 2 && r <= 6) { row[Math.floor(BOSS_ART_WIDTH/2 - 5 + r/2)] = 'H'; row[Math.floor(BOSS_ART_WIDTH/2 + 4 - r/2)] = 'H'; }
    if (r >= BOSS_ART_HEIGHT * 0.3 && r <= BOSS_ART_HEIGHT * 0.45) {
        const eyeCenterY = Math.floor(BOSS_ART_HEIGHT * 0.37);
        const eyeLX = Math.floor(BOSS_ART_WIDTH * 0.35); const eyeRX = Math.floor(BOSS_ART_WIDTH * 0.65);
        if (r >= eyeCenterY -1 && r <= eyeCenterY + 1) {
            row[eyeLX] = 'E'; row[eyeRX] = 'E';
            if (r === eyeCenterY) { row[eyeLX-1] = 'E'; row[eyeRX+1] = 'E'; row[eyeLX+1]='P'; row[eyeRX-1]='P';}
        }
    }
    if (r >= BOSS_ART_HEIGHT * 0.4 && r <= BOSS_ART_HEIGHT * 0.7 && (r%5 === 0) ) { for(let c = 1; c < 5; c++) {row[c] = 'W'; row[BOSS_ART_WIDTH - 1 - c] = 'W';} }
    return row.join('');
});
*/

// Reference palettes for canvas drawing - can be used if desired, or colors defined directly in canvasArt.ts
export const MINI_ALIEN_PALETTE_REF = { 'B': '#6A5ACD', 'W': '#4B0082', 'E': '#FFD700', 'P': '#8B0000', 'T': '#A9A9A9' };
export const SPLITTER_PALETTE_REF = { 'C': '#A855F7', 'S': '#FBBF24', 'O': '#7C3AED' };
export const SUPER_ALIEN_PALETTE_REF = { 'B': '#8B0000', 'A': '#A52A2A', 'H': '#FF8C00', 'E': '#FFFF00', 'P': '#000000', 'W': '#D2691E' };


// --- PROJECTILES (Pixel art deprecated for canvas rendering) ---
/*
export const FIRE_PROJECTILE_PALETTE = { 'C': '#FFD700', 'T': '#FFA500', 'B': '#FF8C00', 'X': 'transparent' };
export const FIRE_PROJECTILE_SPRITE = [
  "XXXCXXX", "XXCTCXX", "XCTBTCX", "XCBBCX", "XCBBCX", "XCTBTCX", "XXCTCXX", "XXXCXXX", "XXXXXXX"
].map(r => r.slice(0, PROJECTILE_ART_WIDTH)).slice(0, PROJECTILE_ART_HEIGHT);
*/

// --- PLATFORMS (Pixel art deprecated for canvas rendering) ---
/*
export const GROUND_PLATFORM_PALETTE = { 'D': '#696969', 'M': '#808080', 'L': '#A9A9A9', 'G': '#228B22', 'S': '#CD853F', 'X': 'transparent', 'R': '#556B2F' };
export const GROUND_PLATFORM_SPRITE = Array(GROUND_PLATFORM_SPRITE_ART_HEIGHT).fill("").map((_, r) => {
    let row = "";
    if (r === 0) return "LGLGLG"; if (r === 1) return "GRGRGR";
    if (r >= 2 && r <= 4) { for (let c = 0; c < GROUND_PLATFORM_SPRITE_ART_WIDTH; c++) { row += (c % 2 === r % 2) ? 'S' : 'X'; } return row; }
    for (let c = 0; c < GROUND_PLATFORM_SPRITE_ART_WIDTH; c++) {
        if (r > GROUND_PLATFORM_SPRITE_ART_HEIGHT - 3 && Math.random() < 0.2) row += 'M';
        else if (r > 5 && c % 3 === 0 && r % 2 ===0 && Math.random() < 0.3) row += 'L';
        else row += (Math.random() < 0.7) ? 'D' : 'M';
    }
    return row;
}).slice(0, GROUND_PLATFORM_SPRITE_ART_HEIGHT);


export const DYNAMIC_PLATFORM_PALETTE = { 'B': '#8A2BE2', 'E': '#DA70D6', 'D': '#4B0082', 'C':'#BA55D3', 'F':'#E6E6FA', 'X': 'transparent' };
export const DYNAMIC_PLATFORM_SPRITE = Array(DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT).fill("").map((_, r) => {
    if (r === 0 || r === DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT -1) return "XCCCX";
    if (r === 1 || r === DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT -2) return "CEEEC";
    if (r === 2 || r === DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT -3) return "CFEEC";
    if (r === 3 || r === DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT -4) return "DBBBD";
    return "DCBCD";
}).slice(0, DYNAMIC_PLATFORM_SPRITE_ART_HEIGHT);
*/
