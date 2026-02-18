// chrome.storage.sync에 저장되는 설정 타입
export interface ExtensionSettings {
    naverClientId: string;
    naverClientSecret: string;
    aiProvider: 'gemini' | 'openai';
    geminiApiKey: string;
    openaiApiKey: string;
    openaiModel: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
    naverClientId: '',
    naverClientSecret: '',
    aiProvider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
};

/**
 * 설정을 chrome.storage.sync에서 읽어옵니다.
 */
export async function getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
            resolve({ ...DEFAULT_SETTINGS, ...result } as ExtensionSettings);
        });
    });
}

/**
 * 설정을 chrome.storage.sync에 저장합니다.
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

/**
 * 네이버 API 키가 설정되었는지 확인합니다.
 */
export function hasNaverKeys(settings: ExtensionSettings): boolean {
    return !!(settings.naverClientId && settings.naverClientSecret);
}

/**
 * AI API 키가 설정되었는지 확인합니다.
 */
export function hasAiKey(settings: ExtensionSettings): boolean {
    if (settings.aiProvider === 'gemini') {
        return !!settings.geminiApiKey;
    }
    return !!settings.openaiApiKey;
}
