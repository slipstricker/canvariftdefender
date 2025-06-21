
// gameLogic/shopLogic.ts

import { HatItem, StaffItem, LeveledSkill, Player } from '../types';
import { 
    PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, 
    PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_DEFENSE,
    SKILL_DASH_DURATION, SKILL_DASH_SPEED, SKILL_DASH_INVINCIBILITY_DURATION,
    SKILL_ID_DOUBLE_JUMP, SKILL_ID_DASH, SKILL_ID_XP_BOOST, SKILL_ID_COIN_MAGNET
} from '../constants';

/*
Price Guidelines (editable at top for convenience):
Hats:
- Capacete (Helmet): 50 (Original: 100)
- Chapéu Incomum (Uncommon Hat): 60 (Original: 120)
- Chapéu do Desafiante (Challenger Hat): 90 (Original: 180)
- Fedora Misteriosa (Mysterious Fedora): 75 (Original: 150)

Staffs:
- Cajado de Esmeralda (Emerald Staff): 60 (Original: 120)
- Tridente Aquático (Aquatic Trident): 80 (Original: 160)
- Cajado Explosivo (Explosive Staff): 90 (Original: 180)
- Cajado Trovejante (Thunder Staff): 125 (Original: 250)
- Ponta Congelada (Frozen Tip): 100 (Original: 200)
- Cajado Arco-Íris (Rainbow Staff): 150 (Original: 300)

Permanent Skills (Leveled):
- Pulo Duplo (Double Jump):
  - Level 1: 20
- Dash Impetuoso (Dash):
  - Level 1: 10 (30s CD)
  - Level 2: 15 (25s CD)
  - Level 3: 20 (20s CD)
  - Level 4: 25 (15s CD)
  - Level 5: 30 (10s CD)
  - Level 6: 35 (5s CD)
- Impulso de EXP (XP Boost):
  - Level 1: 20 (+10% XP)
  - Price: +5 per level (up to L20 for +200% XP)
- Imã de Moedas (Coin Magnet):
  - Level 1: 10 (+2% Drop)
  - Prices: L1=10, L2=15, L3=20, L4=25, L5=30, L6=35, L7=40, L8=45, L9=50, L10=50 (+20% Drop)
*/

// --- DEFAULT ITEMS ---
export const DEFAULT_HAT_ID = 'hat_basic_cap';
export const DEFAULT_STAFF_ID = 'staff_wizard';

// --- HAT DEFINITIONS ---
const HAT_ART_SCALE_FACTOR = 32 / 11; 

const HAT_HELMET_SPRITE_ART_WIDTH_CONST = Math.round(9 * HAT_ART_SCALE_FACTOR * 0.6);
const HAT_HELMET_SPRITE_ART_HEIGHT_CONST = Math.round(5 * HAT_ART_SCALE_FACTOR * 0.8);
const HAT_BASIC_CAP_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_BASIC_CAP_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_UNCOMMON_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_UNCOMMON_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_CHALLENGER_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_CHALLENGER_ART_HEIGHT_CONST = Math.round(2*HAT_ART_SCALE_FACTOR*0.8);
const HAT_FEDORA_ART_WIDTH_CONST = Math.round(5*HAT_ART_SCALE_FACTOR*0.6);
const HAT_FEDORA_ART_HEIGHT_CONST = Math.round(3*HAT_ART_SCALE_FACTOR*0.8);

const calculateHatOffsetX = (hatArtWidth: number) => Math.floor((PLAYER_ART_WIDTH - hatArtWidth) / 2);
const calculateHatOffsetY = (hatArtHeight: number) => -(hatArtHeight) + 2; 

