
import { CampaignNpc, LoreNpc, LoreQuest, FullQuest, BreachEvent } from './narrative';

export interface Landmark {
    id: string;
    name: string;
    description: string;
    x: number;
    y: number;
    iconType?: 'star' | 'info' | 'hazard' | 'skull';
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
    landmarks?: Landmark[];
    mapGrid?: string[][];
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

export type MapBlockType = 'wall' | 'floor' | 'door' | 'water' | 'hazard' | 'stairs' | 'secret' | 'window' | 'void';

export interface MapMarker {
    id: string;
    x: number;
    y: number;
    type: 'npc' | 'loot' | 'landmark' | 'enemy';
    label: string;
    description: string;
}

export interface MapLevel {
    id: string;
    name: string; // e.g., "Ground Floor", "Cellar", "Level 2"
    grid: MapBlockType[][];
    markers: MapMarker[];
}

export interface MapData {
    levels: MapLevel[];
    scale: string;
    name: string;
}

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
