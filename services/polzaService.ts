
import { CampaignSettings, FullQuest, CampaignNpc, TravelResult } from "../types";

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

// Helper to get global campaign settings context
const getCampaignContext = (): string => {
    try {
        const saved = localStorage.getItem('dmc_campaign_settings');
        if (!saved) return "";
        const s: CampaignSettings = JSON.parse(saved);
        return `КОНТЕКСТ КАМПАНИИ: Мир: "${s.worldName}". Тон игры: "${s.tone}". Уровень группы: ${s.partyLevel}. Учитывай это при генерации.`;
    } catch (e) {
        return "";
    }
};

// Helper to clean text from Markdown code blocks and artifacts
const cleanText = (text: string): string => {
  if (!text) return "";
  // Remove ```json ... ``` or just ``` ... ``` blocks
  let cleaned = text.replace(/```(?:json|html|xml|markdown)?\s*([\s\S]*?)\s*```/g, '$1');
  // Remove any remaining standalone code block markers
  cleaned = cleaned.replace(/^```/gm, '').replace(/```$/gm, '');
  return cleaned.trim();
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
    
    const body: any = {
        model: model,
        prompt: prompt 
    };

    // Resolution Mapping
    // Models require specific resolutions, not just strings like "16:9".
    let size = "1024x1024"; 
    
    if (requestedRatio === "16:9") size = "1024x1024"; // Default fallback for stability
    if (model === 'seedream-v4' || model === 'gpt4o-image') {
        if (requestedRatio === "16:9") size = "1792x1024"; 
        else if (requestedRatio === "9:16") size = "1024x1792";
        else size = "1024x1024";
    } else {
        // Default 1024x1024 for most models to ensure compatibility
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
    // Some endpoints return the ID immediately in `id`, others in `requestId`
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
            console.log(`Polling image ${requestId}: status=${status}`, result);

            if (status === 'completed' || status === 'succeeded' || status === 'success' || status === 'done' || status === 'finished' || status === 'ready' || status === 'generated') {
                if (Array.isArray(result.output) && result.output.length > 0) return result.output[0];
                if (result.url) return result.url;
                if (result.image) return result.image;
                if (typeof result.output === 'string') return result.output;
                
                // Fallback: sometimes result IS the url if it's a direct link in `output` object key
                if (result.output && typeof result.output.url === 'string') return result.output.url;

                throw new Error("API вернуло успех, но ссылка на изображение не найдена.");
            } else if (status === 'failed' || status === 'error') {
                throw new Error(`Генерация не удалась: ${result.error || 'Неизвестная ошибка'}`);
            }
        } catch (e: any) {
            if (e.message.includes('Генерация не удалась') || e.message.includes('ссылка на изображение не найдена')) {
                throw e;
            }
            // Ignore network blips during polling
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
    Сгенерируй от 2 до 5 событий в зависимости от расстояния и опасности региона. 
    Используй русский язык. Отвечай ТОЛЬКО валидным JSON.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Сгенерируй путешествие." }
        ], true);
        return JSON.parse(cleanText(text));
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
  const systemPrompt = `Ты помощник ДМ. Генерируй списки боевой добычи в формате HTML. Кратко и по делу. ${context}`;
  const userPrompt = `Бой завершен. Побеждены враги: ${monsters.join(', ')}. Средний уровень группы: ${avgLevel}.
  Сгенерируй список добычи (монеты, трофеи, расходники).`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ]);
    return cleanText(text);
  });
};

