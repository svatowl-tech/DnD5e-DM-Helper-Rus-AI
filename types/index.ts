
export * from './audio';
export * from './combat';
export * from './world';
export * from './narrative';
export * from './ui';

// Add missing party types directly for now
export interface Wallet {
    gp: number;
    sp: number;
    cp: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    description?: string;
}

export interface PartyMember {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    maxHp: number;
    hp?: number;
    ac: number;
    passivePerception: number;
    active: boolean;
    xp?: number;
    notes?: string;
    wallet?: Wallet;
    inventory: InventoryItem[];
}

export interface PartyStash {
    items: InventoryItem[];
    wallet: Wallet;
}

export interface PartyManagerProps {
    addLog: (entry: any) => void;
}

/**
 * Fix: Added missing QuestTrackerProps export
 */
export interface QuestTrackerProps {
    addLog: (entry: any) => void;
}

export interface LocationTrackerProps {
    addLog: (entry: any) => void;
    onSaveNote: (note: any) => void;
    onImageGenerated?: (image: any) => void;
    onShowImage?: (image: any) => void;
}

export interface NpcTrackerProps {
    addLog: (entry: any) => void;
    onImageGenerated?: (image: any) => void;
}

export interface GeneratorsProps {
    onImageGenerated?: (image: any) => void;
    onShowImage?: (image: any) => void;
    addLog: (entry: any) => void;
}

export type AiProvider = 'polza' | 'openrouter';

/**
 * Fix: Added missing CampaignMode type
 */
export type CampaignMode = 'standard' | 'echoes';

export interface RuleSection {
    id: string;
    title: string;
    category: string;
    content?: string;
    table?: { label: string; value: string }[];
    list?: string[];
}
