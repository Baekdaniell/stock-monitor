# Stock Monitor

개인 보유 종목과 관심 종목의 가격 추이를 실시간으로 추적하고,
주요 뉴스·실적·애널리스트 리포트를 한 화면에서 모니터링하는 개인용 주식 대시보드입니다.

---

## 기능 목록

### 핵심 기능
| 기능 | 설명 |
|------|------|
| 가격 차트 | 보유·관심 종목의 라인 차트 (1일·5일·1개월·3개월 기간 선택) |
| MA 오버레이 | MA5 / MA20 이동평균선 토글 |
| 52주 신고/신저 배지 | 현재가가 52주 고점·저점 3% 이내일 때 배지 표시 |
| 수익률 요약 | 보유 종목의 총 평가액, 손익, 수익률 KPI 카드 |
| 뉴스 대시보드 | 종목별 뉴스·실적·애널리스트 리포트 카드형 표시 |
| 감성 배지 | 키워드 분석 기반 긍정·중립·부정 자동 분류 |
| 뉴스 필터 | 보유/관심 종목 × 유형(뉴스·실적·애널리스트) 조합 필터 |
| 가격 알림 | 목표가 설정 시 브라우저 Push 알림 |
| 종목 관리 | 보유 종목 추가·수정·삭제 (티커·수량·평균단가·매수일) |
| 관심 종목 관리 | 추가·삭제·알림 설정 |
| CSV 내보내기 | 보유 종목 손익 현황을 엑셀 호환 CSV로 다운로드 |
| 다크 모드 | 시스템 설정 연동 + 수동 전환, 설정값 유지 |
| 반응형 레이아웃 | 모바일 햄버거 드로어 + 데스크탑 사이드 네비게이션 |

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | React 19 + TypeScript + Vite |
| 차트 | Recharts |
| 스타일 | Tailwind CSS |
| 상태 관리 | Zustand (localStorage 퍼시스트) |
| 라우팅 | React Router v7 |
| 아이콘 | Lucide React |
| 가격 API | Yahoo Finance (비공식, 무료·키 불필요) |
| 뉴스 API | NewsAPI.org (무료 티어) |

---

## 사전 요구사항

- **Node.js 20** 이상
- **npm** (또는 pnpm / yarn)
- NewsAPI 무료 키 (뉴스 기능 사용 시)

---

## 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd stock-monitor

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정 (아래 API 키 설정 섹션 참조)
cp .env.example .env.local

# 4. 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

---

## API 키 설정

### NewsAPI 키 (뉴스 기능)

**방법 1 — 앱 내 설정 (권장)**
1. [https://newsapi.org/register](https://newsapi.org/register) 에서 무료 가입 후 API 키 발급
2. 앱 실행 후 **설정** 페이지 → **API 설정** 섹션에 키 입력 후 저장
3. 브라우저 localStorage에 저장되며 외부로 전송되지 않습니다

**방법 2 — 환경 변수**
```bash
# .env.local
VITE_NEWSAPI_KEY=your_api_key_here
```

> **주의:** NewsAPI 무료 티어는 하루 100건 요청 제한이 있으며, localhost 개발 환경에서만 작동합니다.  
> 프로덕션 배포 시에는 Vercel Edge Function 등 서버사이드 프록시를 통해 호출해야 합니다.

### Yahoo Finance (가격 데이터)

별도 API 키가 필요 없습니다. 개발 환경에서는 Vite 프록시가 CORS를 처리합니다.

---

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 로컬 미리보기
npm run preview
```

### Vercel 배포

1. GitHub 저장소에 푸시
2. [vercel.com](https://vercel.com) 에서 저장소 연결
3. 환경 변수에 `VITE_NEWSAPI_KEY` 추가
4. `vercel.json` 에 SPA 라우팅 설정 추가:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 프로젝트 구조

```
stock-monitor/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # 렌더링 오류 포착 + 재시도
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── NewsCard.tsx       # 뉴스 카드 (감성·유형 배지 포함)
│   │   ├── PriceChart.tsx     # Recharts 라인차트 + MA 오버레이
│   │   └── Skeleton.tsx       # 로딩 스켈레톤 컴포넌트
│   ├── hooks/
│   │   ├── useDarkMode.ts
│   │   ├── useNewsService.ts
│   │   └── usePriceService.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── News.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Settings.tsx
│   │   └── Watchlist.tsx
│   ├── services/
│   │   ├── fetchWithRetry.ts  # 재시도 fetch 유틸
│   │   ├── newsService.ts     # NewsAPI 30분 폴링
│   │   └── priceService.ts    # Yahoo Finance 10분 폴링
│   ├── store/
│   │   ├── index.ts           # Zustand 스토어
│   │   └── types.ts           # 공유 타입 정의
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

---

## 주요 동작 방식

| 항목 | 내용 |
|------|------|
| 가격 갱신 주기 | 10분 (setInterval + Yahoo Finance v8 API) |
| 뉴스 갱신 주기 | 30분 (setInterval + NewsAPI /v2/everything) |
| 데이터 저장 | Zustand → localStorage (보유·관심 종목, 알림, 테마) |
| 캔들 데이터 | intraday: 1h 간격·5일 범위 / daily: 1d 간격·3개월 범위 |
| CORS 처리 | 개발: Vite 프록시 / 배포: Vercel Edge Function (별도 설정 필요) |
| 감성 분석 | 뉴스 제목의 긍정·부정 키워드 카운트로 자동 분류 |
| 오류 처리 | React ErrorBoundary (재시도 가능) + fetchWithRetry (최대 2회) |

---

## 라이선스

MIT
