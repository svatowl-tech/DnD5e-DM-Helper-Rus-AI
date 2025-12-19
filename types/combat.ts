
export interface Condition {
    id: string;
    name: string;
    description: string;
    duration?: number;
}

export enum EntityType {
    PLAYER = 'PLAYER',
    MONSTER = 'MONSTER',
    NPC = 'NPC'
}

/**
 * Fix: Added EquipmentItem interface
 */
export interface EquipmentItem {
    index: string;
    name: string;
    category: string;
    subcategory?: string;
    cost: string;
    weight: number;
    damage?: string;
    damageType?: string;
    range?: string;
    properties?: string[];
    ac?: number;
    dexBonus?: boolean;
    maxDexBonus?: number;
    strReq?: number;
    stealthDisadvantage?: boolean;
    description?: string;
}

export interface Combatant {
    id: string;
    name: string;
    type: EntityType;
    initiative: number;
    hp: number;
    maxHp: number;
    ac: number;
    conditions: Condition[];
    notes: string;
    xp?: number;
    actions?: string[];
}

export interface BestiaryEntry {
    id: string;
    name: string;
    type: string;
    ac: number;
    hp: number;
    cr: string | number;
    xp: number;
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    actions?: { name: string; desc: string }[];
    description?: string;
    source?: 'srd' | 'local' | 'ai';
}
