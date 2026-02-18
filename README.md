# 📖 읽긴했니? (Read or Fake?)

> 학생 독후감의 진위를 AI로 검증하는 선생님을 위한 서비스

네이버 도서 검색 API로 책 존재 여부를 확인하고, Gemini/OpenAI로 감상문이 실제로 책을 읽고 쓴 것인지 분석합니다.

**웹 서비스**와 **크롬 확장 프로그램** 두 가지 방식으로 제공됩니다.

---

## ✨ 주요 기능

- **도서 검증** — 네이버 도서 검색 API로 책 제목·저자 실존 여부 자동 확인
- **AI 감상문 분석** — Gemini 또는 OpenAI로 감상문 진위 판정 (읽었을 가능성 높음/보통/낮음)
- **일괄 처리** — CSV/Excel 파일로 학급 전체 독후감을 한 번에 업로드
- **결과 다운로드** — 분석 결과를 Excel/CSV로 내보내기
- **개인정보 보호** — 업로드 파일은 서버에 저장되지 않음

---

## 🗂 프로젝트 구조

```
fake-book-report-detector/
├── app/                    # Next.js 웹 애플리케이션
│   ├── api/                # 서버 API (네이버 도서 검증)
│   ├── components/         # UI 컴포넌트
│   └── lib/                # 유틸리티 (파서, AI 분석 등)
└── chrome-extension/       # 크롬 확장 프로그램
    └── src/
        ├── popup/          # 사이드 패널 UI
        ├── options/        # 설정 페이지
        └── lib/            # 유틸리티
```

---

## 🌐 웹 서비스

### 환경 변수 설정

`.env.example`을 복사하여 `.env.local`을 생성하고 네이버 API 키를 입력합니다.

```bash
cp .env.example .env.local
```

```env
# 네이버 도서 검색 API (서버 전용, 사용자에게 노출되지 않음)
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
```

> **네이버 API 키 발급**: [네이버 개발자 센터](https://developers.naver.com/apps/#/register) → 애플리케이션 등록 → 검색 API 선택

AI 분석 API 키(Gemini/OpenAI)는 **사용자가 웹 앱 내 설정 화면에서 직접 입력**합니다. 브라우저 `localStorage`에만 저장되며 서버로 전송되지 않습니다.

### 개발 서버 실행

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

### 프로덕션 빌드

```bash
pnpm build
pnpm start
```

### Vercel 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Vercel 프로젝트 설정 → **Environment Variables**에 아래 값을 추가합니다.

| 변수명 | 설명 |
|--------|------|
| `NAVER_CLIENT_ID` | 네이버 API 클라이언트 ID |
| `NAVER_CLIENT_SECRET` | 네이버 API 클라이언트 시크릿 |

---

## 🧩 크롬 확장 프로그램

크롬 확장은 웹 서비스 없이 **브라우저에서 독립적으로 동작**합니다. 네이버 API 키와 AI API 키 모두 확장 설정 페이지에서 직접 입력합니다.

### 개발 빌드 (파일 감시)

```bash
cd chrome-extension
pnpm install
pnpm dev        # 변경 시 자동 재빌드
```

### 프로덕션 빌드

```bash
cd chrome-extension
pnpm build      # dist/ 폴더에 빌드 결과물 생성
```

### 크롬에 설치

1. `chrome-extension/dist/` 폴더에 빌드 결과물 생성 확인
2. Chrome 브라우저에서 `chrome://extensions` 접속
3. 우측 상단 **개발자 모드** 활성화
4. **압축 해제된 확장 프로그램 로드** 클릭 → `chrome-extension/dist/` 폴더 선택

### 확장 프로그램 설정

설치 후 확장 아이콘 우클릭 → **옵션**에서 API 키를 입력합니다.

| 설정 항목 | 설명 | 발급처 |
|-----------|------|--------|
| 네이버 Client ID | 도서 검색용 | [네이버 개발자 센터](https://developers.naver.com) |
| 네이버 Client Secret | 도서 검색용 | 동일 |
| Gemini API Key | AI 분석용 (무료) | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI API Key | AI 분석용 (유료) | [OpenAI Platform](https://platform.openai.com/api-keys) |

---

## 📋 사용 방법

### 입력 파일 형식

CSV 또는 Excel(`.xlsx`) 파일로 아래 컬럼을 포함해야 합니다. 헤더 이름이 달라도 업로드 후 직접 매핑할 수 있습니다.

| 컬럼 | 예시 |
|------|------|
| 학번 | 20250101 |
| 책 제목 | 어린 왕자 |
| 작가 | 생텍쥐페리 |
| 감상문 | 이 책을 읽고... |

### 분석 흐름

```
파일 업로드 → 네이버 도서 검증 → (선택) AI 감상문 분석 → 결과 다운로드
```

---

## 🔒 개인정보 보호

- 업로드된 파일은 분석 후 서버에 저장되지 않습니다.
- AI 분석 API 키(웹 서비스)는 사용자 브라우저 `localStorage`에만 저장되며 서버로 전송되지 않습니다.
- 네이버 API 키는 서버 환경변수로만 관리됩니다.

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| 웹 프레임워크 | Next.js 16 (App Router) |
| 크롬 확장 빌드 | Vite + React |
| 스타일링 | Tailwind CSS v4 |
| AI 분석 | Google Gemini API, OpenAI API |
| 도서 검색 | 네이버 검색 API |
| 파일 파싱 | xlsx |
