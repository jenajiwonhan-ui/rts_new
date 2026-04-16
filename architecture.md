# RTS (Resource Tracking System) - Architecture

## 1. 프로젝트 개요

RTS는 조직 계층 및 프로덕트 그룹별 리소스 투입 현황을 시각화하는 대시보드 애플리케이션입니다.
주간/월간 기준으로 인력 배분 데이터를 추적하고 차트로 표현합니다.

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19, TypeScript 5.9, Vite 8.0 |
| Styling | Custom CSS (CSS Variables, Pretendard 폰트) |
| Charts | Chart.js, react-chartjs-2 |
| Database | Supabase (PostgreSQL) |
| Backend | Node.js, TypeScript, node-cron |
| Deployment | Vercel |

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│                 Frontend                     │
│          (React + TypeScript + Vite)         │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages   │  │Components│  │  Charts    │  │
│  │(Home/SVC/│  │ (Common/ │  │(Doughnut/ │  │
│  │ GPD/NPD) │  │  Layout) │  │StackedBar)│  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       └──────────┬───┘──────────────┘        │
│            ┌─────┴──────┐                    │
│            │ DataContext │                    │
│            └─────┬──────┘                    │
│            ┌─────┴──────┐                    │
│            │  Services   │                    │
│            └─────┬──────┘                    │
└──────────────────┼───────────────────────────┘
                   │
           ┌───────┴────────┐
           │    Supabase     │
           │  (PostgreSQL)   │
           └───────┬────────┘
                   │
┌──────────────────┼───────────────────────────┐
│              Backend                          │
│        (Node.js + node-cron)                  │
│                                               │
│  ┌────────────────────────────┐               │
│  │  fetchRawData (Cron Job)   │               │
│  │  외부 API → Supabase 동기화  │               │
│  └────────────────────────────┘               │
└───────────────────────────────────────────────┘
```

## 4. 프론트엔드 디렉토리 구조

```
rts-dashboard/src/
├── components/
│   ├── charts/          # 차트 컴포넌트 (DoughnutChart, StackedBarChart 등)
│   ├── common/          # 공통 UI (LoadingSpinner, Toggle, MultiSelect, PeriodSelect)
│   ├── gpd/             # GPD(게임 프로덕트) 뷰
│   ├── home/            # 홈 대시보드
│   ├── layout/          # Header, Sidebar, Breadcrumb
│   └── svc/             # SVC(서비스) 뷰
├── contexts/            # DataContext (중앙 데이터 관리)
├── hooks/               # 커스텀 훅 (useMultiSelect)
├── services/            # API 연동 (Supabase 클라이언트)
├── types/               # TypeScript 인터페이스
├── utils/               # 유틸리티 함수
├── App.tsx              # 메인 앱 컴포넌트
└── main.tsx             # 엔트리 포인트
```

## 5. 백엔드 디렉토리 구조

```
rts-backend/src/
├── jobs/
│   └── fetchRawData.ts   # 외부 API 데이터 수집 스케줄러
├── index.ts              # Cron 스케줄러 엔트리
└── supabase.ts           # DB 클라이언트 설정
```

## 6. 주요 뷰 (ViewMode)

| 뷰 | 설명 |
|----|------|
| **Home** | 전체 대시보드 개요 |
| **SVC** | 조직 계층별 (Level 1-3) 리소스 현황 |
| **GPD** | 게임 프로덕트 기준 리소스 현황 |
| **NPD** | 비프로덕트 항목 리소스 현황 |

## 7. 데이터 흐름

1. **Backend**: node-cron이 주기적으로 외부 API에서 원시 데이터를 가져와 Supabase에 저장
2. **Frontend**: DataContext가 Supabase에서 데이터를 조회하여 중앙 관리
3. **시각화**: Chart.js 기반 컴포넌트가 데이터를 차트(도넛, 스택바 등)로 렌더링

## 8. 네비게이션 구조

```
┌─────────────────────────────────────────┐
│  Header (ViewMode 전환)                  │
├──────┬──────────────────────────────────┤
│      │  Breadcrumb                      │
│ Side │──────────────────────────────────│
│ bar  │                                  │
│      │  Main Content                    │
│(조직 │  (필터 드롭다운 + 차트 + 테이블)   │
│ 선택)│                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```
