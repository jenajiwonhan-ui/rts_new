# GP Dashboard Design System — DESIGN.md

> **GP 조직 내부 대시보드 공통 디자인 시스템**
> GP 조직에서 제작하는 모든 내부 대시보드에 동일하게 적용된다.
> Claude Code는 컴포넌트 구현 시 반드시 이 파일을 참조한다.


## 1. Color Tokens

### 1-1. Primitive — Primary (Blue)

```
primary-50:  #e0f0ff
primary-100: #99d0ff
primary-200: #47aaff
primary-300: #1890ff   ← base (가장 많이 쓰는 대표색)
primary-400: #006fd6
```

### 1-2. Primitive — Secondary (Purple)

```
secondary-50:  #f0eeff
secondary-100: #cdc5ff
secondary-200: #a594ff
secondary-300: #7c5cfc   ← base
secondary-400: #5a35d4

### 1-3. Primitive — Surface (Neutral)

surface-50:  #f5f5f7
surface-100: #e8e8ed
surface-200: #aeaeb2
surface-300: #6e6e73   ← text color
surface-400: #1d1d1f   ← heading color
```

### 1-4. Semantic Tokens

```css
/* Surface */
--color-sidebar-bg:     #ffffff;
--color-page-bg:        #f5f5f7;       /* surface-50 */
--color-panel-bg:       #f4f4f4;
--color-card-bg:        #ffffff;

/* Border */
--color-border:         rgba(0, 0, 0, 0.06);
--color-border-strong:  rgba(0, 0, 0, 0.12);
--color-divider:        rgba(0, 0, 0, 0.07);

/* Text */
--color-text-primary:   #1d1d1f;       /* surface-400 */
--color-text-secondary: #6e6e73;       /* surface-300 */
--color-text-tertiary:  #aeaeb2;       /* surface-200 */
--color-text-disabled:  rgba(0, 0, 0, 0.28);

/* Brand */
--color-brand-primary:  #1890ff;       /* primary-300 */
--color-brand-dark:     #006fd6;       /* primary-400 */
--color-brand-light:    #47aaff;       /* primary-200 */
--color-accent-light:   rgba(24, 144, 255, 0.1);
```

### 1-5. Status Tokens

```css
/* Success — 승인완료, 긍정 지표 */
--status-success-bg:    rgba(22, 163, 74, 0.1);
--status-success-text:  #16a34a;

/* Warning — 결재진행중, 주의 상태 */
--status-warning-bg:    rgba(245, 158, 11, 0.1);
--status-warning-text:  #b35a00;

/* Neutral — 취소, 비활성 */
--status-neutral-bg:    rgba(0, 0, 0, 0.06);
--status-neutral-text:  #999999;

/* Danger — 반려, 오류 */
--status-danger-bg:     rgba(232, 0, 11, 0.1);
--status-danger-text:   #a80008;
```

### 1-6. Chart Palette

Primary(블루) 스케일 우선. 계열이 5개 이상일 때 Secondary(보라)로 확장.

```css
/* ── Blue (기본, 계열 1~4) ── */
--chart-c1: #1890ff;   /* primary-300 — 1st series */
--chart-c2: #006fd6;   /* primary-400 — 2nd series */
--chart-c3: #47aaff;   /* primary-200 — 3rd series */
--chart-c4: #99d0ff;   /* primary-100 — 4th series */

/* ── Purple (확장, 계열 5~8 — 블루 부족 시) ── */
--chart-c5: #7c5cfc;   /* secondary-300 — 5th series */
--chart-c6: #5a35d4;   /* secondary-400 — 6th series */
--chart-c7: #a594ff;   /* secondary-200 — 7th series */
--chart-c8: #cdc5ff;   /* secondary-100 — 8th series */

/* 바 배경 트랙, 파이차트 미사용 구간 */
--chart-bg: rgba(0, 0, 0, 0.08);
```

> **규칙**: 계열 수가 1~4개면 블루(c1~c4)만 사용.
> 5개 이상이면 c1~c4 이후 c5~c8(보라)로 자연스럽게 확장.
> 블루와 보라를 교차 배치하지 않는다.

---

## 2. Typography

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Pretendard',
             'Helvetica Neue', Arial, sans-serif;
