
// gameLogic/gameSetup.ts
import {
    Player, Enemy, Projectile, Particle, Platform, Upgrade, GameState, ActiveLightningBolt,
    AdminConfig, HatItem, StaffItem, LeveledSkill, CoinDrop, WaveStatus, FloatingText, CenterScreenMessage, Star, Nebula, ParsedNickname
} from '../types';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_INITIAL_HP, PLAYER_WIDTH, PLAYER_HEIGHT,
    XP_PER_LEVEL_BASE,
    GROUND_PLATFORM_HEIGHT,
    PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_ATTACK_SPEED, PLAYER_INITIAL_CRIT_CHANCE, PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE, PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE, PLAYER_INITIAL_DEFENSE,
    SKILL_DASH_DURATION, SKILL_DASH_SPEED, SKILL_DASH_INVINCIBILITY_DURATION,
    INITIAL_WAVE_CONFIG, ADMIN_START_WAVE, DYNAMIC_PLATFORM_HEIGHT
} from '../constants';
import { ALL_HATS_SHOP, ALL_STAFFS_SHOP, PERMANENT_SKILLS_SHOP, DEFAULT_HAT_ID, DEFAULT_STAFF_ID, applyHatEffect, applyStaffEffectToPlayerBase } from './shopLogic';
import { PLATFORMS as InitialStaticPlatformsConfig, repositionAndResizeAllDynamicPlatforms } from './platformLogic';
import { UPGRADES as InitialUpgradesConfig } from './upgradeLogic';
import { parseCheatNickname, applyCheatsToPlayer } from './cheatLogic'; // Import cheat logic

export function getDefaultPlayerState(nickname: string = "Jogador Estelar", selectedHatId: string | null = null, selectedStaffId: string | null = null): Player {
  return {
    nickname: nickname,
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - GROUND_PLATFORM_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    hp: PLAYER_INITIAL_HP,
    maxHp: PLAYER_INITIAL_HP,
    exp: 0,
    level: 1,
    xpToNextLevel: XP_PER_LEVEL_BASE,
    baseMovementSpeed: PLAYER_MOVEMENT_SPEED,
    movementSpeed: PLAYER_MOVEMENT_SPEED,
    jumpHeight: 820,
    baseAttackSpeed: PLAYER_INITIAL_ATTACK_SPEED,
    attackSpeed: PLAYER_INITIAL_ATTACK_SPEED,
    baseMinProjectileDamage: PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE,
    baseMaxProjectileDamage: PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE,
    minProjectileDamage: PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE,
    maxProjectileDamage: PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE,
    critChance: PLAYER_INITIAL_CRIT_CHANCE,
    critMultiplier: 1.5,
    baseDefense: PLAYER_INITIAL_DEFENSE,
    defense: PLAYER_INITIAL_DEFENSE,
    isJumping: false,
    isInvincible: false,
    lastHitTime: 0,
    invincibilityDuration: 500, // Default hit invincibility (was 1000, changed to 500 in App.tsx)
    shootCooldown: 0,
    lastShotTime: 0,
    upgrades: [],
    lifeSteal: 0,
    revives: 0,
    appraisalChoices: 3,
    onGround: true,
    canDoubleJump: false,
    hasJumpedOnce: false,
    thunderboltEffectiveBolts: 0,
    isAdmin: false,
    currentFrame: 0,
    animationTimer: 0,
    animationState: 'idle',
    facingDirection: 'right',
    appliesBurn: undefined,
    appliesChill: undefined,
    projectilePierceCount: 0,
    projectilesAreHoming: false,
    projectileHomingStrength: 0,
    shieldMaxHp: undefined,
    shieldCurrentHp: undefined,
    shieldRechargeDelay: undefined,
    shieldRechargeRate: undefined,
    shieldLastDamagedTime: 0,
    selectedHatId: selectedHatId || DEFAULT_HAT_ID,
    selectedStaffId: selectedStaffId || DEFAULT_STAFF_ID,
    coins: 0, 
    purchasedPermanentSkills: {},
    xpBonus: 1,
    coinDropBonus: 0,
    challengerHatMoreEnemies: false,
    canFreeRerollUpgrades: false,
    usedFreeRerollThisLevelUp: false,
    draw: () => {}, // Placeholder, actual drawing handled by renderers
    justDoubleJumped: false,
    justLanded: false,
    justDashed: false,
    hasDashSkill: false,
    dashCooldownTime: 30,
    lastDashTimestamp: 0,
    isDashing: false,
    dashDurationTime: SKILL_DASH_DURATION,
    dashTimer: 0,
    dashSpeedValue: SKILL_DASH_SPEED,
    dashInvincibilityDuration: SKILL_DASH_INVINCIBILITY_DURATION,
  };
}

