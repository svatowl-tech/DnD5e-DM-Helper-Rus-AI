
export * from './aiCore';
export * from './entityService';
export * from './worldService';

import { FullQuest, LocationData } from "../types";
import { makeRequest, withRetry, cleanText, getCampaignContext } from "./aiCore";

// Narrative & Quest services kept here or moved to narrativeService.ts if preferred
export const generateStoryFromLog = async (rawText: string): Promise<string> => {
    const context = getCampaignContext();
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты летописец D&D. Преврати лог в художественный текст. ${context}` },
            { role: "user", content: rawText.substring(0, 8000) }
        ]);
        return cleanText(text);
    });
};

export const enhanceQuest = async (quest: FullQuest): Promise<FullQuest> => {
    const context = getCampaignContext();
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Улучши квест в JSON. ${context}` },
            { role: "user", content: JSON.stringify(quest) }
        ], true);
        return { ...quest, ...JSON.parse(cleanText(text)) };
    });
};

export const generateSubLocation = async (parentLocationName: string, promptInput: string): Promise<LocationData> => {
    const context = getCampaignContext();
    const prompt = `Создай детальную под-локацию (здание, комнату, пещеру или достопримечательность) внутри локации "${parentLocationName}".
    
    Вводные данные от мастера: "${promptInput}".
    
    Верни JSON объект (LocationData):
    - name: Название
    - type: Тип (Таверна, Магазин, Комната и т.д.)
    - description: Описание интерьера и деталей.
    - atmosphere: Звуки, запахи, освещение.
    - npcs: 1-2 ключевых NPC (если уместно).
    - secrets: 1-2 секрета.
    - loot: Интересные предметы.
    - monsters: Возможные угрозы (если уместно).
    
    Русский язык. Будь креативен. ${context}`;

    return withRetry(async () => {
        const text = await makeRequest([{ role: "user", content: prompt }], true);
        return JSON.parse(cleanText(text || "{}"));
    });
};
