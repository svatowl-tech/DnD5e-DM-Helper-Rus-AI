
export enum Tab {
    DASHBOARD = 'dashboard',
    COMBAT = 'combat',
    LOCATION = 'location',
    QUESTS = 'quests',
    NPCS = 'npcs',
    GENERATORS = 'generators',
    SCREEN = 'screen',
    PARTY = 'party',
    SOUNDS = 'sounds',
    NOTES = 'notes',
    GALLERY = 'gallery',
    MAP = 'map'
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    toasts: ToastMessage[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export interface LogEntry {
    id: string;
    timestamp: number;
    text: string;
    type: 'roll' | 'combat' | 'story' | 'system';
}

export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    type: 'session' | 'npc' | 'location' | 'quest' | 'other';
    date: string;
}

export interface SavedImage {
    id: string;
    url: string;
    title: string;
    type: 'npc' | 'location' | 'item' | 'monster';
    timestamp: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
