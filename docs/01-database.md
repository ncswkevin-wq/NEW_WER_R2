# 01. 데이터베이스 규칙

## 1. DB 연결 아키텍처

이 프로젝트는 SQL Server에 **직접 연결하지 않습니다.**
Express 서버가 WebInfo ASP.NET HTTP 프록시를 통해 SQL을 실행합니다.

```
Express 서버
  └─ server/lib/webinfo.ts
       └─ POST http://211.56.248.7:14283/CHANGWOO_TEST/WebInfo/sqlserver.aspx
            └─ SQL Server (창우 ERP DB)
```

### WebInfo 요청 형식

```http
POST /CHANGWOO_TEST/WebInfo/sqlserver.aspx HTTP/1.1
Content-Type: application/x-www-form-urlencoded; charset=UTF-8

HTTP=CHANGWOO&SQL=SELECT+...
```

| 파라미터 | 값 | 설명 |
|--------|-----|------|
| `HTTP` | `CHANGWOO` | 회사/DB 식별자 |
| `SQL`  | SQL 문자열 | 실행할 SELECT/DML |

### WebInfo 응답 형식 (확인 필요)

연동 초기에 실제 응답을 로그로 확인한 후 `server/lib/webinfo.ts`의 `parseResponse()`를 수정합니다.

```
# 예상 형식 A — 파이프 구분 텍스트
COL1|COL2|COL3
값1|값2|값3
값4|값5|값6

# 예상 형식 B — JSON 배열
[{"COL1":"값1","COL2":"값2"},...]
```

---

## 2. SQL 작성 기준

### 2-1. 기본 원칙

- **모든 SQL은 서버(Express)에서 작성**합니다. 프론트엔드에서 SQL을 직접 생성·전송하지 않습니다.
- 문자열 파라미터는 반드시 싱글쿼트 이스케이프 처리합니다.

```typescript
// server/lib/webinfo.ts 또는 각 route에서
const safe = (s: string) => s.replace(/'/g, "''");
const sql = `WHERE CUST_CD = '${safe(custCd)}'`;
```

- 향후 WebInfo가 파라미터 바인딩을 지원하면 이 방식으로 전환합니다.

### 2-2. SELECT 규칙

```sql
-- 컬럼명은 명시적으로 나열 (SELECT * 금지)
SELECT
    CUST_CD,
    CUST_NM,
    BIZ_NO,
    USE_YN
FROM TB_CUST
WHERE USE_YN = 'Y'
ORDER BY CUST_NM
```

- `SELECT *` 사용 금지 — AG Grid 컬럼 정의와 불일치 방지
- `ORDER BY` 명시 — 정렬 기준 없는 조회 금지

### 2-3. DML 규칙

- INSERT/UPDATE/DELETE는 별도 라우트(`POST /api/도메인/save`)로 분리합니다.
- 저장 모드는 `SaveMode = 'C' | 'U' | 'D'` 타입으로 구분합니다. (`src/types/api.ts` 참고)

---

## 3. 테이블 네이밍 규칙

| 구분 | 접두사 | 예시 |
|------|--------|------|
| 기준정보(Master) | `TB_` | `TB_CUST`, `TB_ITEM`, `TB_EMP` |
| 전표 헤더 | `TD_` | `TD_ORDER_H`, `TD_PO_H` |
| 전표 라인 | `TD_` | `TD_ORDER_D`, `TD_PO_D` |
| 코드 | `TC_` | `TC_CODE`, `TC_DEPT` |
| 이력·로그 | `TL_` | `TL_LOGIN`, `TL_AUDIT` |

> 기존 마이빌더 DB 테이블명을 그대로 사용합니다. 임의 변경 금지.

---

## 4. 컬럼 네이밍 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 코드 | `_CD` 접미사 | `CUST_CD`, `ITEM_CD`, `DEPT_CD` |
| 명칭 | `_NM` 접미사 | `CUST_NM`, `ITEM_NM` |
| 금액 | `_AMT` 접미사 | `SALE_AMT`, `TAX_AMT` |
| 수량 | `_QTY` 접미사 | `ORDER_QTY`, `SHIP_QTY` |
| 날짜 | `_DT` 접미사 | `ORDER_DT`, `SHIP_DT` |
| 일시 | `_DTM` 접미사 | `REG_DTM`, `UPD_DTM` |
| 사용여부 | `USE_YN` | `'Y'` / `'N'` |
| 등록자 | `REG_ID` | 사용자 ID |
| 수정자 | `UPD_ID` | 사용자 ID |

---

## 5. 공통 시스템 컬럼

모든 마스터·전표 테이블에 아래 컬럼이 존재합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `REG_DTM` | DATETIME | 등록 일시 |
| `REG_ID` | VARCHAR | 등록자 ID |
| `UPD_DTM` | DATETIME | 수정 일시 |
| `UPD_ID` | VARCHAR | 수정자 ID |
| `USE_YN` | CHAR(1) | 사용 여부 (`Y`/`N`) |

INSERT 시 `REG_DTM = GETDATE()`, `REG_ID = 로그인사용자ID` 를 항상 포함합니다.
UPDATE 시 `UPD_DTM = GETDATE()`, `UPD_ID = 로그인사용자ID` 를 항상 포함합니다.

---

## 6. 서버 라우트 → WebInfo 호출 패턴

```typescript
// server/routes/master/customer.ts 예시

router.get('/list', async (req, res) => {
  const { searchNm = '' } = req.query as Record<string, string>;
  const safe = (s: string) => s.replace(/'/g, "''");

  const sql = `
    SELECT CUST_CD, CUST_NM, BIZ_NO, TEL_NO, USE_YN
    FROM   TB_CUST
    WHERE  USE_YN = 'Y'
      ${searchNm ? `AND CUST_NM LIKE '%${safe(searchNm)}%'` : ''}
    ORDER  BY CUST_NM
  `;

  const rows = await query(sql);
  res.json({ rows, total: rows.length });
});
```

---

## 7. 환경변수 (.env)

`.env` 파일은 **절대 GitHub에 커밋하지 않습니다.** `.gitignore`에 포함됨.
팀원 추가 시 `.env.example`을 복사하여 `.env`를 생성합니다.

```
WEBINFO_URL=http://211.56.248.7:14283/CHANGWOO_TEST/WebInfo/sqlserver.aspx
WEBINFO_HTTP=CHANGWOO
WEBINFO_VERB=POST
WEBINFO_TYPE=UTF-8
PORT=3000
SESSION_SECRET=...
```
