'use client';

import { useState } from 'react';
import type { BookReport, ColumnMapping } from '@/lib/types';
import { FIELD_LABELS } from '@/lib/file-parser';

interface HeaderMappingModalProps {
    detectedHeaders: string[];
    missingFields: (keyof BookReport)[];
    partialMapping: Partial<ColumnMapping>;
    onConfirm: (mapping: ColumnMapping) => void;
    onCancel: () => void;
}

export default function HeaderMappingModal({
    detectedHeaders,
    missingFields,
    partialMapping,
    onConfirm,
    onCancel,
}: HeaderMappingModalProps) {
    const [mapping, setMapping] = useState<Partial<ColumnMapping>>(partialMapping);

    const allFields: (keyof BookReport)[] = ['studentId', 'bookTitle', 'author', 'review'];

    const isComplete = allFields.every(field => mapping[field]);

    const handleConfirm = () => {
        if (isComplete) {
            onConfirm(mapping as ColumnMapping);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
                {/* 헤더 */}
                <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-warning-bg flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">헤더를 매핑해주세요</h2>
                            <p className="text-sm text-muted">일부 컬럼을 자동으로 인식하지 못했습니다</p>
                        </div>
                    </div>
                </div>

                {/* 감지된 헤더 목록 */}
                <div className="px-6 py-4 bg-surface-hover/50 border-b border-border">
                    <p className="text-xs text-muted mb-2">업로드한 파일에서 감지된 헤더</p>
                    <div className="flex flex-wrap gap-1.5">
                        {detectedHeaders.map(h => (
                            <span key={h} className="px-2 py-0.5 rounded-md bg-border text-xs font-mono">
                                {h}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 매핑 선택 */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-muted">각 필드에 해당하는 헤더를 선택해주세요.</p>
                    {allFields.map(field => {
                        const isAutoMapped = partialMapping[field] !== undefined;
                        return (
                            <div key={field} className="flex items-center gap-3">
                                <div className="w-24 shrink-0">
                                    <span className={`text-sm font-medium ${missingFields.includes(field) ? 'text-warning' : 'text-muted'}`}>
                                        {FIELD_LABELS[field]}
                                        <span className="text-danger ml-0.5">*</span>
                                    </span>
                                </div>
                                <div className="flex-1 relative">
                                    <select
                                        value={mapping[field] || ''}
                                        onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border text-sm appearance-none bg-surface
                                            focus:outline-none focus:ring-2 focus:ring-primary/30
                                            ${isAutoMapped ? 'border-success/40 bg-success-bg/20' : 'border-border'}
                                        `}
                                    >
                                        <option value="">— 선택하세요 —</option>
                                        {detectedHeaders.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {isAutoMapped && !missingFields.includes(field) && (
                                    <span className="text-xs text-success shrink-0">자동 인식</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 버튼 */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isComplete}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        확인 — 이 매핑으로 파싱
                    </button>
                </div>
            </div>
        </div>
    );
}
