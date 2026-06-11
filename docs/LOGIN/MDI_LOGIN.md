# [MDI_LOGIN] 로그인

## 기본 정보

| 항목 | 내용 |
|------|------|
| **화면 ID** | MDI_LOGIN |
| **화면명** | 로그인 |
| **화면 유형** | `AUTH` (인증 전용 — 표준 5종 유형 외 특수 화면) |
| **메뉴 경로** | 진입점 — 미인증 사용자 모든 접근 시 자동 이동 |
| **접근 권한** | 비로그인 사용자만 접근 가능 (로그인 상태이면 메인으로 리다이렉트) |
| **구현 파일** | `src/pages/Login.tsx` |
| **상태 관리** | `src/store/authStore.ts` |
| **API 라우트** | `server/routes/auth.ts` |
| **작성일** | 2026-06-11 |
| **상태** | 확정 |

---

## 1. 원본 화면 분석 (마이빌더 C/S)

### 1-1. 원본 시스템 정보

| 항목 | 내용 |
|------|------|
| 시스템명 | **Netra** — Next Enterprise Total Resource Application |
| 제작사 | Miraesoftware Co., Ltd (2013) |
| 최적 해상도 | 1280 × 1024 |

### 1-2. 원본 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ Netra                                                   │ ← 좌상단 로고 + 부제목
│ Next Enterprise Total Resource Application              │
├─────────────────────────────────────────────────────────┤
│                                        ┌──────────────┐ │
│                                        │ Member Login │ │ ← 로그인 패널
│   [배너 이미지: 건물 사진, 청색 계열]  │              │ │   (배너 위 우측)
│                                        │ 아이디  [   ]│ │
│                                        │ 비밀번호[   ]│ │ ← 노란색 배경
│                                        │ Language[KR▼]│ │
│                                        │    [🔑 로그인]│ │ ← 열쇠 아이콘
│                                        └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│     1280 X 1024 해상도에 최적화 되었습니다.             │ ← 빨간 텍스트
├─────────────────────────────────────────────────────────┤
│  COPYRIGHT 2013 BY MIRAESOFTWARE CO.,LTD ALL RIGHT RESERVED │
└─────────────────────────────────────────────────────────┘
```

### 1-3. 원본 필드 목록

| 원본 레이블 | 원본 특징 | 웹 전환 결정 |
|-------------|-----------|-------------|
| 아이디 | 그레이 배경 | **유지** — 레이블 "아이디" 그대로 |
| 비밀번호 | **노란색 배경** 강조 | 유지 — 포커스 시 하이라이트 |
| Language | Select (Korean 기본) | **보류** — 다국어 요건 확인 후 결정 |
| 로그인 버튼 | 🔑 열쇠 아이콘 + "로그인" | **유지** — `KeyOutlined` 아이콘 |

---

## 2. 원본 SQL 분석

### 2-1. 원본 SQL 전문

```sql
select
    user_id,
    user_name,

    -- 비밀번호 변경 체크
    (case
        when user_pwd is null then  1
        -- when DATEDIFF(DD, left(LAST_CHANGE_DATE, 8), GETDATE()) > 90 then 2
        else    0
    end) as change_pwd,

    -- 비밀번호 일치 여부 (SHA1 해시 비교)
    (case
        when user_pwd = CONVERT(varchar(256), HASHBYTES('SHA1', :frmLogin.user_pwd), 1) then 1
        else 0
    end) as dec_user_pwd,

    -- 만기일자 초과 여부
    (case
        when user_end_date is not null
         and user_end_date < CONVERT(varchar(8), getdate(), 112)
        then 1
        else 0
    end) as end_date_check,

    -- 퇴사 여부 (mst_emp 조인)
    (select e.emp_status
     from   mst_emp e
     where  e.emp_code in (
                select emp_code from ENV_USER
                where  user_id = ::frmLogin.user_id
            )
    ) as emp_sts

from ENV_USER
where
    USER_ID   = ::frmLogin.user_id
