import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { AnalysisResult } from './types';

/**
 * 분석 결과를 Excel 파일로 다운로드
 */
export function downloadResults(results: AnalysisResult[], fileName: string = '독후감_검증결과') {
    const hasAnalysis = results.some(r => r.reviewAnalysis);

    const data = results.map(r => {
        const row: Record<string, string> = {
            '학번': r.report.studentId,
            '입력한 책 제목': r.report.bookTitle,
            '입력한 작가': r.report.author,
            '매칭된 책 제목': r.verification.matchedTitle || '-',
            '매칭된 작가': r.verification.matchedAuthor || '-',
            '도서 존재 여부': r.verification.found ? '존재' : '미확인',
        };

        if (hasAnalysis) {
            const verdictLabel = r.reviewAnalysis
                ? r.reviewAnalysis.verdict === 'high' ? '읽었을 가능성 높음'
                    : r.reviewAnalysis.verdict === 'medium' ? '판단 어려움'
                        : '읽었을 가능성 낮음'
                : '';
            row['AI 판정'] = verdictLabel;
            row['AI 판단 근거'] = r.reviewAnalysis?.reasoning || '';
        }

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // 컬럼 너비 설정
    const cols = [
        { wch: 10 },  // 학번
        { wch: 25 },  // 입력한 책 제목
        { wch: 15 },  // 입력한 작가
        { wch: 30 },  // 매칭된 책 제목
        { wch: 15 },  // 매칭된 작가
        { wch: 12 },  // 도서 존재 여부
    ];
    if (hasAnalysis) {
        cols.push({ wch: 18 });  // AI 판정
        cols.push({ wch: 50 });  // AI 판단 근거
    }
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '검증결과');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    const timestamp = new Date().toISOString().slice(0, 10);
    saveAs(blob, `${fileName}_${timestamp}.xlsx`);
}

/**
 * 템플릿 Excel 파일 다운로드
 */
export function downloadTemplate() {
    const templateData = [
        { '학번': '20241001', '책제목': '어린왕자', '작가': '생텍쥐페리', '감상문': '어린왕자를 읽고 느낀 점...' },
        { '학번': '20241002', '책제목': '해리포터와 마법사의 돌', '작가': 'J.K. 롤링', '감상문': '해리포터를 읽고...' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
        { wch: 12 },
        { wch: 25 },
        { wch: 15 },
        { wch: 50 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '독후감');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, '독후감_업로드_템플릿.xlsx');
}


