
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Helper to get a fresh client instance for every request to avoid stale state
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const modelName = "gemini-2.5-flash";

// Helper to strip Markdown code blocks
const cleanText = (text: string): string => {
  if (!text) return "";
  // Remove ```html, ```json, ```xml or just ``` blocks, keeping the content inside
  return text.replace(/```(?:json|html|xml)?\s*([\s\S]*?)\s*```/g, '$1').trim();
};

// Retry wrapper for robustness against transient network errors (like code 6 or 500s)
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0) {
            console.warn(`Gemini API Error. Retrying... (${retries} attempts left).`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

export const generateNpc = async (keywords: string): Promise<any> => {
  const prompt = `Создай фэнтези NPC для D&D. Ключевые слова: "${keywords}". 
  Предоставь: Имя, Расу, Класс (опционально), Описание внешности, Характер, Голос/Манеру речи, Секрет и Крючок для квеста.
  Отвечай строго на русском языке.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      race: { type: Type.STRING },
      class: { type: Type.STRING },
      description: { type: Type.STRING },
      personality: { type: Type.STRING },
      voice: { type: Type.STRING },
      secret: { type: Type.STRING },
      hook: { type: Type.STRING },
    },
    required: ["name", "description", "personality"],
  };

  return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
      });
      
      if (response.text) {
          return JSON.parse(cleanText(response.text));
      }
      throw new Error("No text returned");
  });
};

export const generateLoot = async (level: number, type: string): Promise<string> => {
  const prompt = `Сгенерируй список добычи/сокровищ для группы уровня ${level}. Контекст: ${type}. 
  Включи стоимость в золоте и 1 интересный магический предмет (с описанием), если уместно.
  Отформатируй как HTML (используй <ul>, <li>, <strong>). Отвечай на русском языке.`;

  return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return cleanText(response.text || "Добыча не сгенерирована.");
  });
};

export const generateCombatLoot = async (monsters: string[], avgLevel: number): Promise<string> => {
  const prompt = `Бой завершен. Побеждены враги: ${monsters.join(', ')}. Средний уровень группы: ${avgLevel}.
  Сгенерируй список добычи, которую можно найти на телах этих существ (или в их логове).
  Включи монеты, возможные трофеи (шкуры, клыки) и 1-2 интересных предмета или расходника.
  Не пиши вступлений, только список в формате HTML. Русский язык.`;

  return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return cleanText(response.text || "Ничего ценного не найдено.");
  });
};

export const generateTrinket = async (type: string): Promise<string> => {
    const prompt = `Сгенерируй 5 предметов "карманного лута" или безделушек, которые можно найти ${type} (например, в карманах бандита, на полке, в гнезде).
    Предметы должны быть атмосферными, но не обязательно дорогими.
    Отформатируй как HTML список. Русский язык.`;

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Безделушки не найдены.");
    });
};

export const generateScenarioDescription = async (context: string): Promise<string> => {
    const prompt = `Напиши короткий, атмосферный художественный текст (для чтения игрокам вслух) для следующей сцены: ${context}. 
    Сфокусируйся на чувствах (запах, звук, вид). Объем до 100 слов. Отвечай на русском языке.`;

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Описание не сгенерировано.");
    });
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

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Квест не создан.");
    });
};

export const generateShop = async (shopType: string, location: string): Promise<string> => {
    const prompt = `Создай магазин для D&D. Тип: ${shopType}. Место: ${location}.
    Включи:
    1. Название магазина и имя владельца (с яркой чертой характера).
    2. Описание интерьера.
    3. Список из 5-7 товаров с ценами (HTML таблица или список), включая один "особый" предмет.
    Русский язык.`;

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Магазин закрыт.");
    });
};

export const generateMinorLocation = async (type: string): Promise<string> => {
    const prompt = `Сгенерируй интересную "проходную" локацию для путешествия. Тип местности: ${type} (например, деревня, руины у дороги, мост, поляна).
    Опиши:
    - Внешний вид и сенсорику.
    - Одну интересную деталь или энкаунтер (не обязательно боевой).
    Отформатируй красиво в HTML. Русский язык.`;

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Локация не найдена.");
    });
};

export const generateJobBoard = async (setting: string): Promise<string> => {
    const prompt = `Создай содержание "Доски объявлений" для поселения типа: ${setting}.
    Сгенерируй 4 объявления разного характера (охота на монстра, поиск вещи, местная услуга, странное объявление).
    Оформи каждое как стилизованную записку в HTML (цитаты). Русский язык.`;

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Доска пуста.");
    });
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

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Загадка не сложилась.");
    });
};

export const parseLoreFromText = async (rawText: string): Promise<any> => {
  const prompt = `Проанализируй следующий текст из справочника по D&D (Фаэрун). 
  Извлеки информацию о локации, создай структурированное описание.
  Если в тексте несколько локаций, выбери самую главную или общую.
  
  Текст:
  "${rawText.substring(0, 8000)}"

  Верни JSON с полями:
  - name (Название)
  - description (Краткое описание для мастера, макс 3 предложения)
  - atmosphere (Художественное описание атмосферы для игроков, 1-2 предложения)
  - npcs (Список ключевых NPC из текста: {name, race, description})
  - secrets (Список секретов, слухов или угроз из текста)
  - monsters (Список типов монстров, упомянутых или подходящих логически, например ["Орки", "Нежить"])
  - loot (Список интересных предметов или ресурсов, упомянутых в тексте)
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      atmosphere: { type: Type.STRING },
      npcs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             name: { type: Type.STRING },
             race: { type: Type.STRING },
             description: { type: Type.STRING },
             personality: { type: Type.STRING }
          }
        }
      },
      secrets: { type: Type.ARRAY, items: { type: Type.STRING } },
      monsters: { type: Type.ARRAY, items: { type: Type.STRING } },
      loot: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["name", "description", "atmosphere"],
  };

  return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
      });
      
      if (response.text) {
          return JSON.parse(cleanText(response.text));
      }
      throw new Error("No text returned");
  });
};

