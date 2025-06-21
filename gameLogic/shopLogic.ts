// gameLogic/shopLogic.ts

import { HatItem, StaffItem, LeveledSkill, Player } from '../types';
import { 
    PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, 
    PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_DEFENSE, PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE, PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE, PLAYER_INITIAL_ATTACK_SPEED, PLAYER_INITIAL_CRIT_CHANCE,
    SKILL_DASH_DURATION, SKILL_DASH_SPEED, SKILL_DASH_INVINCIBILITY_DURATION,
    SKILL_ID_DOUBLE_JUMP, SKILL_ID_DASH, SKILL_ID_XP_BOOST, SKILL_ID_COIN_MAGNET
} from '../constants';


// --- DEFAULT ITEMS ---
export const DEFAULT_HAT_ID = 'hat_basic_cap';
export const DEFAULT_STAFF_ID = 'staff_wizard';

// --- HAT DEFINITIONS ---
const HAT_ART_SCALE_FACTOR = 32 / 11; 

// Placeholder art dimensions (not strictly used by current canvas drawing logic for hats, but kept for structure)
const GENERIC_HAT_ART_WIDTH_CONST = Math.round(7 * HAT_ART_SCALE_FACTOR * 0.7); 
const GENERIC_HAT_ART_HEIGHT_CONST = Math.round(6 * HAT_ART_SCALE_FACTOR * 0.8);

const calculateHatOffsetX = (hatArtWidth: number) => Math.floor((PLAYER_ART_WIDTH - hatArtWidth) / 2);
const calculateHatOffsetY = (hatArtHeight: number) => -(hatArtHeight) + 2; 

