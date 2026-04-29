# 주식 모니터링 웹 애플리케이션 — 프로젝트 계획서

> **대상 도구:** Claude Code  
> **작성일:** 2026-04-28  
> **버전:** v1.1 (Step 1~5 완료 / 배포 과정 추가)

---

## 1. 프로젝트 개요

보유 종목 및 관심 종목의 가격 추이를 실시간에 가깝게 추적하고, 주요 뉴스·실적·애널리스트 리포트를 한 화면에서 모니터링할 수 있는 개인용 주식 대시보드 웹 애플리케이션을 구축한다.

---

## 2. 요구사항 정의

### 2-1. 핵심 기능 (Must Have)

| # | 기능 | 설명 |
|---|------|------|
| F-01 | 보유 종목 차트 | 매수 종목의 가격 추이를 10분 주기로 갱신하는 라인 차트 |
| F-02 | 관심 종목 차트 | 관심 등록 종목의 가격 추이를 10분 주기로 갱신하는 라인 차트 |
| F-03 | 이슈 모니터링 대시보드 | 뉴스 기사, 실적 발표, 애널리스트 리포트를 카드형 UI로 표시 |
| F-04 | 종목 관리 | 보유/관심 종목 추가·삭제·편집 (매수가, 수량 입력) |
| F-05 | 수익률 요약 | 보유 종목의 평균 매수가 대비 현재가 손익 현황 표시 |

### 2-2. 추가 추천 기능 (Nice to Have)

| # | 기능 | 설명 |
|---|------|------|
| F-06 | 포트폴리오 파이차트 | 종목별 비중을 시각화 |
| F-07 | 가격 알림 | 설정 가격 도달 시 브라우저 Push 알림 |
| F-08 | 52주 신고/신저 배지 | 52주 최고·최저가 근접 여부를 배지로 표시 |
| F-09 | 기술적 지표 오버레이 | 이동평균선(MA5·MA20), 볼린저 밴드 토글 |
| F-10 | 메모 기능 | 종목별 투자 메모 및 목표가 기록 |
| F-11 | CSV 내보내기 | 보유 종목·수익률 데이터를 CSV로 다운로드 |
| F-12 | 다크 모드 | 시스템 설정 연동 다크/라이트 테마 전환 |

---

## 3. 기술 스택

```
Frontend  : React 18 + TypeScript + Vite
차트       : Recharts (라인차트, 파이차트)
스타일     : Tailwind CSS
상태 관리  : Zustand (경량, 로컬 퍼시스트 지원)
주가 API   : Yahoo Finance 비공식 API (무료) 또는 Alpha Vantage (무료 티어)
뉴스 API   : NewsAPI.org (무료 티어) 또는 Yahoo Finance RSS
알림       : Web Notifications API
인증 + DB  : Supabase (무료 티어 — 2인 공유 데이터 동기화)
배포       : Vercel (무료 티어 — 자동 빌드/배포, CORS 프록시 포함)
소스 관리  : GitHub (Vercel 자동 배포 트리거)
빌드/실행  : Node.js 20+
```

> **비용:** Vercel 무료 + Supabase 무료 = **$0/월**. 별도 클라우드 서버 구매·운영 불필요.  
> **배포 흐름:** `git push` → GitHub → Vercel 자동 감지 → 빌드 → `yourapp.vercel.app` URL 생성

---

