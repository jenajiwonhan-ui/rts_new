# RTS - Design System

Apple 디자인 시스템을 기반으로 한 대시보드 디자인. 데이터가 주인공이고, UI는 뒤로 물러난다.

## 1. 컬러 토큰

### 배경 / 표면

| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg` | `#f5f5f7` | 페이지 배경, 테이블 헤더, 행 hover |
| `--card` | `#ffffff` | 카드/패널 배경 |
| `--border` | `rgba(0, 0, 0, 0.04)` | 거의 보이지 않는 미세한 경계선 |
| `--al` | `#e8f0fe` | 액센트 라이트 (활성 항목 배경) |

### 텍스트

| 변수 | 값 | 용도 |
|------|-----|------|
| `--text` | `#1d1d1f` | 기본 텍스트 |
| `--ts` | `rgba(0, 0, 0, 0.8)` | 보조 텍스트 (꽤 진함) |
| `--td` | `rgba(0, 0, 0, 0.48)` | 디밍 텍스트, 테이블 헤더, 라벨 |
| `--ba` | `rgba(0, 0, 0, 0.48)` | 비활성 요소, 스크롤바 |

### 인터랙티브

| 변수/값 | 용도 |
|---------|------|
| `--accent` `#0071e3` | 유일한 강조색 — 인터랙티브 요소 전용 |
| `#0066cc` | 텍스트 링크 전용 (약간 더 어두움) |

## 2. 타이포그래피

### 폰트 패밀리
```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
'Pretendard', 'Helvetica Neue', Helvetica, Arial, sans-serif
```

### 사이즈 계층 (5단계)

| 역할 | 크기 | 굵기 | letter-spacing | 사용 위치 |
|------|------|------|---------------|----------|
| 패널 제목 | 17px | 600 | -0.374px | 패널 헤더 h3, 테이블 제목 |
| 주요 정보 | 14px | 400~600 | -0.224px | 사이드바, 랭킹 카드, 본문 |
| 데이터/컨트롤 | 12px | 400 | -0.12px | 표 데이터, 필터, 토글, 셀렉트, 레전드 |
| 보조 라벨 | 11px | 600 | 0.3px / -0.08px | 테이블/트리 헤더 (uppercase), 카운트 |
| 구조 표시 | 10px | 600 | 0.3px | th, 사이드바 섹션 타이틀 (uppercase) |

### 원칙
- 모든 사이즈에서 음수 letter-spacing (라벨/헤더 제외)
- 굵기는 400과 600만 사용, 700 이상 금지
- 숫자 영역에 `font-variant-numeric: tabular-nums` 필수

## 3. 간격 / 라운딩

| 변수 | 값 | 용도 |
|------|-----|------|
| `--r` | `8px` | 기본 radius (패널, 랭킹 카드, 드롭다운 아이템) |
| `--rl` | `12px` | 큰 radius (팝오버, 인라인 패널) |
| `11px` | - | 필터/서치 컨트롤 전용 (Apple Filter Button) |
| `6px` | - | 사이드바 아이템 (좁은 공간) |
| `980px` | - | Pill 탭 (prod-tab) |

### 패널 간 간격
- `gpd-panels` gap: **24px**
- 랜딩 카드 간: **16px**

## 4. 그림자

단일 그림자만 사용 (Apple 원칙):

```css
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
```

모든 패널, 카드, 테이블, 팝오버, 드롭다운에 동일하게 적용.
border는 사용하지 않음 (`border: none`).

## 5. 컴포넌트 스타일

### 헤더 (Glass Navigation)
```css
background: rgba(0, 0, 0, 0.8);
backdrop-filter: saturate(180%) blur(20px);
height: 48px;
```

### 패널 (카드)
```css
background: var(--card);
border: none;
border-radius: var(--r);  /* 8px */
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
```

### 필터/서치 컨트롤 (Apple Filter Button)
```css
background: #fafafc;
border: 3px solid rgba(0, 0, 0, 0.04);
border-radius: 11px;
height: 32px;
font-size: 12px;
```
`.fi`, `.svc-org-select`, `.ms-btn`, `.search-row input` 모두 동일.

### 토글 (Segmented Control)
```css
/* 컨테이너 */
background: rgba(0, 0, 0, 0.04);
border-radius: var(--r);
padding: 3px;

/* 활성 버튼 */
background: #fff;
font-weight: 600;
box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
```

### Pill 탭
```css
border-radius: 980px;
font-size: 12px;
/* 비활성: transparent, 활성: rgba(0,0,0,0.06) + font-weight 600 */
```

### 사이드바
```css
/* 섹션 타이틀: 10px uppercase, 0.3px tracking */
/* 아이템: 13px, radius 6px */
/* 서브아이템: 12px, indent 22px */
/* hover: rgba(0,0,0,0.04) */
/* active: var(--al) + var(--accent) + weight 600 */
/* divider: rgba(0,0,0,0.06) */
```

### 테이블/트리 행
```css
background: var(--card);
border-bottom: 1px solid var(--border);
font-size: 12px;
/* hover: var(--bg) — 솔리드, 모든 행 동일 */
/* 배경색 차이 없음 (zebra/lv2 배경 제거) */
```

### 정렬 아이콘
```css
margin-left: auto;  /* 열 오른쪽 끝에 붙음 */
font-size: 10px;
```

### 데이터 레이블 (차트)
```
총합/세그먼트: 12px weight 500 (weekly: 10px)
diff: 10px weight 400 (weekly: 9px)
칩 (overflow): 18px 높이, pill shape, #fff 92% opacity + 0.5px border
```

### 포커스 상태
```css
outline: 2px solid var(--accent);
outline-offset: 2px;
```

## 6. 페이지 구조

### 랜딩 페이지
- 제목: 28px 가운데 정렬
- 섹션: 카드형 패널 (shadow 포함), 16px 간격
- 본문: 13px, `--td` 색상 (제목보다 연하게)

### 데이터 페이지
- 소제목 없음 — 패널 3개가 flat하게 나열
  1. **Monthly Snapshot** — 랭킹 카드 + 도넛 차트
  2. **4-Month Trend** — 스택 바 차트 + 토글
  3. **Details** — 필터 + 트리/테이블

### Favicon
- 단일 `#0071e3` + opacity 차이 (0.4 / 0.65 / 1.0)로 3개 바 차트 표현
- 그라데이션/shadow 없음, 투명 배경

## 7. Do's and Don'ts

### Do
- accent(`#0071e3`)는 인터랙티브 요소에만 사용
- 모든 텍스트에 음수 letter-spacing 적용
- 카드는 border 없이 단일 soft shadow
- 행 hover는 `var(--bg)` 솔리드 — 반투명 금지
- 숫자에 `tabular-nums` 적용
- transition은 `.2s ease` 통일

### Don't
- 추가 accent 컬러 도입 금지
- 다중 shadow 레이어 금지
- font-weight 700 이상 금지
- zebra/배경색 차이로 행 구분 금지 — 가로선만
- 넓은 letter-spacing (라벨/헤더 uppercase 제외)
- 배경에 그라데이션/텍스처 금지
