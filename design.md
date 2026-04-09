# GP RTS Dashboard — DESIGN.md

> Apple-inspired design system for an internal resource tracking dashboard.
> Light mode only · Data-dense · Functional over decorative

---

## 1. Visual Theme & Atmosphere

**Philosophy**: 데이터가 주인공이고, UI는 뒤로 물러난다. Apple의 "controlled minimalism" — 모든 픽셀이 정보를 위해 존재하고, 인터페이스 자체는 투명해질 때까지 절제한다.

**Density**: Medium-high. 리소스 배분 데이터를 추적하는 대시보드 — 정보 밀도가 핵심.

**Personality Keywords**: Precise · Legible · Calm · Minimal · Neutral

**Anti-patterns**:
- 다중 shadow 레이어
- 배경 그라데이션/텍스처
- Zebra stripe (가로선으로 충분)
- 인터랙티브가 아닌 곳에 accent 컬러

---

## 2. Color Palette

### Surface & Neutral

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f5f5f7` | 페이지 배경, 테이블 헤더, 행 hover |
| `--card` | `#ffffff` | 카드/패널 배경 |
| `--border` | `rgba(0, 0, 0, 0.04)` | 미세한 경계선 (거의 안 보임) |
| `--text` | `#1d1d1f` | 기본 텍스트 |
| `--ts` | `rgba(0, 0, 0, 0.8)` | 보조 텍스트 (꽤 진함) |
| `--td` | `rgba(0, 0, 0, 0.48)` | 디밍 텍스트, 라벨, 테이블 헤더 |
| `--ba` | `rgba(0, 0, 0, 0.48)` | 비활성 요소, 스크롤바 |

### Interactive

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#0071e3` | 유일한 강조색 — 인터랙티브 전용 |
| `--al` | `#e8f0fe` | 액센트 라이트 (활성 항목 배경) |
| link | `#0066cc` | 텍스트 링크 전용 |

### Hover / Active States

| State | Value | 사용처 |
|-------|-------|--------|
| hover (밝은 배경 위) | `rgba(0, 0, 0, 0.04)` | 사이드바 항목 |
| hover (행) | `var(--bg)` 솔리드 | 테이블/트리 행 — 반투명 금지 |
| active pill/tab | `rgba(0, 0, 0, 0.06)` | prod-tab 활성 |
| filter hover | `#f0f0f4` | 필터 컨트롤 hover |

---

## 3. Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
             'Pretendard', 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

### Type Scale (5단계)

| Role | Size | Weight | Letter Spacing | Usage |
|------|------|--------|---------------|-------|
| Panel Title | 17px | 600 | -0.374px | 패널 헤더 h3, 테이블 제목 |
| Primary Info | 14px | 400~600 | -0.224px | 사이드바 아이템, 랭킹 카드, 본문 |
| Data / Control | 12px | 400 | -0.12px | 표 데이터, 필터, 토글, 셀렉트, 레전드 |
| Aux Label | 11px | 600 | 0.3px / -0.08px | 테이블 헤더 uppercase, 카운트 |
| Structure | 10px | 600 | 0.3px | th, 사이드바 섹션 타이틀 (uppercase) |

### Rules
- 모든 사이즈에서 음수 letter-spacing (라벨/헤더 uppercase 제외)
- 굵기는 400과 600만 사용, 700 이상 금지
- 숫자 데이터에 `font-variant-numeric: tabular-nums` 필수
- 페이지 내 font-size 종류를 이 5단계 밖으로 늘리지 말 것

---

