
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

// Helper to clean text from Markdown code blocks
const cleanText = (text: string): string => {
  if (!text) return "";
  return text.replace(/```(?:json|html|xml)?\s*([\s\S]*?)\s*```/g, '$1').trim();
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

async function initiateImageGeneration(prompt: string, requestedSize: string = "1:1"): Promise<string> {
    const apiKey = getCustomApiKey() || process.env.API_KEY || '';
    if (!apiKey) throw new Error("API Key не найден.");

    const model = getActiveImageModel();
    
    // Parameter mapping based on model requirements
    const body: any = {
        model: model,
        prompt: prompt
    };

    // Handle Ratios and specific model params
    if (model === 'gpt4o-image') {
        // GPT-4o supports: 1:1, 2:3, 3:2
        let size = "1:1";
        if (requestedSize === "16:9") size = "3:2"; // Closest mapping
        else if (requestedSize === "9:16") size = "2:3";
        else if (requestedSize === "4:3") size = "1:1"; // Fallback
        else if (requestedSize === "3:4") size = "2:3"; // Fallback
        body.size = size;
        // No imageResolution for GPT-4o
    } 
    else if (model === 'seedream-v4') {
        // Supports: 1:1, 4:3, 3:4, 16:9, 9:16, 4k
        body.size = requestedSize;
        body.imageResolution = "1K"; // Seedream specific
    } 
    else if (model === 'nano-banana') {
        // Supports: auto, 1:1, 3:4, 9:16, 4:3, 16:9
        body.size = requestedSize;
        // No imageResolution
    }

    const response = await fetch(`${BASE_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Ошибка генерации изображения (${response.status})`);
    }

    const data = await response.json();
    return data.requestId;
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
    // 1. Start generation
    const requestId = await initiateImageGeneration(prompt, aspectRatio);
    console.log(`Image generation started. ID: ${requestId}`);
    
    // 2. Poll for status
    // Increased timeout to 5 minutes (150 attempts * 2 seconds)
    const maxAttempts = 150; 
    const delayMs = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs)); 
        
        try {
            const result = await checkImageStatus(requestId);
            
            // Normalize status check (case insensitive)
            const status = (result.status || result.state || '').toLowerCase();
            console.log(`Polling image ${requestId}: status=${status}`, result);

            // Success check
            if (status === 'completed' || status === 'succeeded' || status === 'success' || status === 'done' || status === 'finished' || status === 'ready' || status === 'generated') {
                // Normalization of different API responses
                if (Array.isArray(result.output) && result.output.length > 0) return result.output[0];
                if (result.url) return result.url;
                if (result.image) return result.image;
                // Sometimes output is just a string property "output"
                if (typeof result.output === 'string') return result.output;
                
                console.error("Image generation done but no URL field found in:", result);
                // Don't throw here immediately, maybe it appears in next poll? Unlikely if status is done.
                // Throwing to stop the loop
                throw new Error("API вернуло успех, но ссылка на изображение не найдена.");
            } else if (status === 'failed' || status === 'error') {
                throw new Error(`Генерация не удалась: ${result.error || 'Неизвестная ошибка'}`);
            }
            // If 'processing', 'pending', 'queued', 'in-progress' -> continue loop
        } catch (e: any) {
            console.warn("Polling warning:", e.message);
            if (e.message.includes('Генерация не удалась') || e.message.includes('ссылка на изображение не найдена')) {
                throw e;
            }
            // For network glitches in polling, we continue
        }
        
        attempts++;
    }
    throw new Error("Тайм-аут: Изображение генерируется слишком долго (5+ мин).");
};


// --- Generators ---

export const generateItemCustomization = async (itemName: string, itemType: string, userContext?: string): Promise<any> => {
    const contextPrompt = userContext ? `Пожелания пользователя: "${userContext}".` : "";
    
    const systemPrompt = `Ты — легендарный кузнец и знаток артефактов D&D 5e.
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
  const systemPrompt = `Ты помощник Мастера Подземелий. Генерируй NPC для D&D 5e в формате JSON.
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

export const generateLoot = async (level: number, type: string): Promise<string> => {
  const systemPrompt = `Ты помощник ДМ. Генерируй списки лута в формате HTML (<ul>, <li>, <strong>). Без JSON, просто красивый HTML текст.`;
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
  const systemPrompt = `Ты помощник ДМ. Генерируй списки боевой добычи в формате HTML. Кратко и по делу.`;
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
    const systemPrompt = `Ты генератор атмосферных мелочей для D&D. Формат ответа: HTML список.`;
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
    const systemPrompt = `Ты профессиональный рассказчик (Нарратор). Твоя задача — описывать сцены для игроков D&D.`;
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
    const systemPrompt = `Ты генератор квестов. Формат: HTML (<h3>, <p>).`;
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
    const systemPrompt = `Ты мастер квестов. Создай структуру квеста в формате JSON.
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
    const userPrompt = `Создай магазин для D&D. Тип: ${shopType}. Место: ${location}.
    Включи: Название, Владельца (с характером), Описание интерьера, Список 5-7 товаров с ценами (HTML таблица).`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: "Ты генератор магазинов D&D. Используй HTML." },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const userPrompt = `Сгенерируй интересную "проходную" локацию: ${type}. Опиши внешний вид и одну интересную деталь/энкаунтер. Формат HTML.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: "Ты помощник ДМ." },
            { role: "user", content: userPrompt }
        ]);
        return cleanText(text);
    });
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const userPrompt = `Создай "Доску объявлений" для поселения: ${setting}. 4 объявления разного типа. Оформи как записки в HTML.`;

    return withRetry(async () => {
        const text = await makeRequest([
            { role: "system", content: "Ты помощник ДМ." },
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
    const systemPrompt = `Ты создатель миров D&D. Создай детальную локацию в JSON.
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
    let systemPrompt = "Отвечай ТОЛЬКО валидным JSON массивом.";
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
   const userPrompt = `Группа героев в локации "${location}". Начинается бой с: ${monsters.join(', ')}.
   Напиши короткое, динамичное вступление (нарратив) к бою. Русский язык.`;
   
   return withRetry(async () => {
       const text = await makeRequest([
           { role: "system", content: "Ты нарратор боевых сцен D&D." },
           { role: "user", content: userPrompt }
       ]);
       return cleanText(text);
   });
};

export const generateExtendedDetails = async (category: string, name: string, locationContext: string): Promise<string> => {
    const systemPrompt = "Ты Мастер Подземелий. Дай детальную справку в формате HTML.";
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
