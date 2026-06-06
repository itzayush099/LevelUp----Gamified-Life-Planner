// src/utils/levelUtils.js

/**
 * Returns the current level, base XP, and next level XP threshold
 * for a given total XP value.
 *
 * Exact v1.9 tiered step formula (unchanged):
 *   Level 1 base: 100 XP to next
 *   Level 2 → 3 : step = 150
 *   Level 3 → 4 : step = 250
 *   Level 4+     : step += 100 each level
 *
 * @param {number} totalXp
 * @returns {{ level: number, currentBaseXp: number, nextLevelXp: number }}
 */
export const getLevelData = (totalXp) => {
  let level         = 1;
  let currentBaseXp = 0;
  let nextLevelXp   = 100;
  let step          = 150;

  while (totalXp >= nextLevelXp) {
    level++;
    currentBaseXp = nextLevelXp;
    if (level === 2)      step = 150;
    else if (level === 3) step = 250;
    else                  step += 100;
    nextLevelXp += step;
  }

  return { level, nextLevelXp, currentBaseXp };
};
