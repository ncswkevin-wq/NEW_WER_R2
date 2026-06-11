# [MDI_LOGIN_PWD] 비밀번호 변경

## 기본 정보

| 항목 | 내용 |
|------|------|
| **화면 ID** | MDI_LOGIN_PWD |
| **화면명** | 비밀번호 변경 |
| **화면 유형** | `AUTH` (인증 전용 — 표준 5종 유형 외 특수 화면) |
| **호출 경로** | ① 로그인 후 `change_pwd = 1` 경고 시 → 비밀번호 변경 화면으로 이동 ② 메뉴에서 직접 접근 (로그인 상태) |
| **접근 권한** | 로그인 사용자 (자신의 비밀번호만 변경 가능) |
| **구현 파일** | `src/pages/ChangePassword.tsx` |
| **API 라우트** | `server/routes/auth.ts` |
| **작성일** | 2026-06-12 |
| **상태** | 확정 |

---

## 1. 원본 화면 분석 (마이빌더 C/S)

### 1-1. 원본 레이아웃

```
┌──────────────────────────────────┐
│  비밀번호 변경  │  즐겨찾기 편집  │ ← 탭 (즐겨찾기는 별개 기능)
├──────────────────────────────────┤
│  사용자ID   * │  (user_id)       │ ← 읽기전용
│  사용자명   * │  (user_name)     │ ← 읽기전용
│  현재 비밀번호 │  cur_pwd        │ ← Input.Password
│  변경할 비밀번호│  new_pwd1      │ ← Input.Password  *필수
│               │  new_pwd2       │ ← Input.Password (확인)  *필수
├──────────────────────────────────┤
│                 [💾 저장]  [✖ 취소] │
├──────────────────────────────────┤
│  1. 변경할 비밀번호와 현재 비밀번호는 달라야 합니다.     │
│  2. 변경할 비밀번호는 특수기호 + 숫자 + 알파벳          │
│     조합이어야 합니다.                                   │
│  3. 변경된 비밀번호는 90일간 유효합니다.                 │
└──────────────────────────────────┘
```

### 1-2. 원본 필드 요약

| 원본 필드명 | 레이블 | 특성 |
|-------------|--------|------|
| `user_id` | 사용자ID | 읽기전용, 현재 로그인 사용자 자동 표시 |
| `user_name` | 사용자명 | 읽기전용, 현재 로그인 사용자 자동 표시 |
| `cur_pwd` | 현재 비밀번호 | 입력 필수 여부 미표시 (원본 기준) |
| `new_pwd1` | 변경할 비밀번호 | 필수 (`*`) |
| `new_pwd2` | 변경할 비밀번호 확인 | 필수 (`*`) |

---

## 2. 원본 유효성 검사 함수 분석 (FUNCTION Validate)

### 2-1. 원본 코드 전문

```
FUNCTION Validate(p_pwd)

v_msg = '';

if length(p_pwd) < 8 then
    v_msg = '비밀번호는 8자리 이상, 영문자, 숫자, 특수문자가 포함되어야 합니다.';
else
    v_alpha   = 0;
    v_digit   = 0;
    v_special = 0;

    for i = 1 to length(p_pwd) loop
        v_char = substr(p_pwd, i, 1);

        if   v_char >= 'A' and v_char <= 'Z' then
            v_alpha = v_alpha + 1;
        elseif v_char >= '0' and v_char <= '9' then
            v_digit = v_digit + 1;
        elseif v_char = '''' or v_char = ' ' then
            v_msg = ''' 문자와 공백은 사용할 수 없습니다.';
        elseif asc(v_char) between 33 and 47
            or asc(v_char) between 58 and 64
            or asc(v_char) between 91 and 96
            or asc(v_char) between 123 and 126 then
            v_special = v_special + 1;
        endif;
    endloop;

    if IsEmpty(v_msg) and (v_alpha = 0 or v_digit = 0 or v_special = 0) then
        v_msg = '비밀번호는 영문자, 숫자, 특수문자가 포함되어야 합니다.';
    endif;
endif;

return v_msg;
```

### 2-2. 유효성 규칙 상세 분석

#### 규칙 1 — 최소 길이

| 조건 | 메시지 |
|------|--------|
| `length < 8` | "비밀번호는 8자리 이상, 영문자, 숫자, 특수문자가 포함되어야 합니다." |

