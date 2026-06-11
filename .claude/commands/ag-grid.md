# AG Grid ERP 표준 사용 가이드

AG Grid가 포함된 화면을 개발할 때 아래 규칙을 **예외 없이** 적용하세요.
규칙에 없는 방식으로 임의 구현하지 마세요.

---

## 화면 개발 시 체크리스트

AG Grid 화면을 구현하기 전에 아래 5가지를 확인하고 적용하세요.

### 1. 숫자 컬럼 — 천단위 콤마 + 우측 정렬

숫자형 필드는 반드시 아래 방식만 사용하세요.

```ts
const numberColDef = {
  type: 'numericColumn',         // 우측 정렬
  valueFormatter: (p) =>
    p.value == null ? '' : Number(p.value).toLocaleString('ko-KR'),
};
```

- `cellStyle`로 직접 `textAlign: 'right'`를 중복 지정하지 마세요.

---

### 2. 날짜 컬럼 — YYYY/MM/DD

날짜 표현은 항상 `YYYY/MM/DD`만 사용하세요. (`YYYY-MM-DD`, `YYYY.MM.DD` 금지)

```ts
const dateColDef = {
  valueFormatter: (p) => {
    if (!p.value) return '';
    const d = dayjs(p.value);
    return d.isValid() ? d.format('YYYY/MM/DD') : p.value;
  },
};
```

---

### 3. 코드HELP 셀 — 돋보기(🔍) 아이콘

코드도움 셀의 버튼은 텍스트 없이 돋보기 아이콘만 사용하세요. ("조회", "선택" 등 텍스트 금지)

```tsx
const CodeHelpRenderer = (props) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span>{props.value}</span>
    <button
      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
      onClick={() => openCodeHelp(props)}
    >
      🔍
    </button>
  </span>
);
```

---

### 4. 전체 폰트 — 맑은 고딕 10pt

개별 `colDef`에 폰트를 지정하지 마세요. 반드시 전역 CSS 변수로만 관리하세요.

```css
.ag-theme-alpine {
  --ag-font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
  --ag-font-size: 10pt;
}
```

---

### 5. 헤더(컬럼 타이틀) — 가운데 정렬

모든 컬럼 헤더는 가운데 정렬이 기본입니다. `defaultColDef`에 반드시 포함하세요.

```ts
const defaultColDef = {
  headerClass: 'ag-header-center',
};
```

```css
.ag-header-center .ag-header-cell-label {
  justify-content: center;
}
```

---

## 공통 모듈 — 화면마다 새로 작성 금지

위 설정은 공통 모듈(`src/components/grid/`)에 정의하고 import해서 사용하세요.

```ts
// src/components/grid/gridDefaults.ts
export const defaultColDef = {
  headerClass: 'ag-header-center',
  resizable: true,
  sortable: true,
};

export const columnTypes = {
  number: {
    type: 'numericColumn',
    valueFormatter: (p) =>
      p.value == null ? '' : Number(p.value).toLocaleString('ko-KR'),
  },
  date: {
    valueFormatter: (p) => {
      if (!p.value) return '';
      const d = dayjs(p.value);
      return d.isValid() ? d.format('YYYY/MM/DD') : p.value;
    },
  },
};
```

새 그리드 화면을 개발할 때는 위 `defaultColDef`와 `columnTypes`를 반드시 import해서 사용하세요.
