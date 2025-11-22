
import { Combatant, EntityType, PartyMember } from "../types";

// XP Thresholds per character level (Easy, Medium, Hard, Deadly)
const XP_THRESHOLDS: Record<number, number[]> = {
    1: [25, 50, 75, 100],
    2: [50, 100, 150, 200],
    3: [75, 150, 225, 400],
    4: [125, 250, 375, 500],
    5: [250, 500, 750, 1100],
    6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700],
    8: [450, 900, 1400, 2100],
    9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800],
    11: [800, 1600, 2400, 3600],
    12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100],
    14: [1250, 2500, 3800, 5700],
    15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200],
    17: [2000, 3900, 5900, 8800],
    18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900],
    20: [2800, 5700, 8500, 12700]
};

// Challenge Rating to XP
const CR_TO_XP: Record<string, number> = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
    "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
    "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
    "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
    "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
    "21": 33000, "22": 41000, "23": 50000, "24": 62000, "30": 155000
};

export const getXpFromCr = (cr: number): number => {
    // Basic approximations if exact map fails
    if (cr < 1) return CR_TO_XP[cr.toString()] || 10;
    return CR_TO_XP[cr.toString()] || cr * 200; // fallback
};

const getMultiplier = (count: number, partySize: number): number => {
    let multiplier = 1;
    if (count === 2) multiplier = 1.5;
    else if (count >= 3 && count <= 6) multiplier = 2;
    else if (count >= 7 && count <= 10) multiplier = 2.5;
    else if (count >= 11) multiplier = 3;
    else if (count >= 15) multiplier = 4;

    // Adjust for small/large parties
    if (partySize < 3) multiplier += 0.5; // Actually rule says shift one category up
    if (partySize > 5) multiplier -= 0.5; // Shift category down (simplified)

    return Math.max(0.5, multiplier); // Multiplier can't be < 0.5 or 1 typically
};

export interface EncounterResult {
    difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard' | 'Deadly';
    totalXp: number;
    adjustedXp: number;
    dailyBudgetPercent: number;
}

export const calculateEncounterDifficulty = (
    party: PartyMember[], 
    monsters: Combatant[]
): EncounterResult => {
    const activeParty = party.filter(p => p.active);
    const activeMonsters = monsters.filter(m => m.type === EntityType.MONSTER && m.hp > 0); // Only active monsters count

    if (activeParty.length === 0) return { difficulty: 'Trivial', totalXp: 0, adjustedXp: 0, dailyBudgetPercent: 0 };

    // 1. Calculate Party Thresholds
    let thresholds = [0, 0, 0, 0]; // Easy, Medium, Hard, Deadly
    activeParty.forEach(p => {
        const lvl = Math.min(20, Math.max(1, p.level));
        const th = XP_THRESHOLDS[lvl];
        if (th) {
            thresholds[0] += th[0];
            thresholds[1] += th[1];
            thresholds[2] += th[2];
            thresholds[3] += th[3];
        }
    });

    // 2. Calculate Monster XP
    const totalXp = activeMonsters.reduce((sum, m) => sum + (m.xp || 0), 0);
    
    // 3. Adjust XP based on count
    const multiplier = getMultiplier(activeMonsters.length, activeParty.length);
    const adjustedXp = totalXp * multiplier;

    // 4. Determine Difficulty
    let difficulty: EncounterResult['difficulty'] = 'Trivial';
    if (adjustedXp >= thresholds[3]) difficulty = 'Deadly';
    else if (adjustedXp >= thresholds[2]) difficulty = 'Hard';
    else if (adjustedXp >= thresholds[1]) difficulty = 'Medium';
    else if (adjustedXp >= thresholds[0]) difficulty = 'Easy';

    // 5. Daily Budget Estimate (Roughly Deadly * 3 is a full day)
    const dailyBudget = thresholds[2] * 3; // Approximate
    const percent = Math.round((adjustedXp / dailyBudget) * 100);

    return { difficulty, totalXp, adjustedXp, dailyBudgetPercent: percent };
};
