import { Upgrade, Player, Enemy } from '../types';
import { PLAYER_INITIAL_ATTACK_SPEED, PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_CRIT_CHANCE } from '../constants';

// Note: 'game: any' for game context in apply functions is kept for now
// to avoid circular dependencies or overly complex type definitions at this stage.
// It typically provides access to methods like addEnemyProjectile or modify game-wide flags.

export const UPGRADES: Upgrade[] = [
  {
    id: 'catalyst',
    name: 'Catalisador',
    description: 'Dano do Projétil +5. Acumula infinitamente.',
    tier: 'comum',
    apply: (player) => { player.projectileDamage += 5; },
  },
  {
    id: 'growth',
    name: 'Crescimento',
    description: 'HP Máx. +10. Acumula infinitamente.',
    tier: 'comum',
    apply: (player) => { player.maxHp += 10; player.hp += 10; },
  },
  {
    id: 'resonance',
    name: 'Ressonância',
    description: 'Vel. de Ataque +12%. Máx +100% (aprox. 6 aplicações).',
    tier: 'comum',
    apply: (player) => { 
      player.attackSpeed *= 1.12; 
      player.attackSpeed = Math.min(player.attackSpeed, PLAYER_INITIAL_ATTACK_SPEED * 2);
    },
    maxApplications: 6,
  },
  {
    id: 'swift',
    name: 'Rapidez',
    description: 'Vel. de Movimento +20%. Máx +150% (aprox. 5 aplicações).',
    tier: 'comum',
    apply: (player) => { 
      player.movementSpeed *= 1.20; 
      player.movementSpeed = Math.min(player.movementSpeed, PLAYER_MOVEMENT_SPEED * 2.5);
    },
    maxApplications: 5, 
  },
  {
    id: 'eyesight',
    name: 'Visão Aguçada',
    description: 'Chance Crítica +5%. Máx 40% (7 aplicações da base de 5%).',
    tier: 'comum',
    apply: (player) => { 
      player.critChance += 0.05;
      player.critChance = Math.min(player.critChance, 0.40);
    },
    maxApplications: 7, 
  },
  {
    id: 'renew',
    name: 'Renovar',
    description: 'Cura para HP Máx.',
    tier: 'incomum',
    apply: (player) => { player.hp = player.maxHp; },
    maxApplications: 1, 
  },
  {
    id: 'leech',
    name: 'Sanguessuga',
    description: 'Roubo de Vida +3% do Dano. Máx 30% (10 aplicações).',
    tier: 'incomum',
    apply: (player) => { 
      player.lifeSteal += 0.03; 
      player.lifeSteal = Math.min(player.lifeSteal, 0.30);
    },
    maxApplications: 10,
  },
  {
    id: 'scorchedRounds',
    name: 'Munição Incendiária',
    description: 'Projéteis têm 25% de chance de Incendiar inimigos (20% dano proj./s, 3s). Acumula 3x. Mais apps melhoram.',
    tier: 'incomum',
    apply: (player) => {
      if (!player.appliesBurn) {
        player.appliesBurn = {
          chance: 0.25,
          damageFactor: 0.20, 
          duration: 3, 
          baseStacks: 1, 
          maxStacks: 3,
          tickInterval: 1, 
        };
      } else {
        player.appliesBurn.chance = Math.min(1, player.appliesBurn.chance + 0.10); 
        player.appliesBurn.maxStacks = Math.min(10, player.appliesBurn.maxStacks + 1); 
        player.appliesBurn.damageFactor = Math.min(1, player.appliesBurn.damageFactor + 0.05); 
        player.appliesBurn.duration = Math.min(10, player.appliesBurn.duration + 0.5); 
      }
    },
    maxApplications: 5,
  },
  {
    id: 'cryoRounds',
    name: 'Munição Criogênica',
    description: 'Projéteis têm 25% de chance de Congelar inimigos, lentidão de 30% por 3s. Mais apps melhoram.',
    tier: 'incomum',
    apply: (player) => {
      if (!player.appliesChill) {
        player.appliesChill = {
          chance: 0.25,
          duration: 3, 
          movementSlowFactor: 0.7, 
          attackSpeedSlowFactor: 0.7, 
        };
      } else {
        player.appliesChill.chance = Math.min(1, player.appliesChill.chance + 0.10); 
        player.appliesChill.duration = Math.min(10, player.appliesChill.duration + 0.5); 
        player.appliesChill.movementSlowFactor = Math.max(0.3, player.appliesChill.movementSlowFactor - 0.05); 
        player.appliesChill.attackSpeedSlowFactor = Math.max(0.3, player.appliesChill.attackSpeedSlowFactor - 0.05); 
      }
    },
    maxApplications: 5,
  },
   {
    id: 'gush',
    name: 'Impulso',
    description: 'Adiciona +1 Pulo (Habilita Pulo Duplo). Máx 1 aplicação.',
    tier: 'incomum',
    apply: (player) => { player.canDoubleJump = true; },
    maxApplications: 1,
  },
  {
    id: 'piercingRounds',
    name: 'Munição Perfurante',
    description: 'Seus projéteis perfuram +1 inimigo. Aumenta com mais aplicações.',
    tier: 'incomum',
    apply: (player) => {
      if (player.projectilePierceCount === undefined) {
        player.projectilePierceCount = 1; 
      } else {
        player.projectilePierceCount += 1;
      }
      player.projectilePierceCount = Math.min(player.projectilePierceCount, 5); 
    },
    maxApplications: 5,
  },
  {
    id: 'fragmentation',
    name: 'Fragmentação',
    description: 'Inimigos soltam 2 projéteis fracos ao morrer. Máx 1 aplicação.',
    tier: 'raro',
    apply: (player, game) => { 
      game.enableFragmentation = (enemy: Enemy) => {
        if (!game.addEnemyProjectile) return;
        for(let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 150;
          game.addEnemyProjectile(
            enemy.x + enemy.width / 2, 
            enemy.y + enemy.height / 2, 
            Math.cos(angle) * speed, 
            Math.sin(angle) * speed, 
            Math.max(1, player.projectileDamage / 4) 
          );
        }
      };
    },
    maxApplications: 1,
  },
  {
    id: 'thunderbolt',
    name: 'Raio Trovejante',
    description: 'Invoca raios dos céus a cada 5s. Começa com 2 raios, +1 por acúmulo. Máx 6 raios.',
    tier: 'raro',
    apply: (player, game) => {
      let currentBoltApplications = 0;
      player.upgrades.forEach(uid => { if (uid === 'thunderbolt') currentBoltApplications++; });
      
      const boltsToCall = Math.min(2 + Math.max(0, currentBoltApplications - 1), 6);
      player.thunderboltEffectiveBolts = boltsToCall;

      if (game.activateThunderbolts) {
          game.activateThunderbolts(boltsToCall, 5000);
      }
    },
    maxApplications: 5, 
  },
  {
    id: 'appraisal',
    name: 'Avaliação',
    description: '+1 escolha de item de agora em diante. Máx 3 aplicações.',
    tier: 'raro',
    apply: (player) => { player.appraisalChoices += 1; },
    maxApplications: 3, 
  },
  {
    id: 'immortal',
    name: 'Imortal',
    description: '+1 Reviver (limpa inimigos ao reviver). Carta removida após pegar.',
    tier: 'raro',
    apply: (player, game) => { 
      player.revives += 1; 
      if (game.removeUpgradeFromPool) game.removeUpgradeFromPool('immortal');
    },
    maxApplications: 1,
  },
  {
    id: 'seekerRounds',
    name: 'Mísseis Teleguiados',
    description: 'Seus projéteis rastreiam lentamente os inimigos. Melhora com mais aplicações.',
    tier: 'raro',
    apply: (player) => {
      player.projectilesAreHoming = true;
      if (player.projectileHomingStrength === undefined) {
        player.projectileHomingStrength = 0.05; 
      } else {
        player.projectileHomingStrength = Math.min(player.projectileHomingStrength + 0.03, 0.25); 
      }
    },
    maxApplications: 5,
  },
  {
    id: 'energyShield',
    name: 'Escudo de Energia',
    description: 'Ganha um escudo que bloqueia 1 acerto. Recarrega após 5s sem dano.',
    tier: 'raro',
    apply: (player) => {
      if (player.shieldMaxHp === undefined) {
        player.shieldMaxHp = 1; 
        player.shieldCurrentHp = 1;
        player.shieldRechargeDelay = 5; 
        player.shieldRechargeRate = 1; 
        player.shieldLastDamagedTime = 0;
      } else {
        // player.shieldMaxHp = Math.min((player.shieldMaxHp || 0) + 1, 3);
        // player.shieldRechargeDelay = Math.max((player.shieldRechargeDelay || 5) - 0.5, 2); 
      }
    },
    maxApplications: 1, 
  }
];