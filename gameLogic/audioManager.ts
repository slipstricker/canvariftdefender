// gameLogic/audioManager.ts

export const sfxAssets: string[] = [
  // Player
  // '/assets/sounds/player_jump_01.wav',
  // '/assets/sounds/player_double_jump_01.wav',
  // '/assets/sounds/player_shoot_magic_01.wav',
  // '/assets/sounds/player_hit_01.wav',
  // '/assets/sounds/player_revive_01.wav',
  // // Shield
  // '/assets/sounds/shield_activate_01.wav',
  // '/assets/sounds/shield_hit_01.wav',
  // '/assets/sounds/shield_break_01.wav',
  // // Projectiles
  // '/assets/sounds/projectile_fire_shoot_01.wav',
  // '/assets/sounds/projectile_ice_shoot_01.wav',
  // '/assets/sounds/projectile_water_shoot_01.wav',
  // '/assets/sounds/projectile_shadow_shoot_01.wav',
  // '/assets/sounds/projectile_fire_explode_01.wav',
  // // Enemies
  // '/assets/sounds/enemy_spawn_alien_01.wav',
  // '/assets/sounds/enemy_hit_flesh_01.wav',
  // '/assets/sounds/enemy_hit_boss_01.wav',
  // '/assets/sounds/enemy_death_generic_01.wav',
  // '/assets/sounds/enemy_death_splitter_01.wav',
  // '/assets/sounds/enemy_mini_splitter_spawn_01.wav',
  // '/assets/sounds/enemy_death_boss_01.wav',
  // '/assets/sounds/enemy_shoot_generic_01.wav',
  // '/assets/sounds/enemy_boss_shoot_01.wav',
  // // Game Events
  // '/assets/sounds/event_level_up_01.wav',
  // '/assets/sounds/event_upgrade_select_01.wav',
  // '/assets/sounds/event_wave_start_01.wav',
  // '/assets/sounds/event_wave_clear_01.wav',
  // '/assets/sounds/event_game_over_01.wav',
  // '/assets/sounds/thunderbolt_strike_01.wav',
  // '/assets/sounds/event_cosmetic_unlock_01.wav',
  // // UI
  // '/assets/sounds/ui_button_click_01.wav',
];

export const musicAssets = {
  // mainTheme: '/assets/music/game_theme_01.mp3',
};

const sfxCache: Map<string, HTMLAudioElement> = new Map();
let musicElement: HTMLAudioElement | null = null;
let isGloballyMuted = true; // Default to muted since audio is disabled
let globalVolume = 0.0; // Default to 0 volume

export const loadSfx = async (): Promise<void> => {
  console.log("SFX loading skipped (audio disabled).");
  return Promise.resolve();
};

export const loadMusic = (src: string): Promise<void> => {
    console.log("Music loading skipped (audio disabled).");
    return Promise.resolve();
};

export const playSound = (soundName: string, volumeScale: number = 1.0, forcePlay: boolean = false): void => {
  // Audio disabled
  // console.log(`Attempted to play SFX (disabled): ${soundName}`);
};

export const playMusic = (loop: boolean = true): void => {
  // Audio disabled
  // console.log("Attempted to play music (disabled).");
};

export const pauseMusic = (): void => {
  // Audio disabled
};

export const stopMusic = (): void => {
  // Audio disabled
};

export const toggleGlobalMute = (): boolean => {
  isGloballyMuted = !isGloballyMuted;
  console.log(isGloballyMuted ? "Audio Muted (disabled)" : "Audio Unmuted (disabled)");
  return isGloballyMuted;
};

export const getGlobalMuteStatus = (): boolean => {
  return isGloballyMuted;
};

export const setGlobalVolume = (volume: number): void => {
  globalVolume = Math.max(0, Math.min(1, volume));
  // console.log(`Global volume set to (disabled): ${globalVolume}`);
};

export const getGlobalVolume = (): number => {
  return globalVolume;
};
