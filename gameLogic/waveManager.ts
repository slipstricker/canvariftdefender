

import React from 'react';
import { Player, Enemy, Platform, Projectile, WaveStatus, CenterScreenMessage } from '../types';
// Removed: import { CenterScreenMessage } from '../App'; // Assuming CenterScreenMessage is exported from App or types
import {
  INITIAL_WAVE_CONFIG, WAVE_CONFIG_INCREMENTS, ALL_BOSS_WAVES,
  PLAYER_INTERMISSION_HEAL_PERCENT, WAVE_ANNOUNCEMENT_DURATION,
  INTERMISSION_COUNTDOWN_UPDATE_INTERVAL, CANVAS_WIDTH
} from '../constants';
import { repositionAndResizeAllDynamicPlatforms } from './platformLogic'; // Assuming this is the correct path


interface WaveSystemParams {
  deltaTime: number;
  waveStatus: WaveStatus;
  timeToNextWaveAction: number;
  currentWave: number;
  enemiesToSpawnThisWave: number;
  enemiesSpawnedThisWaveCount: number;
  currentWaveConfig: typeof INITIAL_WAVE_CONFIG; // Use the type of the constant
  player: Player;
  enemies: Enemy[];
  lastClearedWave: number;
  playSound: (soundName: string, volume?: number) => void;
  createEnemyOrBossFn: (currentWave: number, playerLevel: number, canvasWidth: number, playSound: (soundName: string, volume?: number) => void) => Enemy;
  repositionPlatformsFn: () => void;
  setPlayerFn: React.Dispatch<React.SetStateAction<Player>>;
  setEnemiesFn: React.Dispatch<React.SetStateAction<Enemy[]>>;
  setPlayerProjectilesFn: React.Dispatch<React.SetStateAction<Projectile[]>>;
  setEnemyProjectilesFn: React.Dispatch<React.SetStateAction<Projectile[]>>;
  setCenterMessageFn: React.Dispatch<React.SetStateAction<CenterScreenMessage | null>>;
  handleGameOverFn: () => void;
}

interface WaveSystemResult {
  newWaveStatus: WaveStatus;
  newTimeToNextWaveAction: number;
  newCurrentWave: number;
  newEnemiesToSpawnThisWave: number;
  newEnemiesSpawnedThisWaveCount: number;
  newCurrentWaveConfig: typeof INITIAL_WAVE_CONFIG;
  newLastClearedWave: number;
}