export const ALL_HATS_SHOP: HatItem[] = [
  { id: DEFAULT_HAT_ID, name: 'Boné Vermelho', description: 'Um boné esportivo vermelho.', price: 0, type: 'hat', spriteKey: 'HAT_BASIC_CAP_SPRITE', paletteKey: 'HAT_BASIC_CAP_PALETTE', artWidth: HAT_BASIC_CAP_ART_WIDTH_CONST, artHeight: HAT_BASIC_CAP_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_BASIC_CAP_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_BASIC_CAP_ART_HEIGHT_CONST), effectDescription: 'Visual apenas.' },
  { id: 'hat_helmet', name: 'Capacete Cósmico', description: 'Proteção robusta contra detritos espaciais.', price: 50, type: 'hat', spriteKey: 'HAT_HELMET_SPRITE', paletteKey: 'HAT_HELMET_PALETTE', artWidth: HAT_HELMET_SPRITE_ART_WIDTH_CONST, artHeight: HAT_HELMET_SPRITE_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_HELMET_SPRITE_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_HELMET_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: '+10% Defesa, -15% Vel. Movimento.' },
  { id: 'hat_uncommon', name: 'Chapéu da Sorte Estelar', description: 'Atrai apenas as melhores energias cósmicas.', price: 60, type: 'hat', spriteKey: 'HAT_UNCOMMON_SPRITE', paletteKey: 'HAT_UNCOMMON_PALETTE', artWidth: HAT_UNCOMMON_ART_WIDTH_CONST, artHeight: HAT_UNCOMMON_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_UNCOMMON_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_UNCOMMON_ART_HEIGHT_CONST), effectDescription: 'Apenas melhorias Incomuns ou Raras são oferecidas.' },
  { id: 'hat_challenger', name: 'Elmo do Desbravador', description: 'Para os audazes que enfrentam o desconhecido!', price: 90, type: 'hat', spriteKey: 'HAT_CHALLENGER_SPRITE', paletteKey: 'HAT_CHALLENGER_PALETTE', artWidth: HAT_CHALLENGER_ART_WIDTH_CONST, artHeight: HAT_CHALLENGER_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_CHALLENGER_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_CHALLENGER_ART_HEIGHT_CONST), effectDescription: '20% chance de escolher 2 melhorias. Ondas têm o dobro de inimigos.' },
  { id: 'hat_fedora', name: 'Fedora do Viajante Temporal', description: 'Para aqueles que gostam de uma segunda chance... no espaço-tempo.', price: 75, type: 'hat', spriteKey: 'HAT_FEDORA_SPRITE', paletteKey: 'HAT_FEDORA_PALETTE', artWidth: HAT_FEDORA_ART_WIDTH_CONST, artHeight: HAT_FEDORA_ART_HEIGHT_CONST, offsetX: calculateHatOffsetX(HAT_FEDORA_ART_WIDTH_CONST), offsetY: calculateHatOffsetY(HAT_FEDORA_ART_HEIGHT_CONST)-1, effectDescription: 'Uma rerrolagem gratuita de melhorias por nível. Não entra no placar.' },
];

// --- STAFF DEFINITIONS ---
const PLAYER_HAND_ART_X = 17; 
const PLAYER_HAND_ART_Y = 20; 

const STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST = Math.round(4 * HAT_ART_SCALE_FACTOR * 0.8); 
const STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST = Math.round(9 * HAT_ART_SCALE_FACTOR * 0.9);

const calculateStaffOffsetX = (staffArtWidth: number) => PLAYER_HAND_ART_X - Math.floor(staffArtWidth / 2);
const calculateStaffOffsetY = (staffArtHeight: number) => PLAYER_HAND_ART_Y - Math.floor(staffArtHeight * 0.75);

