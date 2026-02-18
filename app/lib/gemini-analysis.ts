import { GoogleGenAI } from '@google/genai';
import type { ReviewAnalysis } from './types';

const GEMINI_MODEL = 'gemini-2.0-flash';

const ANALYSIS_PROMPT = `당신은 독후감 진위를 평가하는 교육 전문가입니다.
학생의 감상문과 책 정보를 바탕으로, 이 학생이 실제로 책을 읽었을 가능성을 판단하세요.

평가 기준:
1. 책 내용과의 일관성 — 감상문에 언급된 인물·사건·주제가 실제 책과 맞는가?
2. 구체성 — 책을 읽지 않으면 쓸 수 없는 구체적인 디테일(장면, 대사, 감정 등)이 있는가?
3. 개인적 감상 — 자신만의 경험이나 느낌과 연결 지었는가?
4. 범용성 — 아무 책에나 붙일 수 있는 뻔한 문장 위주인가?

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
{
  "verdict": "high" | "medium" | "low",
  "reasoning": "판단 근거를 2~3문장으로 요약"
}

verdict 기준:
- "high": 읽었을 가능성이 높음 (구체적 디테일, 개인적 감상, 책 내용과 일치)
- "medium": 판단하기 어려움 (일부 구체적이나 불확실)
- "low": 읽었을 가능성이 낮음 (뻔한 문장, 구체성 부족, 내용 불일치)`;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

/**
 * 지수 백오프로 재시도합니다.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const isRateLimit =
                error instanceof Error &&
                (error.message.includes('429') ||
                    error.message.includes('RESOURCE_EXHAUSTED') ||
                    error.message.includes('Resource exhausted'));

            if (isRateLimit && attempt < retries) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (isRateLimit) {
                throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            }
            throw error;
        }
    }
    throw new Error('재시도 횟수를 초과했습니다.');
}

/**
 * Gemini LLM으로 감상문의 진위를 분석합니다.
 */
export async function analyzeReview(
    bookTitle: string,
    author: string,
    review: string,
    description: string,
    apiKey: string,
): Promise<ReviewAnalysis> {
    const client = new GoogleGenAI({ apiKey });

    const userMessage = `## 책 정보
- 제목: ${bookTitle}
- 저자: ${author}
- 책 소개: ${description}

## 학생의 감상문
${review}`;

    const response = await withRetry(() =>
        client.models.generateContent({
            model: GEMINI_MODEL,
            contents: userMessage,
            config: {
                systemInstruction: ANALYSIS_PROMPT,
                temperature: 0.2,
                responseMimeType: 'application/json',
            },
        })
    );

    const text = response.text;

    if (!text) {
        throw new Error('AI 응답이 비어있습니다.');
    }

    try {
        const parsed = JSON.parse(text);

        if (!['high', 'medium', 'low'].includes(parsed.verdict)) {
            throw new Error('유효하지 않은 판정 결과');
        }

        return {
            verdict: parsed.verdict,
            reasoning: parsed.reasoning || '근거 없음',
        };
    } catch {
        throw new Error('AI 응답을 파싱할 수 없습니다.');
    }
}