```

| Role         | Size  | Weight | Letter-spacing | Usage                     |
|--------------|-------|--------|----------------|---------------------------|
| `page-title` | 18px  | 600    | -0.4px         | 페이지 제목               |
| `card-title` | 14px  | 600    | -0.3px         | 카드 헤더                 |
| `body`       | 13px  | 400    | -0.2px         | 사이드바 아이템, 본문      |
| `data`       | 12px  | 400    | -0.15px        | 테이블 셀, 리스트 행       |
| `label`      | 11px  | 600    | -0.1px         | 범례, 뱃지, 보조 레이블   |
| `micro`      | 10px  | 600    | +0.3px         | 컬럼 헤더 (uppercase)     |
| `metric`     | 20px  | 600    | -0.5px         | KPI, 주요 수치            |

**Rules:**
- 모든 숫자: `font-variant-numeric: tabular-nums` 필수
- Weight: 400 / 500 / 600만 사용. **700 이상 금지**
- Uppercase 라벨에만 양수 letter-spacing, 그 외 음수

---

## 3. Spacing & Radius

### Border Radius

| Token           | Value  | Usage                    |
|-----------------|--------|--------------------------|
| `radius-panel`  | 14px   | 메인 콘텐츠 패널         |
| `radius-card`   | 10px   | 내부 카드                |
| `radius-item`   | 7px    | 사이드바 아이템          |
| `radius-badge`  | 980px  | Pill 탭, 뱃지            |
| `radius-bar`    | 999px  | 데이터 바 (완전 둥근)    |

### Layout

| Element           | Value  |
|-------------------|--------|
| Sidebar width     | 220px  |
| Panel margin      | 10px   |
| Content max-width | 1280px |
| Panel padding     | 20px   |
| Card gap          | 10px   |

---

## 4. Elevation & Shadow

--shadow-panel: 0 4px 24px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.04);  /* 미사용 — panel-wrap에 shadow 없음 */
--shadow-card:  0 1px 6px rgba(0, 0, 0, 0.05);
--shadow-pill:  0 1px 4px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
```

> **주의**: `--shadow-panel`은 토큰으로 정의되어 있으나 `.panel-wrap`에는 적용하지 않는다. 패널은 shadow 없이 배경색(`#f4f4f4`)과 border-radius만으로 구분한다.

---

## 5. Layout

### 전체 구조

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (220px, bg:#fff, border-right: none)        │
│  └─ Brand 로고/명칭 (최상단)                          │
│  └─ Section > Items (최대 2 depth)                   │
├──────────────────────────────────────────────────────┤
│  Main (bg:#fff)                                       │
│  └─ panel-wrap                                        │
│      bg:#f4f4f4 · border-radius:14px · margin:10px   │
│      (shadow 없음)                                    │
│      └─ panel-header (no border-bottom)               │
│          └─ panel-header-inner (max-width:1280px)     │
│              └─ ph-row                                │
│                  └─ ph-title [› sub-title] + filter   │
│      └─ panel-body                                    │
│          └─ panel-body-inner (max-width:1280px)       │
│              └─ .content (padding:20px)               │
│                  └─ Cards, Charts, Tables...          │
└──────────────────────────────────────────────────────┘
```

**핵심 원칙:**
- 레이어 최대 2단계: page-bg(#f4f4f4) → card-bg(#fff)
- 사이드바 border-right 없음 — 배경색 대비로 구분
- Topbar 없음 — 브랜드는 사이드바 최상단에 배치
- panel-header와 panel-body-inner는 동일한 max-width(1280px) + 동일한 수평 padding(20px) → 제목과 카드 좌측 정렬 일치

### Panel Header CSS

```css
.panel-header {
  padding: 20px 0 0;    /* top 20px, 좌우·하단 없음 */
  flex-shrink: 0;
}
.panel-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 0 20px;      /* panel-body-inner와 동일 기준 */
}
.ph-row {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 0;     /* 하단 gap은 .content padding-top(20px)이 담당 */
}
.ph-title {
  font-size: 18px; font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.4px;
  display: flex; align-items: center; gap: 6px;
}

/* 2-depth 타이틀 패턴: 상위 선택 → 하위 선택 시 "상위 › 하위" 표시 */
/* 예) "GPD1 › Subnautica 2", "EPS › 팀 이름" 등 2레벨 메뉴라면 공통 적용 */
.ph-title-parent { color: var(--color-text-tertiary); font-weight: 500; }
.ph-title-sep    { color: var(--color-text-tertiary); font-weight: 400; font-size: 16px; }
/* 상위만 선택된 경우(하위 없음): ph-title에 텍스트 직접 — parent/sep 없이 */
```

**Spacing 원칙:**
- 제목 위: 20px (`panel-header` padding-top)
- 제목 아래: 20px (`.content` padding-top) → 위아래 동일

### Sidebar CSS

```css
.sidebar {
  width: 220px;
  background: #ffffff;
  overflow-y: auto;
  height: 100vh;
  flex-shrink: 0;
  padding: 14px 0;
}
.sb-brand {
  padding: 6px 12px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 브랜드 아이콘: 파비콘과 동일한 SVG, 연한 파란 네모 배경 */
.sb-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: rgba(0, 113, 227, 0.08);
  border-radius: 6px;
  padding: 3px;
}
.sb-section {
  padding: 10px 14px 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.sb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin: 1px 6px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--color-text-primary);
  border: none;
  background: transparent;
  width: calc(100% - 12px);
  cursor: pointer;
  transition: background 0.12s;
}
.sb-item:hover  { background: #f2f2f2; }
.sb-item.active { background: #efefef; font-weight: 500; }

.sb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);   /* 기본: 회색 */
  flex-shrink: 0;
}
.sb-item.active .sb-dot { background: var(--color-brand-primary); /* #1890ff */ }