#### 규칙 2 — 금지 문자 (즉시 에러 반환)

| 문자 | ASCII | 이유 |
|------|-------|------|
| `'` (싱글쿼트) | 39 | SQL Injection 방지 |
| ` ` (공백) | 32 | 보안 정책 |

> 금지 문자가 발견되면 루프를 계속 진행하지만 `v_msg`가 설정되어 최종 에러 반환.

#### 규칙 3 — 문자 카운팅 (원본 기준)

| 분류 | 범위 | 비고 |
|------|------|------|
| **알파벳** | `A–Z` (ASCII 65–90) | ⚠️ **대문자만 카운트** — 소문자(`a-z`)는 카운트하지 않음 (원본 그대로) |
| **숫자** | `0–9` (ASCII 48–57) | — |
| **특수문자** | 아래 4개 범위 합산 | 싱글쿼트(39)는 금지 문자로 먼저 처리됨 |

#### 규칙 4 — 허용 특수문자 ASCII 범위

| 범위 | 문자 목록 | 비고 |
|------|-----------|------|
| 33–47 | `! " # $ % & ( ) * + , - . /` | 39(`'`)는 금지 문자로 제외 |
| 58–64 | `: ; < = > ? @` | — |
| 91–96 | `[ \ ] ^ _ \`` | — |
| 123–126 | `{ \| } ~` | — |

#### 규칙 5 — 조합 필수

| 조건 | 메시지 |
|------|--------|
| 알파벳(대문자) 0개 OR 숫자 0개 OR 특수문자 0개 | "비밀번호는 영문자, 숫자, 특수문자가 포함되어야 합니다." |

> **소문자만 입력한 경우 실패** — 소문자는 alpha 카운트에 포함되지 않으므로 반드시 대문자가 1자 이상 있어야 합니다.

### 2-3. 웹 전환 TypeScript 구현 (예정)

```typescript
// src/utils/validatePassword.ts

export function validatePassword(pwd: string): string {
  if (pwd.length < 8) {
    return '비밀번호는 8자리 이상, 영문자, 숫자, 특수문자가 포함되어야 합니다.';
  }

  let alpha   = 0; // 대문자(A-Z)만 카운트 — 원본 동작 유지
  let digit   = 0;
  let special = 0;

  for (const char of pwd) {
    const code = char.charCodeAt(0);

    if (char >= 'A' && char <= 'Z') {
      alpha++;
    } else if (char >= '0' && char <= '9') {
      digit++;
    } else if (char === "'" || char === ' ') {
      return "' 문자와 공백은 사용할 수 없습니다.";
    } else if (
      (code >= 33 && code <= 47) ||
      (code >= 58 && code <= 64) ||
      (code >= 91 && code <= 96) ||
      (code >= 123 && code <= 126)
    ) {
      special++;
    }
    // 소문자(a-z, ASCII 97-122)는 카운트하지 않음 — 원본 동작 유지
  }

  if (alpha === 0 || digit === 0 || special === 0) {
    return '비밀번호는 영문자, 숫자, 특수문자가 포함되어야 합니다.';
  }

  return ''; // 유효
}
```

### 2-4. 비밀번호 유효 예시 / 무효 예시

| 비밀번호 | 결과 | 이유 |
|----------|------|------|
| `Abc1!xyz` | ✅ 유효 | 대문자 A, 숫자 1, 특수문자 !, 8자 이상 |
| `abc1!xyz` | ❌ 실패 | 소문자만 있어 alpha = 0 |
| `ABC12345` | ❌ 실패 | 특수문자 없음 |
| `ABC!@#$%` | ❌ 실패 | 숫자 없음 |
| `A1!` | ❌ 실패 | 8자 미만 |
| `A1!abc d` | ❌ 실패 | 공백 포함 |
| `A1!'test` | ❌ 실패 | 싱글쿼트 포함 |

---

## 3. 화면 목적

로그인 사용자가 자신의 비밀번호를 변경합니다.
다음 두 가지 경로로 진입합니다:
1. 로그인 후 `change_pwd = 1` 경고 — 비밀번호 미설정 안내 후 이동
2. 메뉴에서 직접 접근

---

## 4. 웹 전환 레이아웃

