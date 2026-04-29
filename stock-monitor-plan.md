# 주식 모니터링 웹 애플리케이션 — 프로젝트 계획서

> **대상 도구:** Claude Code  
> **작성일:** 2026-04-28  
> **버전:** v1.0

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
로컬 저장  : localStorage (종목 목록, 매수 정보, 메모)
주가 API   : Yahoo Finance 비공식 API (무료) 또는 Alpha Vantage (무료 티어)
뉴스 API   : NewsAPI.org (무료 티어) 또는 Yahoo Finance RSS
알림       : Web Notifications API
빌드/실행  : Node.js 20+
```

> **API 선택 기준:** 별도 서버 없이 브라우저에서 직접 호출 가능한 무료 엔드포인트를 우선 사용한다. 프로덕션 전환 시 Express 프록시 서버를 추가한다.

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
    │  Yahoo Finance │    │   NewsAPI / RSS  │
    │  (가격 데이터)  │    │  (뉴스 데이터)   │
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

### Phase 1 — 프로젝트 기반 구축 (Day 1)

```
[ ] Vite + React + TypeScript 프로젝트 초기화
[ ] Tailwind CSS 설정
[ ] React Router 설정 (5개 화면)
[ ] Zustand 스토어 구조 정의 + localStorage 퍼시스트
[ ] 공통 레이아웃 컴포넌트 (Navbar, Sidebar)
[ ] 더미 데이터로 라우팅 동작 확인
```

### Phase 2 — 가격 데이터 연동 (Day 2)

```
[ ] Yahoo Finance API 래퍼 작성
    - 현재가 조회: /v8/finance/chart/{ticker}
    - 1d/5d/1mo 히스토리 조회
[ ] PriceService (10분 폴링, setInterval)
[ ] Recharts 라인 차트 컴포넌트
    - X축: 시간, Y축: 가격
    - 호버 툴팁 (가격, 등락률)
    - MA5/MA20 토글
[ ] 포트폴리오 페이지 완성
[ ] 관심 종목 페이지 완성
```

### Phase 3 — 뉴스/이슈 연동 (Day 3)

```
[ ] NewsAPI 래퍼 작성 (또는 Yahoo Finance RSS 파싱)
[ ] NewsService (30분 폴링)
[ ] 뉴스 카드 컴포넌트 (감성 배지 포함)
[ ] 대시보드 이슈 피드 완성
[ ] 뉴스 전체 목록 페이지 완성
```

### Phase 4 — 핵심 기능 완성 (Day 4)

```
[ ] 설정 페이지 — 종목 추가/삭제/편집 UI
[ ] 보유 종목 손익 테이블 (매수가, 현재가, 손익, 수익률)
[ ] 포트폴리오 파이차트 (종목별 비중)
[ ] 요약 KPI 카드 (총 평가액, 총 손익, 수익률)
[ ] 마지막 갱신 시각 표시 + 수동 새로고침 버튼
```

### Phase 5 — 부가 기능 및 마무리 (Day 5)

```
[ ] Web Push 알림 (가격 알림 설정 및 트리거)
[ ] 52주 신고/신저 배지
[ ] CSV 내보내기
[ ] 다크 모드 (Tailwind dark: 클래스)
[ ] 반응형 레이아웃 (모바일 대응)
[ ] 에러 핸들링 및 로딩 스켈레톤 UI
[ ] README 작성
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
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
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

> ⚠️ CORS 우회가 필요할 수 있음. 개발 시 Vite 프록시 설정으로 해결:
```typescript
// vite.config.ts
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

→ 설정 페이지에서 API 키를 입력받아 localStorage에 저장

---

## 10. Claude Code 실행 프롬프트 (순서대로 사용)

아래 프롬프트를 Claude Code 세션에서 순서대로 실행한다.

---

**[Step 1] 프로젝트 초기화**

```
"stock-monitor"라는 이름으로 Vite + React + TypeScript 프로젝트를 새로 만들어줘.
다음 의존성을 설치해줘: react-router-dom, zustand, recharts, tailwindcss, @types/react, @types/react-dom, lucide-react.
다크 모드를 지원하도록 Tailwind CSS를 설정해줘.
아래 5개 경로로 React Router를 구성해줘: /, /portfolio, /watchlist, /news, /settings.
holdings, watchlist, prices, news, alerts 슬라이스를 포함하는 Zustand 스토어를 만들고,
zustand/middleware의 persist를 사용해 localStorage에 자동 저장되도록 해줘.
```

**[Step 2] 레이아웃 및 공통 컴포넌트**

```
상단 내비게이션 바가 있는 반응형 레이아웃을 만들어줘.
내비게이션 바에는 앱 이름, 페이지 링크(대시보드, 포트폴리오, 관심종목, 뉴스, 설정),
다크 모드 토글 버튼, 마지막 갱신 시각이 표시되어야 해.
Tailwind CSS로 스타일링하고, 모바일과 데스크톱 양쪽에서 잘 동작해야 해.
```

**[Step 3] 가격 서비스 및 차트**

```
다음 기능을 가진 PriceService를 만들어줘:
1. Vite 프록시를 통해 Yahoo Finance API에서 주가 데이터를 가져온다
2. setInterval로 10분마다 자동으로 데이터를 갱신한다
3. OHLCV 데이터 포인트를 Zustand 스토어에 저장한다

