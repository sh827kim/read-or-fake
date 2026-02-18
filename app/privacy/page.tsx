import Link from 'next/link';

export const metadata = {
    title: '개인정보처리방침 — 읽긴했니?',
    description: '읽긴했니? 서비스의 개인정보처리방침',
};

export default function PrivacyPage() {
    return (
        <>
            <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white text-sm">📖</span>
                        </div>
                        <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            읽긴했니?
                        </span>
                    </Link>
                    <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
                        ← 돌아가기
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
                <article className="prose prose-sm max-w-none space-y-6">
                    <h1 className="text-2xl font-bold">개인정보처리방침</h1>
                    <p className="text-muted text-sm">최종 수정일: 2026년 2월 18일</p>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">1. 수집하는 개인정보 항목</h2>
                        <p className="text-sm leading-relaxed">
                            본 서비스는 독후감 검증을 위해 다음 정보를 일시적으로 처리합니다:
                        </p>
                        <ul className="text-sm space-y-1 list-disc list-inside text-foreground/80">
                            <li>학번 (학생 식별 목적)</li>
                            <li>독후감 내용 (감상문)</li>
                            <li>책 제목 및 작가명</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">2. 수집 목적</h2>
                        <p className="text-sm leading-relaxed">
                            수집된 정보는 독후감에 기재된 도서의 존재 여부를 확인하고,
                            감상문과 실제 도서 소개를 비교하여 검증 결과를 제공하는 데에만 사용됩니다.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">3. 보유 및 이용 기간</h2>
                        <div className="rounded-lg bg-success-bg/50 border border-success/20 p-4">
                            <p className="text-sm font-medium text-success">
                                ✅ 서버에 데이터를 저장하지 않습니다.
                            </p>
                            <p className="text-sm text-foreground/70 mt-1">
                                모든 데이터는 분석 처리 중에만 메모리에 존재하며, 처리 완료 후 즉시 삭제됩니다.
                                브라우저 세션이 종료되면 클라이언트 측 데이터도 자동으로 삭제됩니다.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">4. 제3자 제공</h2>
                        <p className="text-sm leading-relaxed">
                            도서 존재 여부 확인을 위해 <strong>네이버 도서 검색 API</strong>에 책 제목과 작가명만 전달됩니다.
                            학생 정보(학번, 감상문 내용)는 외부 서비스에 전달되지 않습니다.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">5. 이용자의 권리</h2>
                        <p className="text-sm leading-relaxed">
                            본 서비스는 데이터를 저장하지 않으므로, 별도의 열람·정정·삭제 요청이 필요하지 않습니다.
                            업로드된 파일은 서비스 이용 중에만 브라우저에서 처리되며, 페이지를 벗어나면 자동 삭제됩니다.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">6. 안전성 확보 조치</h2>
                        <ul className="text-sm space-y-1 list-disc list-inside text-foreground/80">
                            <li>HTTPS를 통한 암호화된 통신</li>
                            <li>서버 측 데이터 비저장 원칙</li>
                            <li>외부 API 통신 시 학생 개인정보 미전달</li>
                        </ul>
                    </section>
                </article>
            </main>

            <footer className="border-t border-border py-6 text-center text-xs text-muted">
                <p>📖 읽긴했니? — 선생님을 위한 독후감 진위 검증 서비스</p>
            </footer>
        </>
    );
}
