
// Audio Types
export type AudioCategory = 'combat' | 'atmosphere' | 'city' | 'horror' | 'mystic' | 'drama' | 'scifi' | 'special';

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
    isAutoDJEnabled: boolean;
    volume: number;
    isLoading: boolean;
    error: string | null;
    playTrack: (track: Track, playlistId: string) => void;
    playPlaylist: (playlistId: string, shuffle?: boolean) => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    toggleAutoDJ: () => void;
    playNext: () => void;
    playPrev: () => void;
    setVolume: (vol: number) => void;
    addTrackToPlaylist: (playlistId: string, track: Track) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    importLocalTracks: (playlistId: string, files: File[]) => void;
    getFile: (trackId: string) => File | undefined;
    playSfx: (url: string) => void;
    stopAllSfx: () => void;
    autoPlayMusic: (type: 'combat' | 'location' | 'travel' | 'victory', contextText?: string) => void;
}

// Toast Types
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

// General Types
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
    GALLERY = 'gallery'
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

// Combat Types
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

// Party Types
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
    addLog: (entry: LogEntry) => void;
}

// Rules & Equipment
export interface RuleSection {
    id: string;
    title: string;
    category: string;
    content?: string;
    table?: { label: string; value: string }[];
    list?: string[];
}

export interface EquipmentItem {
    index: string;
    name: string;
    category: string;
    cost: string;
    weight: number;
    description?: string;
    damage?: string;
    damageType?: string;
    range?: string;
    properties?: string[];
    ac?: number;
    dexBonus?: boolean;
    maxDexBonus?: number;
    strReq?: number;
    stealthDisadvantage?: boolean;
    subcategory?: string;
}

// Generators & AI
export interface NpcData {
    name: string;
    race: string;
    class?: string;
    description: string;
    personality: string;
    voice?: string;
    secret?: string;
    hook?: string;
    imageUrl?: string;
}

export interface GeneratorsProps {
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
    addLog: (entry: LogEntry) => void;
}

export interface CampaignSettings {
    worldName: string;
    tone: string;
    partyLevel: number;
    activeQuestsSummary: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

// Lore & Location
export interface BreachEvent {
    title: string;
    description: string;
    goal: string;
    threats: string[];
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

export interface LocationData {
    id?: string;
    name: string;
    type: string;
    description: string;
    atmosphere: string;
    status?: string;
    imageUrl?: string;
    originWorld?: string;
    npcs?: LoreNpc[] | CampaignNpc[];
    quests?: LoreQuest[] | FullQuest[];
    loot?: string[];
    secrets?: string[];
    monsters?: string[];
    anomalyEffect?: string;
    anchor?: string;
    breachEvent?: BreachEvent;
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

export interface LocationTrackerProps {
    addLog: (entry: LogEntry) => void;
    onSaveNote: (note: Note) => void;
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
}

// Quest Tracking
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

export interface QuestTrackerProps {
    addLog: (entry: LogEntry) => void;
}

// Travel
export interface TravelEvent {
    day: number;
    type: 'combat' | 'social' | 'discovery' | 'weather' | 'quiet';
    title: string;
    description: string;
    threats?: string[];
    loot?: string[];
    mechanic?: string;
    locationName?: string;
}

export interface TravelResult {
    summary: string;
    duration: number;
    events: TravelEvent[];
}

export interface TravelState {
    result: TravelResult;
    completed: number[];
    destination?: {
        name: string;
        regionId?: string;
    };
}

export interface NpcTrackerProps {
    addLog: (entry: LogEntry) => void;
    onImageGenerated?: (image: SavedImage) => void;
}
