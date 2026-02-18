// localStorage에 저장되는 AI 설정 타입
export interface WebSettings {
    aiProvider: 'gemini' | 'openai';
    geminiApiKey: string;
    openaiApiKey: string;
    openaiModel: string;
}

const STORAGE_KEY = 'readornot_settings';

const DEFAULT_SETTINGS: WebSettings = {
    aiProvider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
};

/**
 * localStorage에서 AI 설정을 불러옵니다.
 */
export function getWebSettings(): WebSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/**
 * AI 설정을 localStorage에 저장합니다.
 * API 키는 이 브라우저 외부로 전송되지 않습니다.
 */
export function saveWebSettings(settings: Partial<WebSettings>): void {
    if (typeof window === 'undefined') return;
    const current = getWebSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}

/**
 * AI API 키가 설정되었는지 확인합니다.
 */
export function hasAiKey(settings: WebSettings): boolean {
    if (settings.aiProvider === 'gemini') {
        return !!settings.geminiApiKey;
    }
    return !!settings.openaiApiKey;
}
