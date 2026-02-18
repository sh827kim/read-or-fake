import { useState, useCallback, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import ProgressBar from '@/components/ProgressBar';
import ReportTable from '@/components/ReportTable';
import type { BookReport, AnalysisResult, BookVerification } from '@/lib/types';
import { downloadResults, downloadTemplate } from '@/lib/download';
import { verifyBook } from '@/lib/naver-books';
import { getSettings, hasNaverKeys, type ExtensionSettings } from '@/lib/storage';

type AppStep = 'upload' | 'analyzing' | 'results';

export default function App() {
    const [step, setStep] = useState<AppStep>('upload');
    const [reports, setReports] = useState<BookReport[]>([]);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<ExtensionSettings | null>(null);

    // 설정 로드
    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    const handleParsed = useCallback((parsed: BookReport[]) => {
        setReports(parsed);
        setResults([]);
        setSelectedIndex(null);
        setError(null);
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (!settings || reports.length === 0) return;

        if (!hasNaverKeys(settings)) {
            setError('네이버 API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.');
            return;
        }

        setStep('analyzing');
        setProgress({ current: 0, total: reports.length });
        setError(null);
        setResults([]);

        let completedCount = 0;

        for (const report of reports) {
            try {
                const verification: BookVerification = await verifyBook(
                    report.bookTitle,
                    report.author,
                    settings.naverClientId,
                    settings.naverClientSecret,
                );

                setResults((prev) => [
                    ...prev,
                    {
                        report,
                        verification,
                        status: verification.found ? 'verified' : 'not_found',
                    },
                ]);
            } catch (err) {
                console.error('분석 실패:', err);
                setResults((prev) => [
                    ...prev,
                    {
                        report,
                        verification: { found: false },
                        status: 'error',
                        errorMessage: err instanceof Error ? err.message : '알 수 없는 오류',
                    },
                ]);
            } finally {
                completedCount++;
                setProgress({ current: completedCount, total: reports.length });
            }

            await new Promise((r) => setTimeout(r, 100));
        }

        setStep('results');
    }, [reports, settings]);

    const handleDownload = useCallback(() => {
        downloadResults(results);
    }, [results]);

    const handleUpdateResult = useCallback((index: number, updated: AnalysisResult) => {
        setResults((prev) => prev.map((r, i) => (i === index ? updated : r)));
    }, []);

    const handleReset = useCallback(() => {
        setStep('upload');
        setReports([]);
        setResults([]);
        setSelectedIndex(null);
        setError(null);
    }, []);

    const openOptions = () => {
        chrome.runtime.openOptionsPage();
    };

    const keysConfigured = settings && hasNaverKeys(settings);

    return (
        <>
            {/* 헤더 */}
            <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white text-sm">📖</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                읽긴했니?
                            </h1>
                            <p className="text-[10px] text-muted">독후감 진위 검증 서비스</p>
                        </div>
                    </button>
                    <button
                        onClick={openOptions}
                        className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        설정
                    </button>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 px-4 py-6 w-full overflow-y-auto custom-scrollbar">
                {/* API 키 미설정 경고 */}
                {!keysConfigured && (
                    <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 text-sm space-y-2">
                        <p className="font-semibold text-warning">⚠️ API 키가 설정되지 않았습니다</p>
                        <p className="text-muted text-xs">
                            네이버 검색 API 키를 등록해야 독후감을 분석할 수 있습니다.
                        </p>
                        <button
                            onClick={openOptions}
                            className="px-3 py-1.5 rounded-lg bg-warning text-white text-xs font-medium hover:bg-warning/90 transition-colors"
                        >
                            설정 페이지 열기
                        </button>
                    </div>
                )}

                {/* 업로드 단계 */}
                {step === 'upload' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* 히어로 */}
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">
                                학생들이 정말 <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">읽었을까요?</span>
                            </h2>
                            <p className="text-muted text-xs">
                                독후감에 적힌 책이 실제로 존재하는지 확인하고, 책 소개와 감상문을 비교해보세요.
                            </p>
                        </div>

                        {/* 사용 방법 */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { icon: '📤', title: '1. 업로드', desc: 'CSV/Excel 파일 업로드' },
                                { icon: '🔍', title: '2. 검증', desc: '도서 존재 여부 확인' },
                                { icon: '📊', title: '3. 비교', desc: '감상문 비교 & 다운로드' },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-border bg-surface p-3 text-center space-y-1">
                                    <div className="text-xl">{item.icon}</div>
                                    <h3 className="font-semibold text-xs">{item.title}</h3>
                                    <p className="text-[10px] text-muted">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* 파일 형식 안내 */}
                        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="font-semibold text-foreground">
                                        엑셀 파일 헤더에는 아래 내용들을 포함해주세요. (예시는{' '}
                                        <button onClick={downloadTemplate} className="text-primary hover:underline">
                                            템플릿 다운로드
                                        </button>{' '}
                                        참고)
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['학번', '책 제목', '작가', '감상문'].map((h) => (
                                            <span key={h} className="px-1.5 py-0.5 rounded bg-surface-hover border border-border text-[10px] font-mono">{h}</span>
                                        ))}
                                    </div>
                                    <p className="text-muted text-[10px] leading-relaxed">
                                        * 헤더 이름이 달라도 괜찮아요. 인식되지 않는 헤더는 직접 연결할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 파일 업로드 */}
                        <FileUploader onParsed={handleParsed} />

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="rounded-xl bg-danger-bg border border-danger/20 p-3">
                                <p className="text-danger text-xs">{error}</p>
                            </div>
                        )}

                        {/* 미리보기 테이블 */}
                        {reports.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">
                                    미리보기 <span className="text-muted font-normal">({reports.length}건)</span>
                                </h3>
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-surface-hover border-b border-border">
                                                    <th className="text-left px-3 py-2 font-medium text-muted">학번</th>
                                                    <th className="text-left px-3 py-2 font-medium text-muted">책제목</th>
                                                    <th className="text-left px-3 py-2 font-medium text-muted">작가</th>
                                                    <th className="text-left px-3 py-2 font-medium text-muted">감상문</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.slice(0, 5).map((report, i) => (
                                                    <tr key={i} className="border-b border-border last:border-b-0">
                                                        <td className="px-3 py-2 font-mono">{report.studentId}</td>
                                                        <td className="px-3 py-2 font-medium truncate max-w-[6rem]">{report.bookTitle}</td>
                                                        <td className="px-3 py-2 text-muted">{report.author}</td>
                                                        <td className="px-3 py-2 text-muted truncate max-w-[6rem]">
                                                            {report.review.slice(0, 40)}{report.review.length > 40 ? '...' : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {reports.length > 5 && (
                                        <div className="px-3 py-1.5 text-[10px] text-muted bg-surface-hover border-t border-border text-center">
                                            외 {reports.length - 5}건 더...
                                        </div>
                                    )}
                                </div>

                                {/* 분석 시작 버튼 */}
                                <div className="flex justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleAnalyze}
                                        disabled={!keysConfigured}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        🔍 분석 시작 ({reports.length}건)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 분석 진행 중 */}
                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-500">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <div className="text-center space-y-1">
                            <h2 className="text-lg font-bold">독후감을 분석하고 있습니다</h2>
                            <p className="text-muted text-xs">
                                책 존재 여부를 확인하는 중...
                            </p>
                        </div>
                        <div className="w-full max-w-sm">
                            <ProgressBar current={progress.current} total={progress.total} label="분석 진행률" />
                        </div>
                    </div>
                )}

                {/* 결과 화면 */}
                {step === 'results' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">분석 결과</h2>
                                <p className="text-muted text-xs mt-0.5">총 {results.length}건의 독후감이 검증되었습니다</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleReset}
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-surface-hover transition-colors"
                                >
                                    새로 분석
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-xs font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    결과 다운로드
                                </button>
                            </div>
                        </div>

                        <ReportTable
                            results={results}
                            onSelectReport={(index) => setSelectedIndex(selectedIndex === index ? null : index)}
                            selectedIndex={selectedIndex}
                            onUpdateResult={handleUpdateResult}
                        />
                    </div>
                )}
            </main>

            {/* 푸터 */}
            <footer className="border-t border-border py-3 text-center text-[10px] text-muted">
                📖 읽긴했니? — 선생님을 위한 독후감 진위 검증 서비스
            </footer>
        </>
    );
}
