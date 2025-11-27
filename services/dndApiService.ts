
const BASE_URL = 'https://www.dnd5eapi.co/api';

export interface ApiReference {
  index: string;
  name: string;
  url: string;
}

export type ApiMonsterSummary = ApiReference;

export interface ApiMonsterDetails {
  index: string;
  name: string;
  hit_points: number;
  armor_class: { type: string, value: number }[] | number; // API format varies
  dexterity: number; // For initiative
  challenge_rating: number;
  xp: number;
  type: string;
  actions?: { name: string; desc: string }[];
}

// Generic Search
export const searchEndpoint = async (endpoint: string, query: string): Promise<ApiReference[]> => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}?name=${query}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error searching ${endpoint}:`, error);
        return [];
    }
};

export const getDetails = async (endpoint: string, index: string): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}/${index}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching details for ${endpoint}/${index}:`, error);
        return null;
    }
};

// Specific Helpers (Legacy support + Type Safety)

export const searchMonsters = async (query: string) => searchEndpoint('monsters', query);
export const getMonsterDetails = async (index: string) => getDetails('monsters', index);

export const searchSpells = async (query: string) => searchEndpoint('spells', query);
export const getSpellDetails = async (index: string) => getDetails('spells', index);

export const searchEquipment = async (query: string) => searchEndpoint('equipment', query);
export const getEquipmentDetails = async (index: string) => getDetails('equipment', index);

export const searchMagicItems = async (query: string) => searchEndpoint('magic-items', query);
export const getMagicItemDetails = async (index: string) => getDetails('magic-items', index);

export const searchRules = async (query: string) => searchEndpoint('rule-sections', query);
export const getRuleDetails = async (index: string) => getDetails('rule-sections', index);

// New function to find monsters by CR range and optionally type
export const getMonstersByCr = async (minCr: number, maxCr: number, type?: string): Promise<ApiReference[]> => {
  try {
    const response = await fetch(`${BASE_URL}/monsters`);
    const data = await response.json();
    let allMonsters: ApiReference[] = data.results;

    // Simple shuffling
    allMonsters = allMonsters.sort(() => 0.5 - Math.random());

    const matches: ApiReference[] = [];
    
    // Limit checks to 20 to avoid rate limits/slow UI
    let checks = 0;
    for (const m of allMonsters) {
        if (checks > 20 || matches.length >= 3) break;
        
        const details = await getMonsterDetails(m.index);
        checks++;

        if (details && details.challenge_rating >= minCr && details.challenge_rating <= maxCr) {
            if (!type || details.type.toLowerCase().includes(type.toLowerCase())) {
                matches.push(m);
            }
        }
    }

    return matches;

  } catch (error) {
    console.error("Error getting monsters by CR:", error);
    return [];
  }
};