and user_type in ('U', 'S')
DBID=0;
```

### 2-2. SQL 구조 분석

#### 조회 테이블

| 테이블 | 용도 |
|--------|------|
| `ENV_USER` | 사용자 마스터 — 로그인 정보 저장 |
| `mst_emp` | 사원 마스터 — 퇴사 여부 확인 |

#### 조회 컬럼 및 반환 컬럼

| 컬럼명 (DB) | 반환 별칭 | 타입 | 설명 |
|------------|----------|------|------|
| `user_id` | — | VARCHAR | 사용자 ID |
| `user_name` | — | VARCHAR | 사용자명 |
| `user_pwd` | — | VARCHAR | SHA1 해시 저장된 비밀번호 (응답에 포함 안 함) |
| `user_end_date` | — | VARCHAR(8) | 계정 만기일 (YYYYMMDD) |
| `user_type` | — | CHAR(1) | `'U'`=일반사용자, `'S'`=슈퍼유저 |
| `last_change_date` | — | VARCHAR | 비밀번호 최종 변경일 (현재 미사용) |
| — | `change_pwd` | INT | `0`=정상 / `1`=비밀번호 미설정(null) / `2`=90일 초과(주석처리) |
| — | `dec_user_pwd` | INT | `1`=비밀번호 일치 / `0`=불일치 |
| — | `end_date_check` | INT | `1`=만기일 초과 / `0`=정상 |
| — | `emp_sts` | CHAR(1) | `'2'`=퇴사 / 기타=재직 |

#### WHERE 조건

| 조건 | 설명 |
|------|------|
| `USER_ID = :userId` | 입력한 아이디와 정확히 일치 |
| `user_type in ('U', 'S')` | 일반사용자·슈퍼유저만 로그인 가능 (타입 외 계정 차단) |

#### 비밀번호 암호화 방식

```sql
CONVERT(varchar(256), HASHBYTES('SHA1', 입력비밀번호), 1)
```

- 알고리즘: **SHA1**
- 변환: `HASHBYTES` 결과(binary)를 `varchar(256)`으로 변환 (`style=1` → `0x...` 형식 hex string)
- 비교: DB 저장값 = SHA1 hex string
- 웹 전환 시: 서버에서 동일 방식으로 해시하여 비교 OR WebInfo에 비밀번호 전달 후 DB에서 비교

---

## 3. 원본 로직 분석 (SUBROUTINE login_chk)

### 3-1. 원본 처리 흐름 (우선순위 순)

```
proc_login.Refresh  (SQL 실행)
        │
        │ SqlStatus() ≠ '' → SetFocus 비밀번호
        │
        ▼
  [판단 1] RecordCount = 0 ?
        │ YES → "등록되지 않은 아이디입니다." → SetFocus 아이디
        │ NO
        ▼
  [판단 2] 비밀번호 = MASTER 패스워드 ?   ← 모든 후속 체크 무시
        │ YES → 즉시 로그인 성공 (Command OK)
        │ NO
        ▼
  [판단 3] end_date_check = 1 ?
        │ YES → "만기일자가 지나 로그인을 할 수 없습니다." → SetFocus 비밀번호
        │ NO
        ▼
  [판단 4] emp_sts = '2' ?
        │ YES → "퇴사자는 로그인 할 수 없습니다." → SetFocus 아이디
        │ NO
        ▼
  [판단 5] dec_user_pwd > 0 ?  (비밀번호 일치)
        │ NO  → "비밀번호가 틀렸습니다." → SetFocus 비밀번호
        │ YES
        ▼
  [판단 6] change_pwd > 0 ?  (비밀번호 미설정 또는 만료)
        │ change_pwd = 1 → "비밀번호가 설정되지 않았습니다. 비밀번호를 설정하신 후 다시 로그인하세요."
        │                   App.UserName = '(비밀번호설정)'
        │ change_pwd = 2 → "비밀번호가 변경된지 50일이 지났습니다. 비밀번호를 변경하신 후 다시 로그인하세요."
        │                   App.UserName = '(비밀번호설정)'
        │ (경고 후에도 로그인은 성공 처리됨)
        ▼
  로그인 성공 처리
  ├─ App.UserID   = user_id
  ├─ App.UserName = user_name
  ├─ App.Language = language 설정
  ├─ sp_env_log_login_save 호출 (로그인 이력 저장)
  ├─ delete/insert into login(user_id)  [TEXT DB — 로컬 캐시]
  ├─ fc_getOption('COM_API_TOKEN') 조회
  └─ Command OK  (화면 전환)