.sb-divider {
  height: 1px;
  background: var(--color-divider);
  margin: 6px 12px;
}

/* L2 서브아이템 (필요한 경우에만) */
.sb-item-l2 {
  padding-left: 26px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
```

### Sidebar Menu 구조 규칙

```
[브랜드명]

── Section A ──────────────────      ← sb-section
  ○ 전체                             ← sb-item (L1)
  ● 현재 선택     ← active           ← sb-item.active
  ○ 항목 B
── [sb-divider] ──────────────
── Section B ──────────────────
  ○ 전체
  ○ 항목 C
    · 서브항목    ← sb-item-l2 (필요시)
```

**Rules:**
- 섹션마다 "전체" 아이템 제공 권장
- 섹션 사이 `sb-divider` 필수
- 불릿(sb-dot): 기본 회색, active만 `#1890ff`
- L2는 꼭 필요한 경우에만

---

## 6. Components

### Segmented Control

Badge(pill)와 구분: badge는 `radius-badge(980px)` 유지, **토글/탭 컨트롤은 `8px`** 사용 — 카드 계열과 시각적 통일감.

```css
.seg-ctrl {
  display: inline-flex;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 8px;   /* ← 980px(pill) 아님 */
  padding: 3px;
}
.seg-btn {
  height: 28px;
  padding: 0 16px;
  border-radius: 6px;   /* ← container보다 2px 작게 */
  border: none;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
}
.seg-btn.active {
  background: #ffffff;
  color: var(--color-text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-pill);
}
```

### Card

```css
.card {
  background: var(--color-card-bg);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.card-head {
  padding: 11px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}
.card-title { font-size: 13px; font-weight: 600; }
.card-sub   { font-size: 11px; color: var(--color-text-tertiary); }
```

### Metric (KPI) Card

```
Layout: grid, repeat(N, 1fr), gap: 8px

구조 (카드당):
  Label   10px  uppercase  의미에 맞는 색
  Value   20px  weight 600 의미에 맞는 색
  Sub     11px             동일 색 or tertiary

색상 가이드:
  기본값:    --color-text-primary
  1순위 강조: primary-300 (#1890ff)
  2순위 강조: primary-400 (#006fd6)
  긍정:      --status-success-text
  경고:      --status-warning-text
```

### Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge-success  { background: var(--status-success-bg);  color: var(--status-success-text);  }
.badge-warning  { background: var(--status-warning-bg);  color: var(--status-warning-text);  }
.badge-neutral  { background: var(--status-neutral-bg);  color: var(--status-neutral-text);  }
.badge-danger   { background: var(--status-danger-bg);   color: var(--status-danger-text);   }
```

### Data Table

```css
.table-head th {
  padding: 7px 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  color: var(--color-text-tertiary);
  background: var(--color-card-bg);   /* solid — sticky 헤더가 스크롤 행과 겹치지 않도록 */
  border-bottom: 1px solid var(--color-border);
}
.table-row td {
  padding: 10px 12px;
  font-size: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  font-variant-numeric: tabular-nums;
}
.table-row:hover td      { background: rgba(0, 0, 0, 0.015); }
.table-row:last-child td { border-bottom: none; }
/* 금지: zebra stripe, 배경색으로 행 구분 */
```

### Chart Legend

커스텀 범례. Chart.js 내장 legend는 항상 `display: false`.

```css
.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  padding: 12px 0 14px;
}
.sl-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-secondary);   /* #6e6e73 — opacity 없음 */
}
.sl-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;   /* 둥근 사각형 — 원형 아님 */
  flex-shrink: 0;
}
```

> **주의**: `.sl-dot`은 `border-radius: 3px` 사각형. `border-radius: 50%` 원형 사용 금지.
> 색상에 `opacity` 적용 금지 — 시리즈 색상 그대로 사용.

### Data Bar

진행률, 비율, 달성도 표현. 최대 3레이어 겹침.

```
height: 12~16px · border-radius: 999px

