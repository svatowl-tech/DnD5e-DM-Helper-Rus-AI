
import { LocationData, TravelResult, FullQuest, MapData } from "../types";
import { withRetry, cleanText, getCampaignContext, makeRequest } from "./aiCore";

/**
 * Generates a tactical multi-level grid map with markers based on location context.
 * Dynamic sizing: AI chooses width/height between 10 and 32 based on location scale.
 */
export const generateDungeonMap = async (location: LocationData): Promise<MapData> => {
    const context = getCampaignContext();
    const prompt = `Создай тактическую многоуровневую карту для D&D в формате JSON.
    Локация: ${location.name}
    Тип: ${location.type}
    Описание: ${location.description}
    Враги: ${location.monsters?.join(', ') || 'придумай подходящих'}

    Требования к JSON:
    1. levels: Массив объектов { id, name, grid, markers }. 
       - Генерируй от 1 до 3 уровней.
       - grid: 2D массив строк. ВАЖНО: Массив не должен быть пустым. Минимальный размер 10x10.
         Выбери размер сетки сам (до 32x32) так, чтобы план был логичен для этого места. 
       - Значения ячеек: 'wall', 'floor', 'door', 'water', 'hazard', 'stairs', 'secret', 'window', 'void'.
       - markers: Объекты { id, x, y, type, label, description }. 
         ВАЖНО: Координаты x/y должны быть в пределах размера сетки.
         Для type: 'enemy', в label пиши конкретное название существа.
    2. name: Название локации.
    3. scale: Масштаб (напр. "1 клетка = 5 футов").

    Логика: Лестницы ('stairs') должны быть на одних и тех же координатах между уровнями.
    Верни ТОЛЬКО JSON объект.
    `;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты — мастер-архитектор и картограф D&D. Твои карты динамичны по размеру и тактически интересны. ${context}` },
            { role: "user", content: prompt }
        ], true);
        const data = JSON.parse(cleanText(text || "{}"));
        return data as MapData;
    });
};

export const parseLoreFromText = async (rawText: string): Promise<any> => {
    const prompt = `Проанализируй текст и извлеки информацию о локации в JSON. Текст: ${rawText.substring(0, 5000)}`;
    return withRetry(async () => {
        const text = await makeRequest([{ role: "user", content: prompt }], true);
        return JSON.parse(cleanText(text || "{}"));
    });
};

export const generateLocationContent = async (locationName: string, category: string): Promise<any[]> => {
    const prompt = `Сгенерируй контент категории "${category}" для локации "${locationName}". Верни JSON массив объектов.`;
    return withRetry(async () => {
        const text = await makeRequest([{ role: "user", content: prompt }], true);
        return JSON.parse(cleanText(text || "[]"));
    });
};

export const generateEncounterIntro = async (monsters: string[], location: string): Promise<string> => {
    const prompt = `Напиши короткое вступление к бою с: ${monsters.join(', ')} в локации "${location}".`;
    return await makeRequest([{ role: "user", content: prompt }]);
};

export const generateScenarioDescription = async (context: string): Promise<string> => {
    return await makeRequest([{ role: "user", content: `Опиши художественно сцену: ${context}` }]);
};

export const generateQuest = async (level: string, context: string): Promise<string> => {
    return await makeRequest([{ role: "user", content: `Придумай квест уровня ${level}. Контекст: ${context}. Используй HTML.` }]);
};

export const generateFullQuestTracker = async (level: number, theme: string): Promise<any> => {
    const prompt = `Создай детальный квест уровня ${level} на тему "${theme}" в JSON: { "title", "giver", "summary", "description", "objectives": ["string"], "threats": ["string"], "reward" }`;
    const text = await makeRequest([{ role: "user", content: prompt }], true);
    return JSON.parse(cleanText(text || "{}"));
};

export const parseQuestFromText = async (text: string): Promise<any> => {
    return generateFullQuestTracker(1, `Разбери текст: ${text}`);
};

export const generateMultiverseBreach = async (): Promise<any> => {
    const prompt = `Создай аномалию разлома мультивселенной в JSON.`;
    const text = await makeRequest([{ role: "user", content: prompt }], true);
    return JSON.parse(cleanText(text || "{}"));
};

export const generateRealityGlitch = async (location: string): Promise<any> => {
    const prompt = `Создай глюк реальности в "${location}" в JSON: { "name", "effect" }`;
    const text = await makeRequest([{ role: "user", content: prompt }], true);
    return JSON.parse(cleanText(text || "{}"));
};

export const enhanceEntityDraft = async (type: string, data: any): Promise<any> => {
    const prompt = `Дополни черновик ${type}: ${JSON.stringify(data)}. Верни JSON: { "suggestedType", "addedDescription" }`;
    const text = await makeRequest([{ role: "user", content: prompt }], true);
    return JSON.parse(cleanText(text || "{}"));
};

export const generateTravelScenario = async (from: string, to: string, context: string, method: string, pace: string, duration: number): Promise<TravelResult> => {
    const prompt = `Сгенерируй путешествие в JSON: { "summary", "duration", "events": [{ "day", "type", "title", "description", "threats": ["string"] }] }. От ${from} до ${to}, ${duration} дней. Способ: ${method}, Темп: ${pace}. Контекст: ${context}`;
    const text = await makeRequest([{ role: "user", content: prompt }], true);
    return JSON.parse(cleanText(text || "{}"));
};

export const generateFullLocation = async (regionName: string, locationType: string): Promise<any> => {
    const context = getCampaignContext();
    const prompt = `Создай детальную D&D локацию.
    Регион: ${regionName} (Forgotten Realms).
    Тип локации: ${locationType}.
    
    Локация должна вписываться в лор этого региона.
    Верни JSON объект со следующей структурой:
    - name: Название локации
    - type: Тип (напр. Деревня, Руины)
    - description: Краткое описание для ДМа
    - atmosphere: Художественное описание атмосферы (звуки, запахи)
    - npcs: Массив из 2-3 NPC (name, race, description, personality)
    - secrets: Массив из 2 тайн или слухов
    - monsters: Массив из 2-3 типов монстров, которые могут здесь встретиться
    - loot: Массив из 2-3 интересных предметов или ресурсов
    - quests: Массив из 1 квеста {title, description}
    
    Русский язык. ${context}`;

    return withRetry(async () => {
        const text = await makeRequest([{ role: "user", content: prompt }], true);
        return JSON.parse(cleanText(text || "{}"));
    });
};

export const generateShop = async (shopType: string, location: string): Promise<string> => {
    const context = getCampaignContext();
    const prompt = `Создай магазин для D&D. Тип: ${shopType}. Место: ${location}.
    Включи:
    1. Название магазина и имя владельца (с яркой чертой характера).
    2. Описание интерьера.
    3. Список из 5-7 товаров с ценами (HTML таблица или список), включая один "особый" предмет.
    Русский язык. ${context}`;

    return withRetry(async () => {
        return await makeRequest([{ role: "user", content: prompt }]);
    });
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const context = getCampaignContext();
    const prompt = `Сгенерируй интересную "проходную" локацию для путешествия. Тип местности: ${type}.
    Опиши:
    - Внешний вид и сенсорику.
    - Одну интересную деталь или энкаунтер (не обязательно боевой).
    Отформатируй красиво в HTML. Русский язык. ${context}`;

    return withRetry(async () => {
        return await makeRequest([{ role: "user", content: prompt }]);
    });
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const context = getCampaignContext();
    const prompt = `Создай содержание "Доски объявлений" для поселения типа: ${setting}.
    Сгенерируй 4 объявления разного характера (охота на монстра, поиск вещи, местная услуга, странное объявление).
    Оформи каждое как стилизованную записку в HTML (цитаты). Русский язык. ${context}`;

    return withRetry(async () => {
        return await makeRequest([{ role: "user", content: prompt }]);
    });
};

export const generatePuzzle = async (difficulty: string, theme: string): Promise<string> => {
    const context = getCampaignContext();
    const prompt = `Придумай головоломку для D&D подземелья. Сложность: ${difficulty}. Тема: ${theme}.
    Структура (HTML):
    <h3>Название</h3>
    <p><strong>Описание комнаты:</strong> (что видят игроки)</p>
    <p><strong>Механика:</strong> (как это работает)</p>
    <p><strong>Решение:</strong> (ответ)</p>
    <p><strong>Подсказки:</strong> (для проверки Интеллекта)</p>
    <p><strong>Последствия провала:</strong> ...</p>
    Русский язык. ${context}`;

    return withRetry(async () => {
        return await makeRequest([{ role: "user", content: prompt }]);
    });
};