export function applyPermanentSkillEffectsToPlayer(p: Player, purchasedSkills: Record<string, { level: number }>): Player {
    let tempPlayer = { ...p };
    // Reset skill-based properties before re-applying, ensure base values are from player for consistency
    tempPlayer.canDoubleJump = false;
    tempPlayer.hasDashSkill = false;
    tempPlayer.dashCooldownTime = 30; // Default dash cooldown if skill is re-applied
    tempPlayer.xpBonus = 1; // Base XP bonus
    tempPlayer.coinDropBonus = 0; // Base coin drop bonus

    Object.entries(purchasedSkills).forEach(([skillId, data]) => {
        const skillDef = PERMANENT_SKILLS_SHOP.find(s => s.id === skillId);
        if (skillDef && data.level > 0) {
            const levelDef = skillDef.levels[data.level - 1]; // Array is 0-indexed
            if (levelDef) {
                levelDef.applyEffect(tempPlayer);
            }
        }
    });
    return tempPlayer;
}

export interface InitialGameState {
    player: Player;
    enemies: Enemy[];
    playerProjectiles: Projectile[];
    enemyProjectiles: Projectile[];
    particles: Particle[];
    activeLightningBolts: ActiveLightningBolt[];
    floatingTexts: FloatingText[];
    coinDrops: CoinDrop[];
    platforms: Platform[];
    availableUpgrades: Upgrade[];
    currentOfferedUpgradesForSelection: Upgrade[];
    currentPicksAllowedForSelection: number;
    gameTime: number;
    currentWave: number;
    waveStatus: WaveStatus;
    enemiesToSpawnThisWave: number;
    enemiesSpawnedThisWaveCount: number;
    currentWaveConfig: typeof INITIAL_WAVE_CONFIG;
    lastClearedWave: number;
    centerScreenMessage: CenterScreenMessage | null;
    stars: Star[];
    nebulae: Nebula[];
    // thunderboltIntervalId is managed within App.tsx via gameContextForUpgrades and refs
}

