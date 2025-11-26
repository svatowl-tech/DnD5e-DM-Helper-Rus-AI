

import { CampaignSettings, FullQuest, CampaignNpc, TravelResult, BestiaryEntry } from "../types";
import { ECHOES_CAMPAIGN_PROMPT } from "../data/prompts/echoesPrompts";

// Available models per user request
export const AVAILABLE_MODELS = [
  { id: 'deepseek/deepseek-v3.2-exp', name: 'DeepSeek V3.2' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'microsoft/phi-4-reasoning-plus', name: 'Phi-4 Reasoning+' },
  { id: 'liquid/lfm-7b', name: 'Liquid LFM 7B' },
  { id: 'google/gemma-3-12b-it', name: 'Google Gemma 3 12B' },
  { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite' },
];

export const AVAILABLE_IMAGE_MODELS = [
    { id: 'seedream-v4', name: 'Seedream 4.0 (Art)' },
    { id: 'gpt4o-image', name: 'GPT-4o Image (Creative)' },
    { id: 'nano-banana', name: 'Nano Banana (Fast/Edit)' },
];

// API Key Management
const STORAGE_KEY_API = 'dmc_polza_api_key';
const STORAGE_KEY_MODEL = 'dmc_ai_model';
const STORAGE_KEY_IMG_MODEL = 'dmc_ai_image_model';
const STORAGE_KEY_MODE = 'dmc_campaign_mode'; // New key for mode
const BASE_API_URL = 'https://api.polza.ai/api/v1';

export const setCustomApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY_API, key.trim());
};

export const getCustomApiKey = () => {
    return localStorage.getItem(STORAGE_KEY_API);
};

// Helper to get active text model
export const getActiveModel = () => {
    const saved = localStorage.getItem(STORAGE_KEY_MODEL);
    if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) {
        return saved;
    }
    return AVAILABLE_MODELS[0].id;
};

export const setActiveModel = (modelId: string) => {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
};

// Helper to get active image model
export const getActiveImageModel = () => {
    const saved = localStorage.getItem(STORAGE_KEY_IMG_MODEL);
    if (saved && AVAILABLE_IMAGE_MODELS.some(m => m.id === saved)) {
        return saved;
    }
    return AVAILABLE_IMAGE_MODELS[0].id;
};

export const setActiveImageModel = (modelId: string) => {
    localStorage.setItem(STORAGE_KEY_IMG_MODEL, modelId);
};

// --- Campaign Mode Management ---
export type CampaignMode = 'standard' | 'echoes';

export const getCampaignMode = (): CampaignMode => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    return (saved === 'echoes') ? 'echoes' : 'standard';
};

export const setCampaignMode = (mode: CampaignMode) => {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
};

// Helper to get global campaign settings context
const getCampaignContext = (): string => {
    const mode = getCampaignMode();
    
    try {
        const saved = localStorage.getItem('dmc_campaign_settings');
        let baseSettings = "";
        if (saved) {
            const s: CampaignSettings = JSON.parse(saved);
            baseSettings = `НАСТРОЙКИ ИГРЫ: Мир: "${s.worldName}". Тон: "${s.tone}". Уровень группы: ${s.partyLevel}.`;
        }

        if (mode === 'echoes') {
            // Inject the massive prompt + local settings
            return `${ECHOES_CAMPAIGN_PROMPT}\n\n${baseSettings}`;
        } else {
            // Standard mode
            return `КОНТЕКСТ КАМПАНИИ: ${baseSettings} Учитывай это при генерации.`;
        }
    } catch (e) {
        return "";
    }
};

// Helper to clean text from Markdown code blocks and extract JSON
const cleanText = (text: string): string => {
  if (!text) return "";

  // 1. Try regex for code blocks first as it's safest
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  
  // 2. Try finding JSON object/array directly by brackets
  const openBrace = text.indexOf('{');
  const openBracket = text.indexOf('[');
  const closeBrace = text.lastIndexOf('}');
  const closeBracket = text.lastIndexOf(']');
  
  let start = -1;
  let end = -1;
  
  // Determine if it's an Object or Array likely
  if (openBrace !== -1 && (openBracket === -1 || openBrace < openBracket)) {
      start = openBrace;
      end = closeBrace;
  } else if (openBracket !== -1) {
      start = openBracket;
      end = closeBracket;
  }
  
  if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
  }
  
  // 3. Last resort: strip markdown but keep content
  return text.replace(/```(?:json|html|xml|markdown)?/g, '').replace(/```/g, '').trim();
};

