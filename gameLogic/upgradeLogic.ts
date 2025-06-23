
import { Upgrade, Player, Enemy } from '../types';
import { PLAYER_INITIAL_ATTACK_SPEED, PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_CRIT_CHANCE, PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE, PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE } from '../constants';
import { ALL_STAFFS_SHOP, DEFAULT_STAFF_ID } from './shopLogic';

export const UPGRADES: Upgrade[] = [
  {
    id: 'catalyst',
    numericId: '001',
    name: 'Catalisador',
    description: 'Dano do Projétil +5. Acumula infinitamente.',
    tier: 'comum',
    apply: (player) => { 
      player.minProjectileDamage += 5; 
      player.maxProjectileDamage += 5;
    },
  },
  {
    id: 'growth',
    numericId: '002',
    name: 'Crescimento',
    description: 'HP Máx. +10. Acumula infinitamente.',
    tier: 'comum',
    apply: (player) => { player.maxHp += 10; player.hp += 10; },
  },
  {
    id: 'resonance',
    numericId: '003',
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
    numericId: '004',
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
    numericId: '005',
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
    numericId: '006',
    name: 'Renovar',
    description: 'Cura para HP Máx.',
    tier: 'incomum',
    apply: (player) => { player.hp = player.maxHp; },
    maxApplications: 1, 
  },
  {
    id: 'leech',
    numericId: '007',
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
    numericId: '008',
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
    numericId: '009',
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
    id: 'piercingRounds',
    numericId: '010',
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
    numericId: '011',
    name: 'Fragmentação',
    description: 'Inimigos soltam 2 projéteis fracos ao morrer. Máx 1 aplicação.',
    tier: 'raro',
    apply: (player, game) => {
      // The logic for fragmentation projectile creation is handled
      // by the gameContextForUpgrades.enableFragmentation defined in App.tsx.
      // This apply function primarily serves to ensure the upgrade ID is added to player.upgrades,
      // which is done by the caller (handleApplyUpgrade).
      // No direct action needed here to set up the fragmentation effect itself,
      // as long as the player.upgrades array reflects that this upgrade was chosen.
    },
    maxApplications: 1,
  },
  {
    id: 'thunderbolt',
    numericId: '012',
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
    numericId: '013',
    name: 'Avaliação',
    description: '+1 escolha de item de agora em diante. Máx 3 aplicações.',
    tier: 'raro',
    apply: (player) => { player.appraisalChoices += 1; },
    maxApplications: 3, 
  },
  {
    id: 'immortal',
    numericId: '014',
    name: 'Imortal',
    description: '+1 Reviver (limpa inimigos ao reviver). Carta removida após pegar.',
    tier: 'raro',
    apply: (player, game) => { 
      player.revives += 1; 
      // The removal from pool is now handled by handleApplyUpgrade in App.tsx for upgrades with maxApplications: 1
    },
    maxApplications: 1,
  },
  {
    id: 'seekerRounds',
    numericId: '015',
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
    numericId: '016',
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
      }
    },
    maxApplications: 1, 
  },
  {
    id: 'damagingAura',
    numericId: '017',
    name: 'Aura Danosa',
    description: 'Seu corpo causa dano de contato (10% do dano médio do projétil). +10% por nível (máx 50%).',
    tier: 'raro',
    apply: (player) => {
      if (player.damagingAuraFactor === undefined || player.damagingAuraFactor < 0.1) {
        player.damagingAuraFactor = 0.10;
      } else {
        player.damagingAuraFactor = Math.min(0.50, player.damagingAuraFactor + 0.10);
      }
    },
    maxApplications: 5, 
  },
  {
    id: 'mirroredMinion',
    numericId: '018',
    name: 'Miniatura Espelhada',
    description: 'Invoca 1 pequena cópia sua que atira automaticamente (20% dano do projétil máx., 50% vel. tiro). Nv2: +1 cópia (total 2).',
    tier: 'raro',
    apply: (player) => {
      if (!player.miniatures) {
        player.miniatures = { count: 1, lastShotTimes: [0] };
      } else if (player.miniatures.count < 2) {
        player.miniatures.count++;
        // Ensure lastShotTimes array has enough entries
        while (player.miniatures.lastShotTimes.length < player.miniatures.count) {
          player.miniatures.lastShotTimes.push(0);
        }
      }
    },
    maxApplications: 2,
  },
];