## 4. Spacing & Radius

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r` | `8px` | 기본 (패널, 랭킹 카드, 드롭다운 아이템) |
| `--rl` | `12px` | 큰 (팝오버, 인라인 패널) |
| - | `11px` | 필터/서치 컨트롤 (Apple Filter Button) |
| - | `6px` | 사이드바 아이템, 토글 내부 버튼 |
| - | `980px` | Pill 탭 (prod-tab) |

### Panel Spacing
- 패널 간 gap: **24px** (`gpd-panels`)
- 랜딩 카드 간: **16px**
- 콘텐츠 padding: **24px 32px**

---

## 5. Elevation & Shadow

단일 shadow만 사용 — Apple 원칙.

```css
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
```

모든 패널, 카드, 테이블, 팝오버, 드롭다운, 토글 active에 동일 적용.
`border: none` — 카드에 border 사용하지 않음.

| Level | Treatment | Usage |
|-------|-----------|-------|
| Flat | none | 일반 콘텐츠 영역 |
| Glass | `rgba(0,0,0,0.8)` + `backdrop-filter: saturate(180%) blur(20px)` | 헤더 네비게이션 |
| Elevated | `rgba(0,0,0,0.22) 3px 5px 30px` | 패널, 카드, 팝오버 |

---

## 6. Component Specs

### Header (Glass Navigation)
```css
background: rgba(0, 0, 0, 0.8);
backdrop-filter: saturate(180%) blur(20px);
height: 48px;
font-size: 14px;
```

### Panel (Card)
```css
background: var(--card);
border: none;
border-radius: var(--r);  /* 8px */
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
/* Panel header h3: 17px weight 600 */
```

### Filter / Search Control (Apple Filter Button)
```css
background: #fafafc;
border: 3px solid rgba(0, 0, 0, 0.04);
border-radius: 11px;
height: 32px;
font-size: 12px;
color: var(--ts);
hover: background #f0f0f4;
focus: outline 2px solid var(--accent), offset 2px;
```
`.fi`, `.svc-org-select`, `.ms-btn`, `.search-row input` 모두 동일 스타일.

### Toggle (Segmented Control)
```css
/* Container */
background: rgba(0, 0, 0, 0.04);
border-radius: var(--r);
padding: 3px;

/* Button */
font-size: 12px; height: 24px; radius: 6px;

/* Active */
background: #fff; font-weight: 600;
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
```

### Pill Tab
```css
border-radius: 980px;
font-size: 12px;
/* off: transparent */
/* on: rgba(0,0,0,0.06) + font-weight 600 */
```

### Sidebar
```css
width: 220px;
/* Section title: 10px uppercase, 0.3px tracking */
/* Item: 13px, radius 6px, gap 7px */
/* Sub-item: 12px, indent 22px */
/* hover: rgba(0,0,0,0.04) */
/* active: var(--al) bg + var(--accent) text + weight 600 */
/* divider: rgba(0,0,0,0.06) */
```

### Table / Tree Row
```css
background: var(--card);
border-bottom: 1px solid var(--border);
font-size: 12px;
font-variant-numeric: tabular-nums;
/* hover: var(--bg) — 솔리드, 반투명 금지 */
/* 배경색 차이 없음 (zebra/lv2 배경 제거) */
```

### Sort Icon
```css
margin-left: auto;  /* 열 오른쪽 끝 */
font-size: 10px;
color: var(--ba);
active: color var(--accent);
```

### Chart Data Labels
```
Total / Segment: 12px weight 500 (weekly: 10px)
Diff: 10px weight 400 (weekly: 9px)
Chip (overflow): 18px height, pill shape, #fff 92% opacity + 0.5px border
Color on chip: rgba(0,0,0,0.8) value, rgba(0,0,0,0.48) diff
```

### Focus State
```css
outline: 2px solid var(--accent);
outline-offset: 2px;
```

### Favicon
- 단일 `#0071e3` + opacity 차이 (0.4 / 0.65 / 1.0)로 3개 바 차트
- 그라데이션/shadow 없음, 투명 배경

---

## 7. Page Structure

### Landing Page
- 제목: 28px 가운데 정렬 (favicon 없음)
- 섹션: 카드형 패널 (shadow), 16px 간격
- 본문: 13px, `--td` 색상

### Data Page
- 소제목 없음 — 패널 3개 flat 나열, 24px 간격
  1. **Monthly Snapshot** — 랭킹 카드 + 도넛 차트 + 월 선택
  2. **4-Month Trend** — 스택 바 차트 + 토글 + 레전드
  3. **Details** — 필터 + 트리/테이블

---

## 8. Do's & Don'ts

### Do
- accent(`#0071e3`)는 인터랙티브 요소에만
- 모든 텍스트에 음수 letter-spacing (라벨/헤더 uppercase 제외)
- 카드는 border 없이 단일 soft shadow
- 행 hover는 `var(--bg)` 솔리드
- 숫자에 `tabular-nums`
- transition `.2s ease` 통일
- 행 구분은 가로선(`border-bottom`)만

### Don't
- 추가 accent 컬러 도입
- 다중 shadow 레이어
- font-weight 700 이상
- zebra stripe / 배경색 차이로 행 구분
- 배경에 그라데이션/텍스처
- 반투명 hover (`rgba` 직접 사용 → `var(--bg)` 솔리드로)
- 넓은 letter-spacing (uppercase 라벨 제외)