export const ALL_HATS_SHOP: HatItem[] = [
  { 
    id: DEFAULT_HAT_ID, // 'hat_basic_cap'
    name: 'Capuz do Viajante Estelar', 
    description: 'Um capuz elegante para o explorador do cosmos.', 
    price: 0, 
    type: 'hat', 
    spriteKey: 'UNUSED_SPRITE', 
    paletteKey: 'UNUSED_PALETTE', 
    artWidth: GENERIC_HAT_ART_WIDTH_CONST, 
    artHeight: GENERIC_HAT_ART_HEIGHT_CONST, 
    offsetX: calculateHatOffsetX(GENERIC_HAT_ART_WIDTH_CONST), 
    offsetY: calculateHatOffsetY(GENERIC_HAT_ART_HEIGHT_CONST), 
    effectDescription: 'Visual apenas.' 
  },
  { 
    id: 'hat_helmet', 
    name: 'Capacete de Tecno-Alienígena', 
    description: 'Proteção avançada com um toque extraterrestre.', 
    price: 50, 
    type: 'hat', 
    spriteKey: 'UNUSED_SPRITE', 
    paletteKey: 'UNUSED_PALETTE', 
    artWidth: GENERIC_HAT_ART_WIDTH_CONST, 
    artHeight: GENERIC_HAT_ART_HEIGHT_CONST, 
    offsetX: calculateHatOffsetX(GENERIC_HAT_ART_WIDTH_CONST), 
    offsetY: calculateHatOffsetY(GENERIC_HAT_ART_HEIGHT_CONST)-2, 
    effectDescription: '+10% Defesa, -10% Vel. Movimento.' // Adjusted effect slightly
  },
  { 
    id: 'hat_wizard', 
    name: 'Chapéu de Mago Cósmico', 
    description: 'Imbuido com o poder das estrelas distantes.', 
    price: 70, 
    type: 'hat', 
    spriteKey: 'UNUSED_SPRITE', 
    paletteKey: 'UNUSED_PALETTE', 
    artWidth: GENERIC_HAT_ART_WIDTH_CONST, 
    artHeight: GENERIC_HAT_ART_HEIGHT_CONST * 1.2, // Taller hat
    offsetX: calculateHatOffsetX(GENERIC_HAT_ART_WIDTH_CONST), 
    offsetY: calculateHatOffsetY(GENERIC_HAT_ART_HEIGHT_CONST * 1.2), 
    effectDescription: 'Projéteis são ligeiramente maiores e causam +5% de dano (baseado no dano base).' 
  },
  { 
    id: 'hat_propeller_beanie', // Formerly 'hat_challenger' or new
    name: 'Gorro Nebulosa Viva', 
    description: 'Um fragmento de uma nebulosa, pulsando com energia vital.', 
    price: 80, 
    type: 'hat', 
    spriteKey: 'UNUSED_SPRITE', 
    paletteKey: 'UNUSED_PALETTE', 
    artWidth: GENERIC_HAT_ART_WIDTH_CONST, 
    artHeight: GENERIC_HAT_ART_HEIGHT_CONST, 
    offsetX: calculateHatOffsetX(GENERIC_HAT_ART_WIDTH_CONST), 
    offsetY: calculateHatOffsetY(GENERIC_HAT_ART_HEIGHT_CONST), 
    effectDescription: '+10% de experiência ganha de todas as fontes.' 
  },
  { 
    id: 'hat_crown', // Formerly 'hat_fedora' or new
    name: 'Coroa da Órbita Celestial', 
    description: 'Pequenos corpos celestes orbitam esta majestosa coroa.', 
    price: 100, 
    type: 'hat', 
    spriteKey: 'UNUSED_SPRITE', 
    paletteKey: 'UNUSED_PALETTE', 
    artWidth: GENERIC_HAT_ART_WIDTH_CONST, 
    artHeight: GENERIC_HAT_ART_HEIGHT_CONST * 0.8, // Shorter crown
    offsetX: calculateHatOffsetX(GENERIC_HAT_ART_WIDTH_CONST), 
    offsetY: calculateHatOffsetY(GENERIC_HAT_ART_HEIGHT_CONST*0.8) + 5, // Adjust Y for crown style
    effectDescription: 'Inimigos têm 5% de chance de dropar um orbe de cura pequeno.' 
  },
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
  { id: 'staff_emerald', name: 'Cajado de Esmeralda Nebulosa', description: 'Magia teleguiada e veloz como um cometa.', price: 60, type: 'staff', spriteKey: 'STAFF_EMERALD_SPRITE', paletteKey: 'STAFF_EMERALD_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis teleguiados, +20% Vel. Ataque, -50% Dano (base).', projectileColor: '#2ECC71', projectileGlowColor: '#A9DFBF' },
  { id: 'staff_trident', name: 'Tridente das Marés Cósmicas', description: 'Dispara uma saraivada de energia aquática.', price: 80, type: 'staff', spriteKey: 'STAFF_TRIDENT_SPRITE', paletteKey: 'STAFF_TRIDENT_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST)-2, effectDescription: 'Dispara 3 projéteis em ângulo.', projectileColor: '#3498DB', projectileGlowColor: '#AED6F1' },
  { id: 'staff_boom', name: 'Cajado Supernova', description: 'Faz um grande estrondo cósmico!', price: 90, type: 'staff', spriteKey: 'STAFF_BOOM_SPRITE', paletteKey: 'STAFF_BOOM_PALETTE', artWidth: STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST, artHeight: STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST, offsetX: calculateStaffOffsetX(STAFF_WIZARD_STAFF_SPRITE_ART_WIDTH_CONST), offsetY: calculateStaffOffsetY(STAFF_WIZARD_STAFF_SPRITE_ART_HEIGHT_CONST), effectDescription: 'Projéteis têm 30% de chance de explodir ao atingir um inimigo, causando dano em área em até 4 alvos.', projectileColor: '#F39C12', projectileGlowColor: '#FAD7A0' },
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
      { level: 2, price: 15, effectDescription: 'Cooldown: 25s', dashCooldown: 25, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 25; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION;} },
      { level: 3, price: 20, effectDescription: 'Cooldown: 20s', dashCooldown: 20, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 20; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION;} },
      { level: 4, price: 25, effectDescription: 'Cooldown: 15s', dashCooldown: 15, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 15; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION;} },
      { level: 5, price: 30, effectDescription: 'Cooldown: 10s', dashCooldown: 10, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 10; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION;} },
      { level: 6, price: 35, effectDescription: 'Cooldown: 5s', dashCooldown: 5, applyEffect: (player: Player) => { player.hasDashSkill = true; player.dashCooldownTime = 5; player.dashDurationTime = SKILL_DASH_DURATION; player.dashSpeedValue = SKILL_DASH_SPEED; player.dashInvincibilityDuration = SKILL_DASH_INVINCIBILITY_DURATION;} },
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
    tempPlayer.movementSpeed = tempPlayer.baseMovementSpeed || PLAYER_MOVEMENT_SPEED;
    tempPlayer.defense = tempPlayer.baseDefense || PLAYER_INITIAL_DEFENSE;
    // Keep current min/max projectile damage, don't reset to base here. Specific hats will modify it.
    // tempPlayer.minProjectileDamage = tempPlayer.baseMinProjectileDamage || PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE;
    // tempPlayer.maxProjectileDamage = tempPlayer.baseMaxProjectileDamage || PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE;
    
    // Reset XP bonus to what player might have from permanent skills, then let hat add to it
    const existingXpSkillLevel = tempPlayer.purchasedPermanentSkills[SKILL_ID_XP_BOOST]?.level || 0;
    if (existingXpSkillLevel > 0) {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s=>s.id === SKILL_ID_XP_BOOST);
        tempPlayer.xpBonus = 1 + (skillDef?.levels[existingXpSkillLevel-1]?.xpBonus || 0);
    } else {
        tempPlayer.xpBonus = 1;
    }


    tempPlayer.challengerHatMoreEnemies = false;
    tempPlayer.canFreeRerollUpgrades = false;
    
    const hat = ALL_HATS_SHOP.find(h => h.id === hatId);
    if (!hat || hat.effectDescription === 'Visual apenas.') {
      return tempPlayer;
    }

    switch(hat.id) {
        case 'hat_helmet': 
            tempPlayer.defense = Math.min(1, (tempPlayer.baseDefense || PLAYER_INITIAL_DEFENSE) + 0.10);
            tempPlayer.movementSpeed = (tempPlayer.baseMovementSpeed || PLAYER_MOVEMENT_SPEED) * 0.90;
            break;
        case 'hat_wizard': 
            const wizardMinBonus = (tempPlayer.baseMinProjectileDamage || PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE) * 0.05;
            const wizardMaxBonus = (tempPlayer.baseMaxProjectileDamage || PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE) * 0.05;
            tempPlayer.minProjectileDamage += wizardMinBonus;
            tempPlayer.maxProjectileDamage += wizardMaxBonus;
            break;
        case 'hat_propeller_beanie': 
             tempPlayer.xpBonus += 0.10; // Additive to any existing skill bonus
            break;
        case 'hat_crown': 
            break;
    }
    return tempPlayer;
};

export const applyStaffEffectToPlayerBase = (player: Player, staffId: string | null): Player => {
  let tempPlayer = {...player};
  tempPlayer.attackSpeed = tempPlayer.baseAttackSpeed || PLAYER_INITIAL_ATTACK_SPEED;
  tempPlayer.projectilesAreHoming = false; 
  tempPlayer.projectileHomingStrength = 0;
  tempPlayer.projectilePierceCount = 0; 

  const staff = ALL_STAFFS_SHOP.find(s => s.id === staffId);
   if (!staff || staff.effectDescription === 'Dispara um projétil em linha reta.') { 
    return tempPlayer;
  }
  
  switch(staff.id) {
    case 'staff_emerald': 
      tempPlayer.attackSpeed = (tempPlayer.baseAttackSpeed || PLAYER_INITIAL_ATTACK_SPEED) * 1.20;
      // Damage modification and homing for Emerald staff is handled per-projectile in createPlayerProjectiles
      break;
    case 'staff_frozen_tip': 
      // Pierce count is handled per-projectile in createPlayerProjectiles
      break;
  }
  return tempPlayer;
};