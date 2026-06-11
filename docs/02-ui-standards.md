# 02. 공통 UI/UX 표준

## 1. 화면 레이아웃 구조

모든 업무 화면은 아래 3단 구조를 따릅니다.

```
┌─────────────────────────────────────────────┐
│  GNB (Global Navigation Bar)                │  고정 높이 56px
├─────────────┬───────────────────────────────┤
│             │  ┌───────────────────────────┐│
│  사이드 메뉴│  │  검색 조건 영역 (Collapse) ││  접이식 (기본 펼침)
│  (240px)    │  ├───────────────────────────┤│
│             │  │  버튼 영역 (우측 정렬)    ││  고정 높이 48px
│             │  ├───────────────────────────┤│
│             │  │  AG Grid 목록             ││  남은 높이 꽉 채움
│             │  │                           ││
│             │  └───────────────────────────┘│
└─────────────┴───────────────────────────────┘
```

- `HEADER-DETAIL` 화면은 그리드 영역이 헤더 폼 + 디테일 그리드로 분리됩니다.
- 화면 높이는 `calc(100vh - GNB높이)` 기준으로 스크롤 없이 꽉 채웁니다.

---

## 2. Ant Design 공통 설정

### 2-1. 로케일·테마 (App.tsx)

```tsx
<ConfigProvider locale={koKR}>
  <AntApp>
    {/* 모든 화면 */}
  </AntApp>
</ConfigProvider>
```

### 2-2. 디자인 토큰 기준

| 항목 | 값 | 비고 |
|------|----|------|
| Primary Color | `#1677ff` | Ant Design 기본 파란색 |
| Font Size | `13px` | 기본 (ERP 특성상 작게) |
| Border Radius | `4px` | 입력 필드·버튼 |
| 폼 라벨 넓이 | `80px` | 검색 조건 폼 기준 |

### 2-3. 폼 입력 필드 크기

- 검색 조건: `size="middle"` (기본값)
- 데이터 입력 팝업: `size="middle"`
- 로그인 등 단독 화면: `size="large"`

### 2-4. 버튼 규칙

| 버튼 | 타입 | 위치 | 단축키 |
|------|------|------|--------|
| 조회 | `primary` | 검색 우측 | F5 |
| 저장 | `primary` | 버튼 바 | — |
| 삭제 | `danger` | 버튼 바 | — |
| 엑셀 | `default` | 버튼 바 우측 | — |
| 닫기/취소 | `default` | 버튼 바 우측 | ESC |

버튼 바는 항상 **우측 정렬**합니다.

```tsx
<Space style={{ float: 'right' }}>
  <Button type="primary" onClick={handleSearch}>조회</Button>
  <Button type="primary" onClick={handleSave}>저장</Button>
  <Button danger onClick={handleDelete}>삭제</Button>
  <Button onClick={handleExcel}>엑셀</Button>
</Space>
```

---

## 3. AG Grid 공통 설정

### 3-1. 필수 공통 옵션

모든 그리드에 아래 옵션을 적용합니다.

```tsx
const defaultGridOptions = {
  rowHeight: 28,           // ERP 밀도에 맞는 낮은 행 높이
  headerHeight: 32,
  suppressMovableColumns: false,
  suppressColumnVirtualisation: false,
  rowSelection: 'single', // 기본 단일 선택 (다중 선택 필요 시 'multiple')
  animateRows: false,      // ERP 대용량 데이터 → 애니메이션 OFF
  suppressCellFocus: false,
  stopEditingWhenCellsLoseFocus: true,
  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 20,
  // 한국어 로케일
  localeText: AG_GRID_LOCALE_KO,  // src/components/grid/locale.ts 참고
};
```

### 3-2. 공통 컬럼 타입

`src/components/grid/columnTypes.ts`에 정의하고 모든 그리드에서 재사용합니다.

| 타입 키 | 설명 | 정렬 | 포맷 |
|---------|------|------|------|
| `numericColumn` | 정수 | 우측 | `#,##0` |
| `amountColumn` | 금액 | 우측 | `#,##0` |
| `decimalColumn` | 소수 | 우측 | `#,##0.##` |
| `dateColumn` | 날짜 | 중앙 | `YYYY-MM-DD` |
| `checkboxColumn` | 체크박스 | 중앙 | boolean |
| `codeColumn` | 코드 | 중앙 | 그대로 |