## 4. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │Portfolio │  │Watchlist │  │  News Dashboard   │ │
│  │  Page    │  │  Page    │  │      Page         │ │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘ │
│       │              │                 │             │
│  ┌────▼──────────────▼─────────────────▼──────────┐ │
│  │              Zustand Store                      │ │
│  │  (holdings / watchlist / prices / news / alerts)│ │
│  └────┬───────────────────────────────────────────┘ │
│       │                                              │
│  ┌────▼────────────────────────────────────────┐    │
│  │           Data Service Layer                │    │
│  │  ┌──────────────┐   ┌────────────────────┐  │    │
│  │  │ PriceService │   │   NewsService      │  │    │
│  │  │ (10분 폴링)   │   │  (30분 폴링)       │  │    │
│  │  └──────┬───────┘   └─────────┬──────────┘  │    │
│  └─────────┼─────────────────────┼─────────────┘    │
└────────────┼─────────────────────┼──────────────────┘
             │                     │
    ┌────────▼──────┐    ┌─────────▼────────┐
    │ Vercel Edge   │    │   NewsAPI / RSS  │
    │ Function      │    │  (뉴스 데이터)   │
    │ (CORS 프록시) │    └──────────────────┘
    └───────┬───────┘
            │
    ┌───────▼───────┐    ┌──────────────────┐
    │ Yahoo Finance │    │    Supabase      │
    │ (가격 데이터)  │    │  인증 + DB 저장  │
    └───────────────┘    └──────────────────┘
```

---

## 5. 화면 구성 (UI/UX)

### 5-1. 화면 목록

| 화면 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/` | 요약 카드 + 주요 이슈 피드 |
| 포트폴리오 | `/portfolio` | 보유 종목 차트 + 손익 테이블 |
| 관심 종목 | `/watchlist` | 관심 종목 차트 그리드 |
| 뉴스 | `/news` | 이슈 카드 전체 목록 |
| 설정 | `/settings` | 종목 관리, API 키 입력, 알림 설정 |

### 5-2. 대시보드 레이아웃 (와이어프레임)

```
┌─────────────────────────────────────────────────────────┐
│  📈 Stock Monitor          [포트폴리오] [관심] [뉴스] [⚙] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ 총 평가액 │ │ 총 손익  │ │ 수익률   │ │ 갱신 시각  │ │
│  │  $12,430 │ │ +$430    │ │  +3.58%  │ │ 14:30:00  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
├──────────────────────────┬──────────────────────────────┤
│   보유 종목 현황          │   최신 이슈                  │
│  ┌──────────────────────┐│  ┌────────────────────────┐  │
│  │ AAPL  ▲ +1.2%       ││  │ 📰 AAPL 실적 발표 예정  │  │
│  │ TSLA  ▼ -0.8%       ││  │ 📊 NVDA 목표주가 상향   │  │
│  │ NVDA  ▲ +2.1%       ││  │ 📰 시장 전반 뉴스       │  │
│  └──────────────────────┘│  └────────────────────────┘  │
└──────────────────────────┴──────────────────────────────┘
```

---

## 6. 데이터 모델

```typescript
// 보유 종목
interface Holding {
  id: string;
  ticker: string;          // 'AAPL'
  name: string;            // 'Apple Inc.'
  quantity: number;        // 보유 수량
  avgBuyPrice: number;     // 평균 매수가 (USD)
  buyDate: string;         // '2024-01-15'
  memo?: string;
  targetPrice?: number;
}

// 관심 종목
interface WatchItem {
  id: string;
  ticker: string;
  name: string;
  addedAt: string;
  memo?: string;
  alertPrice?: number;     // 알림 설정 가격
}

// 가격 데이터 포인트
interface PricePoint {
  timestamp: number;       // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 뉴스/이슈 아이템
interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  type: 'news' | 'earnings' | 'analyst';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// 가격 알림
interface PriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  createdAt: string;
}
```

---

## 7. 구현 계획 (단계별)

### ✅ Phase 1 — 프로젝트 기반 구축 (완료)

```
[x] Vite + React + TypeScript 프로젝트 초기화
[x] Tailwind CSS 설정
[x] React Router 설정 (5개 화면)
[x] Zustand 스토어 구조 정의 + localStorage 퍼시스트
[x] 공통 레이아웃 컴포넌트 (Navbar, Sidebar)
[x] 더미 데이터로 라우팅 동작 확인
```

### ✅ Phase 2 — 가격 데이터 연동 (완료)

```
[x] Yahoo Finance API 래퍼 작성
[x] PriceService (10분 폴링, setInterval)
[x] Recharts 라인 차트 컴포넌트
[x] 포트폴리오 페이지 완성
[x] 관심 종목 페이지 완성
```

