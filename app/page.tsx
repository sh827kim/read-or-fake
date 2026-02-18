'use client';

import { useState, useCallback, useEffect } from 'react';
import FileUploader from '@/app/components/FileUploader';
import ProgressBar from '@/app/components/ProgressBar';
import ReportTable from '@/app/components/ReportTable';
import ApiKeyModal from '@/app/components/ApiKeyModal';
import type { BookReport, AnalysisResult } from '@/app/lib/types';
import { downloadResults, downloadTemplate } from '@/app/lib/download';
import { getWebSettings, hasAiKey, type WebSettings } from '@/app/lib/web-storage';

type AppStep = 'upload' | 'analyzing' | 'results';

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [reports, setReports] = useState<BookReport[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<WebSettings | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // localStorage에서 AI 설정 불러오기
  useEffect(() => {
    setAiSettings(getWebSettings());
  }, []);

  const handleParsed = useCallback((parsed: BookReport[]) => {
    setReports(parsed);
    setResults([]);
    setSelectedIndex(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (reports.length === 0) return;

    setStep('analyzing');
    setProgress({ current: 0, total: reports.length });
    setError(null);
    setResults([]); // 결과 초기화

    let completedCount = 0;

    // 순차적으로 API 호출 (진행률 업데이트를 위해)
    for (const report of reports) {
      try {
        const response = await fetch('/api/verify-books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reports: [report] }), // 하나씩 전송
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // 결과 누적 업데이트
        setResults(prev => [...prev, ...data.results]);
      } catch (err) {
        // 개별 건 실패 시에도 계속 진행
        console.error('분석 실패:', err);
        setResults(prev => [
          ...prev,
          {
            report,
            verification: { found: false },
            status: 'error',
            errorMessage: '서버 연결 실패',
          }
        ]);
      } finally {
        completedCount++;
        setProgress({ current: completedCount, total: reports.length });
      }
    }

    setStep('results');
  }, [reports]);

  const handleDownload = useCallback(() => {
    downloadResults(results);
  }, [results]);

  const handleUpdateResult = useCallback((index: number, updated: AnalysisResult) => {
    setResults(prev => prev.map((r, i) => i === index ? updated : r));
  }, []);

  const handleReset = useCallback(() => {
    setStep('upload');
    setReports([]);
    setResults([]);
    setSelectedIndex(null);
    setError(null);
  }, []);

  const aiConfigured = aiSettings !== null && hasAiKey(aiSettings);

  return (
    <>
      {/* 헤더 */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-lg">📖</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                읽긴했니?
              </h1>
              <p className="text-xs text-muted">독후감 진위 검증 서비스</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${aiConfigured
                  ? 'border-success/30 text-success bg-success/5 hover:bg-success/10'
                  : 'border-border text-muted hover:bg-surface-hover'
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {aiConfigured ? 'AI 설정됨' : 'AI 설정'}
            </button>
            <a
              href="/privacy"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">

        {/* 업로드 단계 */}
        {step === 'upload' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 히어로 */}
            <div className="text-center space-y-3 py-4">
              <h2 className="text-3xl font-bold">
                학생들이 정말 <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">읽었을까요?</span>
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                독후감에 적힌 책이 실제로 존재하는지 확인하고, 책 소개와 감상문을 비교해보세요.
              </p>
            </div>

            {/* 사용 방법 */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📤', title: '1. 업로드', desc: 'CSV 또는 Excel 파일로 독후감을 업로드하세요' },
                { icon: '🔍', title: '2. 검증', desc: '도서 존재 여부를 자동으로 확인합니다' },
                { icon: '📊', title: '3. 비교', desc: '감상문과 책 소개를 비교하고 결과를 다운로드하세요' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-5 text-center space-y-2 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="text-3xl">{item.icon}</div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* 파일 형식 안내 */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">
                    엑셀 파일 헤더에는 아래 내용들을 포함해주세요. (예시는
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="mx-1 text-primary hover:underline underline-offset-2 inline-flex items-center gap-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      템플릿 다운로드
                    </button>
                    참고)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['학번', '책 제목', '작가', '감상문'].map((header) => (
                      <span key={header} className="px-2 py-1 rounded-md bg-surface-hover border border-border text-xs font-mono font-medium">
                        {header}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted text-xs leading-relaxed">
                    * 헤더 이름이 달라도 괜찮아요. (예: 'Title' → '책 제목')<br />
                    * 인식되지 않는 헤더가 있으면 업로드 후 직접 연결할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">독후감 파일 업로드</h3>
              </div>
              <FileUploader onParsed={handleParsed} />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-xl bg-danger-bg border border-danger/20 p-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* 미리보기 테이블 */}
            {reports.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    미리보기 <span className="text-muted font-normal text-sm">({reports.length}건)</span>
                  </h3>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-hover border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-muted">학번</th>
                          <th className="text-left px-4 py-3 font-medium text-muted">책제목</th>
                          <th className="text-left px-4 py-3 font-medium text-muted">작가</th>
                          <th className="text-left px-4 py-3 font-medium text-muted">감상문</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.slice(0, 5).map((report, i) => (
                          <tr key={i} className="border-b border-border last:border-b-0">
                            <td className="px-4 py-3 font-mono text-xs">{report.studentId}</td>
                            <td className="px-4 py-3 font-medium">{report.bookTitle}</td>
                            <td className="px-4 py-3 text-muted">{report.author}</td>
                            <td className="px-4 py-3 text-muted text-xs truncate max-w-xs">
                              {report.review.slice(0, 80)}{report.review.length > 80 ? '...' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reports.length > 5 && (
                    <div className="px-4 py-2 text-xs text-muted bg-surface-hover border-t border-border text-center">
                      외 {reports.length - 5}건 더...
                    </div>
                  )}
                </div>

                {/* 분석 시작 버튼 */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
              <span className="text-3xl">🔍</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">독후감을 분석하고 있습니다</h2>
              <p className="text-muted">책 존재 여부를 확인하는 중...</p>
            </div>
            <div className="w-full max-w-md">
              <ProgressBar
                current={progress.current}
                total={progress.total}
                label="분석 진행률"
              />
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {step === 'results' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 결과 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">분석 결과</h2>
                <p className="text-muted text-sm mt-1">총 {results.length}건의 독후감이 검증되었습니다</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  새로 분석
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  결과 다운로드
                </button>
              </div>
            </div>

            {/* 결과 테이블 */}
            <ReportTable
              results={results}
              onSelectReport={(index) => setSelectedIndex(selectedIndex === index ? null : index)}
              selectedIndex={selectedIndex}
              onUpdateResult={handleUpdateResult}
              settings={aiSettings}
              onOpenSettings={() => setShowApiKeyModal(true)}
            />
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        <p>📖 읽긴했니? — 선생님을 위한 독후감 진위 검증 서비스</p>
        <p className="mt-1">업로드된 파일은 서버에 저장되지 않습니다.</p>
      </footer>

      {/* AI API 키 설정 모달 */}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSaved={(saved) => {
            setAiSettings(saved);
            setShowApiKeyModal(false);
          }}
        />
      )}
    </>
  );
}
