import { useState, useEffect } from 'react';
import { getSettings, saveSettings, type ExtensionSettings } from '@/lib/storage';

export default function Options() {
    const [settings, setSettings] = useState<ExtensionSettings>({
        naverClientId: '',
        naverClientSecret: '',
        aiProvider: 'gemini',
        geminiApiKey: '',
        openaiApiKey: '',
        openaiModel: 'gpt-4o-mini',
    });
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ key: string; ok: boolean; msg: string } | null>(null);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    const handleSave = async () => {
        await saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const testNaverKey = async () => {
        setTesting('naver');
        setTestResult(null);
        try {
            const res = await fetch(
                `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent('해리포터')}&display=1`,
                {
                    headers: {
                        'X-Naver-Client-Id': settings.naverClientId,
                        'X-Naver-Client-Secret': settings.naverClientSecret,
                    },
                },
            );
            setTestResult({
                key: 'naver',
                ok: res.ok,
                msg: res.ok ? '네이버 API 키가 정상 작동합니다.' : `오류: ${res.status} ${res.statusText}`,
            });
        } catch {
            setTestResult({ key: 'naver', ok: false, msg: '연결에 실패했습니다.' });
        }
        setTesting(null);
    };

    const testAiKey = async () => {
        setTesting('ai');
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
                    key: 'ai',
                    ok: res.ok,
                    msg: res.ok ? 'Gemini API 키가 정상 작동합니다.' : `오류: ${res.status}`,
                });
            } else {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { Authorization: `Bearer ${settings.openaiApiKey}` },
                });
                setTestResult({
                    key: 'ai',
                    ok: res.ok,
                    msg: res.ok ? 'OpenAI API 키가 정상 작동합니다.' : `오류: ${res.status}`,
                });
            }
        } catch {
            setTestResult({ key: 'ai', ok: false, msg: '연결에 실패했습니다.' });
        }
        setTesting(null);
    };

    const hasCurrentAiKey =
        (settings.aiProvider === 'gemini' && !!settings.geminiApiKey) ||
        (settings.aiProvider === 'openai' && !!settings.openaiApiKey);

    return (
        <div className="max-w-xl mx-auto p-8 space-y-8">
            {/* 헤더 */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">📖</span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            읽긴했니?
                        </h1>
                        <p className="text-xs text-muted">API 키 설정</p>
                    </div>
                </div>
            </div>

            {/* 서비스 소개 */}
            <section className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-5 space-y-3">
                <h2 className="text-base font-bold">🎓 서비스 소개</h2>
                <p className="text-sm text-muted leading-relaxed">
                    <strong className="text-foreground">읽긴했니?</strong>는 학생들이 제출한 독후감의 진위를 검증하는 도구입니다.
                    독후감에 적힌 책이 실제로 존재하는지 확인하고, AI로 감상문의 진위 여부를 심층 분석합니다.
                </p>
                <div className="text-xs text-muted space-y-1.5 border-t border-border/50 pt-3">
                    <p className="font-semibold text-foreground text-sm">왜 API 키가 필요한가요?</p>
                    <p>
                        이 확장 프로그램은 별도의 서버 없이 <strong className="text-foreground">사용자의 브라우저에서 직접</strong> 외부 API를 호출합니다.
                        따라서 각 API 서비스의 키를 직접 발급받아 등록해야 합니다.
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                        <li><strong className="text-foreground">네이버 검색 API</strong> — 도서 존재 여부 확인 <span className="text-primary font-medium">(필수)</span></li>
                        <li><strong className="text-foreground">AI API (Gemini/OpenAI)</strong> — 감상문 심층 분석 <span className="text-muted">(선택)</span></li>
                    </ul>
                    <p>모든 키는 브라우저에만 저장되며, 외부 서버로 전송되지 않습니다.</p>
                </div>
            </section>

            {/* 네이버 API 키 */}
            <section className="space-y-4 p-5 rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-xl">🔍</span> 네이버 검색 API
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">필수</span>
                    </h2>
                    <button
                        onClick={testNaverKey}
                        disabled={!settings.naverClientId || !settings.naverClientSecret || testing === 'naver'}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {testing === 'naver' ? '검증 중...' : '키 검증'}
                    </button>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                    독후감에 적힌 책이 실제로 존재하는지 네이버 도서 검색으로 확인합니다.{' '}
                    <a href="https://developers.naver.com/apps/" target="_blank" rel="noreferrer" className="text-primary underline">
                        Naver Developers
                    </a>
                    에서 애플리케이션을 등록하고 Client ID/Secret을 발급받으세요.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted">Client ID</label>
                        <input
                            type="text"
                            value={settings.naverClientId}
                            onChange={(e) => setSettings({ ...settings, naverClientId: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50"
                            placeholder="발급받은 Client ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted">Client Secret</label>
                        <input
                            type="password"
                            value={settings.naverClientSecret}
                            onChange={(e) => setSettings({ ...settings, naverClientSecret: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50"
                            placeholder="발급받은 Client Secret"
                        />
                    </div>
                </div>
                {testResult?.key === 'naver' && (
                    <div className={`text-xs p-2 rounded-lg ${testResult.ok ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                        {testResult.msg}
                    </div>
                )}
            </section>

            {/* AI 분석 설정 */}
            <section className="space-y-4 p-5 rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-xl">🤖</span> AI 분석 설정
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-semibold">선택</span>
                    </h2>
                    {hasCurrentAiKey && (
                        <button
                            onClick={testAiKey}
                            disabled={testing === 'ai'}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {testing === 'ai' ? '검증 중...' : '키 검증'}
                        </button>
                    )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                    AI가 감상문 내용과 실제 책 소개를 비교하여 학생이 책을 읽었을 가능성을 판단합니다.
                    설정하지 않아도 도서 검증 기능은 정상적으로 사용할 수 있습니다.
                </p>

                {/* 프로바이더 선택 */}
                <div className="flex gap-3">
                    {(['gemini', 'openai'] as const).map((provider) => (
                        <button
                            key={provider}
                            onClick={() => setSettings({ ...settings, aiProvider: provider })}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${settings.aiProvider === provider
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted hover:border-muted/50'
                                }`}
                        >
                            {provider === 'gemini' ? '✨ Google Gemini' : '🧠 OpenAI'}
                        </button>
                    ))}
                </div>

                {/* Gemini 키 */}
                {settings.aiProvider === 'gemini' && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted">
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary underline">
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
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50"
                                placeholder="미입력 시 AI 분석 기능이 비활성화됩니다"
                            />
                        </div>
                    </div>
                )}

                {/* OpenAI 키 */}
                {settings.aiProvider === 'openai' && (
                    <div className="space-y-3">
                        <p className="text-xs text-muted">
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">
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
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm font-mono focus:outline-none focus:border-primary/50"
                                placeholder="미입력 시 AI 분석 기능이 비활성화됩니다"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-muted">모델 선택</label>
                            <select
                                value={settings.openaiModel}
                                onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm focus:outline-none focus:border-primary/50"
                            >
                                <option value="gpt-4o-mini">GPT-4o Mini — 가장 저렴, 빠름</option>
                                <option value="gpt-5-mini">GPT-5 Mini — 중간 비용, 가장 느림</option>
                                <option value="gpt-4.1-mini">GPT-4.1 Mini — 가장 비쌈, 빠름</option>
                            </select>
                        </div>
                    </div>
                )}

                {testResult?.key === 'ai' && (
                    <div className={`text-xs p-2 rounded-lg ${testResult.ok ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                        {testResult.msg}
                    </div>
                )}
            </section>

            {/* 저장 버튼 */}
            <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
                {saved ? '✅ 저장되었습니다!' : '설정 저장'}
            </button>

            {/* 확장 프로그램 열기 */}
            {saved && (
                <button
                    onClick={() => {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            const tabId = tabs[0]?.id;
                            if (tabId) {
                                chrome.sidePanel.open({ tabId }).catch(() => { });
                            }
                        });
                    }}
                    className="w-full py-2.5 rounded-xl border-2 border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                    📖 읽긴했니? 열기
                </button>
            )}

            <p className="text-center text-xs text-muted">
                API 키는 브라우저에 안전하게 저장되며, 외부로 전송되지 않습니다.
            </p>
        </div>
    );
}
