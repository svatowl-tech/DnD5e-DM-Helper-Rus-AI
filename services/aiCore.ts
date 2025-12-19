import { GoogleGenAI } from "@google/genai";
import { AiProvider, CampaignSettings } from "../types";
import { ECHOES_CAMPAIGN_PROMPT } from "../data/prompts/echoesPrompts";

export const POLZA_BASE_URL = 'https://api.polza.ai/api/v1';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Full model list for Polza.ai
export const AVAILABLE_MODELS = [
  { id: 'deepseek/deepseek-v3.2-exp', name: 'DeepSeek V3.2' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'microsoft/phi-4-reasoning-plus', name: 'Phi-4 Reasoning+' },
  { id: 'liquid/lfm-7b', name: 'Liquid LFM 7B' },
  { id: 'google/gemma-3-12b-it', name: 'Google Gemma 3 12B' },
  { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro' },
];

// Free models for OpenRouter
export const OPENROUTER_MODELS = [
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)' },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B (Free)' },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (Free)' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B (Free)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
];

export const AVAILABLE_IMAGE_MODELS = [
    { id: 'seedream-v4', name: 'Seedream 4.0 (Art)' },
    { id: 'gpt4o-image', name: 'GPT-4o Image (Creative)' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini Pro Image' },
];

const STORAGE_KEY_PROVIDER = 'dmc_ai_provider';
const STORAGE_KEY_MODEL = 'dmc_ai_model';
const STORAGE_KEY_IMG_MODEL = 'dmc_ai_image_model';
const STORAGE_KEY_MODE = 'dmc_campaign_mode';
const STORAGE_KEY_API_POLZA = 'dmc_polza_api_key';
const STORAGE_KEY_API_OPENROUTER = 'dmc_openrouter_api_key';

// Fix: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function safeHeaderValue(val: any): string {
    if (val === undefined || val === null) return "";
    const str = String(val);
    return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

export const getAiProvider = (): AiProvider => (localStorage.getItem(STORAGE_KEY_PROVIDER) as AiProvider) || 'polza';
export const setAiProvider = (provider: AiProvider) => localStorage.setItem(STORAGE_KEY_PROVIDER, provider);

export const setCustomApiKey = (key: string, provider: AiProvider = 'polza') => {
    const storageKey = provider === 'openrouter' ? STORAGE_KEY_API_OPENROUTER : STORAGE_KEY_API_POLZA;
    localStorage.setItem(storageKey, key.trim());
};

export const getCustomApiKey = (provider: AiProvider = 'polza') => {
    const storageKey = provider === 'openrouter' ? STORAGE_KEY_API_OPENROUTER : STORAGE_KEY_API_POLZA;
    return localStorage.getItem(storageKey);
};

export const getActiveModel = () => {
    const saved = localStorage.getItem(STORAGE_KEY_MODEL);
    const provider = getAiProvider();
    const models = provider === 'openrouter' ? OPENROUTER_MODELS : AVAILABLE_MODELS;
    
    if (saved && models.some(m => m.id === saved)) {
        return saved;
    }
    return models[0].id;
};

export const setActiveModel = (modelId: string) => localStorage.setItem(STORAGE_KEY_MODEL, modelId);

export const getActiveImageModel = () => {
    const saved = localStorage.getItem(STORAGE_KEY_IMG_MODEL);
    return saved || 'seedream-v4';
};

export const setActiveImageModel = (modelId: string) => localStorage.setItem(STORAGE_KEY_IMG_MODEL, modelId);

export const getCampaignMode = () => (localStorage.getItem(STORAGE_KEY_MODE) === 'echoes' ? 'echoes' : 'standard');
export const setCampaignMode = (mode: string) => localStorage.setItem(STORAGE_KEY_MODE, mode);

export const getCampaignContext = (): string => {
    const mode = getCampaignMode();
    try {
        const saved = localStorage.getItem('dmc_campaign_settings');
        let baseSettings = "";
        if (saved) {
            const s: CampaignSettings = JSON.parse(saved);
            baseSettings = `НАСТРОЙКИ ИГРЫ: Мир: "${s.worldName}". Тон: "${s.tone}". Уровень группы: ${s.partyLevel}. Текущие цели: ${s.activeQuestsSummary || 'не заданы'}.`;
        }
        return mode === 'echoes' ? `${ECHOES_CAMPAIGN_PROMPT}\n\n${baseSettings}` : `КОНТЕКСТ КАМПАНИИ: ${baseSettings}`;
    } catch (e) { return ""; }
};

export const cleanText = (text: string): string => {
    if (!text) return "";
    const codeBlockMatch = text.match(/```(?:json|html|xml|markdown)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    return text.trim();
};

/**
 * Standard request router supporting multiple providers via REST
 */
export async function makeRequest(messages: Array<{role: string, content: string}>, jsonMode: boolean = false): Promise<string> {
    const provider = getAiProvider();
    const model = getActiveModel();
    const baseUrl = provider === 'openrouter' ? OPENROUTER_BASE_URL : POLZA_BASE_URL;
    
    // Key hierarchy: Custom Key > process.env.API_KEY
    let apiKey = getCustomApiKey(provider) || process.env.API_KEY || '';
    apiKey = apiKey.replace(/[^\x21-\x7E]/g, "").trim();

    if (!apiKey) throw new Error(`API Key для ${provider} не найден.`);

    const headers: Record<string, string> = {
        'Authorization': safeHeaderValue(`Bearer ${apiKey}`),
        'Content-Type': 'application/json'
    };

    if (provider === 'openrouter') {
        headers['HTTP-Referer'] = safeHeaderValue(window.location.origin);
        headers['X-Title'] = safeHeaderValue('DM Codex');
    }

    const body: any = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2500,
        stream: false
    };

    if (jsonMode) {
        // Some providers support response_format, some need it in prompt
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Ошибка API (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
    try { return await fn(); } catch (error: any) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}