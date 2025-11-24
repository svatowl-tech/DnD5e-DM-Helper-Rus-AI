
export enum EntityType {
  PLAYER = 'PLAYER',
  NPC = 'NPC',
  MONSTER = 'MONSTER'
}

export interface CampaignSettings {
  worldName: string;
  tone: string;
  partyLevel: number;
  activeQuestsSummary?: string;
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
  xp?: number; // Added for difficulty calculation
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
  xp: number; // Added XP tracking
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

// Detailed NPC for the Tracker
export interface CampaignNpc extends NpcData {
    id: string;
    location: string; // Current location name
    status: 'alive' | 'dead' | 'missing';
    attitude: 'friendly' | 'neutral' | 'hostile';
    notes: string;
    faction?: string;
    imageUrl?: string;
}

// Legacy simple quest data for locations
export interface QuestData {
    title: string;
    description: string;
    reward?: string;
}

// Full Quest structure for Tracker
export interface QuestObjective {
    id: string;
    text: string;
    completed: boolean;
}

export interface FullQuest {
    id: string;
    title: string;
    location?: string; // Location binding
    status: 'active' | 'completed' | 'failed';
    giver: string;
    summary: string;
    description: string; // Full text / HTML
    objectives?: QuestObjective[];
    threats?: string[];
    reward?: string;
}

// Data Types
export interface EquipmentItem {
  index: string;
  name: string;
  category: string;
  subcategory?: string;
  cost: string;
  weight?: number;
  description?: string;
  damage?: string;
  damageType?: string;
  range?: string;
  properties?: string[];
  ac?: number;
  dexBonus?: boolean;
  maxDexBonus?: number;
  stealthDisadvantage?: boolean;
  strReq?: number;
}

export interface RuleSection {
  id: string;
  title: string;
  category: 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'equipment' | 'alchemy' | 'conditions' | 'spells' | 'lazy' | 'crafting';
  content?: string;
  table?: { label: string; value: string }[];
  list?: string[];
}

export interface LoreEntry {
    id: string;
    name: string;
    description: string;
    capital?: string;
    ruler?: string;
    population?: string;
    locations: LocationData[];
}

export interface LocationData {
    id?: string;
    name: string;
    type: string;
    description: string;
    atmosphere: string;
    npcs?: NpcData[];
    secrets?: string[];
    monsters?: string[];
    loot?: string[];
    quests?: QuestData[];
    originWorld?: string;
    anomalyEffect?: string;
    anchor?: string;
    breachEvent?: {
        title: string;
        description: string;
        goal: string;
        threats: string[];
    };
}

// Travel Types
export interface TravelEvent {
    day: number;
    type: 'combat' | 'social' | 'discovery' | 'weather' | 'quiet';
    title: string;
    description: string; // Narrative
    threats?: string[]; // For combat
    loot?: string[]; // For discoveries
    locationName?: string; // If a POI is found
    mechanic?: string; // e.g. "Survival DC 15 to avoid exhaustion"
}

export interface TravelResult {
    summary: string;
    duration: number; // Days
    events: TravelEvent[];
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
    type: 'npc' | 'location' | 'item' | 'monster' | 'other';
    timestamp: number;
}

// Audio Types
export type AudioCategory = 'atmosphere' | 'combat' | 'mood' | 'travel' | 'comedy' | 'scifi' | 'special';

export interface Track {
    id: string;
    title: string;
    artist?: string;
    url: string;
    isLocal?: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    category: AudioCategory;
    tracks: Track[];
}

export interface AudioContextType {
    playlists: Playlist[];
    currentTrack: Track | null;
    currentPlaylistId: string | null;
    isPlaying: boolean;
    isShuffle: boolean;
    volume: number;
    isLoading: boolean;
    error: string | null;
    playTrack: (track: Track, playlistId: string) => void;
    playPlaylist: (playlistId: string, shuffle?: boolean) => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    playNext: () => void;
    playPrev: () => void;
    setVolume: (vol: number) => void;
    addTrackToPlaylist: (playlistId: string, track: Track) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    importLocalTracks: (playlistId: string, files: File[]) => void;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  COMBAT = 'combat',
  GENERATORS = 'generators',
  SCREEN = 'screen',
  NOTES = 'notes',
  PARTY = 'party',
  LOCATION = 'location',
  SOUNDS = 'sounds',
  QUESTS = 'quests',
  GALLERY = 'gallery',
  NPCS = 'npcs'
}

export interface GeneratorsProps {
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
    addLog: (entry: LogEntry) => void;
}

export interface PartyManagerProps {
    addLog: (entry: LogEntry) => void;
}

export interface LocationTrackerProps {
    addLog: (entry: LogEntry) => void;
    onSaveNote: (note: Note) => void;
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
}

export interface QuestTrackerProps {
    addLog: (entry: LogEntry) => void;
}

export interface NpcTrackerProps {
    addLog: (entry: LogEntry) => void;
    onImageGenerated?: (image: SavedImage) => void;
}