```

### 3-2. 원본 에러 메시지 목록

| 조건 | 원본 메시지 (정확) | 웹 전환 처리 |
|------|-------------------|-------------|
| RecordCount = 0 | `등록되지 않은 아이디입니다.` | `아이디 또는 비밀번호가 올바르지 않습니다.` (보안상 통합) |
| MASTER 패스워드 일치 | 메시지 없음 (즉시 로그인) | 동일 |
| end_date_check = 1 | `만기일자가 지나 로그인을 할 수 없습니다.` | 동일 |
| emp_sts = '2' | `퇴사자는 로그인 할 수 없습니다.` | 동일 |
| dec_user_pwd = 0 | `비밀번호가 틀렸습니다.` | `아이디 또는 비밀번호가 올바르지 않습니다.` (보안상 통합) |
| change_pwd = 1 | `비밀번호가 설정되지 않았습니다.` + CRLF + `비밀번호를 설정하신 후 다시 로그인하세요.` | 동일 (로그인은 허용) |
| change_pwd = 2 | `비밀번호가 변경된지 50일이 지났습니다.` + CRLF + `비밀번호를 변경하신 후 다시 로그인하세요.` | 동일 (로그인은 허용) |

> 보안 강화: 원본에서 "등록되지 않은 아이디"와 "비밀번호 틀림"을 구분하여 노출했으나,
> 웹 전환 시 아이디 존재 여부 노출을 막기 위해 **두 경우 모두 동일한 메시지**로 통합합니다.

### 3-3. 원본 로그인 성공 후처리

| 원본 처리 | 웹 전환 처리 |
|-----------|-------------|
| `App.UserID`, `App.UserName`, `App.Language` 설정 | Zustand `authStore.login(user)` |
| `SetLanguage`, `SetProfile` | 브라우저 locale 설정 (미구현) |
| `sp_env_log_login_save` 호출 | WebInfo를 통해 동일 SP 호출 |
| `delete/insert into login` (TEXT DB) | **해당 없음** — 웹 서버 세션으로 대체 |
| `fc_getOption('COM_API_TOKEN')` 조회 | 필요 시 로그인 응답에 포함 |

---

## 4. 웹 전환 화면 목적

아이디와 비밀번호를 입력받아 인증하고, 성공 시 메인 화면으로 진입합니다.
인증 정보는 `Zustand persist` (localStorage)에 저장하여 브라우저를 닫아도 세션이 유지됩니다.

---

## 5. 웹 전환 레이아웃

원본의 **배너 이미지 + 우측 로그인 패널** 구조를 웹에서는 **좌우 분할** 레이아웃으로 재해석합니다.

```
┌──────────────────────┬───────────────────────────┐
│                      │                           │
│                      │    Netra                  │ ← 시스템명 (h2)
│  배너 이미지         │    Next Enterprise        │ ← 부제목
│  (청색 계열 건물)    │    Total Resource         │
│                      │    Application            │
│  좌측 60%            │  ─────────────────────    │
│  배경: 이미지 또는   │  Member Login             │ ← 섹션 타이틀
│  그라디언트          │                           │
│  (#0a3d7c → #1677ff) │  아이디                   │ ← 레이블 좌측
│                      │  ┌─────────────────────┐  │
│                      │  │ 👤                  │  │ Input
│                      │  └─────────────────────┘  │
│                      │                           │
│                      │  비밀번호                 │
│                      │  ┌─────────────────────┐  │
│                      │  │ 🔒              👁   │  │ Input.Password
│                      │  └─────────────────────┘  │
│                      │                           │
│                      │  ┌─────────────────────┐  │
│                      │  │  🔑  로그인          │  │ Button primary block
│                      │  └─────────────────────┘  │
│                      │                           │
│                      │  ─────────────────────    │
│                      │  © Miraesoftware Co.,Ltd  │ ← 카피라이트
└──────────────────────┴───────────────────────────┘

전체 높이: 100vh  /  좌측: 60%  /  우측: 40% (최소 380px)
로그인 실패 시: 버튼 위에 Alert (type="error") 표시
비밀번호 경고(change_pwd>0) 시: Modal 또는 Alert (type="warning") 후 메인 이동
```

---

## 6. 입력 필드 정의

| No | 레이블 | 필드명 | 입력 유형 | 필수 | 아이콘 | placeholder |
|----|--------|--------|-----------|------|--------|-------------|
| 1 | 아이디 | `userId` | `Input` | ✓ | `UserOutlined` | 아이디 |
| 2 | 비밀번호 | `password` | `Input.Password` | ✓ | `LockOutlined` | 비밀번호 |

> **Language 필드**: 다국어 요건 미확인으로 현재 미구현. 확정 후 추가.

---

## 7. 버튼 정의

| 버튼명 | 아이콘 | 유형 | 동작 |
|--------|--------|------|------|
| 로그인 | `KeyOutlined` (🔑) | `primary`, `block`, `large` | Form submit → API 호출 |

- `htmlType="submit"` → Enter 키 지원
- API 호출 중 `loading={true}`

---

## 8. 인증 흐름 (웹 전환 기준)

```
사용자 입력 (아이디 + 비밀번호)
        │
        ▼
  [프론트] Ant Design Form 유효성 검사
        │ 실패 → 필드 인라인 오류 메시지
        │ 통과
        ▼
  POST /api/auth/login  { userId, password }
        │
        ▼
  [서버] WebInfo로 아래 SQL 실행
  SELECT user_id, user_name, change_pwd, dec_user_pwd,
         end_date_check, emp_sts
  FROM   ENV_USER + mst_emp
  WHERE  USER_ID = :userId AND user_type IN ('U','S')
        │
        │ RecordCount = 0
        ├─────────────── → 401 "아이디 또는 비밀번호가 올바르지 않습니다."
        │
        │ 레코드 있음
        ▼
  [서버] MASTER 패스워드 검사  ← .env의 MASTER_PASSWORD와 비교
        │ 일치 → 모든 체크 건너뜀 → 200 로그인 성공
        │ 불일치
        ▼
  [서버] 만기일 체크  (end_date_check = 1)
        │ YES → 401 "만기일자가 지나 로그인을 할 수 없습니다."
        │ NO
        ▼
  [서버] 퇴사자 체크  (emp_sts = '2')
        │ YES → 401 "퇴사자는 로그인 할 수 없습니다."
        │ NO
        ▼
  [서버] 비밀번호 일치 체크  (dec_user_pwd = 1)
        │ NO  → 401 "아이디 또는 비밀번호가 올바르지 않습니다."
        │ YES
        ▼
  [서버] sp_env_log_login_save 호출 (로그인 이력 저장)
        │
        ▼
  200 응답  { userId, userName, changePwd }
        │
        ▼
  [프론트] authStore.login(user)  → localStorage 저장
        │
        ├── changePwd = 0 → navigate('/')  [메인 이동]
        │
        └── changePwd = 1 → Modal 경고 "비밀번호가 설정되지 않았습니다..."
                             → 확인 후 navigate('/')  (로그인은 허용)
```

---

## 9. API 명세

### 요청

```
POST /api/auth/login
Content-Type: application/json
```

```typescript
// src/types/api.ts
interface LoginRequest {
  userId: string;
  password: string;
}
```

### 응답 (200 성공)

```typescript
// src/types/api.ts
interface LoginResponse {
  userId: string;      // 사용자 ID
  userName: string;    // 사용자명
  deptCode: string;    // 부서코드 (ENV_USER에서 확인 필요)
  authCode: string;    // 권한코드 (ENV_USER에서 확인 필요)
  changePwd: 0 | 1;   // 0=정상, 1=비밀번호 미설정 (로그인 허용, 프론트 경고 표시)
}
```

> `changePwd = 2` (90일 초과)는 원본 SQL에서 주석처리 되어 있어 현재 미사용.
> 향후 활성화 시 타입을 `0 | 1 | 2`로 확장합니다.

### 응답 (실패)

| HTTP | 조건 | message |
|------|------|---------|
| `400` | 필드 미입력 | "아이디와 비밀번호를 입력하세요." |
| `401` | 사용자 없음 또는 비밀번호 불일치 | "아이디 또는 비밀번호가 올바르지 않습니다." |
| `401` | 만기일 초과 | "만기일자가 지나 로그인을 할 수 없습니다." |
| `401` | 퇴사자 | "퇴사자는 로그인 할 수 없습니다." |
| `500` | WebInfo 오류 | "DB 연결 오류가 발생했습니다." |

---

## 10. DB 조회 정보 (확정)

| 항목 | 내용 |
|------|------|
| **메인 테이블** | `ENV_USER` |
| **조인 테이블** | `mst_emp` (퇴사 여부 확인) |
| **user_type 조건** | `'U'` (일반사용자), `'S'` (슈퍼유저) |
| **비밀번호 암호화** | `CONVERT(varchar(256), HASHBYTES('SHA1', 입력값), 1)` |
| **만기일 포맷** | `VARCHAR(8)` YYYYMMDD, `CONVERT(varchar(8), getdate(), 112)` 와 비교 |
| **비밀번호 로그인 로그** | `sp_env_log_login_save` (@p_user_id, @p_ip_address, @p_host_name, @p_result) |

### 웹 전환 SQL (예정)

```sql
-- WebInfo 호출용 SQL (서버에서 구성, :userId에 실제 값 치환)
SELECT
    user_id,
    user_name,
    (CASE WHEN user_pwd IS NULL THEN 1 ELSE 0 END) AS change_pwd,
    (CASE
        WHEN user_pwd = CONVERT(varchar(256), HASHBYTES('SHA1', ':password'), 1)
        THEN 1 ELSE 0
     END) AS dec_user_pwd,
    (CASE
        WHEN user_end_date IS NOT NULL
         AND user_end_date < CONVERT(varchar(8), GETDATE(), 112)
        THEN 1 ELSE 0
     END) AS end_date_check,
    (SELECT e.emp_status
     FROM   mst_emp e
     WHERE  e.emp_code IN (
                SELECT emp_code FROM ENV_USER WHERE user_id = ':userId'
            )) AS emp_sts
FROM   ENV_USER
WHERE  USER_ID   = ':userId'
AND    user_type IN ('U', 'S')
```

> ⚠️ WebInfo가 파라미터 바인딩을 지원하지 않으므로 서버에서 값을 직접 치환합니다.
> 반드시 싱글쿼트 이스케이프(`'` → `''`) 처리 후 치환합니다.

---

## 11. 로그인 이력 저장

로그인 성공 시 `sp_env_log_login_save` 저장 프로시저를 WebInfo로 호출합니다.

```sql
-- WebInfo 호출용 EXEC
EXEC dbo.sp_env_log_login_save
    @p_user_id    = ':userId',
    @p_ip_address = ':clientIp',
    @p_host_name  = ':hostName',
    @p_result     = 'Y'
```

| 파라미터 | 원본 | 웹 전환 |
|---------|------|---------|
| `@p_user_id` | `frmLogin.user_id` | 요청 `userId` |
| `@p_ip_address` | `GetIP()` | Express `req.ip` |
| `@p_host_name` | `GetHost()` | `req.hostname` |
| `@p_result` | `'Y'` (고정) | `'Y'` (고정) |

---

## 12. MASTER 패스워드 (개발자 전용)

### 개요

일반 로그인과 별개로 **개발자 전용 우회 로그인** 기능입니다.
원본 C/S에도 동일한 기능이 있으며, 웹 전환 시에도 유지합니다.

### 원본과 웹 전환 비교

| 항목 | 원본 C/S | 웹 전환 |
|------|---------|---------|
| 저장 위치 | 소스코드 하드코딩 | **`.env` 파일** (`MASTER_PASSWORD=`) |
| 값 변경 | 소스 수정 후 재배포 | `.env` 수정 후 서버 재시작 |
| 우선순위 | 만기일·퇴사자 체크보다 먼저 | 동일 (모든 체크 우회) |
| 감사 로그 | 없음 | 서버 콘솔 `[MASTER LOGIN]` 경고 기록 |

### 동작 방식

```
비밀번호 == MASTER_PASSWORD (.env)?
    │ YES → 만기일/퇴사/비밀번호 체크 모두 건너뜀 → 즉시 로그인 성공
    │ NO  → 일반 비밀번호 검증 흐름 진행
```

### 보안 원칙

| 원칙 | 구현 방식 |
|------|----------|
| 값 은닉 | `.env` 에만 저장, 소스코드·git 미포함 |
| 클라이언트 미노출 | 서버 메모리 비교만, 응답에 절대 미포함 |
| 사용자 식별 불가 | 성공 응답이 일반 로그인과 동일 |
| 감사 추적 | 서버 콘솔에만 경고 기록 |
| userId 유효성 필요 | DB에 존재하는 userId 여야 함 |
| 변경 방법 | `.env` 값 수정 → `npm run server` 재시작 |

> ⚠️ MASTER 패스워드 실제 값은 이 문서에 기재하지 않습니다.
> `.env` 파일과 개발팀 내부 채널로만 관리합니다.

---

## 13. 상태 관리

```typescript
// src/store/authStore.ts (Zustand + persist → localStorage)
interface UserInfo {
  userId: string;
  userName: string;
  deptCode: string;
  authCode: string;
  changePwd: 0 | 1;
}
```

- 저장소 키: `localStorage['erp-auth']`
- 로그아웃: `authStore.logout()` → `navigate('/login', { replace: true })`

---

## 14. 라우팅 규칙

| 조건 | 동작 |
|------|------|
| 미인증 상태에서 임의 경로 접근 | `/login` 리다이렉트 |
| 인증 상태에서 `/login` 접근 | `/` 리다이렉트 |
| 로그인 성공 (changePwd=0) | `navigate('/')` |
| 로그인 성공 (changePwd=1) | Modal 경고 → 확인 클릭 후 `navigate('/')` |
| 로그아웃 | `navigate('/login', { replace: true })` |

---

## 15. 비즈니스 규칙

1. 로그인 버튼 클릭 또는 Enter 키 입력 시 인증을 시도합니다.
2. 아이디 / 비밀번호 중 하나라도 비어있으면 API 호출 없이 필드 오류를 표시합니다.
3. `user_type IN ('U', 'S')` 계정만 로그인 가능합니다.
4. 만기일 초과 / 퇴사자는 로그인 불가입니다 (MASTER 패스워드 제외).
5. 비밀번호 미설정(change_pwd=1) 계정은 경고 후 로그인을 허용합니다.
6. 인증 실패 시 에러 Alert를 표시하고 비밀번호 필드를 초기화합니다.
7. MASTER 패스워드는 모든 체크를 우회하며, 사용 시 서버 콘솔에 기록됩니다.
8. 로그인 성공 시 `sp_env_log_login_save`로 이력을 저장합니다.

---

## 16. 에러 처리

| 상황 | 메시지 | 처리 방식 |
|------|--------|-----------|
| 아이디/비밀번호 미입력 | (Ant Design Form 기본) | 필드 하단 인라인 오류 |
| 사용자 없음 / 비밀번호 불일치 | "아이디 또는 비밀번호가 올바르지 않습니다." | Alert (error) |
| 만기일 초과 | "만기일자가 지나 로그인을 할 수 없습니다." | Alert (error) |
| 퇴사자 | "퇴사자는 로그인 할 수 없습니다." | Alert (error) |
| 비밀번호 미설정 (허용) | "비밀번호가 설정되지 않았습니다.\n비밀번호를 설정하신 후 다시 로그인하세요." | Modal (warning) |
| 네트워크 단절 | "서버에 연결할 수 없습니다. 네트워크를 확인하세요." | Alert (error) |
| WebInfo / DB 오류 | "DB 연결 오류가 발생했습니다." | Alert (error) |

---

## 17. 연결 화면

| 화면 ID | 화면명 | 조건 |
|---------|--------|------|
| SCR-MAIN-001 | 메인(대시보드) | 로그인 성공 시 이동 (미정의) |

---

## 18. 미결 사항 (TODO)

| No | 항목 | 상태 | 비고 |
|----|------|------|------|
| 1 | ~~DB 사용자 테이블명 확인~~ | ✅ 완료 | `ENV_USER` 확인 |
| 2 | ~~비밀번호 암호화 방식 확인~~ | ✅ 완료 | SHA1 `HASHBYTES` 확인 |
| 3 | Language 필드 요건 결정 | 미결 | 다국어 필요 여부 |
| 4 | 배너 이미지 소스 확인 | 미결 | 원본 이미지 사용 또는 대체 |
| 5 | 시스템명 결정 | 미결 | "Netra" 유지 또는 새 명칭 |
| 6 | `ENV_USER`의 `dept_code`, `auth_code` 컬럼명 확인 | 미결 | 응답 필드에 필요 |
| 7 | ~~WebInfo SHA1 해시 처리 방식 결정~~ | ✅ 완료 | **SQL 내 inline 처리** — WebInfo에 평문 포함 SQL 전달, SQL Server에서 해시 비교 |
| 8 | `sp_env_log_login_save` 파라미터 최종 확인 | 미결 | IP/호스트명 수집 방식 |
| 9 | change_pwd 경고 시 비밀번호 변경 화면 연결 여부 | 미결 | 변경 화면 개발 여부 결정 필요 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-06-11 | 1.0 | 최초 작성 |
| 2026-06-11 | 1.1 | 원본 화면 분석 추가 (Netra 스크린샷 기반) |
| 2026-06-11 | 1.2 | MASTER 패스워드 섹션 추가 |
| 2026-06-12 | 2.0 | 원본 SQL 및 SUBROUTINE login_chk 전문 분석 반영 — 테이블명(`ENV_USER`), SHA1 암호화, 만기일·퇴사자·비밀번호 미설정 체크, 로그인 로그(`sp_env_log_login_save`) 모두 확정 반영 |
| 2026-06-12 | 2.1 | SHA1 처리 방식 확정 (SQL inline), MDI_LOGIN_PWD 비밀번호 변경 Modal 확정에 따라 연결 화면 확정 |