### ⬜ Phase 3 — 뉴스/이슈 연동

```
[ ] NewsAPI 래퍼 작성 (또는 Yahoo Finance RSS 파싱)
[ ] NewsService (30분 폴링)
[ ] 뉴스 카드 컴포넌트 (감성 배지 포함)
[ ] 대시보드 이슈 피드 완성
[ ] 뉴스 전체 목록 페이지 완성
```

### ⬜ Phase 4 — 핵심 기능 완성

```
[ ] 설정 페이지 — 종목 추가/삭제/편집 UI
[ ] 보유 종목 손익 테이블 (매수가, 현재가, 손익, 수익률)
[ ] 포트폴리오 파이차트 (종목별 비중)
[ ] 요약 KPI 카드 (총 평가액, 총 손익, 수익률)
[ ] 마지막 갱신 시각 표시 + 수동 새로고침 버튼
```

### ⬜ Phase 5 — 부가 기능 및 마무리

```
[ ] Web Push 알림 (가격 알림 설정 및 트리거)
[ ] 52주 신고/신저 배지
[ ] CSV 내보내기
[ ] 다크 모드 (Tailwind dark: 클래스)
[ ] 반응형 레이아웃 (모바일 대응)
[ ] 에러 핸들링 및 로딩 스켈레톤 UI
[ ] README 초안 작성
```

### ⬜ Phase 6 — 인증 + 배포 (2인 공유)

```
[ ] GitHub 저장소 생성 및 첫 push
[ ] Supabase 프로젝트 생성 (무료)
[ ] 이메일 로그인 인증 연동
[ ] 보유/관심 종목 데이터를 Supabase DB로 이전
[ ] Vercel 프로젝트 생성 및 GitHub 연결
[ ] Vercel Edge Function으로 CORS 프록시 설정
[ ] 환경변수 설정 (Supabase URL, anon key, NewsAPI key)
[ ] 최종 배포 확인 + 지인에게 URL 공유
```

---

## 8. 디렉터리 구조

```
stock-monitor/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── chart/
│   │   │   ├── PriceChart.tsx       # 메인 라인 차트
│   │   │   ├── PortfolioPie.tsx     # 파이차트
│   │   │   └── ChartControls.tsx    # 기간/지표 토글
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── HoldingsTable.tsx
│   │   │   └── NewsFeed.tsx
│   │   └── news/
│   │       └── NewsCard.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Watchlist.tsx
│   │   ├── News.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   ├── priceService.ts          # 10분 폴링
│   │   └── newsService.ts           # 30분 폴링
│   ├── store/
│   │   └── useStore.ts              # Zustand 스토어
│   ├── types/
│   │   └── index.ts                 # 데이터 타입 정의
│   ├── utils/
│   │   ├── formatters.ts            # 숫자/날짜 포맷
│   │   └── indicators.ts            # MA, 볼린저 계산
│   ├── lib/
│   │   └── supabase.ts              # Supabase 클라이언트 (Step 10에서 추가)
│   ├── App.tsx
│   └── main.tsx
├── api/
│   └── price.ts                     # Vercel Edge Function / CORS 프록시 (Step 11에서 추가)
├── public/
├── .env.local                       # 환경변수 (gitignore 처리 — 절대 커밋 금지)
├── .env.example                     # 환경변수 템플릿 (커밋 가능)
├── package.json
├── vite.config.ts
├── vercel.json                      # Vercel SPA 라우팅 설정 (Step 11에서 추가)
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 9. API 설정 가이드

### Yahoo Finance (가격 데이터, 무료·키 불필요)

```
현재가:
GET https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}
    ?interval=1m&range=1d

히스토리 (1개월):
GET https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}
    ?interval=10m&range=1mo
```

> 개발 환경에서는 Vite 프록시로 CORS를 처리하고, 배포 후에는 Vercel Edge Function이 프록시 역할을 대신한다.

```typescript
// vite.config.ts (개발 환경 전용)
server: {
  proxy: {
    '/api/yahoo': {
      target: 'https://query1.finance.yahoo.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
    }
  }
}
```

### NewsAPI (뉴스, 무료 티어 100req/day)

```
GET https://newsapi.org/v2/everything
    ?q={TICKER}&sortBy=publishedAt&apiKey={YOUR_KEY}