export function initializeNewGameState(
    fullNickname: string, // Now expects the full nickname string which might contain cheats
    adminConfig: AdminConfig | undefined,
    selectedHatId: string | null,
    selectedStaffId: string | null,
    currentPlayerCoins: number, // Total coins the player has, not session coins
    purchasedPermanentSkills: Record<string, { level: number }>,
    gameContextForUpgrades: any // Type this more strictly if possible
): InitialGameState {
    const parsedNicknameResult: ParsedNickname = parseCheatNickname(fullNickname);
    let newPlayerState = getDefaultPlayerState(parsedNicknameResult.baseNickname, selectedHatId, selectedStaffId);

    // Apply permanent skills first
    newPlayerState = applyPermanentSkillEffectsToPlayer(newPlayerState, purchasedPermanentSkills);
    
    // Apply hat and staff effects (these might override or stack with permanent skill effects)
    newPlayerState = applyHatEffect(newPlayerState, selectedHatId);
    newPlayerState = applyStaffEffectToPlayerBase(newPlayerState, selectedStaffId);
    
    // Set player's total coins (from previous session or 0 if new)
    newPlayerState.coins = currentPlayerCoins; 
    
    // Apply coin cheat if present
    if (parsedNicknameResult.coinCheatAmount > 0) {
        newPlayerState.coins += parsedNicknameResult.coinCheatAmount; // Add to existing coins
        console.log(`Coin Cheat Applied: Added ${parsedNicknameResult.coinCheatAmount} coins. New total for session start: ${newPlayerState.coins}`);
    }
    
    newPlayerState.purchasedPermanentSkills = purchasedPermanentSkills; // Store for reference

    if (adminConfig?.isAdminEnabled) {
        newPlayerState.isAdmin = true;
        
        if (adminConfig.damageMultiplier && adminConfig.damageMultiplier > 0) {
            newPlayerState.minProjectileDamage = (newPlayerState.baseMinProjectileDamage || PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE) * adminConfig.damageMultiplier;
            newPlayerState.maxProjectileDamage = (newPlayerState.baseMaxProjectileDamage || PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE) * adminConfig.damageMultiplier;
        }
        if (adminConfig.defenseBoost !== undefined && adminConfig.defenseBoost >= 0) {
            newPlayerState.defense = Math.min(0.95, (newPlayerState.baseDefense || PLAYER_INITIAL_DEFENSE) + (adminConfig.defenseBoost || 0));
        }

        // Apply admin-selected upgrades (regular upgrades, not cheats from nickname)
        Object.entries(adminConfig.selectedSkills).forEach(([skillId, count]) => {
            const upgrade = InitialUpgradesConfig.find(u => u.id === skillId);
            if (upgrade) {
                for (let i = 0; i < count; i++) {
                    if (upgrade.maxApplications && newPlayerState.upgrades.filter(uid => uid === skillId).length >= upgrade.maxApplications) {
                        break;
                    }
                    upgrade.apply(newPlayerState, gameContextForUpgrades);
                    newPlayerState.upgrades.push(skillId);
                }
            }
        });
    }

    // Apply skill cheats from nickname
    if (parsedNicknameResult.skillCheats.length > 0) {
        newPlayerState = applyCheatsToPlayer(newPlayerState, parsedNicknameResult.skillCheats, gameContextForUpgrades, InitialUpgradesConfig, PERMANENT_SKILLS_SHOP);
    }


    const basePlatforms = InitialStaticPlatformsConfig.map(p => ({
        ...p,
        isVisible: p.id === 'ground' ? true : false,
        currentAlpha: p.id === 'ground' ? 1 : 0,
        isBlinkingOut: false,
        blinkTimer: p.id === 'ground' ? Infinity : 0,
        height: p.id === 'ground' ? GROUND_PLATFORM_HEIGHT : DYNAMIC_PLATFORM_HEIGHT, // Ensure correct heights
    }));

    const startWaveForReset = adminConfig?.isAdminEnabled ? adminConfig.startWave : 0;
    
    // Initialize stars and nebulae
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 1.5 + 0.5,
            baseOpacity: Math.random() * 0.4 + 0.2,
            twinkleSpeed: Math.random() * 0.5 + 0.2,
        });
    }
    const nebulae: Nebula[] = [];
    for (let i = 0; i < 3; i++) {
        nebulae.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT * 0.7, // Keep nebulae mostly in upper part
            radiusX: Math.random() * 200 + 150,
            radiusY: Math.random() * 100 + 100,
            color1: `hsla(${Math.random() * 60 + 200}, 70%, 50%, 1)`, // Blues, Purples
            color2: `hsla(${Math.random() * 60 + 240}, 70%, 60%, 1)`, // Violets, Magentas
            opacity: Math.random() * 0.15 + 0.05,
            rotation: Math.random() * Math.PI * 2,
        });
    }


    return {
        player: newPlayerState,
        enemies: [],
        playerProjectiles: [],
        enemyProjectiles: [],
        particles: [],
        activeLightningBolts: [],
        floatingTexts: [],
        coinDrops: [],
        platforms: repositionAndResizeAllDynamicPlatforms(basePlatforms),
        availableUpgrades: InitialUpgradesConfig.map(u => ({ ...u })), // Fresh copy
        currentOfferedUpgradesForSelection: [],
        currentPicksAllowedForSelection: 0,
        gameTime: 0,
        currentWave: startWaveForReset,
        waveStatus: 'intermissao',
        enemiesToSpawnThisWave: 0,
        enemiesSpawnedThisWaveCount: 0,
        currentWaveConfig: { ...INITIAL_WAVE_CONFIG },
        lastClearedWave: adminConfig?.isAdminEnabled ? Math.max(0, startWaveForReset - 1) : 0,
        centerScreenMessage: null,
        stars,
        nebulae,
    };
}