export const generateFullLocation = async (regionName: string, locationType: string): Promise<any> => {
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
    
    Русский язык.`;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          atmosphere: { type: Type.STRING },
          npcs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                 name: { type: Type.STRING },
                 race: { type: Type.STRING },
                 description: { type: Type.STRING },
                 personality: { type: Type.STRING }
              }
            }
          },
          secrets: { type: Type.ARRAY, items: { type: Type.STRING } },
          monsters: { type: Type.ARRAY, items: { type: Type.STRING } },
          loot: { type: Type.ARRAY, items: { type: Type.STRING } },
          quests: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                  }
              }
          }
        },
        required: ["name", "description", "atmosphere", "npcs"],
      };

      return withRetry(async () => {
          const ai = getClient();
          const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: schema,
              },
          });
          
          if (response.text) {
              return JSON.parse(cleanText(response.text));
          }
          throw new Error("No text returned");
      });
};

export const generateLocationContent = async (locationName: string, category: 'npc' | 'secret' | 'loot' | 'quest'): Promise<any[]> => {
    let prompt = '';
    let schema: Schema = { type: Type.ARRAY, items: { type: Type.STRING } }; // Default

    if (category === 'npc') {
        prompt = `Придумай 2 интересных NPC для локации "${locationName}". Верни JSON массив.`;
        schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    race: { type: Type.STRING },
                    description: { type: Type.STRING },
                    personality: { type: Type.STRING }
                }
            }
        };
    } else if (category === 'quest') {
        prompt = `Придумай 2 коротких квеста для локации "${locationName}". Верни JSON массив.`;
        schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        };
    } else if (category === 'secret') {
        prompt = `Придумай 3 тайны или слуха для локации "${locationName}". Верни JSON массив строк.`;
        schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    } else if (category === 'loot') {
        prompt = `Придумай 5 предметов лута/ресурсов для локации "${locationName}". Верни JSON массив строк.`;
        schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    }

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: schema,
            },
        });
        
        if (response.text) {
            return JSON.parse(cleanText(response.text));
        }
        throw new Error("No text returned");
    });
};

export const generateEncounterIntro = async (monsters: string[], location: string): Promise<string> => {
   const prompt = `Группа искателей приключений находится в локации "${location}". 
   Внезапно начинается бой с существами: ${monsters.join(', ')}.
   Напиши короткое, динамичное вступление к бою (1 абзац), описывающее появление врагов.
   Используй русский язык.`;
   
   return withRetry(async () => {
       const ai = getClient();
       const response = await ai.models.generateContent({
         model: modelName,
         contents: prompt,
       });
       return cleanText(response.text || "Враги атакуют!");
   });
};

export const generateExtendedDetails = async (category: string, name: string, locationContext: string): Promise<string> => {
    let prompt = "";
    
    switch (category) {
        case 'npc':
            prompt = `Действуй как Мастер Подземелий. Предоставь детальную информацию об NPC "${name}" в локации "${locationContext}".
            Включи:
            1. Рекомендованный статблок (например, "Используйте статы Шпиона с +2 к Харизме").
            2. Советы по отыгрышу (голос, манеры, цитата).
            3. Скрытые мотивы или секрет.
            4. Что у него в карманах (лут).
            Формат HTML. Русский язык.`;
            break;
        case 'quest':
            prompt = `Действуй как Мастер Подземелий. Распиши квест "${name}" в локации "${locationContext}".
            Включи:
            1. 3-шаговый план развития событий.
            2. Ключевые проверки навыков (с DC).
            3. Твист или осложнение.
            4. Награда (золото, опыт, предмет).
            Формат HTML. Русский язык.`;
            break;
        case 'secret':
            prompt = `Действуй как Мастер Подземелий. Раскрой тайну/слух: "${name}" в локации "${locationContext}".
            Включи:
            1. Истина, стоящая за слухом.
            2. Кто знает правду.
            3. Последствия раскрытия этой тайны для игроков.
            Формат HTML. Русский язык.`;
            break;
        case 'loot':
            prompt = `Действуй как Мастер Подземелий. Опиши предмет "${name}" найденный в "${locationContext}".
            Включи:
            1. Внешний вид и сенсорику.
            2. Магические свойства (если есть) или историческую ценность.
            3. Оценочную стоимость.
            4. Возможный подвох или проклятие (опционально).
            Формат HTML. Русский язык.`;
            break;
        case 'spell':
            prompt = `Действуй как Мастер Подземелий. Опиши заклинание D&D 5e "${name}".
            Включи:
            1. Уровень, Школу, Время накладывания, Дистанцию, Компоненты, Длительность.
            2. Полное описание эффекта и урона (если есть).
            3. Усиление на более высоких уровнях (если есть).
            4. Классы, которым оно доступно (по возможности).
            Формат HTML. Русский язык.`;
            break;
        default:
            prompt = `Расскажи подробнее про "${name}" в контексте "${locationContext}". HTML. Русский язык.`;
    }

    return withRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return cleanText(response.text || "Информация недоступна.");
    });
};