// Generic Request Handler for Polza API
async function makeRequest(messages: Array<{role: string, content: string}>, jsonMode: boolean = false): Promise<string> {
    const apiKey = getCustomApiKey() || process.env.API_KEY || '';
    if (!apiKey) {
        throw new Error("API Key не найден. Введите его в настройках.");
    }

    const model = getActiveModel();

    const body: any = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2500, // Reasonable limit for generations
        stream: false
    };

    const response = await fetch(`${BASE_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Ошибка API (${response.status})`;
        
        if (response.status === 401) errorMessage = "Ошибка авторизации (401). Проверьте API Key.";
        if (response.status === 402) errorMessage = "Недостаточно средств (402). Пополните баланс Polza.";
        if (response.status === 429) errorMessage = "Слишком много запросов (429). Подождите немного.";
        if (errorData.error?.message) errorMessage += `: ${errorData.error.message}`;
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
}

// Retry wrapper
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // Don't retry on Auth or Payment errors
        if (error.message.includes('401') || error.message.includes('402')) {
            throw error;
        }
        
        if (retries > 0) {
            console.warn(`Polza AI Error. Retrying... (${retries} attempts left).`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

// --- IMAGE GENERATION ---

async function initiateImageGeneration(prompt: string, requestedRatio: string = "1:1"): Promise<string> {
    const apiKey = getCustomApiKey() || process.env.API_KEY || '';
    if (!apiKey) throw new Error("API Key не найден.");

    const model = getActiveImageModel();
    
    // Truncate prompt to avoid 400 Error (Prompt too long)
    // Most models have a limit (e.g. 1000 chars), we limit to 950 to be safe.
    const safePrompt = prompt.substring(0, 950);

    const body: any = {
        model: model,
        prompt: safePrompt 
    };

    // Resolution Mapping
    let size = "1024x1024"; 
    
    if (model === 'seedream-v4' || model === 'gpt4o-image') {
        if (requestedRatio === "16:9") size = "1792x1024"; 
        else if (requestedRatio === "9:16") size = "1024x1792";
        else size = "1024x1024";
    } else {
        // For other models (like nano-banana), stick to 1024x1024 to ensure compatibility 
        // and avoid 400s on unsupported dimensions like 1792x1024.
        size = "1024x1024";
    }

    body.size = size;

    const response = await fetch(`${BASE_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Ошибка генерации изображения (${response.status})`);
    }

    const data = await response.json();
    return data.requestId || data.id; 
}

async function checkImageStatus(requestId: string): Promise<any> {
    const apiKey = getCustomApiKey() || process.env.API_KEY || '';
    
    const response = await fetch(`${BASE_API_URL}/images/${requestId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) throw new Error("Не удалось получить статус генерации.");
    
    return await response.json();
}

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    const requestId = await initiateImageGeneration(prompt, aspectRatio);
    console.log(`Image generation started. ID: ${requestId}`);
    
    const maxAttempts = 150; 
    const delayMs = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs)); 
        
        try {
            const result = await checkImageStatus(requestId);
            const status = (result.status || result.state || '').toLowerCase();

            if (status === 'completed' || status === 'succeeded' || status === 'success' || status === 'done' || status === 'finished' || status === 'ready' || status === 'generated') {
                if (Array.isArray(result.output) && result.output.length > 0) return result.output[0];
                if (result.url) return result.url;
                if (result.image) return result.image;
                if (typeof result.output === 'string') return result.output;
                if (result.output && typeof result.output.url === 'string') return result.output.url;

                throw new Error("API вернуло успех, но ссылка на изображение не найдена.");
            } else if (status === 'failed' || status === 'error') {
                throw new Error(`Генерация не удалась: ${result.error || 'Неизвестная ошибка'}`);
            }
        } catch (e: any) {
            if (e.message.includes('Генерация не удалась') || e.message.includes('ссылка на изображение не найдена')) {
                throw e;
            }
        }
        attempts++;
    }
    throw new Error("Тайм-аут: Изображение генерируется слишком долго (5+ мин).");
};


// --- Generators ---

export const generateTravelScenario = async (
    from: string,
    to: string,
    regionContext: string,
    method: string,
    pace: string
): Promise<TravelResult> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты — Мастер Подземелий (DM), ведущий игру D&D 5e. ${context}
    Твоя задача — сгенерировать сценарий путешествия между двумя точками.
    
    Входные данные:
    - Откуда: ${from}
    - Куда: ${to}
    - Регион/Контекст: ${regionContext}
    - Способ: ${method}
    - Темп: ${pace}

    Верни JSON со следующей структурой:
    {
      "summary": "Краткое описание всего маршрута и атмосферы (1-2 предложения).",
      "duration": Число дней пути (int),
      "events": [
        {
          "day": Номер дня (int),
          "type": "combat" | "social" | "discovery" | "weather" | "quiet",
          "title": "Короткий заголовок события",
          "description": "Художественное описание события (2-3 предложения).",
          "threats": ["Имя монстра 1", "Имя монстра 2"] (только для combat),
          "loot": ["Предмет 1"] (только для discovery),
          "mechanic": "Описание механики, проверки навыка или спасброска (если нужно)"
        }
      ]
    }
    Сгенерируй от 2 до 5 событий. 
    Используй русский язык. Отвечай ТОЛЬКО валидным JSON.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Сгенерируй путешествие." }
        ], true);
        
        let parsed;
        try {
            parsed = JSON.parse(cleanText(text));
        } catch (e) {
            throw new Error("Не удалось прочитать ответ AI (ошибка JSON). Попробуйте снова.");
        }
        
        if (!parsed || typeof parsed !== 'object') throw new Error("AI returned invalid data structure");
        
        return {
            summary: parsed.summary || "Описание отсутствует.",
            duration: typeof parsed.duration === 'number' ? parsed.duration : 1,
            events: Array.isArray(parsed.events) ? parsed.events : []
        };
    });
};

export const generateMonster = async (prompt: string, cr?: string): Promise<BestiaryEntry> => {
    const context = getCampaignContext();
    const crText = cr ? `Challenge Rating (CR): ${cr}.` : "CR выбери подходящий под описание.";

    const systemPrompt = `Ты геймдизайнер D&D 5e. Твоя задача — создать статблок монстра в формате JSON. ${context}
    
    Входной запрос: "${prompt}". ${crText}

    Верни JSON со следующей структурой:
    {
        "name": "Имя монстра",
        "type": "Тип (напр. Нежить, Зверь)",
        "ac": Класс Доспеха (int),
        "hp": Хиты (int),
        "cr": "Показатель опасности (string, напр '1/2' или '5')",
        "xp": Опыт за убийство (int),
        "stats": {
            "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10
        },
        "actions": [
            { "name": "Название атаки/действия", "desc": "Описание (урон, дальность, эффект)" }
        ],
        "description": "Краткое художественное описание внешности и поведения (2-3 предложения)."
    }
    
    Отвечай ТОЛЬКО валидным JSON. Русский язык.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Создай монстра." }
        ], true);
        
        const data = JSON.parse(cleanText(text));
        
        return {
            id: Date.now().toString(),
            ...data,
            source: 'ai'
        };
    });
};