export function updateWaveSystem(params: WaveSystemParams): WaveSystemResult {
  let {
    deltaTime, waveStatus, timeToNextWaveAction, currentWave,
    enemiesToSpawnThisWave, enemiesSpawnedThisWaveCount, currentWaveConfig,
    player, enemies, lastClearedWave, playSound, createEnemyOrBossFn,
    repositionPlatformsFn, setPlayerFn, setEnemiesFn,
    setPlayerProjectilesFn, setEnemyProjectilesFn, setCenterMessageFn, handleGameOverFn
  } = params;

  timeToNextWaveAction -= deltaTime;

  if (waveStatus === 'intermissao') {
    if (timeToNextWaveAction <= 0) {
      const newWaveNumber = currentWave + 1;

      // Anti-cheat for wave skipping removed
      // if (newWaveNumber > lastClearedWave + 1 && lastClearedWave !== 0 && !player.isAdmin) {
      //   console.warn("Anti-Cheat: Pulo de wave detectado!");
      //   handleGameOverFn();
      //   // Early return might be needed if game over stops further processing
      //   return { 
      //       newWaveStatus: waveStatus, newTimeToNextWaveAction: timeToNextWaveAction, newCurrentWave: currentWave, 
      //       newEnemiesToSpawnThisWave: enemiesToSpawnThisWave, newEnemiesSpawnedThisWaveCount: enemiesSpawnedThisWaveCount, 
      //       newCurrentWaveConfig: currentWaveConfig, newLastClearedWave: lastClearedWave
      //   };
      // }

      currentWave = newWaveNumber;
      playSound('/assets/sounds/event_wave_start_01.wav', 0.6);

      let numEnemies = INITIAL_WAVE_CONFIG.enemies + (newWaveNumber - 1) * WAVE_CONFIG_INCREMENTS.enemiesPerWave;
      if (player.challengerHatMoreEnemies) {
        numEnemies *= 2;
      }
      if (ALL_BOSS_WAVES.includes(newWaveNumber)) {
        numEnemies = player.challengerHatMoreEnemies ? 2 : 1;
      }
      enemiesToSpawnThisWave = numEnemies;
      enemiesSpawnedThisWaveCount = 0;

      const spawnInterval = Math.max(
        WAVE_CONFIG_INCREMENTS.minSpawnInterval,
        INITIAL_WAVE_CONFIG.spawnInterval - (newWaveNumber - 1) * WAVE_CONFIG_INCREMENTS.spawnIntervalReduction
      );
      currentWaveConfig = { ...currentWaveConfig, spawnInterval };
      timeToNextWaveAction = spawnInterval;
      waveStatus = 'surgindo';
      setCenterMessageFn({ text: `Wave ${newWaveNumber} Chegando...`, duration: WAVE_ANNOUNCEMENT_DURATION, initialDuration: WAVE_ANNOUNCEMENT_DURATION, color: '#00FFFF', fontSize: 24 });
    } else {
      setCenterMessageFn({ text: `Próxima Wave em ${Math.ceil(timeToNextWaveAction)}s`, duration: INTERMISSION_COUNTDOWN_UPDATE_INTERVAL, initialDuration: INTERMISSION_COUNTDOWN_UPDATE_INTERVAL, color: '#00DDDD', fontSize: 20 });
    }
  } else if (waveStatus === 'surgindo') {
    if (timeToNextWaveAction <= 0 && enemiesSpawnedThisWaveCount < enemiesToSpawnThisWave) {
      const newEnemy = createEnemyOrBossFn(currentWave, player.level, CANVAS_WIDTH, playSound);
      setEnemiesFn(prevE => [...prevE, newEnemy]);
      enemiesSpawnedThisWaveCount++;
      timeToNextWaveAction = currentWaveConfig.spawnInterval;
    }
    if (enemiesSpawnedThisWaveCount >= enemiesToSpawnThisWave) {
      waveStatus = 'lutando';
    }
  } else if (waveStatus === 'lutando') {
    const nonSummonedEnemies = enemies.filter(e => !e.isSummonedByBoss).length;
    if (nonSummonedEnemies === 0 && enemiesSpawnedThisWaveCount >= enemiesToSpawnThisWave) {
      waveStatus = 'intermissao';
      playSound('/assets/sounds/event_wave_clear_01.wav', 0.7);
      lastClearedWave = currentWave;
      
      const intermission = INITIAL_WAVE_CONFIG.intermissionTime + (currentWave - 1) * WAVE_CONFIG_INCREMENTS.intermissionTimeIncrease;
      timeToNextWaveAction = intermission;
      setCenterMessageFn({text: `Wave ${currentWave} Neutralizada!`, duration: WAVE_ANNOUNCEMENT_DURATION, initialDuration: WAVE_ANNOUNCEMENT_DURATION, color: '#39FF14', fontSize: 22 });
      
      repositionPlatformsFn();
      setPlayerProjectilesFn([]);
      setEnemyProjectilesFn([]);
      setPlayerFn(p => ({...p, hp: Math.min(p.maxHp, p.hp + p.maxHp * PLAYER_INTERMISSION_HEAL_PERCENT)}));
    }
  }

  return {
    newWaveStatus: waveStatus,
    newTimeToNextWaveAction: timeToNextWaveAction,
    newCurrentWave: currentWave,
    newEnemiesToSpawnThisWave: enemiesToSpawnThisWave,
    newEnemiesSpawnedThisWaveCount: enemiesSpawnedThisWaveCount,
    newCurrentWaveConfig: currentWaveConfig,
    newLastClearedWave: lastClearedWave,
  };
}