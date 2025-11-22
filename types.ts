
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
    status: 'active' | 'completed' | 'failed';
    giver: string;
    summary: string;
    description: string; // Full text / HTML
    objectives: QuestObjective[];
    threats: string[]; // List of monster names
    reward: string;
    location?: string;
    level?: number;
}

export interface BreachEvent {
    title: string;
    description: string;
    threats: string[]; // List of enemies involved in the event
    goal: string; // What players need to do
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
  // Project Ark specific fields
  originWorld?: string;
  anomalyEffect?: string;
  anchor?: string;
  breachEvent?: BreachEvent; // Specific event happening in the breach
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

export interface SavedImage {
  id: string;
  url: string;
  title: string;
  type: 'npc' | 'location' | 'item' | 'monster';
  timestamp: number;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  LOCATION = 'location',
  QUESTS = 'quests',
  PARTY = 'party',
  COMBAT = 'combat',
  NOTES = 'notes',
  GENERATORS = 'generators',
  SCREEN = 'screen',
  SOUNDS = 'sounds',
  GALLERY = 'gallery'
}

export interface LocationTrackerProps {
    addLog: (entry: LogEntry) => void;
    onSaveNote: (note: Note) => void;
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
}

export interface RuleSection {
  id: string;
  title: string;
  category: 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'conditions' | 'spells' | 'equipment' | 'alchemy';
  content?: string;
  table?: { label: string; value: string }[];
  list?: string[];
}

// --- Audio Types ---

export type AudioCategory = 'atmosphere' | 'mood' | 'combat' | 'travel' | 'special' | 'comedy' | 'scifi';

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
  isShuffle: boolean; // New
  volume: number;
  isLoading: boolean;
  error: string | null;
  playTrack: (track: Track, playlistId: string) => void;
  playPlaylist: (playlistId: string, shuffle?: boolean) => void; // New
  togglePlay: () => void;
  toggleShuffle: () => void; // New
  playNext: () => void;
  playPrev: () => void;
  setVolume: (vol: number) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  importLocalTracks: (playlistId: string, files: File[]) => void;
}
