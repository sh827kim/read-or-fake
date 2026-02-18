'use client';

import { useState, useCallback, Fragment } from 'react';
import BookComparisonCard from './BookComparisonCard';
import type { AnalysisResult, ReviewAnalysis } from '@/app/lib/types';
import { analyzeReview } from '@/app/lib/ai-analyzer';
import { hasAiKey, type WebSettings } from '@/app/lib/web-storage';

const MAX_AI_ANALYSES = 5;

interface ReportTableProps {
    results: AnalysisResult[];
    onSelectReport: (index: number) => void;
    selectedIndex: number | null;
    onUpdateResult: (index: number, updated: AnalysisResult) => void;
    settings: WebSettings | null;
    onOpenSettings: () => void;
}

function getStatusBadge(status: AnalysisResult['status']) {
    switch (status) {
        case 'verified':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-bg text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    검증 완료
                </span>
            );
        case 'not_found':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-bg text-danger">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    미확인
                </span>
            );
        case 'error':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-bg text-warning">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    오류
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                    대기중
                </span>
            );
    }
}

function getVerdictBadge(verdict: ReviewAnalysis['verdict']) {
    switch (verdict) {
        case 'high':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-bg text-success">
                    읽었을 가능성 높음
                </span>
            );
        case 'medium':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-bg text-warning">
                    판단 어려움
                </span>
            );
        case 'low':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-bg text-danger">
                    읽었을 가능성 낮음
                </span>
            );
    }
}

export default function ReportTable({ results, onSelectReport, selectedIndex, onUpdateResult, settings, onOpenSettings }: ReportTableProps) {
    const verifiedCount = results.filter(r => r.status === 'verified').length;
    const notFoundCount = results.filter(r => r.status === 'not_found').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const analyzedCount = results.filter(r => r.reviewAnalysis).length;

    const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const canAnalyzeMore = analyzedCount < MAX_AI_ANALYSES;
    const aiReady = settings !== null && hasAiKey(settings);

    const handleAnalyzeReview = useCallback(async (index: number) => {
        const result = results[index];
        if (!result || result.status !== 'verified' || !result.verification.description) return;
        if (!canAnalyzeMore || !settings || !aiReady) return;

        setAnalyzingIndex(index);
        setAnalysisError(null);

        try {
            const analysis: ReviewAnalysis = await analyzeReview(
                settings,
                result.report.bookTitle,
                result.report.author,
                result.report.review,
                result.verification.description,
            );
            onUpdateResult(index, { ...result, reviewAnalysis: analysis });
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
        } finally {
            setAnalyzingIndex(null);
        }
    }, [results, canAnalyzeMore, onUpdateResult, settings, aiReady]);

    return (
        <div className="space-y-4">
            {/* 요약 */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-success-bg/50 border border-success/20 p-4 text-center">
                    <p className="text-2xl font-bold text-success">{verifiedCount}</p>
                    <p className="text-xs text-success/70 mt-1">검증 완료</p>
                </div>
                <div className="rounded-xl bg-danger-bg/50 border border-danger/20 p-4 text-center">
                    <p className="text-2xl font-bold text-danger">{notFoundCount}</p>
                    <p className="text-xs text-danger/70 mt-1">도서 미확인</p>
                </div>
                <div className="rounded-xl bg-warning-bg/50 border border-warning/20 p-4 text-center">
                    <p className="text-2xl font-bold text-warning">{errorCount}</p>
                    <p className="text-xs text-warning/70 mt-1">오류</p>
                </div>
            </div>

            {/* AI 분석 안내 */}
            {verifiedCount > 0 && (
                <div className="rounded-xl border border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-sm">🤖</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">AI 감상문 분석</p>
                            {aiReady ? (
                                <p className="text-xs text-muted">
                                    의심되는 감상문의 &quot;AI 분석&quot; 버튼을 눌러 개별 분석하세요 (최대 {MAX_AI_ANALYSES}건, 현재 {analyzedCount}건 사용)
                                </p>
                            ) : (
                                <p className="text-xs text-muted">
                                    AI 분석을 사용하려면{' '}
                                    <button
                                        type="button"
                                        onClick={onOpenSettings}
                                        className="text-primary underline underline-offset-2 hover:opacity-80"
                                    >
                                        API 키를 설정
                                    </button>
                                    해주세요.
                                </p>
                            )}
                        </div>
                    </div>
                    {analysisError && (
                        <div className="mt-3 rounded-lg bg-danger-bg border border-danger/20 p-2.5">
                            <p className="text-danger text-xs">{analysisError}</p>
                        </div>
                    )}
                </div>
            )}

            {/* 테이블 */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-hover border-b border-border">
                                <th className="text-left px-4 py-3 font-medium text-muted">학번</th>
                                <th className="text-left px-4 py-3 font-medium text-muted">책제목</th>
                                <th className="text-left px-4 py-3 font-medium text-muted">작가</th>
                                <th className="text-left px-4 py-3 font-medium text-muted">상태</th>
                                <th className="text-left px-4 py-3 font-medium text-muted">상세</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <Fragment key={index}>
                                    <tr
                                        className={`
                                            border-b border-border last:border-b-0
                                            transition-colors duration-150
                                            ${selectedIndex === index ? 'bg-primary/5 border-b-primary/10' : 'hover:bg-surface-hover'}
                                            ${result.status === 'verified' ? 'cursor-pointer' : ''}
                                        `}
                                        onClick={() => result.status === 'verified' && onSelectReport(index)}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">{result.report.studentId}</td>
                                        <td className="px-4 py-3 font-medium">{result.report.bookTitle}</td>
                                        <td className="px-4 py-3 text-muted">{result.report.author}</td>
                                        <td className="px-4 py-3">{getStatusBadge(result.status)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {result.status === 'verified' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); onSelectReport(index); }}
                                                        className="px-2.5 py-1 rounded-md border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                                                    >
                                                        {selectedIndex === index ? '접기' : '상세 비교'}
                                                    </button>
                                                )}
                                                {result.status === 'verified' && !result.reviewAnalysis && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleAnalyzeReview(index); }}
                                                        disabled={analyzingIndex !== null || !canAnalyzeMore || !aiReady}
                                                        title={!aiReady ? 'AI 분석을 사용하려면 API 키를 설정해주세요' : undefined}
                                                        className="px-2.5 py-1 rounded-md bg-gradient-to-r from-accent to-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                                    >
                                                        {analyzingIndex === index ? (
                                                            <>
                                                                <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                                                                분석 중
                                                            </>
                                                        ) : (
                                                            'AI 분석'
                                                        )}
                                                    </button>
                                                )}
                                                {result.reviewAnalysis && (
                                                    <div className="flex flex-col gap-1">
                                                        {getVerdictBadge(result.reviewAnalysis.verdict)}
                                                        <p className="text-xs text-muted max-w-xs leading-relaxed line-clamp-2">
                                                            {result.reviewAnalysis.reasoning}
                                                        </p>
                                                    </div>
                                                )}
                                                {result.status !== 'verified' && result.errorMessage && (
                                                    <span className="text-xs text-muted">{result.errorMessage}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* 상세 패널 (행 확장) */}
                                    {selectedIndex === index && (
                                        <tr className="bg-primary/5 border-b border-border animate-in fade-in duration-200">
                                            <td colSpan={5} className="p-4 pt-1 pb-6">
                                                <div className="pl-4 border-l-2 border-primary/30">
                                                    <BookComparisonCard
                                                        result={result}
                                                        onClose={() => onSelectReport(index)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
