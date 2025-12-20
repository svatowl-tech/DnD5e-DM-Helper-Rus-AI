
import { CampaignNpc, BestiaryEntry, ChatMessage } from "../types";
import { withRetry, cleanText, getCampaignContext, getActiveImageModel, makeRequest, getAiClient } from "./aiCore";

/**
 * Generates an NPC using the configured AI provider (Polza/OpenRouter).
 */
export const generateNpc = async (keywords: string): Promise<any> => {
    const context = getCampaignContext();
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты — мастер D&D. Создай NPC в формате JSON: { "name", "race", "class", "description", "personality", "voice", "secret", "hook" }. ${context}` },
            { role: "user", content: `Ключевые слова для NPC: ${keywords}` }
        ], true);
        return JSON.parse(cleanText(text || "{}"));
    });
};

export const parseNpcFromText = async (text: string): Promise<any> => {
    return generateNpc(`Разбери текст и создай NPC: ${text}`);
};

export const enhanceNpc = async (npc: CampaignNpc): Promise<CampaignNpc> => {
    const result = await generateNpc(`Улучши и детализируй этого NPC: ${JSON.stringify(npc)}`);
    return { ...npc, ...result };
};

/**
 * Generates a full monster statblock. Used by both LocationTracker and LocationMap.
 */
export const generateMonster = async (prompt: string, cr?: string): Promise<BestiaryEntry> => {
    const context = getCampaignContext();
    const finalPrompt = `Создай статблок монстра в JSON: { "name", "type", "ac", "hp", "cr", "xp", "stats": {"str", "dex", "con", "int", "wis", "cha"}, "actions": [{"name", "desc"}], "description" }. Монстр: ${prompt}, CR: ${cr || 'подходящий'}`;
    
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты — мастер D&D. Создавай сбалансированные и интересные статблоки. ${context}` },
            { role: "user", content: finalPrompt }
        ], true);
        const data = JSON.parse(cleanText(text || "{}"));
        return { id: Date.now().toString(), ...data, source: 'ai' };
    });
};

export const generateLoot = async (level: number, type: string): Promise<string> => {
    const prompt = `Сгенерируй список добычи для группы уровня ${level}. Контекст: ${type}. Используй HTML (ul, li).`;
    return withRetry(async () => {
        return await makeRequest([
            { role: "user", content: prompt }
        ]);
    });
};

export const generateCombatLoot = async (monsters: string[], avgLevel: number): Promise<string> => {
    return generateLoot(avgLevel, `Побеждены: ${monsters.join(', ')}`);
};

export const generateTrinket = async (context: string): Promise<string> => {
    return generateLoot(1, `Мелочи/Безделушки ${context}`);
};

export const generateExtendedDetails = async (category: string, name: string, context: string): Promise<string> => {
    const prompt = `Предоставь детальную информацию о ${category} "${name}". Контекст: ${context}. Формат HTML.`;
    return withRetry(async () => {
        return await makeRequest([{ role: "user", content: prompt }]);
    });
};

export const generateItemCustomization = async (name: string, category: string, prompt: string): Promise<any> => {
    const finalPrompt = `Сделай предмет "${name}" (${category}) уникальным артефактом на основе пожелания: "${prompt}". Верни JSON: { "name", "visual", "history", "positive", "negative" }`;
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "user", content: finalPrompt }
        ], true);
        return JSON.parse(cleanText(text || "{}"));
    });
};

export const chatWithNpc = async (npc: CampaignNpc, messages: ChatMessage[]): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты отыгрываешь роль NPC in D&D. Имя: ${npc.name}, Раса: ${npc.race}. Описание: ${npc.description}. ${context}`;
    const userPrompt = messages.map(m => `${m.role === 'user' ? 'Игрок' : npc.name}: ${m.content}`).join('\n');
    
    return withRetry(async () => {
        return await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
    });
};

/**
 * Image generation still uses Gemini SDK.
 */
export const generateImage = async (imagePrompt: string, ratio: string = "1:1"): Promise<string> => {
    const model = getActiveImageModel();
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
        model: model,
        contents: imagePrompt.substring(0, 950),
        config: {
            imageConfig: {
                aspectRatio: ratio as any
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Изображение не сгенерировано.");
};
