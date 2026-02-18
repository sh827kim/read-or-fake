import * as XLSX from 'xlsx';
import type { BookReport, ParseResult, ColumnMapping } from './types';

// 컬럼 헤더 자동 매핑 규칙
const COLUMN_MAPPINGS: Record<keyof BookReport, string[]> = {
    studentId: ['학번', '번호', '학생번호', '출석번호', 'id', 'student_id', 'studentid'],
    bookTitle: ['책제목', '제목', '도서명', '책이름', '도서제목', 'title', 'book_title', 'booktitle'],
    author: ['작가', '저자', '글쓴이', '작성자', '지은이', 'author', 'writer'],
    review: ['감상문', '독후감', '감상평', '내용', '본문', '서평', 'review', 'content', 'report'],
};

export const FIELD_LABELS: Record<keyof BookReport, string> = {
    studentId: '학번',
    bookTitle: '책 제목',
    author: '작가',
    review: '감상문',
};

/**
 * 헤더 이름을 BookReport 필드명으로 자동 매핑
 */
function mapHeader(header: string): keyof BookReport | null {
    const normalized = header.trim().toLowerCase().replace(/\s+/g, '');

    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        if (aliases.some(alias => normalized === alias.replace(/\s+/g, ''))) {
            return field as keyof BookReport;
        }
    }
    return null;
}

/**
 * 파일 확장자가 CSV인지 확인
 */
function isCsvFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.csv');
}

/**
 * BOM(Byte Order Mark) 제거
 */
function stripBom(str: string): string {
    return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

/**
 * ArrayBuffer에서 워크북을 읽어옵니다.
 */
function readWorkbook(buffer: ArrayBuffer, fileName: string): XLSX.WorkBook {
    if (isCsvFile(fileName)) {
        const text = stripBom(new TextDecoder('utf-8').decode(buffer));
        return XLSX.read(text, { type: 'string' });
    }
    return XLSX.read(buffer, { type: 'array' });
}

/**
 * 파일에서 헤더를 추출하고 자동 매핑을 시도합니다.
 * 매핑 실패 시 needsMapping: true와 함께 헤더 목록을 반환합니다.
 */
export function extractHeaders(buffer: ArrayBuffer, fileName: string): ParseResult {
    try {
        const workbook = readWorkbook(buffer, fileName);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            return { success: false, reports: [], errors: ['시트를 찾을 수 없습니다.'] };
        }

        const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
            defval: '',
            raw: false,
        });

        if (rawData.length === 0) {
            return { success: false, reports: [], errors: ['데이터가 없습니다. 파일에 내용이 있는지 확인해주세요.'] };
        }

        const detectedHeaders = Object.keys(rawData[0]);
        const partialMapping: Partial<ColumnMapping> = {};
        const mappedFields = new Set<keyof BookReport>();

        for (const header of detectedHeaders) {
            const field = mapHeader(header);
            if (field && !mappedFields.has(field)) {
                partialMapping[field] = header;
                mappedFields.add(field);
            }
        }

        const requiredFields: (keyof BookReport)[] = ['studentId', 'bookTitle', 'author', 'review'];
        const missingFields = requiredFields.filter(f => !mappedFields.has(f));

        if (missingFields.length > 0) {
            // 자동 매핑 실패 → 사용자 매핑 필요
            return {
                success: false,
                reports: [],
                errors: [],
                needsMapping: true,
                detectedHeaders,
                missingFields,
                partialMapping,
            };
        }

        // 자동 매핑 성공 → 바로 파싱
        return parseWithMapping(buffer, fileName, partialMapping as ColumnMapping);
    } catch (error) {
        return {
            success: false,
            reports: [],
            errors: [`파일 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
        };
    }
}

/**
 * 사용자가 지정한 컬럼 매핑으로 파일을 파싱합니다.
 */
export function parseWithMapping(
    buffer: ArrayBuffer,
    fileName: string,
    mapping: ColumnMapping,
): ParseResult {
    const errors: string[] = [];

    try {
        const workbook = readWorkbook(buffer, fileName);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            return { success: false, reports: [], errors: ['시트를 찾을 수 없습니다.'] };
        }

        const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
            defval: '',
            raw: false,
        });

        const reports: BookReport[] = [];

        rawData.forEach((row, index) => {
            const report: Partial<BookReport> = {};

            for (const [field, header] of Object.entries(mapping) as [keyof BookReport, string][]) {
                report[field] = row[header]?.toString().trim() || '';
            }

            if (!report.studentId) { errors.push(`${index + 2}행: 학번이 비어있습니다.`); return; }
            if (!report.bookTitle) { errors.push(`${index + 2}행: 책제목이 비어있습니다.`); return; }
            if (!report.author) { errors.push(`${index + 2}행: 작가가 비어있습니다.`); return; }
            if (!report.review) { errors.push(`${index + 2}행: 감상문이 비어있습니다.`); return; }

            reports.push(report as BookReport);
        });

        return { success: reports.length > 0, reports, errors };
    } catch (error) {
        return {
            success: false,
            reports: [],
            errors: [`파일 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
        };
    }
}

/**
 * 지원 가능한 파일 확장자 확인
 */
export function isSupportedFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['xlsx', 'xls', 'csv'].includes(ext || '');
}