```
┌─────────────────────────────────────────┐  ← Ant Design Modal
│  비밀번호 변경                      ✕   │    title + 닫기 버튼
├─────────────────────────────────────────┤
│  사용자ID    │  hong (읽기전용, 회색)    │
│  사용자명    │  홍길동 (읽기전용, 회색)  │
│  현재 비밀번호│  [🔒__________👁]  *    │  Input.Password (필수)
│  새 비밀번호  │  [🔒__________👁]  *    │  Input.Password (필수)
│  새 비밀번호 확인 │ [🔒__________👁] * │  Input.Password (필수)
├─────────────────────────────────────────┤
│  ℹ️ 비밀번호 규칙                        │
│  · 8자리 이상                            │
│  · 대문자 + 숫자 + 특수문자 조합 필수    │
│  · ' (싱글쿼트)와 공백 사용 불가        │
│  · 변경 후 90일간 유효                   │
├─────────────────────────────────────────┤
│                      [저장]  [취소]     │  Modal footer (우측 정렬)
└─────────────────────────────────────────┘
```

> **진입 방식 확정: Modal**
> - 로그인 후 `change_pwd=1` 경고 시 → Modal 자동 오픈
> - 메뉴에서 직접 접근 시 → 동일한 Modal 오픈
> - 취소 / ✕ 클릭 시 → Modal 닫힘 (로그인 상태는 유지)

---

## 5. 입력 필드 정의

| No | 레이블 | 필드명 | 입력 유형 | 필수 | 편집 가능 | 비고 |
|----|--------|--------|-----------|------|----------|------|
| 1 | 사용자ID | `userId` | `Input` | — | ❌ 읽기전용 | 로그인 사용자 자동 표시 |
| 2 | 사용자명 | `userName` | `Input` | — | ❌ 읽기전용 | 로그인 사용자 자동 표시 |
| 3 | 현재 비밀번호 | `curPwd` | `Input.Password` | ✓ | ✅ | 서버에서 현재 PW 검증 |
| 4 | 새 비밀번호 | `newPwd1` | `Input.Password` | ✓ | ✅ | Validate() 검사 적용 |
| 5 | 새 비밀번호 확인 | `newPwd2` | `Input.Password` | ✓ | ✅ | newPwd1과 일치 확인 |

---

## 6. 버튼 정의

| 버튼명 | 유형 | 동작 |
|--------|------|------|
| 저장 | `primary` | 유효성 검사 → API 호출 |
| 취소 | `default` | 변경 내용 취소 → 이전 화면으로 |

---

## 7. 처리 흐름

```
사용자 입력 (curPwd + newPwd1 + newPwd2)
        │
        ▼
  [프론트] 클라이언트 유효성 검사
  ┌──────────────────────────────────────────┐
  │  1. 현재 비밀번호 미입력 → 필드 오류     │
  │  2. newPwd1 == curPwd → "현재 비밀번호와 동일합니다."  │
  │  3. newPwd1 != newPwd2 → "비밀번호가 일치하지 않습니다." │
  │  4. validatePassword(newPwd1) ≠ '' → 해당 에러 메시지 │
  └──────────────────────────────────────────┘
        │ 통과
        ▼
  POST /api/auth/change-password
  { userId, curPwd, newPwd }
        │
        ▼
  [서버] 현재 비밀번호 확인
  SELECT 1 FROM ENV_USER
  WHERE  user_id = ':userId'
  AND    user_pwd = CONVERT(varchar(256), HASHBYTES('SHA1', ':curPwd'), 1)
        │ 불일치 → 401 "현재 비밀번호가 올바르지 않습니다."
        │ 일치
        ▼
  [서버] WebInfo로 SP 호출 (SHA1은 SP 내부에서 처리)
  EXEC dbo.sp_env_user_update_pwd
      @p_user_id    = ':userId',
      @p_user_pwd   = ':newPwd',      ← 평문 전달, SP에서 SHA1 해시
      @p_update_user = ':userId'
        │
        ▼
  200 { success: true }
        │
        ▼
  [프론트] "비밀번호가 변경되었습니다." message.success → Modal 닫힘
```

---

## 8. API 명세

### 요청

```
POST /api/auth/change-password
Content-Type: application/json
Authorization: 로그인 세션 필요
```

