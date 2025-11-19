
const BASE_URL = 'https://www.dnd5eapi.co/api';

export interface ApiMonsterSummary {
  index: string;
  name: string;
  url: string;
}

export interface ApiMonsterDetails {
  index: string;
  name: string;
  hit_points: number;
  armor_class: { type: string, value: number }[] | number; // API format varies
  dexterity: number; // For initiative
  challenge_rating: number;
  xp: number;
  type: string;
}

export const searchMonsters = async (query: string): Promise<ApiMonsterSummary[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(`${BASE_URL}/monsters?name=${query}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching monsters:", error);
    return [];
  }
};

export const getMonsterDetails = async (index: string): Promise<ApiMonsterDetails | null> => {
  try {
    const response = await fetch(`${BASE_URL}/monsters/${index}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error fetching monster details:", error);
    return null;
  }
};

// New function to find monsters by CR range and optionally type
export const getMonstersByCr = async (minCr: number, maxCr: number, type?: string): Promise<ApiMonsterSummary[]> => {
  try {
    // Optimization: In a real app, we would cache the full list.
    // D&D API supports query params? No, filtering happens client side usually with this API.
    const response = await fetch(`${BASE_URL}/monsters`);
    const data = await response.json();
    let allMonsters: ApiMonsterSummary[] = data.results;

    // Simple shuffling
    allMonsters = allMonsters.sort(() => 0.5 - Math.random());

    const matches: ApiMonsterSummary[] = [];
    
    // We fetch details for candidates until we fill a small encounter group (1-4 monsters)
    // Limit checks to 20 to avoid rate limits/slow UI
    let checks = 0;
    for (const m of allMonsters) {
        if (checks > 20 || matches.length >= 3) break;
        
        // Basic name filtering to skip obviously wrong things if type is provided loosely
        // e.g. if type is "Undead", maybe skip things with "Dragon" in name to save a call? 
        // Not reliable, so we check details.
        
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