export const ALL_STAFFS_SHOP: StaffItem[] = [
  { id: DEFAULT_STAFF_ID, name: 'Cajado de Aprendiz Cósmico', description: 'Um cajado básico para iniciar sua jornada.', price: 0, type: 'staff', spriteKey: 'STAFF_WIZARD_STAFF_SPRITE', paletteKey: 'STAFF_WIZARD_STAFF_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Dispara um projétil em linha reta.', projectileColor: '#8E44AD', projectileGlowColor: '#E0FFFF' },
  { id: 'staff_emerald', name: 'Cajado de Esmeralda Nebulosa', description: 'Magia teleguiada e veloz como um cometa.', price: 60, type: 'staff', spriteKey: 'STAFF_EMERALD_SPRITE', paletteKey: 'STAFF_EMERALD_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis teleguiados, +20% Vel. Ataque, -50% Dano.', projectileColor: '#2ECC71', projectileGlowColor: '#A9DFBF' },
  { id: 'staff_trident', name: 'Tridente das Marés Cósmicas', description: 'Dispara uma saraivada de energia aquática.', price: 80, type: 'staff', spriteKey: 'STAFF_TRIDENT_SPRITE', paletteKey: 'STAFF_TRIDENT_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: 'Dispara 3 projéteis em ângulo.', projectileColor: '#3498DB', projectileGlowColor: '#AED6F1' },
  { id: 'staff_boom', name: 'Cajado Supernova', description: 'Faz um grande estrondo cósmico!', price: 90, type: 'staff', spriteKey: 'STAFF_BOOM_SPRITE', paletteKey: 'STAFF_BOOM_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis explodem ao atingir, causando dano em área.', projectileColor: '#F39C12', projectileGlowColor: '#FAD7A0' },
  { id: 'staff_thunder', name: 'Cajado Tempestade Galáctica', description: 'Invoca a fúria dos céus estelares.', price: 125, type: 'staff', spriteKey: 'STAFF_THUNDER_SPRITE', paletteKey: 'STAFF_THUNDER_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Cada disparo também invoca um raio.', projectileColor: '#F1C40F', projectileGlowColor: '#FDEBD0' },
  { id: 'staff_frozen_tip', name: 'Ponta Congelante de Cometa', description: 'Atravessa as defesas inimigas como gelo espacial.', price: 100, type: 'staff', spriteKey: 'STAFF_FROZEN_TIP_SPRITE', paletteKey: 'STAFF_FROZEN_TIP_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis perfuram 3 inimigos.', projectileColor: '#AED6F1', projectileGlowColor: '#EBF5FB' },
  { id: 'staff_rainbow', name: 'Cajado Prisma Cósmico', description: 'Caos e cor de nebulosas distantes!', price: 150, type: 'staff', spriteKey: 'STAFF_RAINBOW_SPRITE', paletteKey: 'STAFF_RAINBOW_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: 'Dispara projéteis com efeitos aleatórios de outros cajados.', projectileColor: '#FF69B4' }, // Rainbow color is a placeholder, actual color varies
];

// --- PERMANENT SKILLS (Leveled) ---
export const PERMANENT_SKILLS_SHOP: LeveledSkill[] = [
  {
    id: SKILL_ID_DOUBLE_JUMP,
    name: 'Pulo Duplo Astral',
    icon: '🚀',
    baseDescription: 'Permite pular uma segunda vez no ar, como se flutuasse no vácuo.',
    type: 'permanent_skill',
    levels: [
      { level: 1, price: 20, effectDescription: 'Habilita Pulo Duplo', applyEffect: (player: Player) => { player.canDoubleJump = true; } },
    ],
  },
  {
    id: SKILL_ID_DASH,
    name: 'Dash Impetuoso',
    icon: '💫',
    baseDescription: 'Avanço rápido (Shift). Concede 1s de invencibilidade ao ativar.',
    type: 'permanent_skill',
    levels: [
      { level: 1, price: 10, effectDescription: 'Cooldown: 30s', dashCooldown: 30, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 30; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION; } },
      { level: 2, price: 15, effectDescription: 'Cooldown: 25s', dashCooldown: 25, applyEffect: (player: Player) => { player.dashCooldownTime = 25; } },
      { level: 3, price: 20, effectDescription: 'Cooldown: 20s', dashCooldown: 20, applyEffect: (player: Player) => { player.dashCooldownTime = 20; } },
      { level: 4, price: 25, effectDescription: 'Cooldown: 15s', dashCooldown: 15, applyEffect: (player: Player) => { player.dashCooldownTime = 15; } },
      { level: 5, price: 30, effectDescription: 'Cooldown: 10s', dashCooldown: 10, applyEffect: (player: Player) => { player.dashCooldownTime = 10; } },
      { level: 6, price: 35, effectDescription: 'Cooldown: 5s', dashCooldown: 5, applyEffect: (player: Player) => { player.dashCooldownTime = 5; } },
    ],
  },
  {
    id: SKILL_ID_XP_BOOST,
    name: 'Impulso de EXP Cósmico',
    icon: '🌟',
    baseDescription: 'Aumenta permanentemente a quantidade de Experiência (EXP) ganha.',
    type: 'permanent_skill',
    levels: Array.from({ length: 20 }, (_, i) => ({
      level: i + 1,
      price: 20 + i * 5,
      xpBonus: (i + 1) * 0.1, // +10% per level
      effectDescription: `Bônus de EXP: +${(i + 1) * 10}%`,
      applyEffect: (player: Player) => { player.xpBonus = 1 + (i + 1) * 0.1; },
    })),
  },
  {
    id: SKILL_ID_COIN_MAGNET,
    name: 'Imã de Moedas Galáctico',
    icon: '💰',
    baseDescription: 'Aumenta permanentemente a chance de inimigos derrubarem moedas.',
    type: 'permanent_skill',
    levels: Array.from({ length: 10 }, (_, i) => {
      let price = 10;
      if (i === 0) price = 10;
      else if (i < 8) price = 10 + (i * 5); // 10, 15, 20, 25, 30, 35, 40, 45
      else price = 50; // L9=50, L10=50
      
      return {
        level: i + 1,
        price: price,
        coinDropBonus: (i + 1) * 0.02, // +2% per level
        effectDescription: `Chance de Drop de Moeda: +${(i + 1) * 2}%`,
        applyEffect: (player: Player) => { player.coinDropBonus = (i + 1) * 0.02; },
      };
    }),
  },
];


export const applyHatEffect = (player: Player, hatId: string | null): Player => {
    let tempPlayer = {...player};
    // Reset effects that might be exclusive to hats or need resetting
    tempPlayer.movementSpeed = tempPlayer.baseMovementSpeed;
    tempPlayer.defense = tempPlayer.baseDefense;
    tempPlayer.challengerHatMoreEnemies = false;
    tempPlayer.canFreeRerollUpgrades = false;
    // Note: 'hat_uncommon' effect (only uncommon upgrades) is handled directly in upgrade choice logic

    const hat = ALL_HATS_SHOP.find(h => h.id === hatId);
    if (!hat || hat.effectDescription === 'Visual apenas.') {
      return tempPlayer;
    }

    switch(hat.id) {
        case 'hat_helmet':
            tempPlayer.defense = Math.min(1, (tempPlayer.baseDefense || PLAYER_INITIAL_DEFENSE) + 0.10);
            tempPlayer.movementSpeed = (tempPlayer.baseMovementSpeed || PLAYER_MOVEMENT_SPEED) * 0.85;
            break;
        case 'hat_challenger':
            tempPlayer.challengerHatMoreEnemies = true;
            break;
        case 'hat_fedora':
            tempPlayer.canFreeRerollUpgrades = true;
            break;
    }
    return tempPlayer;
};

export const applyStaffEffectToPlayerBase = (player: Player, staffId: string | null): Player => {
  let tempPlayer = {...player};
   // Reset staff-specific base stat modifiers before applying new ones
  tempPlayer.attackSpeed = tempPlayer.baseAttackSpeed;
  tempPlayer.projectileDamage = tempPlayer.baseProjectileDamage;
  tempPlayer.projectilesAreHoming = false; 
  tempPlayer.projectileHomingStrength = 0;
  tempPlayer.projectilePierceCount = 0; 

  const staff = ALL_STAFFS_SHOP.find(s => s.id === staffId);
   if (!staff || staff.effectDescription === 'Dispara um projétil em linha reta.') { // Default staff effect
    return tempPlayer;
  }
  
  // Specific staff effects that modify player base stats when equipped
  switch(staff.id) {
    case 'staff_emerald': // Projéteis teleguiados, +20% Vel. Ataque, -50% Dano.
      tempPlayer.attackSpeed = (tempPlayer.baseAttackSpeed) * 1.20;
      // tempPlayer.projectileDamage = (tempPlayer.baseProjectileDamage) * 0.50; // Damage modification is handled per-projectile
      tempPlayer.projectilesAreHoming = true; // Player flag for general homing if no staff specific homing is defined
      tempPlayer.projectileHomingStrength = 0.1; // Default homing strength for this staff
      break;
    case 'staff_frozen_tip': // Projéteis perfuram 3 inimigos.
      tempPlayer.projectilePierceCount = 3;
      break;
    // Other staves like trident, boom, thunder have their effects applied per-shot in projectileLogic
  }
  return tempPlayer;
};