```typescript
interface ChangePasswordRequest {
  userId: string;   // 현재 로그인 사용자 ID (authStore에서 주입)
  curPwd: string;   // 현재 비밀번호
  newPwd: string;   // 새 비밀번호 (newPwd1 = newPwd2 확인 후 전달)
}
```

### 응답 (200 성공)

```typescript
interface ChangePasswordResponse {
  success: true;
}
```

### 응답 (실패)

| HTTP | 조건 | message |
|------|------|---------|
| `400` | 필드 미입력 | "모든 항목을 입력하세요." |
| `401` | 현재 비밀번호 불일치 | "현재 비밀번호가 올바르지 않습니다." |
| `400` | 신규 == 현재 비밀번호 | "현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다." |
| `500` | WebInfo 오류 | "DB 연결 오류가 발생했습니다." |

---

## 9. DB 처리 정보

### 9-1. 현재 비밀번호 확인 SQL

```sql
-- WebInfo 호출 (SHA1 inline 처리 — 로그인과 동일한 방식)
SELECT 1
FROM   ENV_USER
WHERE  user_id  = ':userId'
AND    user_pwd = CONVERT(varchar(256), HASHBYTES('SHA1', ':curPwd'), 1)
AND    user_type IN ('U', 'S')
```

> ✅ 확정: SHA1 해시는 **SQL 내 inline** 처리 (`HASHBYTES('SHA1', 평문)`)
> WebInfo에 평문 비밀번호가 포함된 SQL을 전달 → SQL Server에서 해시 비교

### 9-2. 비밀번호 변경 SP (확정)

```sql
-- WebInfo 호출 (EXEC 형식)
-- @p_user_pwd 는 평문 전달 → SP 내부에서 SHA1 처리
EXEC dbo.sp_env_user_update_pwd
    @p_user_id    = ':userId',
    @p_user_pwd   = ':newPwd',
    @p_update_user = ':userId'
```

#### SP 원본 전문 (`sp_env_user_update_pwd`)

```sql
ALTER PROCEDURE [dbo].[sp_env_user_update_pwd]
    @p_user_id      varchar(30),
    @p_user_pwd     varchar(256),   -- 평문 입력, 내부에서 SHA1 처리
    @p_update_user  varchar(30) = null
AS
BEGIN TRY

    UPDATE env_user
    SET
        user_pwd         = CONVERT(varchar(256), HASHBYTES('SHA1', @p_user_pwd), 1),
        last_change_date = CONVERT(varchar(8), GETDATE(), 112)
                         + REPLACE(CONVERT(varchar(8), GETDATE(), 114), ':', ''),
        last_update_date = CONVERT(varchar(8), GETDATE(), 112)
                         + REPLACE(CONVERT(varchar(8), GETDATE(), 114), ':', ''),
        last_updated_by  = ISNULL(@p_update_user, @p_user_id)
    WHERE
        user_id = @p_user_id;

END TRY
BEGIN CATCH
    RETURN ERROR_MESSAGE();
END CATCH
```

#### SP가 업데이트하는 컬럼

| 컬럼 | 값 | 포맷 | 설명 |
|------|-----|------|------|
| `user_pwd` | `HASHBYTES('SHA1', @p_user_pwd)` → hex | `varchar(256)` | 새 비밀번호 SHA1 해시 |
| `last_change_date` | `YYYYMMDD` + `HHmmss` | `varchar(14)` | 비밀번호 변경 일시 (콜론 제거) |
| `last_update_date` | `YYYYMMDD` + `HHmmss` | `varchar(14)` | 레코드 수정 일시 |
| `last_updated_by` | `@p_update_user` or `@p_user_id` | `varchar(30)` | 수정자 ID (미전달 시 본인) |

> **`last_change_date` 포맷**: `YYYYMMDDHHMMSS` 14자리 (예: `20260612143022`)
> 로그인 SQL의 만료 체크 `DATEDIFF(DD, left(LAST_CHANGE_DATE, 8), GETDATE()) > 90` 는
> 앞 8자리(날짜)만 사용하므로 14자리 포맷과 호환됩니다.
> 현재 해당 만료 체크는 **주석 처리** 상태이므로 웹에서도 미적용 (추후 활성화 여부 결정 필요).

---

## 10. 비밀번호 유효성 규칙 요약

