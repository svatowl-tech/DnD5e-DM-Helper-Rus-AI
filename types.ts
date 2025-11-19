
export enum EntityType {
  PLAYER = 'PLAYER',
  NPC = 'NPC',
  MONSTER = 'MONSTER'
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  duration?: number; // in rounds
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
  hidden?: boolean; // Hidden from player view if connected to a VTT
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
  ac: number;
  passivePerception: number;
  notes: string;
  active: boolean; // Is currently playing in the session
  inventory: InventoryItem[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'combat' | 'story' | 'system' | 'roll';
}

export interface NpcData {
  name: string;
  race: string;
  class?: string;
  description: string;
  personality: string;
  secret?: string;
  voice?: string;
  hook?: string;
}

export interface QuestData {
    title: string;
    description: string;
    reward?: string;
}

export interface LocationData {
  id?: string;
  name: string;
  type?: string; // City, Ruins, Forest, etc.
  description: string;
  atmosphere: string;
  npcs: NpcData[];
  secrets: string[];
  monsters: string[]; // Suggested monster types (e.g. "Orc", "Undead")
  loot: string[];
  quests?: QuestData[];
}

// Structure for the static handbook
export interface LoreEntry {
    id: string;
    name: string;
    description: string;
    capital?: string;
    ruler?: string;
    population?: string;
    locations: LocationData[]; // Cities, ruins, forests within the region
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: 'session' | 'location' | 'npc' | 'quest';
  date: string;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  LOCATION = 'location',
  PARTY = 'party',
  COMBAT = 'combat',
  NOTES = 'notes',
  GENERATORS = 'generators',
  SCREEN = 'screen',
  SOUNDS = 'sounds'
}

export interface LocationTrackerProps {
    addLog: (entry: LogEntry) => void;
    onSaveNote: (note: Note) => void;
}

export interface RuleSection {
  id: string;
  title: string;
  category: 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'conditions' | 'spells';
  content?: string;
  table?: { label: string; value: string }[];
  list?: string[];
}
