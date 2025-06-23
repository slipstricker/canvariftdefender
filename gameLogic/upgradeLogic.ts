
import { Upgrade, Player, Enemy } from '../types';
import { PLAYER_INITIAL_ATTACK_SPEED, PLAYER_MOVEMENT_SPEED, PLAYER_INITIAL_CRIT_CHANCE, PLAYER_INITIAL_MIN_PROJECTILE_DAMAGE, PLAYER_INITIAL_MAX_PROJECTILE_DAMAGE } from '../constants';
import { ALL_STAFFS_SHOP, DEFAULT_STAFF_ID } from './shopLogic';

export const UPGRADES: Upgrade[] = [
  {
    id: 'catalyst',
    numericId: '001',
    name: 'Catalisador Estelar',
    description: 'Infunde seus projéteis com energia estelar pura, aumentando seu dano em +5. O poder cósmico é ilimitado!',
    tier: 'comum',
    apply: (player) => { 
      player.minProjectileDamage += 5; 
      player.maxProjectileDamage += 5;
    },
  },
  {
    id: 'growth',
    numericId: '002',
    name: 'Vigor Nebuloso',
    description: 'Fortalece sua essência vital com a resiliência das nebulosas, expandindo seu HP Máx. em +10. Sua vitalidade não conhece fronteiras!',
    tier: 'comum',
    apply: (player) => { player.maxHp += 10; player.hp += 10; },
  },
  {
    id: 'resonance',
    numericId: '003',
    name: 'Ressonância Cósmica',
    description: 'Sincroniza seus ataques com o ritmo pulsante do cosmos, acelerando sua Vel. de Ataque em +12%.',
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
    name: 'Velocidade de Cometa',
    description: 'Canaliza a velocidade dos cometas, impulsionando sua Vel. de Movimento em +20%. Deslize pelo campo de batalha!',
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
    name: 'Olhar Transcendente',
    description: 'Sua percepção transcende o comum, alinhando seus disparos com pontos fracos cósmicos. Chance Crítica +5%.',
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
    name: 'Fluxo Restaurador',
    description: 'Uma onda de energia restauradora das estrelas-mãe preenche você, curando todo seu HP.',
    tier: 'incomum',
    apply: (player) => { player.hp = player.maxHp; },
  },
  {
    id: 'leech',
    numericId: '007',
    name: 'Drenagem Vital Cósmica',
    description: 'Drena a energia vital dos inimigos cósmicos, convertendo 3% do dano causado em cura para você.',
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
    name: 'Projéteis Solares',
    description: 'Encanta seus projéteis com o fogo de sóis distantes. 25% de chance de Incendiar, causando dano contínuo. Aprimoramentos intensificam a chama.',
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
    name: 'Disparos do Vácuo Gelado',
    description: 'Imbui seus disparos com o frio do vácuo espacial. 25% de chance de Congelar, reduzindo velocidade. Aprimoramentos aprofundam o gelo.',
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
    name: 'Fragmentos de Asteroide',
    description: 'Projéteis reforçados com fragmentos de asteroides, capazes de perfurar +1 inimigo. Aprimoramentos aumentam a penetração.',
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
    name: 'Estilhaços Vingativos',
    description: 'A essência instável dos inimigos derrotados se estilhaça em 2 projéteis vingativos ao serem destruídos.',
    tier: 'raro',
    apply: (player, game) => {
    },
    maxApplications: 1,
  },
  {
    id: 'thunderbolt',
    numericId: '012',
    name: 'Fúria da Tempestade Cósmica',
    description: 'Comande a fúria de tempestades cósmicas! Raios celestiais caem a cada 5s. Começa com 2, mais raios a cada aprimoramento.',
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
    name: 'Intuição Cósmica',
    description: 'Sua intuição cósmica se expande, revelando +1 opção de melhoria a cada ascensão de nível.',
    tier: 'raro',
    apply: (player) => { player.appraisalChoices += 1; },
    maxApplications: 3, 
  },
  {
    id: 'immortal',
    numericId: '014',
    name: 'Desafio ao Vazio',
    description: 'Desafie o vazio! Ganha +1 chance de retornar da aniquilação, liberando uma onda de energia purificadora.',
    tier: 'raro',
    apply: (player, game) => { 
      player.revives += 1; 
    },
    maxApplications: 1,
  },
  {
    id: 'seekerRounds',
    numericId: '015',
    name: 'Inteligência Estelar',
    description: 'Projéteis imbuídos com inteligência estelar, buscando os adversários cósmicos. Aprimoramentos refinam a perseguição.',
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
    name: 'Barreira de Plasma',
    description: 'Materializa um escudo de plasma, que anula 3 impactos inimigos. Cada aplicação aumenta em +3. O escudo recarrega após 10s sem sofrer dano.',
    tier: 'raro',
    apply: (player) => {
      const HP_PER_LEVEL = 3;
      const INITIAL_HP = 3;
      const RECHARGE_DELAY_SECONDS = 10;
      const FULL_RECHARGE_DURATION_SECONDS = 1; // Time to fully recharge after delay

      if (player.shieldMaxHp === undefined) { // First application
        player.shieldMaxHp = INITIAL_HP;
      } else { // Subsequent applications
        player.shieldMaxHp += HP_PER_LEVEL;
      }
      player.shieldCurrentHp = player.shieldMaxHp; // Fully charge shield on upgrade
      player.shieldRechargeDelay = RECHARGE_DELAY_SECONDS;
      // Rate is HP per second. If maxHP is 20 and duration is 1s, rate is 20.
      player.shieldRechargeRate = player.shieldMaxHp / FULL_RECHARGE_DURATION_SECONDS; 
      player.shieldLastDamagedTime = 0; // Ensure it can start recharging if not recently hit
    },
  },
  {
    id: 'damagingAura',
    numericId: '017',
    name: 'Aura Disruptiva',
    description: 'Irradia uma aura de energia disruptiva, causando dano de contato (10% do seu dano). Aprimoramentos amplificam a intensidade.',
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
    name: 'Eco Espectral',
    description: 'Cria um eco espectral de si mesmo que dispara autonomamente (20% dano, 50% vel. tiro). Aprimoramentos podem duplicar este aliado astral.',
    tier: 'raro',
    apply: (player) => {
      if (!player.miniatures) {
        player.miniatures = { count: 1, lastShotTimes: [0] };
      } else if (player.miniatures.count < 2) {
        player.miniatures.count++;
        while (player.miniatures.lastShotTimes.length < player.miniatures.count) {
          player.miniatures.lastShotTimes.push(0);
        }
      }
    },
    maxApplications: 2,
  },
];
