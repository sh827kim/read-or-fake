'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/app/lib/types';

interface BookComparisonCardProps {
    result: AnalysisResult;
    onClose: () => void;
}

export default function BookComparisonCard({ result, onClose }: BookComparisonCardProps) {
    const { report, verification } = result;
    const [showLightbox, setShowLightbox] = useState(false);

    return (
        <>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/50">
                    <div className="flex items-center gap-4">
                        {verification.thumbnail && (
                            <img
                                src={verification.thumbnail}
                                alt={verification.matchedTitle || report.bookTitle}
                                className="w-12 h-16 rounded-lg object-cover shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                onClick={() => setShowLightbox(true)}
                                title="클릭하여 크게 보기"
                            />
                        )}
                        <div>
                            <h3 className="font-bold text-lg">{verification.matchedTitle || report.bookTitle}</h3>
                            <p className="text-sm text-muted">{verification.matchedAuthor || report.author} · 학번 {report.studentId}</p>
                            {verification.isbn && (
                                <p className="text-xs text-muted/60 font-mono mt-0.5">ISBN: {verification.isbn}</p>
                            )}
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

                {/* 비교 콘텐츠 */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* 학생 감상문 */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <h4 className="font-semibold text-sm text-primary">학생 감상문</h4>
                        </div>
                        <div className="text-sm leading-relaxed text-foreground/80 max-h-64 overflow-y-auto pr-2 whitespace-pre-wrap">
                            {report.review}
                        </div>
                    </div>

                    {/* 책 소개 */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <h4 className="font-semibold text-sm text-accent">책 소개</h4>
                        </div>
                        <div className="text-sm leading-relaxed text-foreground/80 max-h-64 overflow-y-auto pr-2 whitespace-pre-wrap">
                            {verification.description || '책 소개 정보를 찾을 수 없습니다.'}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI 분석 결과 */}
            {result.reviewAnalysis && (
                <div className="mt-3 rounded-2xl border border-border bg-surface overflow-hidden shadow-lg">
                    <div className="px-6 py-4 border-b border-border bg-surface-hover/50 flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <h4 className="font-semibold text-sm">AI 분석 결과</h4>
                        {result.reviewAnalysis.verdict === 'high' && (
                            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                읽었을 가능성 높음
                            </span>
                        )}
                        {result.reviewAnalysis.verdict === 'medium' && (
                            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                판단 어려움
                            </span>
                        )}
                        {result.reviewAnalysis.verdict === 'low' && (
                            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">
                                읽었을 가능성 낮음
                            </span>
                        )}
                    </div>
                    <div className="px-6 py-4">
                        <p className="text-xs text-muted font-medium mb-1.5">판단 근거</p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            {result.reviewAnalysis.reasoning}
                        </p>
                    </div>
                </div>
            )}

            {/* 이미지 라이트박스 */}
            {showLightbox && verification.thumbnail && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setShowLightbox(false)}
                >
                    <div className="relative max-w-sm mx-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <img
                            src={verification.thumbnail}
                            alt={verification.matchedTitle || report.bookTitle}
                            className="w-full rounded-xl shadow-2xl"
                        />
                        <div className="mt-3 text-center">
                            <p className="text-white font-semibold">{verification.matchedTitle || report.bookTitle}</p>
                            <p className="text-white/60 text-sm">{verification.matchedAuthor || report.author}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLightbox(false)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
