// 업로드된 독후감 한 건
export interface BookReport {
    studentId: string;        // 학번 (기본 식별자)
    bookTitle: string;
    author: string;
    review: string;           // 감상문 원문
}

// 도서 검증 결과
export interface BookVerification {
    found: boolean;           // 존재 여부
    matchedTitle?: string;    // 매칭된 정확한 제목
    matchedAuthor?: string;   // 매칭된 정확한 작가
    description?: string;     // 책 소개 (네이버 API description)
    isbn?: string;
    thumbnail?: string;       // 표지 이미지
}

// 감상문 AI 분석 결과
export interface ReviewAnalysis {
    verdict: 'high' | 'medium' | 'low'; // 읽었을 가능성
    reasoning: string;                   // 판단 근거 요약
}

// 최종 분석 결과 (한 건)
export interface AnalysisResult {
    report: BookReport;
    verification: BookVerification;
    reviewAnalysis?: ReviewAnalysis;  // AI 감상문 분석 (개별 요청)
    status: 'pending' | 'verified' | 'not_found' | 'error';
    errorMessage?: string;
}

// 컨럼 매핑 (header 원본명 → BookReport 필드명)
export type ColumnMapping = Record<keyof BookReport, string>;

// 파일 파싱 결과
export interface ParseResult {
    success: boolean;
    reports: BookReport[];
    errors: string[];
    // 헤더 자동 매핑 실패 시 설정
    needsMapping?: boolean;           // true이면 사용자 매핑 필요
    detectedHeaders?: string[];       // 파일에서 감지된 전체 헤더 목록
    missingFields?: (keyof BookReport)[]; // 자동 매핑에 실패한 필드
    partialMapping?: Partial<ColumnMapping>; // 자동 매핑에 성공한 항목
}

// 도서 검증 API 요청/응답
export interface VerifyBooksRequest {
    reports: BookReport[];
}

export interface VerifyBooksResponse {
    results: AnalysisResult[];
}

// 감상문 AI 분석 API 요청/응답
export interface AnalyzeReviewRequest {
    bookTitle: string;
    author: string;
    review: string;
    description: string;
}

export interface AnalyzeReviewResponse {
    verdict: 'high' | 'medium' | 'low';
    reasoning: string;
}