export const generateTrinket = async (type: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты генератор атмосферных мелочей для D&D. Формат ответа: HTML список. ${context}`;
    const userPrompt = `Сгенерируй 5 предметов "карманного лута" или безделушек, которые можно найти: ${type}.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateScenarioDescription = async (context: string): Promise<string> => {
    const campContext = getCampaignContext();
    const systemPrompt = `Ты профессиональный рассказчик (Нарратор). Твоя задача — описывать сцены для игроков D&D. ${campContext}`;
    const userPrompt = `Напиши короткий, атмосферный текст (до 100 слов) для сцены: "${context}". 
    Сфокусируйся на чувствах (запах, звук, свет). Русский язык.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateQuest = async (level: string, context: string): Promise<string> => {
    const campContext = getCampaignContext();
    const systemPrompt = `Ты генератор квестов. Формат: HTML (<h3>, <p>). ${campContext}`;
    const userPrompt = `Придумай короткий побочный квест для D&D. Уровень: ${level}. Контекст: ${context}.
    Включи: Название, Завязку, Цель, Твист, Награду.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateFullQuestTracker = async (level: number, theme: string): Promise<any> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты мастер квестов. Создай структуру квеста в формате JSON. ${context}
    Структура:
    {
      "title": "Название",
      "giver": "Кто дает квест",
      "summary": "Краткая суть (1 предложение)",
      "description": "Полное описание для мастера (HTML)",
      "objectives": ["Цель 1", "Цель 2"],
      "threats": ["Имя монстра 1", "Имя монстра 2"],
      "reward": "Награда"
    }
    Отвечай ТОЛЬКО валидным JSON.`;
    
    const userPrompt = `Создай квест для уровня ${level}. Тема: ${theme}.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const enhanceQuest = async (questData: FullQuest): Promise<FullQuest> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты опытный Dungeon Master. Твоя задача — улучшить и детализировать существующий набросок квеста. ${context}
    Используй текущие данные, но распиши их подробнее, добавь драмы и конкретики.
    Структура JSON (верни обновленный объект):
    {
      "title": "Название (можно улучшить)",
      "giver": "Заказчик",
      "summary": "Краткая суть (1 предложение)",
      "description": "Детальное художественное описание для мастера (HTML, добавь атмосферы)",
      "objectives": ["Список конкретных шагов/целей (3-5 шагов)"],
      "threats": ["Список конкретных монстров, подходящих по смыслу"],
      "reward": "Награда (золото + предмет)"
    }
    Отвечай ТОЛЬКО валидным JSON.`;

    // Create a stripped down version to save tokens, removing IDs and UI state
    const inputData = {
        title: questData.title,
        description: questData.description,
        giver: questData.giver,
        summary: questData.summary
    };

    const userPrompt = `Улучши этот квест: ${JSON.stringify(inputData)}`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        
        const enhancedData = JSON.parse(cleanText(text));
        
        // Merge back, preserving ID and status
        return {
            ...questData,
            title: enhancedData.title || questData.title,
            giver: enhancedData.giver || questData.giver,
            summary: enhancedData.summary || questData.summary,
            description: enhancedData.description || questData.description,
            reward: enhancedData.reward || questData.reward,
            // Convert plain strings back to Objective objects if returned as strings
            objectives: Array.isArray(enhancedData.objectives) 
                ? enhancedData.objectives.map((txt: string) => ({ id: Date.now().toString() + Math.random(), text: txt, completed: false }))
                : questData.objectives,
            threats: enhancedData.threats || questData.threats
        };
    });
};

export const parseQuestFromText = async (inputText: string): Promise<any> => {
    const systemPrompt = `Ты аналитик текста D&D. Преобразуй входящий текст в структуру квеста JSON.
    Структура:
    {
      "title": "Название",
      "giver": "Заказчик",
      "summary": "Суть",
      "description": "Описание",
      "objectives": ["Список целей"],
      "threats": ["Список врагов"],
      "reward": "Награда"
    }
    Если данных нет, придумай логичные заглушки.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Текст: "${inputText.substring(0, 4000)}"` }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateShop = async (shopType: string, location: string): Promise<string> => {
    const context = getCampaignContext();
    const userPrompt = `Создай магазин для D&D. Тип: ${shopType}. Место: ${location}.
    Включи: Название, Владельца (с характером), Описание интерьера, Список 5-7 товаров с ценами (HTML таблица).`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты генератор магазинов D&D. Используй HTML. ${context}` },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const context = getCampaignContext();
    const userPrompt = `Сгенерируй интересную "проходную" локацию: ${type}. Опиши внешний вид и одну интересную деталь/энкаунтер. Формат HTML.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты помощник ДМ. ${context}` },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const context = getCampaignContext();
    const userPrompt = `Создай "Доску объявлений" для поселения: ${setting}. 4 объявления разного типа. Оформи как записки в HTML.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: `Ты помощник ДМ. ${context}` },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generatePuzzle = async (difficulty: string, theme: string): Promise<string> => {
    const userPrompt = `Головоломка D&D. Сложность: ${difficulty}. Тема: ${theme}.
    Включи: Описание комнаты, Механику, Решение, Подсказки, Последствия провала. Формат HTML.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: "Ты дизайнер подземелий." },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const parseLoreFromText = async (rawText: string): Promise<any> => {
  const systemPrompt = `Ты аналитик лора D&D. Извлеки информацию о локации в JSON.
  Структура JSON:
  {
      "name": "Название",
      "description": "Краткое описание (для мастера)",
      "atmosphere": "Атмосфера (сенсорика)",
      "npcs": [{"name": "", "race": "", "description": "", "personality": ""}],
      "secrets": ["Список тайн"],
      "monsters": ["Типы монстров"],
      "loot": ["Интересные предметы"]
  }
  Отвечай ТОЛЬКО валидным JSON.`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Текст: "${rawText.substring(0, 5000)}"` }
    ], true);
    return JSON.parse(cleanText(text));
  });
};

export const generateFullLocation = async (regionName: string, locationType: string): Promise<any> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты создатель миров D&D. Создай детальную локацию в JSON. ${context}
    Структура JSON:
    {
      "name": "Название",
      "type": "Тип",
      "description": "Описание",
      "atmosphere": "Атмосфера",
      "npcs": [{"name": "", "race": "", "description": "", "personality": ""}],
      "secrets": ["Тайны"],
      "monsters": ["Монстры"],
      "loot": ["Лут"],
      "quests": [{"title": "", "description": ""}]
    }
    Отвечай ТОЛЬКО валидным JSON.`;

    const userPrompt = `Регион: ${regionName}. Тип локации: ${locationType}. Впиши в лор Forgotten Realms.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        return JSON.parse(cleanText(text));
    });
};

export const generateLocationContent = async (locationName: string, category: 'npc' | 'secret' | 'loot' | 'quest'): Promise<any[]> => {
    const context = getCampaignContext();
    let systemPrompt = `Отвечай ТОЛЬКО валидным JSON массивом. ${context}`;
    let userPrompt = "";

    if (category === 'npc') {
        userPrompt = `Придумай 2 интересных NPC для локации "${locationName}". Формат: [{"name":, "race":, "description":, "personality":}].`;
    } else if (category === 'quest') {
        userPrompt = `Придумай 2 квеста для локации "${locationName}". Формат: [{"title":, "description":}].`;
    } else if (category === 'secret') {
        userPrompt = `Придумай 3 тайны для локации "${locationName}". Формат: ["тайна1", "тайна2"].`;
    } else if (category === 'loot') {
        userPrompt = `Придумай 5 предметов лута для локации "${locationName}". Формат: ["предмет1", "предмет2"].`;
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
   const userPrompt = `Группа героев в локации "${location}". Начинается бой с: ${monsters.join(', ')}.
   Напиши короткое, динамичное вступление (нарратив) к бою. Русский язык.`;
   
   return withRetry(async () => {
       const text = await makeRequest([
           { role: "system", content: `Ты нарратор боевых сцен D&D. ${context}` },
           { role: "user", content: userPrompt }
       ]);
       return cleanText(text);
   });
};

export const generateExtendedDetails = async (category: string, name: string, locationContext: string): Promise<string> => {
    const context = getCampaignContext();
    const systemPrompt = `Ты Мастер Подземелий. Дай детальную справку в формате HTML. ${context}`;
    let userPrompt = "";
    
    switch (category) {
        case 'npc':
            userPrompt = `NPC "${name}" в "${locationContext}". Статблок (рекомендация), отыгрыш, секреты, лут.`;
            break;
        case 'quest':
            userPrompt = `Квест "${name}" в "${locationContext}". План развития (3 шага), проверки навыков, награда.`;
            break;
        case 'secret':
            userPrompt = `Тайна "${name}" в "${locationContext}". Истина, последствия раскрытия.`;
            break;
        case 'loot':
            userPrompt = `Предмет "${name}" в "${locationContext}". Вид, история, ценность, свойства.`;
            break;
        case 'spell':
            userPrompt = `Заклинание D&D 5e "${name}". Уровень, школа, время, эффект, усиление.`;
            break;
        default:
            userPrompt = `Подробности про "${name}" в контексте "${locationContext}".`;
    }

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateMultiverseBreach = async (): Promise<any> => {
  const systemPrompt = `Ты генератор событий "Project Ark" (Мультивселенная D&D). Верни JSON.
  Структура:
  {
    "name": "Название разлома",
    "originWorld": "Мир происхождения (напр. Кибертрон, Азерот)",
    "description": "Описание разлома",
    "atmosphere": "Сенсорика",
    "anomalyEffect": "Магическая аномалия",
    "anchor": "Объект-якорь",
    "npcs": [{"name": "", "race": "", "description": "", "personality": ""}],
    "secrets": ["Список тайн"],
    "monsters": ["Типы врагов"],
    "loot": ["Артефакты или технологии"],
    "quests": [{"title": "", "description": ""}],
    "breachEvent": {"title": "", "description": "", "goal": "", "threats": []}
  }
  Отвечай ТОЛЬКО валидным JSON.`;

  return withRetry(async () => {
    const text = await makeRequest([
        { role: "system", content: systemPrompt },
        { role: "user", content: "Сгенерируй новый Разлом Мультивселенной. Заполни обитателей, тайны и лут." }
    ], true);
    return JSON.parse(cleanText(text));
  });
};

export const generateRealityGlitch = async (locationName: string): Promise<any> => {
    const systemPrompt = `Верни JSON: {"name": "Название сбоя", "effect": "Описание эффекта"}.`;
    const userPrompt = `Придумай "Сбой Реальности" (Glitch) для локации "${locationName}". Странный физический или магический эффект.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);
        return JSON.parse(cleanText(text));
    });
};
