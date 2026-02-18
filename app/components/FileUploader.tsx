'use client';

import { useCallback, useState, useRef } from 'react';
import { extractHeaders, parseWithMapping, isSupportedFile } from '@/app/lib/file-parser';
import HeaderMappingModal from '@/app/components/HeaderMappingModal';
import type { BookReport, ParseResult, ColumnMapping } from '@/app/lib/types';

interface FileUploaderProps {
    onParsed: (reports: BookReport[]) => void;
}

export default function FileUploader({ onParsed }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingBuffer, setPendingBuffer] = useState<ArrayBuffer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!isSupportedFile(file.name)) {
            setParseResult({
                success: false,
                reports: [],
                errors: ['지원하지 않는 파일 형식입니다. CSV, XLS, XLSX 파일을 업로드해주세요.'],
            });
            return;
        }

        setIsLoading(true);
        setFileName(file.name);
        setPendingBuffer(null);

        try {
            const buffer = await file.arrayBuffer();
            const result = extractHeaders(buffer, file.name);

            if (result.needsMapping) {
                // 헤더 매핑 필요 → 버퍼 보관 후 모달 표시
                setPendingBuffer(buffer);
                setParseResult(result);
            } else {
                setParseResult(result);
                if (result.success) {
                    onParsed(result.reports);
                }
            }
        } catch {
            setParseResult({
                success: false,
                reports: [],
                errors: ['파일을 읽는 중 오류가 발생했습니다.'],
            });
        } finally {
            setIsLoading(false);
        }
    }, [onParsed]);

    const handleMappingConfirm = useCallback((mapping: ColumnMapping) => {
        if (!pendingBuffer || !fileName) return;

        const result = parseWithMapping(pendingBuffer, fileName, mapping);
        setPendingBuffer(null);
        setParseResult(result);
        if (result.success) {
            onParsed(result.reports);
        }
    }, [pendingBuffer, fileName, onParsed]);

    const handleMappingCancel = useCallback(() => {
        setPendingBuffer(null);
        setParseResult(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleReset = useCallback(() => {
        setFileName(null);
        setParseResult(null);
        setPendingBuffer(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    return (
        <>
            <div className="space-y-4">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
                        flex flex-col items-center justify-center text-center
                        transition-all duration-300 ease-out
                        ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleChange}
                        className="hidden"
                    />

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-muted">파일을 분석하고 있습니다...</p>
                        </div>
                    ) : fileName && parseResult?.success ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center">
                                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{fileName}</p>
                                <p className="text-success mt-1">{parseResult.reports.length}건의 독후감을 발견했습니다</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                className="mt-2 text-sm text-muted hover:text-danger underline underline-offset-2"
                            >
                                다른 파일 선택
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-lg">독후감 파일을 업로드하세요</p>
                                <p className="text-muted mt-1">CSV, Excel(.xlsx) 파일을 드래그하거나 클릭하여 선택</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 파싱 오류 표시 */}
                {parseResult && !parseResult.needsMapping && parseResult.errors.length > 0 && (
                    <div className="rounded-xl bg-danger-bg border border-danger/20 p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-danger mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <div>
                                <p className="font-medium text-danger">파일 처리 중 문제가 발생했습니다</p>
                                <ul className="mt-2 space-y-1 text-sm text-danger/80">
                                    {parseResult.errors.map((err, i) => (
                                        <li key={i}>• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 헤더 매핑 모달 */}
            {parseResult?.needsMapping && parseResult.detectedHeaders && parseResult.missingFields && (
                <HeaderMappingModal
                    detectedHeaders={parseResult.detectedHeaders}
                    missingFields={parseResult.missingFields}
                    partialMapping={parseResult.partialMapping ?? {}}
                    onConfirm={handleMappingConfirm}
                    onCancel={handleMappingCancel}
                />
            )}
        </>
    );
}