```

→ 설정 페이지에서 API 키를 입력받아 Supabase DB 또는 localStorage에 저장

---

## 10. Claude Code 실행 프롬프트

> ✅ **Step 1~5 완료** — Step 6부터 이어서 진행한다.

---

### ✅ Step 1 — 프로젝트 초기화 (완료)

### ✅ Step 2 — 레이아웃 및 공통 컴포넌트 (완료)

### ✅ Step 3 — 가격 서비스 및 차트 (완료)

### ✅ Step 4 — 포트폴리오 페이지 (완료)

### ✅ Step 5 — 관심 종목 페이지 (완료)

---

**[Step 6] 뉴스 및 이슈 대시보드**

```
다음 기능을 가진 NewsService를 만들어줘:
보유 종목과 관심 종목 전체에 대해 NewsAPI에서 30분마다 뉴스를 가져온다.

다음 내용을 보여주는 NewsCard 컴포넌트를 만들어줘:
- 기사 제목, 출처, 발행 시각, 티커 배지
- 키워드 분석 기반의 감성 배지 (긍정 / 중립 / 부정)
- 기사 원문 링크

뉴스 페이지에는 다음 기준으로 필터링 기능을 추가해줘:
전체 | 보유 종목 | 관심 종목 | 유형(뉴스 / 실적 / 애널리스트)
```

---

**[Step 7] 설정 페이지**

```
다음 기능을 포함하는 설정 페이지를 만들어줘:
1. 보유 종목 관리: 종목 추가(티커, 수량, 평균 매수가, 매수일), 수정, 삭제
2. 관심 종목 관리: 추가, 삭제, 가격 알림 설정
3. NewsAPI 키 입력란 (입력값은 localStorage에 저장)
4. 보유 종목 데이터를 CSV로 내보내는 버튼
5. 가격 알림을 위한 브라우저 알림 권한 요청
```

---

**[Step 8] 다크 모드 및 기능 마무리**

```
Tailwind의 dark: 클래스를 활용해서 전체 다크 모드를 완성해줘.
<html> 태그에 'dark' 클래스를 추가/제거하는 방식으로 라이트/다크를 전환하고,
설정값은 localStorage에 저장해줘.
차트와 뉴스 카드에 로딩 스켈레톤 컴포넌트를 추가해줘.
API 호출 실패 시를 위한 에러 바운더리와 재시도 로직을 추가해줘.
설치 방법, API 키 설정, 기능 목록을 포함한 README.md를 작성해줘.
```

---

**[Step 9] GitHub 저장소 연결**

> 💡 이 단계는 터미널에서 직접 실행하는 명령어다. Claude Code 프롬프트가 아니다.

```bash
# 1. .env.local이 gitignore에 있는지 먼저 확인
cat .gitignore | grep .env.local

# 없다면 추가
echo ".env.local" >> .gitignore

# 2. git 초기화 및 첫 커밋
git init
git add .
git commit -m "feat: initial stock monitor app"

# 3. GitHub에서 새 저장소(stock-monitor)를 만든 후 아래 명령어 실행
git remote add origin https://github.com/내아이디/stock-monitor.git
git branch -M main
git push -u origin main
```

---

**[Step 10] Supabase 인증 연동**

```
Supabase를 연동해줘. 나와 지인 한 명이 각자 계정으로 로그인해서
보유 종목과 관심 종목 데이터를 서버에 저장하고 어느 기기에서나 동기화할 수 있어야 해.

1. @supabase/supabase-js 패키지를 설치하고 src/lib/supabase.ts 클라이언트 파일을 만들어줘.
   환경변수는 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY로 관리해.

2. 이메일/패스워드 로그인 화면을 만들어줘.
   로그인하지 않으면 앱에 접근할 수 없도록 라우트를 보호해줘.