다음 기능을 가진 PriceChart 컴포넌트를 Recharts로 만들어줘:
- 종가를 시간 순서대로 보여주는 라인 차트
- 기간 선택 토글: 1일 / 5일 / 1개월 / 3개월
- MA5, MA20 이동평균선을 켜고 끌 수 있는 토글
- 가격, 등락폭, 등락률을 보여주는 호버 툴팁
- ResponsiveContainer로 반응형 처리
```

**[Step 4] 포트폴리오 페이지**

```
다음 내용을 포함하는 포트폴리오 페이지를 만들어줘:
1. 보유 종목별 PriceChart (또는 종목을 선택해서 전환할 수 있는 통합 차트)
2. 요약 테이블: 티커 | 수량 | 평균 매수가 | 현재가 | 손익 | 수익률(%)
3. 이익은 초록색, 손실은 빨간색으로 색상 구분
4. 현재 평가금액 기준 종목별 비중을 보여주는 파이차트
5. KPI 카드: 총 평가금액 | 총 손익 | 전체 수익률
```

**[Step 5] 관심 종목 페이지**

```
다음 내용을 포함하는 관심 종목 페이지를 만들어줘:
1. 관심 종목 하나당 PriceChart 카드를 격자형으로 배치
2. 각 카드에는 티커명, 현재가, 당일 등락률 표시
3. 현재가가 52주 신고가 또는 신저가와 3% 이내 차이라면 배지를 표시
4. 종목 추가 및 삭제 버튼
```

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

**[Step 7] 설정 페이지**

```
다음 기능을 포함하는 설정 페이지를 만들어줘:
1. 보유 종목 관리: 종목 추가(티커, 수량, 평균 매수가, 매수일), 수정, 삭제
2. 관심 종목 관리: 추가, 삭제, 가격 알림 설정
3. NewsAPI 키 입력란 (입력값은 localStorage에 저장)
4. 보유 종목 데이터를 CSV로 내보내는 버튼
5. 가격 알림을 위한 브라우저 알림 권한 요청
```

**[Step 8] 다크 모드 및 마무리**

```
Tailwind의 dark: 클래스를 활용해서 전체 다크 모드를 완성해줘.
<html> 태그에 'dark' 클래스를 추가/제거하는 방식으로 라이트/다크를 전환하고,
설정값은 localStorage에 저장해줘.
차트와 뉴스 카드에 로딩 스켈레톤 컴포넌트를 추가해줘.
API 호출 실패 시를 위한 에러 바운더리와 재시도 로직을 추가해줘.
설치 방법, API 키 설정, 기능 목록을 포함한 README.md를 작성해줘.
```

---

## 11. 예상 일정 요약

| 단계 | 내용 | 소요 시간 |
|------|------|----------|
| Phase 1 | 프로젝트 기반 구축 | ~2시간 |
| Phase 2 | 가격 데이터 + 차트 | ~3시간 |
| Phase 3 | 뉴스/이슈 연동 | ~2시간 |
| Phase 4 | 핵심 기능 완성 | ~2시간 |
| Phase 5 | 부가 기능 + 마무리 | ~2시간 |
| **합계** | | **~11시간** |

---

## 12. 주의사항 및 제약

- Yahoo Finance 비공식 API는 rate limit이 있으므로 캐싱을 반드시 적용한다 (Zustand + 타임스탬프 체크).
- NewsAPI 무료 티어는 하루 100 요청 제한이 있으므로, 동일 결과를 30분간 캐싱한다.
- CORS 이슈는 Vite 개발 서버 프록시로 해결하며, 배포 시에는 Vercel Edge Functions 또는 간단한 Express 프록시를 추가한다.
- 한국 주식(KRX)을 모니터링하려면 ticker 포맷을 `005930.KS` (삼성전자) 형식으로 입력해야 한다.

---

*이 계획서를 Claude Code 세션 시작 시 첨부하거나, 각 Step 프롬프트를 순서대로 실행하면 전체 애플리케이션을 단계적으로 구축할 수 있습니다.*
