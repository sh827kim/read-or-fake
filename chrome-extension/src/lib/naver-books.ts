import type { BookVerification } from './types';

interface NaverBookItem {
    title: string;
    link: string;
    image: string;
    author: string;
    discount: string;
    publisher: string;
    pubdate: string;
    isbn: string;
    description: string;
}

interface NaverBookSearchResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: NaverBookItem[];
}

/**
 * HTML 태그 제거 (네이버 API 결과에 <b> 태그 등이 포함됨)
 */
function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
}

/**
 * 문자열 정규화 (공백 제거, 소문자 변환)
 */
function normalize(str: string): string {
    return stripHtml(str).replace(/\s+/g, '').toLowerCase().trim();
}

/**
 * 작가명 매칭 (공백 무시, 부분 포함 허용)
 */
function isAuthorMatch(searchAuthor: string, resultAuthor: string): boolean {
    const normalizedSearch = normalize(searchAuthor);
    const normalizedResult = normalize(resultAuthor);

    // 정확히 일치
    if (normalizedSearch === normalizedResult) return true;

    // 부분 포함 (네이버 API 결과에 여러 저자가 있을 수 있음)
    if (normalizedResult.includes(normalizedSearch)) return true;
    if (normalizedSearch.includes(normalizedResult)) return true;

    return false;
}

/**
 * 제목 매칭 (공백 무시)
 */
function isTitleMatch(searchTitle: string, resultTitle: string): boolean {
    const normalizedSearch = normalize(searchTitle);
    const normalizedResult = normalize(resultTitle);

    // 정확히 일치
    if (normalizedSearch === normalizedResult) return true;

    // 부분 포함 (부제목 등 고려)
    if (normalizedResult.includes(normalizedSearch)) return true;
    if (normalizedSearch.includes(normalizedResult)) return true;

    return false;
}

/**
 * 네이버 도서 검색 API를 통해 도서 존재 여부를 검증합니다.
 */
export async function verifyBook(
    bookTitle: string,
    author: string,
    clientId: string,
    clientSecret: string,
): Promise<BookVerification> {
    const query = `${bookTitle} ${author}`;
    const url = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=10`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            throw new Error(`네이버 API 오류: ${response.status} ${response.statusText}`);
        }

        const data: NaverBookSearchResponse = await response.json();

        if (data.items.length === 0) {
            return { found: false };
        }

        // 제목 + 작가 매칭되는 항목 찾기
        for (const item of data.items) {
            const titleMatched = isTitleMatch(bookTitle, item.title);
            const authorMatched = isAuthorMatch(author, item.author);

            if (titleMatched && authorMatched) {
                return {
                    found: true,
                    matchedTitle: stripHtml(item.title),
                    matchedAuthor: stripHtml(item.author),
                    description: stripHtml(item.description),
                    isbn: item.isbn,
                    thumbnail: item.image,
                };
            }
        }

        // 제목만 매칭되는 항목 (작가명이 다를 수 있음 — 번역자 포함 등)
        for (const item of data.items) {
            if (isTitleMatch(bookTitle, item.title)) {
                return {
                    found: true,
                    matchedTitle: stripHtml(item.title),
                    matchedAuthor: stripHtml(item.author),
                    description: stripHtml(item.description),
                    isbn: item.isbn,
                    thumbnail: item.image,
                };
            }
        }

        return { found: false };
    } catch (error) {
        console.error('도서 검증 오류:', error);
        throw error;
    }
}