Layer 1 — 배경/기준:  width:100%,   background: rgba(0,0,0,0.08)
Layer 2 — 중간값:     width:{mid}%, background: #1890ff, opacity:0.55
Layer 3 — 실제값:     width:{val}%, background: #006fd6

레이블:
  기준값:  바 우측 상단, color: text-tertiary
  중간·실제값: 바 끝 지점 하단 (공간 충분하면 내부, 아니면 외부)
  범례:    카드 상단에 1회만 표시
```

---

## 7. Charts

Chart.js 사용. 모든 차트: `responsive: true`, `maintainAspectRatio: false`.

### 공통 옵션

```js
const chartDefaults = {
  plugins: {
    legend: { display: false },  // 항상 커스텀 범례
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#1d1d1f',
      bodyColor: '#6e6e73',
      borderColor: 'rgba(0,0,0,0.08)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#aeaeb2', font: { size: 11 } } },
    y: { grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false },
         ticks: { color: '#aeaeb2', font: { size: 11 } } },
  },
};
```

### Chart Color Assignment

```js
// 계열 수에 따라 자동 배열
const CHART_COLORS = [
  '#1890ff',  // c1 — primary-300
  '#006fd6',  // c2 — primary-400
  '#47aaff',  // c3 — primary-200
  '#99d0ff',  // c4 — primary-100
  '#7c5cfc',  // c5 — secondary-300 (5개 이상일 때)
  '#5a35d4',  // c6 — secondary-400
  '#a594ff',  // c7 — secondary-200
  '#cdc5ff',  // c8 — secondary-100
];

// 사용 예
datasets: series.map((s, i) => ({
  backgroundColor: CHART_COLORS[i],
  ...
}))
```

### Stacked Bar Chart

```js
datasets: [
  // 실적 계열 — CHART_COLORS 순서
  { type: 'bar', label: s.label, data: s.data,
    backgroundColor: CHART_COLORS[i], borderRadius: 3, stack: 'stack' },

  // 기준선 (목표/계획이 있는 경우)
  { type: 'line', label: '기준', data: baseline,
    borderColor: 'rgba(0,0,0,0.25)', borderWidth: 1.5,
    borderDash: [4, 3], pointRadius: 3, fill: false, tension: 0 },
]
scales: {
  x: { stacked: true, grid: { display: false } },
  y: { stacked: true },
}
```

### Donut Chart

```js
{
  type: 'doughnut',
  data: {
    datasets: [{
      data: [value1, value2, remainder],
      backgroundColor: ['#1890ff', '#006fd6', 'rgba(0,0,0,0.08)'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 4,
    }]
  },
  options: {
    cutout: '62%',
    plugins: { legend: { display: false } },
  }
}
// 중앙 텍스트: CSS position:absolute overlay
// 주요 수치: 20px, weight 700, text-primary
```

---

## 8. Rules — Do / Don't

### Do ✅
- 차트: 1~4계열은 블루(c1~c4), 5계열 이상에서만 보라(c5~c8) 추가
- 블루와 보라를 교차 배치하지 않는다 — 블루 소진 후 보라
- 사이드바 불릿: 기본 회색, active만 `#1890ff`
- 섹션 사이 `sb-divider` 삽입
- 모든 숫자에 `font-variant-numeric: tabular-nums`
- 콘텐츠 `max-width: 1280px` 중앙 정렬
- 행 구분은 `border-bottom` 만 사용
- Shadow는 `--shadow-card` / `--shadow-pill` 2종만 실사용 (`--shadow-panel`은 토큰만 존재, 미적용)
- 차트 범례는 항상 커스텀

### Don't ❌
- 블루/보라 외 색상을 차트에 사용
- 사이드바 `border-right`
- 별도 Topbar 추가
- `font-weight: 700` 이상
- Zebra stripe / 배경색으로 행 구분
- 레이어 3중 구조 (page-bg → card 가 최대)
- `border-radius` 임의 값 사용 (토큰 외 금지)
- L2 sidebar 남용