3. 기존에 localStorage로 저장하던 holdings, watchlist 데이터를
   Supabase DB 테이블로 이전해줘.
   각 테이블에 user_id 컬럼을 추가해서 사용자별로 데이터가 분리되도록 해.

4. Zustand 스토어가 앱 시작 시 Supabase에서 데이터를 불러오고,
   변경 시 Supabase에 저장하도록 수정해줘.

5. 내비게이션 바에 현재 로그인한 이메일과 로그아웃 버튼을 추가해줘.
```

---

**[Step 11] Vercel 배포 및 CORS 프록시**

```
Vercel에 배포할 수 있도록 다음 작업을 해줘:

1. api/price.ts 파일을 Vercel Edge Function으로 만들어줘.
   Yahoo Finance API를 서버 사이드에서 호출해서 CORS 문제를 해결하는 프록시 역할을 해야 해.
   쿼리 파라미터는 /api/price?ticker=AAPL&range=1d 형식으로 받아.

2. PriceService가 개발 환경(Vite 프록시)과 프로덕션 환경(Vercel Edge Function)을
   자동으로 구분해서 호출하도록 수정해줘.
   import.meta.env.DEV가 true면 /api/yahoo를, false면 /api/price를 사용해.

3. 환경변수 템플릿 파일 .env.example을 만들어줘:
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_NEWS_API_KEY=

4. SPA 라우팅이 올바르게 동작하도록 vercel.json 파일을 만들어줘.
   모든 경로를 index.html로 리다이렉트하는 설정이 필요해.
```

> **Vercel 배포 방법 (사이트에서 1회 설정)**
>
> 1. vercel.com 접속 → GitHub 계정으로 가입
> 2. "Add New Project" → stock-monitor 저장소 선택
> 3. Environment Variables에 .env.example 항목들을 실제 값으로 입력
> 4. Deploy 클릭 → `https://stock-monitor-xxx.vercel.app` URL 생성
>
> 이후부터는 `git push`만 하면 자동으로 재배포된다.  
> 지인에게 URL을 공유하고 Supabase에서 계정을 만들어주면 바로 사용 가능하다.

---

## 11. 예상 일정 요약

| 단계 | 내용 | 소요 시간 | 상태 |
|------|------|----------|------|
| Phase 1 | 프로젝트 기반 구축 | ~2시간 | ✅ 완료 |
| Phase 2 | 가격 데이터 + 차트 | ~3시간 | ✅ 완료 |
| Phase 3 | 뉴스/이슈 연동 | ~2시간 | ⬜ 진행 예정 |
| Phase 4 | 핵심 기능 완성 | ~2시간 | ⬜ 진행 예정 |
| Phase 5 | 부가 기능 + 마무리 | ~2시간 | ⬜ 진행 예정 |
| Phase 6 | 인증 + 배포 | ~1.5시간 | ⬜ 진행 예정 |
| **합계** | | **~12.5시간** | |

---

## 12. 주의사항 및 제약

- Yahoo Finance 비공식 API는 rate limit이 있으므로 캐싱을 반드시 적용한다 (Zustand + 타임스탬프 체크).
- NewsAPI 무료 티어는 하루 100 요청 제한이 있으므로, 동일 결과를 30분간 캐싱한다.
- `.env.local` 파일은 절대 GitHub에 올리지 않는다. Step 9 진행 전 `.gitignore` 포함 여부를 반드시 확인한다.
- Vercel 환경변수는 Vercel 대시보드에서 직접 입력해야 한다 (`.env.local`은 로컬 개발 전용).
- 한국 주식(KRX)을 모니터링하려면 ticker 포맷을 `005930.KS` (삼성전자) 형식으로 입력해야 한다.
- Supabase 무료 티어는 7일 미사용 시 프로젝트가 일시정지될 수 있다. 정기적으로 접속하거나 Pro 플랜($25/월)으로 전환한다.

---

*Step 6부터 순서대로 실행하면 기능 완성 → GitHub 연결 → 인증 연동 → 배포까지 자연스럽게 이어집니다.*