```typescript
// src/components/grid/columnTypes.ts 예시
export const columnTypes = {
  amountColumn: {
    type: 'rightAligned',
    valueFormatter: (p) => p.value?.toLocaleString() ?? '',
    cellStyle: { textAlign: 'right' },
  },
  dateColumn: {
    cellStyle: { textAlign: 'center' },
    valueFormatter: (p) => p.value ? dayjs(p.value).format('YYYY-MM-DD') : '',
  },
};
```

### 3-3. 행 상태 색상 (CRUD 표시)

AG Grid 인라인 편집 화면에서 변경된 행을 시각적으로 구분합니다.

| 상태 | `rowStatus` 값 | 배경색 |
|------|--------------|--------|
| 신규 | `'C'` | `#e6f4ff` (연파란) |
| 수정 | `'U'` | `#fffbe6` (연노랑) |
| 삭제 예정 | `'D'` | `#fff1f0` (연빨강) |
| 변경 없음 | `''` | 흰색 |

```typescript
// getRowStyle 예시
getRowStyle: (params) => {
  switch (params.data?.rowStatus) {
    case 'C': return { background: '#e6f4ff' };
    case 'U': return { background: '#fffbe6' };
    case 'D': return { background: '#fff1f0' };
  }
},
```

### 3-4. 그리드 높이

그리드가 컨테이너를 꽉 채우도록 **반드시** 부모에 높이를 지정합니다.

```tsx
// 부모 컨테이너
<div style={{ height: 'calc(100vh - 200px)' }}>
  <AgGridReact ... />
</div>
```

### 3-5. 엑셀 내보내기

```typescript
const handleExcel = () => {
  gridRef.current?.api.exportDataAsExcel({
    fileName: `${화면명}_${dayjs().format('YYYYMMDD')}.xlsx`,
    sheetName: '데이터',
  });
};
```

---

## 4. 검색 조건 영역 규칙

- Ant Design `Form` + `Row/Col` 그리드 레이아웃 사용
- 라벨 넓이: `labelCol={{ span: 6 }}` (24 기준)
- 한 줄에 최대 4개 조건 (`Col span={6}`)
- 날짜 범위: `DatePicker.RangePicker` + `dayjs` 사용
- 조회 버튼은 검색 조건 영역 우측 하단에 위치

```tsx
<Form layout="horizontal">
  <Row gutter={8}>
    <Col span={6}>
      <Form.Item label="거래처명" name="custNm">
        <Input />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item label="기간" name="dateRange">
        <DatePicker.RangePicker />
      </Form.Item>
    </Col>
    <Col span={6} style={{ textAlign: 'right' }}>
      <Button type="primary" htmlType="submit">조회</Button>
    </Col>
  </Row>
</Form>
```

---

## 5. 팝업(모달) 규칙

- 코드도움 팝업: `화면ID-POP` 형태로 별도 컴포넌트 작성
- 너비: 소(400px) / 중(700px) / 대(1000px) 3단계
- 팝업 내부도 AG Grid + 검색조건 동일한 구조 적용
- 선택 시 `onSelect(row)` 콜백으로 부모에 전달

```tsx
<Modal
  title="거래처 검색"
  open={open}
  onCancel={onClose}
  width={700}
  footer={null}
>
  <CustomerSearchGrid onSelect={(row) => { onSelect(row); onClose(); }} />
</Modal>
```

---

## 6. 로딩·에러 처리

- API 호출 중 버튼 `loading` 상태 표시
- 에러는 `message.error('오류 메시지')` (Ant Design) 사용
- 그리드 로딩은 `gridRef.current?.api.showLoadingOverlay()` 사용

```typescript
const handleSearch = async () => {
  gridRef.current?.api.showLoadingOverlay();
  try {
    const res = await fetch('/api/master/customer/list');
    const { rows } = await res.json();
    setRowData(rows);
  } catch {
    message.error('데이터 조회 중 오류가 발생했습니다.');
  } finally {
    gridRef.current?.api.hideOverlay();
  }
};
```

---

## 7. 숫자·날짜 포맷 기준

| 항목 | 형식 | 예시 |
|------|------|------|
| 금액 | `#,##0` | `1,234,567` |
| 수량 | `#,##0` | `1,000` |
| 소수 | `#,##0.##` | `1,234.56` |
| 날짜 (표시) | `YYYY-MM-DD` | `2026-01-15` |
| 날짜 (DB 전송) | `YYYYMMDD` | `20260115` |
| 일시 | `YYYY-MM-DD HH:mm` | `2026-01-15 09:30` |