export const generateItemCustomization = async (itemName: string, itemType: string, userContext?: string): Promise<any> => {
    const contextPrompt = userContext ? `Пожелания пользователя: "${userContext}".` : "";
    const context = getCampaignContext();

    const systemPrompt = `Ты — легендарный кузнец и знаток артефактов D&D 5e. ${context}
    Твоя задача — создать уникальное описание предмета в формате JSON.
    Структура JSON:
    {
      "name": "Название предмета",
      "history": "Краткая история создания",
      "positive": "Положительное магическое свойство",
      "negative": "Проклятие или недостаток",
      "visual": "Описание внешнего вида"
    }
    Отвечай ТОЛЬКО валидным JSON.`;

    const userPrompt = `Предмет: ${itemName} (${itemType}). ${contextPrompt}`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateNpc = async (keywords: string): Promise<any> => {
  const context = getCampaignContext();
  const systemPrompt = `Ты помощник Мастера Подземелий. Генерируй NPC для D&D 5e в формате JSON. ${context}
  Структура JSON:
  {
      "name": "Имя",
      "race": "Раса",
      "class": "Класс или Род деятельности",
      "description": "Внешность",
      "personality": "Характер",
      "voice": "Манера речи",
      "secret": "Тайна",
      "hook": "Крючок для квеста"
  }
  Отвечай ТОЛЬКО валидным JSON. Русский язык.`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Ключевые слова: "${keywords}".` }
    ], true);
    return JSON.parse(cleanText(text));
  });
};

export const parseNpcFromText = async (text: string): Promise<any> => {
    const systemPrompt = `Ты аналитик текста D&D. Извлеки данные NPC из текста и верни JSON.
    Структура JSON:
    {
        "name": "Имя",
        "race": "Раса",
        "class": "Класс/Роль",
        "description": "Описание внешности",
        "personality": "Характер",
        "secret": "Секрет (если есть)",
        "hook": "Зацепка (если есть)"
    }
    Если каких-то данных нет, придумай подходящие по смыслу или оставь пустую строку.`;

    return withRetry(async () => {
      const resp = await makeRequest([
          { role: "system", content: systemPrompt },
          { role: "user", content: `Текст: "${text.substring(0, 4000)}"` }
      ], true);
      return JSON.parse(cleanText(resp));
    });
};

export const enhanceNpc = async (npcData: CampaignNpc): Promise<CampaignNpc> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты опытный Dungeon Master. Твоя задача — улучшить и детализировать существующего NPC. ${context}
    Используй текущие данные, но сделай персонажа глубже, добавь деталей внешности и характера.
    Структура JSON (верни обновленный объект):
    {
      "name": "Имя (можно уточнить)",
      "race": "Раса",
      "class": "Класс",
      "description": "Детальное художественное описание внешности",
      "personality": "Глубокий психологический портрет, привычки",
      "voice": "Описание голоса и манеры речи",
      "secret": "Интересная тайна",
      "hook": "Конкретный квестовый крючок",
      "notes": "Дополнительные мастерские заметки"
    }
    Отвечай ТОЛЬКО валидным JSON.`;

    const inputData = {
        name: npcData.name,
        race: npcData.race,
        class: npcData.class,
        description: npcData.description,
        personality: npcData.personality,
        notes: npcData.notes
    };

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Улучши этого NPC: ${JSON.stringify(inputData)}` }
        ], true);
        
        const enhancedData = JSON.parse(cleanText(text));
        
        return {
            ...npcData,
            ...enhancedData,
            id: npcData.id, // Preserve ID
            location: npcData.location, // Preserve state
            status: npcData.status,
            attitude: npcData.attitude
        };
    });
};

export const generateLoot = async (level: number, type: string): Promise<string> => {
  const context = getCampaignContext();
  const systemPrompt = `Ты помощник ДМ. Генерируй списки лута в формате HTML (<ul>, <li>, <strong>). Без JSON, просто красивый HTML текст. ${context}`;
  const userPrompt = `Сгенерируй список добычи для группы уровня ${level}. Контекст: ${type}. 
  Включи стоимость в золоте и 1 интересный магический предмет (с описанием), если уместно.`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ]);
    return cleanText(text);
  });
};

export const generateCombatLoot = async (monsters: string[], avgLevel: number): Promise<string> => {
  const context = getCampaignContext();
  const systemPrompt = `Ты генератор лута для D&D 5e. Твоя задача - создать список добычи.
  Контекст кампании: ${context}.
  Формат ответа: HTML список (<ul>, <li>).
  
  Правила:
  1. Всегда возвращай хотя бы монеты.
  2. Если монстр разумный, добавь оружие или безделушку.
  3. Если монстр зверь, добавь шкуры или ингредиенты.
  4. Не пиши вступлений типа "Вот ваш лут". Только список.`;
  
  const userPrompt = `Бой завершен. Враги: ${monsters.join(', ')}. Уровень группы: ${avgLevel}.
  Что нашли герои на телах?`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ]);
    return cleanText(text) || "<ul><li>Несколько медных монет.</li></ul>";
  });
};

export const generateTrinket = async (type: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор атмосферных мелочей для D&D. Формат ответа: HTML список. ${context}`;
    const userPrompt = `Сгенерируй 5 предметов "карманного лута" или безделушек, которые можно найти ${type} (например, в карманах бандита, на полке, в гнезде).
    Предметы должны быть атмосферными, но не обязательно дорогими.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateScenarioDescription = async (context: string): Promise<string> => {
    const campaignContext = getCampaignContext();
    const systemPrompt = `Ты мастер описаний D&D. Твоя цель — создать атмосферный художественный текст для чтения игрокам вслух (Read Aloud Text).
    Используй сенсорику (звуки, запахи, свет). Объем до 100 слов.
    Контекст кампании: ${campaignContext}`;
    
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Опиши сцену/место: ${context}` }
        ]);
        return cleanText(text);
    });
};

