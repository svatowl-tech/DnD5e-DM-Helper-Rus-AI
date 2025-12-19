
export * from './aiCore';
export * from './entityService';
export * from './worldService';

import { FullQuest } from "../types";
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