| 규칙 | 내용 | 검사 위치 |
|------|------|-----------|
| 최소 길이 | 8자 이상 | 프론트 |
| 대문자 필수 | `A–Z` 중 1자 이상 | 프론트 |
| 숫자 필수 | `0–9` 중 1자 이상 | 프론트 |
| 특수문자 필수 | 허용 범위 내 1자 이상 | 프론트 |
| 금지 문자 | `'`(싱글쿼트), ` `(공백) 사용 불가 | 프론트 |
| 현재 PW와 달라야 함 | 새 비밀번호 ≠ 현재 비밀번호 | 프론트 + 서버 |
| 현재 PW 확인 | DB에서 SHA1 비교 | 서버 |
| 유효기간 | 변경 후 90일 | DB(`last_change_date` 기준) |

> ⚠️ **소문자 주의**: 원본 Validate 함수는 소문자(`a-z`)를 알파벳으로 카운트하지 않습니다.
> 소문자만 사용한 경우 "알파벳이 없음"으로 판정됩니다. **대문자가 반드시 1자 이상 포함되어야 합니다.**
> 웹 전환 시 원본 동작을 그대로 유지합니다. (변경 필요 시 별도 협의)

---

## 11. 비즈니스 규칙

1. 자신의 비밀번호만 변경할 수 있습니다 (타인 변경 불가).
2. 새 비밀번호는 현재 비밀번호와 달라야 합니다.
3. 새 비밀번호 1, 2 입력값이 일치해야 합니다.
4. `validatePassword()` 통과 후 서버에 전송합니다.
5. 서버에서 현재 비밀번호를 SHA1 해시로 재확인 후 SP를 호출합니다.
6. 변경 성공 시 SP가 `last_change_date`, `last_update_date`, `last_updated_by`를 자동 갱신합니다.
7. `last_change_date` 포맷은 `YYYYMMDDHHMMSS` (14자리)입니다.
8. 변경 성공 시 90일 유효기간이 재설정됩니다.

---

## 12. 에러 처리

| 상황 | 메시지 | 처리 위치 |
|------|--------|-----------|
| 필수 필드 미입력 | Ant Design Form 기본 오류 | 프론트 |
| 새 PW == 현재 PW | "현재 비밀번호와 동일합니다." | 프론트 |
| newPwd1 ≠ newPwd2 | "비밀번호가 일치하지 않습니다." | 프론트 |
| validatePassword 실패 | 해당 규칙 에러 메시지 | 프론트 |
| 현재 PW 불일치 | "현재 비밀번호가 올바르지 않습니다." | 서버 → 프론트 Alert |
| DB 오류 | "DB 연결 오류가 발생했습니다." | 서버 → 프론트 Alert |
| 성공 | "비밀번호가 변경되었습니다." | 프론트 Modal/message |

---

## 13. 연결 화면

| 화면 ID | 화면명 | 연결 조건 |
|---------|--------|-----------|
| MDI_LOGIN | 로그인 | `change_pwd=1` 경고 후 이동 |
| SCR-MAIN-001 | 메인(대시보드) | 변경 성공 후 이동 / 취소 시 이동 |

---

## 14. 미결 사항 (TODO)

| No | 항목 | 상태 | 비고 |
|----|------|------|------|
| 1 | 90일 만료 체크 활성화 여부 | 미결 | 원본 주석처리 — 웹에서도 미적용 예정, 추후 결정 |
| 2 | 소문자 알파벳 카운트 정책 결정 | 미결 | 원본대로 대문자만 / 소문자도 허용으로 변경할지 |
| 3 | ~~비밀번호 변경 화면 진입 방식 결정~~ | ✅ 완료 | **Modal** 확정 |
| 4 | ~~`last_change_date` 컬럼명 확인~~ | ✅ 완료 | SP 확인 — `last_change_date` (14자리 YYYYMMDDHHMMSS) |
| 5 | ~~비밀번호 변경 SP 및 SHA1 처리 방식~~ | ✅ 완료 | `sp_env_user_update_pwd` 확정, SHA1은 SP 내부 처리 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-06-12 | 1.0 | 최초 작성 — 원본 화면 스크린샷 + Validate 함수 전문 분석 반영 |
| 2026-06-12 | 1.1 | SP `sp_env_user_update_pwd` 전문 반영, Modal 방식 확정, `last_change_date` 포맷 14자리 확정, SHA1 SQL 내 처리 확정 |
