import { NextRequest, NextResponse } from 'next/server';
import { analyzeReview } from '@/app/lib/gemini-analysis';

export async function POST(request: NextRequest) {
    try {
        const { bookTitle, author, review, description } = await request.json();

        if (!bookTitle || !review || !description) {
            return NextResponse.json(
                { error: '필수 데이터가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API 키가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        const result = await analyzeReview(bookTitle, author, review, description, apiKey);

        return NextResponse.json(result);
    } catch (error) {
        console.error('감상문 분석 오류:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '감상문 분석 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
