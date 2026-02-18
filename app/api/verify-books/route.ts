import { NextRequest, NextResponse } from 'next/server';
import { verifyBook } from '@/app/lib/naver-books';
import type { BookReport, AnalysisResult } from '@/app/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { reports }: { reports: BookReport[] } = await request.json();

        if (!reports || !Array.isArray(reports) || reports.length === 0) {
            return NextResponse.json(
                { error: '유효한 독후감 데이터가 필요합니다.' },
                { status: 400 }
            );
        }

        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: '네이버 API 키가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        const results: AnalysisResult[] = [];

        // 네이버 API 호출 제한(초당 10회) 고려, 순차 처리
        for (const report of reports) {
            try {
                const verification = await verifyBook(
                    report.bookTitle,
                    report.author,
                    clientId,
                    clientSecret,
                );

                results.push({
                    report,
                    verification,
                    status: verification.found ? 'verified' : 'not_found',
                });
            } catch (error) {
                results.push({
                    report,
                    verification: { found: false },
                    status: 'error',
                    errorMessage: error instanceof Error ? error.message : '검증 중 오류 발생',
                });
            }

            // Rate limiting: 100ms 딜레이 (초당 10회 이하)
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({ results });
    } catch (error) {
        return NextResponse.json(
            { error: '요청 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
