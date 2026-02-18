'use client';

import { useState, useEffect } from 'react';
import { getWebSettings, saveWebSettings, type WebSettings } from '@/app/lib/web-storage';

interface ApiKeyModalProps {
    onClose: () => void;
    onSaved: (settings: WebSettings) => void;
}

export default function ApiKeyModal({ onClose, onSaved }: ApiKeyModalProps) {
    const [settings, setSettings] = useState<WebSettings>({
        aiProvider: 'gemini',
        geminiApiKey: '',
        openaiApiKey: '',
        openaiModel: 'gpt-4o-mini',
    });
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

    useEffect(() => {
        setSettings(getWebSettings());
    }, []);

    const handleSave = () => {
        saveWebSettings(settings);
        onSaved(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const testAiKey = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            if (settings.aiProvider === 'gemini') {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] }),
                    },
                );
                setTestResult({
                    ok: res.ok,
                    msg: res.ok ? 'Gemini API 키가 정상 작동합니다.' : `오류: ${res.status}`,
                });
            } else {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { Authorization: `Bearer ${settings.openaiApiKey}` },
                });
                setTestResult({
                    ok: res.ok,
                    msg: res.ok ? 'OpenAI API 키가 정상 작동합니다.' : `오류: ${res.status}`,
                });
            }
        } catch {
            setTestResult({ ok: false, msg: '연결에 실패했습니다.' });
        }
        setTesting(false);
    };

    const hasCurrentKey =
        (settings.aiProvider === 'gemini' && !!settings.geminiApiKey) ||
        (settings.aiProvider === 'openai' && !!settings.openaiApiKey);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg">🤖</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">AI 분석 설정</h2>
                            <p className="text-xs text-muted">API 키는 이 브라우저에만 저장됩니다</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 안내 */}
                    <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-2 text-sm">
                        <p className="font-semibold">🔒 개인정보 보호 안내</p>
                        <p className="text-muted text-xs leading-relaxed">
                            AI 분석 API 키는 <strong className="text-foreground">이 브라우저의 localStorage에만 저장</strong>되며,
                            서버나 외부로 전송되지 않습니다. 도서 검증(네이버 검색)은 별도 API 키 없이 사용 가능합니다.
                        </p>
                    </div>

                    {/* 프로바이더 선택 */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold">AI 프로바이더 선택</label>
                        <div className="flex gap-3">
                            {(['gemini', 'openai'] as const).map((provider) => (
                                <button
                                    key={provider}
                                    type="button"
                                    onClick={() => setSettings({ ...settings, aiProvider: provider })}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${settings.aiProvider === provider
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-muted hover:border-muted/50'
                                        }`}
                                >
                                    {provider === 'gemini' ? '✨ Google Gemini' : '🧠 OpenAI'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gemini 키 */}
                    {settings.aiProvider === 'gemini' && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted">
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                >
                                    Google AI Studio
                                </a>
                                에서 Gemini API 키를 발급받으세요. (무료 사용 가능)
                            </p>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={settings.geminiApiKey}
                                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="AIza..."
                                />
                            </div>
                        </div>
                    )}

                    {/* OpenAI 키 */}
                    {settings.aiProvider === 'openai' && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted">
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                >
                                    OpenAI Platform
                                </a>
                                에서 API 키를 발급받으세요. (유료)
                            </p>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted">OpenAI API Key</label>
                                <input
                                    type="password"
                                    value={settings.openaiApiKey}
                                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="sk-..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted">모델 선택</label>
                                <select
                                    value={settings.openaiModel}
                                    onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-hover text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                >
                                    <option value="gpt-4o-mini">GPT-4o Mini — 가장 저렴, 빠름</option>
                                    <option value="gpt-4o">GPT-4o — 고성능</option>
                                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 키 검증 결과 */}
                    {testResult && (
                        <div
                            className={`text-xs p-3 rounded-xl ${testResult.ok
                                    ? 'text-success bg-success/10 border border-success/20'
                                    : 'text-danger bg-danger/10 border border-danger/20'
                                }`}
                        >
                            {testResult.ok ? '✅ ' : '❌ '}{testResult.msg}
                        </div>
                    )}

                    {/* 버튼 영역 */}
                    <div className="flex gap-3 pt-2">
                        {hasCurrentKey && (
                            <button
                                type="button"
                                onClick={testAiKey}
                                disabled={testing}
                                className="px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {testing ? '검증 중...' : '키 검증'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            {saved ? '✅ 저장되었습니다!' : '설정 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
