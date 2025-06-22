// gameLogic/cheatLogic.ts
import { Player, Upgrade, LeveledSkill, CheatCode, ParsedNickname } from '../types';
import { applyPermanentSkillEffectsToPlayer } from './gameSetup'; // For re-applying permanent skill effects

export function parseCheatNickname(fullNickname: string): ParsedNickname {
  const parts = fullNickname.split(',');
  const baseNickname = parts[0].trim();
  const skillCheats: CheatCode[] = [];
  let coinCheatAmount = 0;

  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      const cheatPart = parts[i].trim();
      const skillCheatMatch = cheatPart.match(/^(\d{3})-(\d+)$/);
      // Regex for coin cheat: "coin-" followed by one or more digits. Case-insensitive for "coin".
      const coinCheatMatch = cheatPart.match(/^coin-(\d+)$/i); 

      if (skillCheatMatch) {
        const skillNumericId = skillCheatMatch[1];
        const level = parseInt(skillCheatMatch[2], 10);
        if (level > 0) {
          skillCheats.push({ skillNumericId, level });
        } else {
          console.warn(`Invalid skill cheat level for ${skillNumericId}: ${level}. Must be positive.`);
        }
      } else if (coinCheatMatch) {
        const amount = parseInt(coinCheatMatch[1], 10);
        if (amount > 0) {
          coinCheatAmount += amount; // Sum up amounts if multiple coin cheats are specified
        } else {
          console.warn(`Invalid coin cheat amount: ${amount}. Must be positive.`);
        }
      } else if (cheatPart) { // Only warn if it's not an empty part (e.g. from "name,,001-1")
        console.warn(`Invalid cheat format: ${cheatPart}. Expected NNN-L (e.g., 001-2) or coin-AMOUNT (e.g., coin-1000).`);
      }
    }
  }

  return {
    baseNickname,
    skillCheats,
    coinCheatAmount,
  };
}

export function applyCheatsToPlayer(
  player: Player,
  skillCheats: CheatCode[], // Now specifically takes skillCheats
  gameContextForUpgrades: any,
  allUpgrades: Upgrade[],
  allPermanentSkills: LeveledSkill[]
): Player {
  let tempPlayer = { ...player };

  skillCheats.forEach(cheat => {
    // Check normal upgrades first
    const normalUpgrade = allUpgrades.find(u => u.numericId === cheat.skillNumericId);
    if (normalUpgrade) {
      const currentApplications = tempPlayer.upgrades.filter(uid => uid === normalUpgrade.id).length;
      const applicationsRemaining = (normalUpgrade.maxApplications === undefined ? cheat.level : Math.min(cheat.level, normalUpgrade.maxApplications - currentApplications));
      
      for (let i = 0; i < applicationsRemaining; i++) {
        if (normalUpgrade.maxApplications && tempPlayer.upgrades.filter(uid => uid === normalUpgrade.id).length >= normalUpgrade.maxApplications) {
          console.log(`Cheat: Max applications already reached for upgrade ${normalUpgrade.name} (${normalUpgrade.id}) before applying full cheat level ${cheat.level}.`);
          break; 
        }
        normalUpgrade.apply(tempPlayer, gameContextForUpgrades);
        tempPlayer.upgrades.push(normalUpgrade.id);
      }
      if (applicationsRemaining > 0) {
        console.log(`Cheat Applied: Normal Upgrade ${normalUpgrade.name} (ID: ${normalUpgrade.id}, Numeric: ${normalUpgrade.numericId}) applied ${applicationsRemaining} times.`);
      } else if (cheat.level > 0) {
         console.log(`Cheat: Could not apply Normal Upgrade ${normalUpgrade.name} (ID: ${normalUpgrade.id}, Numeric: ${normalUpgrade.numericId}) further. Max applications likely reached.`);
      }
      return; 
    }

    // Check permanent skills
    const permanentSkill = allPermanentSkills.find(ps => ps.numericId === cheat.skillNumericId);
    if (permanentSkill) {
      const targetLevel = cheat.level;
      if (targetLevel > 0 && targetLevel <= permanentSkill.levels.length) {
        tempPlayer.purchasedPermanentSkills = {
          ...tempPlayer.purchasedPermanentSkills,
          [permanentSkill.id]: { level: targetLevel },
        };
        console.log(`Cheat Applied: Permanent Skill ${permanentSkill.name} (ID: ${permanentSkill.id}, Numeric: ${permanentSkill.numericId}) set to level ${targetLevel}`);
      } else {
        console.warn(`Cheat: Invalid level ${targetLevel} for permanent skill ${permanentSkill.name}. Max level is ${permanentSkill.levels.length}. Level not changed.`);
      }
    } else {
        console.warn(`Cheat: Skill with numericId ${cheat.skillNumericId} not found.`);
    }
  });

  tempPlayer = applyPermanentSkillEffectsToPlayer(tempPlayer, tempPlayer.purchasedPermanentSkills);

  return tempPlayer;
}
