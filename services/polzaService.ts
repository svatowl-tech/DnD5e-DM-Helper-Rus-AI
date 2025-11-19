
import { LogEntry } from "../types";

// Available models based on the user request
export const AVAILABLE_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 (8B)' },
  { id: 'deepseek/deepseek-r1-distill-llama-8b', name: 'DeepSeek R1 (8B)' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 (32B)' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS (20B)' } // Assuming generic ID mapping
];

// Helper to get stored model or default
export const getActiveModel = () => {
    return localStorage.getItem('dmc_ai_model') || 'meta-llama/llama-3.1-8b-instruct';
};

export const setActiveModel = (modelId: string) => {
    localStorage.setItem('dmc_ai_model', modelId);
};

const BASE_URL = "https://api.polza.ai/api/v1/chat/completions";

// Robust JSON cleaner for open models that love to chat
const cleanJsonText = (text: string): string => {
  if (!text) return "{}";
  // Try to find JSON block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return jsonMatch[1].trim();
  
  // If no block, try to find the first { and last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
  }
  return text.trim();
};

const cleanHtmlText = (text: string): string => {
    if (!text) return "";
    return text.replace(/```(?:html)?\s*([\s\S]*?)\s*```/g, '$1').trim();
};

// Generic request wrapper
async function polzaRequest(messages: any[], jsonMode = false): Promise<string> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const model = getActiveModel();

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                // Some open models support json_object, others don't reliably. 
                // We rely on prompt engineering for broader compatibility.
                // response_format: jsonMode ? { type: "json_object" } : undefined 
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(err.error?.message || `API Error ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Polza AI Error:", error);
        throw error;
    }
}

// --- Generator Implementations ---

export const generateNpc = async (keywords: string): Promise<any> => {
  const prompt = `Создай фэнтези NPC для D&D. Ключевые слова: "${keywords}". 
  Верни ответ СТРОГО в формате JSON без лишнего текста. Структура:
  {
      "name": "Имя",
      "race": "Раса",
      "class": "Класс (если есть)",
      "description": "Описание внешности",
      "personality": "Характер",
      "voice": "Голос/Манера речи",
      "secret": "Секрет",
      "hook": "Крючок для квеста"
  }`;

  const response = await polzaRequest([
      { role: "system", content: "Ты помощник Мастера Подземелий. Ты отвечаешь только валидным JSON." },
      { role: "user", content: prompt }
  ], true);

  return JSON.parse(cleanJsonText(response));
};

export const generateLoot = async (level: number, type: string): Promise<string> => {
  const prompt = `Сгенерируй список добычи/сокровищ для группы уровня ${level}. Контекст: ${type}. 
  Включи стоимость в золоте и 1 интересный магический предмет (с описанием), если уместно.
  Отформатируй как HTML (используй <ul>, <li>, <strong>). Используй русский язык.`;

  const response = await polzaRequest([
      { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
      { role: "user", content: prompt }
  ]);
  return cleanHtmlText(response);
};

export const generateCombatLoot = async (monsters: string[], avgLevel: number): Promise<string> => {
  const prompt = `Бой завершен. Побеждены враги: ${monsters.join(', ')}. Средний уровень группы: ${avgLevel}.
  Сгенерируй список добычи, которую можно найти на телах этих существ (или в их логове).
  Включи монеты, возможные трофеи (шкуры, клыки) и 1-2 интересных предмета или расходника.
  Не пиши вступлений, только список в формате HTML. Русский язык.`;

  const response = await polzaRequest([
      { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
      { role: "user", content: prompt }
  ]);
  return cleanHtmlText(response);
};

export const generateTrinket = async (type: string): Promise<string> => {
    const prompt = `Сгенерируй 5 предметов "карманного лута" или безделушек, которые можно найти ${type} (например, в карманах бандита, на полке, в гнезде).
    Предметы должны быть атмосферными, но не обязательно дорогими.
    Отформатируй как HTML список. Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generateScenarioDescription = async (context: string): Promise<string> => {
    const prompt = `Напиши короткий, атмосферный художественный текст (для чтения игрокам вслух) для следующей сцены: ${context}. 
    Сфокусируйся на чувствах (запах, звук, вид). Объем до 100 слов. Отвечай на русском языке.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты рассказчик фэнтези." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generateQuest = async (level: string, context: string): Promise<string> => {
    const prompt = `Придумай короткий побочный квест (Side Quest) для D&D. Уровень группы: ${level}. Контекст: ${context}.
    Структура ответа (HTML):
    <h3>Название квеста</h3>
    <p><strong>Завязка:</strong> ...</p>
    <p><strong>Цель:</strong> ...</p>
    <p><strong>Твист/Сложность:</strong> ...</p>
    <p><strong>Награда:</strong> ...</p>
    Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generateShop = async (shopType: string, location: string): Promise<string> => {
    const prompt = `Создай магазин для D&D. Тип: ${shopType}. Место: ${location}.
    Включи:
    1. Название магазина и имя владельца (с яркой чертой характера).
    2. Описание интерьера.
    3. Список из 5-7 товаров с ценами (HTML таблица или список), включая один "особый" предмет.
    Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const prompt = `Сгенерируй интересную "проходную" локацию для путешествия. Тип местности: ${type} (например, деревня, руины у дороги, мост, поляна).
    Опиши:
    - Внешний вид и сенсорику.
    - Одну интересную деталь или энкаунтер (не обязательно боевой).
    Отформатируй красиво в HTML. Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const prompt = `Создай содержание "Доски объявлений" для поселения типа: ${setting}.
    Сгенерируй 4 объявления разного характера (охота на монстра, поиск вещи, местная услуга, странное объявление).
    Оформи каждое как стилизованную записку в HTML (цитаты). Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const generatePuzzle = async (difficulty: string, theme: string): Promise<string> => {
    const prompt = `Придумай головоломку для D&D подземелья. Сложность: ${difficulty}. Тема: ${theme}.
    Структура (HTML):
    <h3>Название</h3>
    <p><strong>Описание комнаты:</strong> (что видят игроки)</p>
    <p><strong>Механика:</strong> (как это работает)</p>
    <p><strong>Решение:</strong> (ответ)</p>
    <p><strong>Подсказки:</strong> (для проверки Интеллекта)</p>
    <p><strong>Последствия провала:</strong> ...</p>
    Русский язык.`;

    const response = await polzaRequest([
        { role: "system", content: "Ты помощник ДМа. Отвечай HTML разметкой." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};

export const parseLoreFromText = async (rawText: string): Promise<any> => {
  const prompt = `Проанализируй текст и извлеки информацию о локации.
  Текст: "${rawText.substring(0, 5000)}"
  
  Верни СТРОГО JSON:
  {
    "name": "Название",
    "description": "Краткое описание для мастера",
    "atmosphere": "Художественное описание атмосферы",
    "npcs": [{"name": "Имя", "race": "Раса", "description": "Описание", "personality": "Характер"}],
    "secrets": ["Секрет 1", "Секрет 2"],
    "monsters": ["Тип монстра 1", "Тип монстра 2"],
    "loot": ["Предмет 1", "Предмет 2"]
  }`;

  const response = await polzaRequest([
      { role: "system", content: "Ты аналитик данных. Отвечай только JSON." },
      { role: "user", content: prompt }
  ], true);
  
  return JSON.parse(cleanJsonText(response));
};

export const generateFullLocation = async (regionName: string, locationType: string): Promise<any> => {
    const prompt = `Создай детальную D&D локацию. Регион: ${regionName}. Тип: ${locationType}.
    Верни СТРОГО JSON:
    {
      "name": "Название",
      "type": "Тип",
      "description": "Описание для ДМа",
      "atmosphere": "Атмосфера (звуки, запахи)",
      "npcs": [{"name": "Имя", "race": "Раса", "description": "Вид", "personality": "Характер"}],
      "secrets": ["Тайна 1", "Тайна 2"],
      "monsters": ["Монстр 1", "Монстр 2"],
      "loot": ["Лут 1", "Лут 2"],
      "quests": [{"title": "Название", "description": "Описание"}]
    }`;

    const response = await polzaRequest([
        { role: "system", content: "Ты креативный помощник ДМа. Отвечай только JSON." },
        { role: "user", content: prompt }
    ], true);

    return JSON.parse(cleanJsonText(response));
};

export const generateLocationContent = async (locationName: string, category: 'npc' | 'secret' | 'loot' | 'quest'): Promise<any[]> => {
    let prompt = '';
    if (category === 'npc') {
        prompt = `Придумай 2 интересных NPC для локации "${locationName}". Верни СТРОГО JSON массив объектов: [{"name": "...", "race": "...", "description": "...", "personality": "..."}]`;
    } else if (category === 'quest') {
        prompt = `Придумай 2 коротких квеста для локации "${locationName}". Верни СТРОГО JSON массив объектов: [{"title": "...", "description": "..."}]`;
    } else if (category === 'secret') {
        prompt = `Придумай 3 тайны или слуха для локации "${locationName}". Верни СТРОГО JSON массив строк: ["...", "...", "..."]`;
    } else if (category === 'loot') {
        prompt = `Придумай 5 предметов лута для локации "${locationName}". Верни СТРОГО JSON массив строк: ["...", "..."]`;
    }

    const response = await polzaRequest([
        { role: "system", content: "Ты генератор контента. Отвечай только JSON массивом." },
        { role: "user", content: prompt }
    ], true);

    return JSON.parse(cleanJsonText(response));
};

export const generateEncounterIntro = async (monsters: string[], location: string): Promise<string> => {
   const prompt = `Группа искателей приключений находится в локации "${location}". 
   Внезапно начинается бой с существами: ${monsters.join(', ')}.
   Напиши короткое, динамичное вступление к бою (1 абзац), описывающее появление врагов.
   Используй русский язык.`;
   
   const response = await polzaRequest([
       { role: "system", content: "Ты рассказчик." },
       { role: "user", content: prompt }
   ]);
   return cleanHtmlText(response);
};

export const generateExtendedDetails = async (category: string, name: string, locationContext: string): Promise<string> => {
    let prompt = "";
    
    switch (category) {
        case 'npc':
            prompt = `Действуй как Мастер Подземелий. Предоставь детальную информацию об NPC "${name}" в локации "${locationContext}".
            Включи: статблок (рекомендацию), советы по отыгрышу, скрытые мотивы, лут. Формат HTML.`;
            break;
        case 'quest':
            prompt = `Действуй как Мастер Подземелий. Распиши квест "${name}" в локации "${locationContext}".
            Включи: 3 шага развития, проверки навыков (DC), твист, награду. Формат HTML.`;
            break;
        case 'secret':
            prompt = `Действуй как Мастер Подземелий. Раскрой тайну: "${name}" в локации "${locationContext}".
            Включи: истину, кто знает, последствия. Формат HTML.`;
            break;
        case 'loot':
            prompt = `Опиши предмет "${name}" найденный в "${locationContext}".
            Включи: внешний вид, свойства, стоимость, проклятие (если есть). Формат HTML.`;
            break;
        case 'spell':
            prompt = `Опиши заклинание D&D 5e "${name}".
            Включи: Уровень, Школу, Время, Дистанцию, Компоненты, Длительность, Описание эффекта. Формат HTML.`;
            break;
        default:
            prompt = `Расскажи подробнее про "${name}" в контексте "${locationContext}". HTML.`;
    }

    const response = await polzaRequest([
        { role: "system", content: "Ты эксперт по D&D 5e. Отвечай используя HTML разметку." },
        { role: "user", content: prompt }
    ]);
    return cleanHtmlText(response);
};