export const generateQuest = async (level: string, context: string): Promise<string> => {
    const campaignContext = getCampaignContext();
    const systemPrompt = `Ты генератор квестов D&D. Формат ответа HTML. ${campaignContext}
    Структура:
    <h3>Название квеста</h3>
    <p><strong>Завязка:</strong> ...</p>
    <p><strong>Цель:</strong> ...</p>
    <p><strong>Твист/Сложность:</strong> ...</p>
    <p><strong>Награда:</strong> ...</p>`;
    
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Квест для уровня ${level}. Контекст: ${context}` }
        ]);
        return cleanText(text);
    });
};

export const generateShop = async (shopType: string, location: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор магазинов D&D. Формат ответа HTML. ${context}`;
    const userPrompt = `Создай магазин. Тип: ${shopType}. Место: ${location}.
    Включи:
    1. Название и имя владельца (с характером).
    2. Интерьер.
    3. Таблица товаров (5-7 шт) с ценами.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор локаций D&D. Формат ответа HTML. ${context}`;
    const userPrompt = `Опиши интересную "проходную" локацию (Point of Interest). Тип: ${type}.
    Включи сенсорику и одну интерактивную деталь.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор досок объявлений D&D. Формат ответа HTML. ${context}`;
    const userPrompt = `Создай 4 объявления для доски в поселении: ${setting}. Разные типы (охота, поиск, услуги).`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generatePuzzle = async (difficulty: string, theme: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты дизайнер ловушек и загадок D&D. Формат ответа HTML. ${context}`;
    const userPrompt = `Придумай головоломку. Сложность: ${difficulty}. Тема: ${theme}.
    Включи: Описание комнаты, Механику, Решение, Подсказки, Наказание за ошибку.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const parseLoreFromText = async (rawText: string): Promise<any> => {
  const systemPrompt = `Ты аналитик лора D&D. Проанализируй текст и извлеки информацию о локации.
  Верни JSON:
  {
      "name": "Название",
      "description": "Краткое описание",
      "atmosphere": "Атмосфера",
      "npcs": [{ "name": "", "race": "", "description": "", "personality": "" }],
      "secrets": ["Секрет 1"],
      "monsters": ["Тип 1"],
      "loot": ["Предмет 1"]
  }`;

  return withRetry(async () => {
      const text = await makeRequest([
          { role: "system", content: systemPrompt },
          { role: "user", content: rawText.substring(0, 6000) }
      ], true);
      return JSON.parse(cleanText(text));
  });
};

export const generateFullLocation = async (regionName: string, locationType: string): Promise<any> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты креативный директор D&D кампании. Твоя задача — создать детальную локацию в формате JSON. ${context}
    
    Входные данные: Регион "${regionName}", Тип "${locationType}".
    
    Структура JSON:
    {
      "name": "Название",
      "type": "Тип",
      "description": "Описание для ДМа",
      "atmosphere": "Художественное описание (звуки, запахи)",
      "npcs": [{ "name": "", "race": "", "description": "", "personality": "" }],
      "secrets": ["Тайна 1", "Тайна 2"],
      "monsters": ["Тип 1", "Тип 2"],
      "loot": ["Предмет 1", "Предмет 2"],
      "quests": [{ "title": "", "description": "" }]
    }
    Отвечай ТОЛЬКО валидным JSON. Русский язык.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Создай локацию." }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateLocationContent = async (locationName: string, category: 'npc' | 'secret' | 'loot' | 'quest'): Promise<any[]> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор контента D&D. Контекст: Локация "${locationName}". ${context}.
    Верни JSON массив (Array).`;
    
    let userPrompt = "";
    if (category === 'npc') {
        userPrompt = `Придумай 2 интересных NPC. JSON: [{ "name", "race", "description", "personality" }]`;
    } else if (category === 'quest') {
        userPrompt = `Придумай 2 коротких квеста. JSON: [{ "title", "description" }]`;
    } else if (category === 'secret') {
        userPrompt = `Придумай 3 тайны/слуха. JSON: ["строка 1", "строка 2"]`;
    } else if (category === 'loot') {
        userPrompt = `Придумай 5 предметов лута. JSON: ["строка 1", "строка 2"]`;
    }

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateEncounterIntro = async (monsters: string[], location: string): Promise<string> => {
   const context = getCampaignContext();
   const systemPrompt = `Ты рассказчик D&D. Напиши динамичное вступление к бою (1 абзац).
   Локация: ${location}. Враги: ${monsters.join(', ')}.
   Сфокусируйся на внезапности и угрозе. ${context}`;

   return withRetry(async () => {
       const text = await makeRequest([
           { role: "system", content: systemPrompt },
           { role: "user", content: "Начинай бой." }
       ]);
       return cleanText(text);
   });
};

export const generateExtendedDetails = async (category: string, name: string, locationContext: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты энциклопедия D&D. Предоставь детальную информацию в формате HTML. ${context}`;
    let userPrompt = "";

    switch (category) {
        case 'npc':
            userPrompt = `Детально опиши NPC "${name}" в локации "${locationContext}".
            Включи: Статблок (рекомендация), Советы по отыгрышу, Скрытые мотивы, Инвентарь.`;
            break;
        case 'quest':
            userPrompt = `Распиши квест "${name}" в локации "${locationContext}".
            Включи: План событий (3 шага), Проверки навыков (DC), Твист, Награда.`;
            break;
        case 'secret':
            userPrompt = `Раскрой тайну "${name}" в локации "${locationContext}".
            Включи: Истину, Кто знает, Последствия раскрытия.`;
            break;
        case 'loot':
            userPrompt = `Опиши предмет "${name}" из "${locationContext}".
            Включи: Внешний вид, Свойства, Стоимость, Историю.`;
            break;
        case 'spell':
            userPrompt = `Опиши заклинание D&D 5e "${name}".
            Включи: Уровень, Школу, Время, Дистанцию, Компоненты, Эффект, Усиление.`;
            break;
        case 'glitch':
            userPrompt = `Опиши аномалию "${name}". Как она влияет на физику и магию? Как её нейтрализовать?`;
            break;
        default:
            userPrompt = `Расскажи подробнее про "${name}" в контексте "${locationContext}".`;
    }

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

// --- ECHOES SPECIFIC GENERATORS ---
export const generateMultiverseBreach = async (): Promise<any> => {
    const systemPrompt = `Ты генератор событий для кампании 'Предатели Реальности' (Echoes). 
    Создай описание 'Разлома Мультивселенной'.
    Верни JSON:
    {
        "name": "Название Разлома",
        "type": "Тип (напр. Техно-магический, Биологический, Псионический)",
        "originWorld": "Мир происхождения (напр. Эберрон, Равника, Дарк Сан, Киберпанк)",
        "description": "Описание аномалии и окружения",
        "atmosphere": "Звуки, запахи, визуальные искажения",
        "monsters": ["Монстр 1", "Монстр 2"],
        "loot": ["Артефакт 1"],
        "breachEvent": {
            "title": "Событие прорыва",
            "description": "Что происходит прямо сейчас",
            "goal": "Как закрыть разлом",
            "threats": ["Угроза 1"]
        }
    }`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Сгенерируй новый разлом." }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateRealityGlitch = async (location: string): Promise<any> => {
    const systemPrompt = `Ты генератор аномалий 'Глюк Реальности'.
    Верни JSON: { "name": "Название", "effect": "Описание механического и визуального эффекта" }.`;
    
    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Локация: ${location}` }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateFullQuestTracker = async (level: number, theme: string): Promise<any> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор квестов для трекера. Верни JSON. ${context}
    Структура:
    {
        "title": "Название",
        "giver": "Кто дал",
        "summary": "Краткая суть (1 предл)",
        "description": "Полное описание (HTML)",
        "objectives": ["Цель 1", "Цель 2", "Цель 3"],
        "threats": ["Враг 1", "Враг 2"],
        "reward": "Награда"
    }`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Уровень ${level}, тема: ${theme}` }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const parseQuestFromText = async (rawText: string): Promise<any> => {
    const systemPrompt = `Проанализируй текст и извлеки структуру квеста в JSON:
    { "title", "giver", "summary", "description", "objectives": [], "threats": [], "reward" }`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: rawText.substring(0, 4000) }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const enhanceQuest = async (quest: FullQuest): Promise<FullQuest> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты опытный ДМ. Улучши квест, добавь деталей, твистов и угроз. ${context}
    Верни обновленный JSON той же структуры.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(quest) }
        ], true);
        const enhanced = JSON.parse(cleanText(text));
        return { ...quest, ...enhanced }; // Merge to keep IDs
    });
};
