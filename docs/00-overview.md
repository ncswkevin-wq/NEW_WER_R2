# 00. 프로젝트 개요 및 기술 스택

## 1. 프로젝트 소개

마이빌더(C/S) ERP를 웹 기반으로 전환하는 프로젝트입니다.
기초 MASTER 화면은 공통 템플릿으로 표준화하고, 회사별 업무 화면은 표준 화면 수정 또는 신규 개발합니다.

---

## 2. 시스템 아키텍처

```
┌─────────────────┐     HTTP/JSON      ┌──────────────────┐
│  React 프론트   │ ─────────────────► │  Express 서버    │
│  (Vite, :5173)  │ ◄───────────────── │  (Node.js, :3000)│
└─────────────────┘                    └────────┬─────────┘
                                                │ HTTP POST (x-www-form-urlencoded)
                                                ▼
                                       ┌──────────────────┐
                                       │ WebInfo ASP.NET  │
                                       │ (HTTP DB Proxy)  │
                                       └────────┬─────────┘
                                                │ SQL
                                                ▼
                                       ┌──────────────────┐
                                       │   SQL Server     │
                                       └──────────────────┘
```

- **프론트엔드** → Vite 개발 서버(`/api` 요청은 Express로 프록시)
- **Express 서버** → WebInfo HTTP 엔드포인트로 SQL 전달, 결과 반환
- **WebInfo** → SQL Server에 쿼리 실행 후 텍스트/JSON 응답

---

## 3. 기술 스택

### 프론트엔드

| 항목 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| 프레임워크 | React | 19 | UI |
| 언어 | TypeScript | 6 | 타입 안전성 |
| 빌드 도구 | Vite | 8 | 개발 서버·번들링 |
| UI 컴포넌트 | Ant Design | 6 | 폼·버튼·모달 등 |
| 데이터 그리드 | AG Grid | 35 | 모든 목록/테이블 화면 |
| 라우팅 | React Router | 7 | SPA 라우팅 |
| 전역 상태 | Zustand | 5 | 인증 상태·공통 상태 |
| 차트 | Recharts | 3 | 대시보드·통계 차트 |
| 날짜 | dayjs | 1.11 | 날짜 파싱·포맷 |

### 백엔드

| 항목 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| 런타임 | Node.js | 18+ | 서버 실행 환경 |
| 언어 | TypeScript | 6 | 타입 안전성 |
| TS 실행기 | tsx | 4 | TS를 컴파일 없이 실행 |
| 웹 프레임워크 | Express | 5 | API 라우터 |
| 환경변수 | dotenv | 17 | .env 로드 |
| DB 프록시 | fetch (내장) | — | WebInfo HTTP 호출 |

---

## 4. 폴더 구조

```
NEW_WER_R2/
├── docs/                        # 개발 문서
│   ├── 00-overview.md           # 이 파일
│   ├── 01-database.md           # DB 연결·SQL 규칙
│   ├── 02-ui-standards.md       # UI/UX 표준
│   ├── LOGIN/                   # MDI_ 시스템 프레임 화면 정의서
│   │   ├── MDI_LOGIN.md         # 로그인 화면
│   │   └── MDI_LOGIN_PWD.md     # 비밀번호 변경 Modal
│   ├── MDI/                     # MDI_ 메인화면·트리 정의서 (예정)
│   │   ├── MDI_MAIN.md          # 메인 화면 (예정)
│   │   └── MDI_MAIN_TREE.md     # 메인 메뉴 트리 (예정)
│   ├── screens/                 # SCR- 업무 화면 정의서 (도메인별 하위 폴더)
│   └── templates/               # 화면 정의서 작성 템플릿
│
├── server/                      # Express 백엔드 (TypeScript)
│   ├── index.ts                 # 서버 진입점
│   ├── config.ts                # 환경변수 로드·검증
│   ├── lib/
│   │   └── webinfo.ts           # WebInfo HTTP 클라이언트
│   ├── middleware/
│   │   └── auth.ts              # 인증 미들웨어 (예정)
│   └── routes/
│       ├── auth.ts              # 로그인/로그아웃
│       ├── master/              # 기준정보 API
│       ├── sales/               # 영업 API
│       └── purchase/            # 구매 API
│
├── src/                         # React 프론트엔드 (TypeScript)
│   ├── types/
│   │   └── api.ts               # 프론트·백 공유 타입
│   ├── store/
│   │   └── authStore.ts         # 인증 Zustand 스토어
│   ├── components/              # 공통 컴포넌트
│   │   ├── grid/                # AG Grid 래퍼 컴포넌트
│   │   └── form/                # 공통 폼 컴포넌트
│   ├── pages/                   # 화면 (라우트 단위)
│   │   ├── Login.tsx
│   │   ├── master/
│   │   ├── sales/
│   │   └── purchase/
│   └── hooks/                   # 커스텀 훅
│
├── .env                         # 로컬 DB 설정 (git 제외)
├── .env.example                 # 환경변수 템플릿 (git 포함)
├── package.json
├── vite.config.ts
├── tsconfig.json                # 루트 (references)
├── tsconfig.app.json            # 프론트엔드 TS 설정
├── tsconfig.node.json           # Vite 설정 TS
└── tsconfig.server.json         # 백엔드 TS 설정
```

---

## 5. 개발 환경 설정

### 최초 설치

```bash
npm install
```

### 개발 서버 실행 (터미널 2개 필요)

```bash
# 터미널 1 — Express 백엔드
npm run server

# 터미널 2 — Vite 프론트엔드
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:3000
- Vite가 `/api/*` 요청을 자동으로 `:3000`으로 프록시

### 타입 체크

```bash
# 프론트엔드
npx tsc -p tsconfig.app.json --noEmit

# 백엔드
npm run typecheck:server
```

---

## 6. 코딩 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `CustomerList.tsx` |
| 훅 | camelCase, `use` 접두사 | `useCustomerSearch.ts` |
| 유틸·서비스 | camelCase | `webinfo.ts` |
| 타입·인터페이스 | PascalCase | `LoginRequest` |
| 상수 | UPPER_SNAKE_CASE | `MAX_GRID_ROWS` |
| API 라우트 파일 | camelCase | `auth.ts`, `customerMaster.ts` |
| MDI 시스템 프레임 화면 | `MDI_` 접두사 | `MDI_LOGIN.md`, `MDI_MAIN.md` |
| 업무 화면 정의서 | `SCR-도메인-번호` | `SCR-MST-001.md`, `SCR-SAL-001.md` |

---

## 7. Git 규칙

- `main` — 운영 배포 브랜치 (직접 push 금지)
- `develop` — 개발 통합 브랜치
- `feature/화면ID-설명` — 기능 개발 브랜치

커밋 메시지:
```
[화면ID] 작업 내용 요약
예) [SCR-MST-001] 거래처 마스터 그리드 페이징 추가
```
