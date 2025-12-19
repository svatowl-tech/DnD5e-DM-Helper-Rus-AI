
export interface QuestObjective {
    id: string;
    text: string;
    completed: boolean;
}

export interface FullQuest {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'failed' | 'unreceived' | 'received' | 'background';
    giver: string;
    location?: string;
    summary: string;
    description: string;
    objectives: QuestObjective[];
    threats: string[];
    reward: string;
}

export interface LoreNpc {
    name: string;
    race: string;
    description: string;
    personality: string;
}

export interface LoreQuest {
    title: string;
    description: string;
}

/**
 * Fix: Added NpcData interface used by Generators
 */
export interface NpcData {
    name: string;
    race: string;
    class: string;
    description: string;
    personality: string;
    voice: string;
    secret: string;
    hook: string;
}

/**
 * Fix: Update CampaignNpc to match NpcData structure
 */
export interface CampaignNpc extends LoreNpc {
    id: string;
    class?: string;
    location: string;
    status: 'alive' | 'dead' | 'missing';
    attitude: 'friendly' | 'neutral' | 'hostile';
    notes?: string;
    imageUrl?: string;
    secret?: string;
    hook?: string;
    voice?: string;
}

export interface CampaignSettings {
    worldName: string;
    tone: string;
    partyLevel: number;
    activeQuestsSummary: string;
}

export interface BreachEvent {
    title: string;
    description: string;
    goal: string;
    threats: string[];
}
