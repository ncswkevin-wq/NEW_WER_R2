// ============================================================
// 프론트엔드 ↔ 백엔드 공유 API 타입
// 서버: server/routes/*.ts  /  클라이언트: src/ 어디서나 import
// ============================================================

// ── 인증 ────────────────────────────────────────────────────

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  userName: string;
  deptCode: string;
  authCode: string;
}

// ── 공통 응답 래퍼 ─────────────────────────────────────────

export interface ApiOk<T> {
  data: T;
}

export interface ApiError {
  message: string;
}

// ── 공통 목록 조회 ─────────────────────────────────────────

export interface ListResponse<T> {
  rows: T[];
  total: number;
}

// ── 공통 저장/삭제 ─────────────────────────────────────────

export type SaveMode = 'C' | 'U' | 'D'; // Create / Update / Delete

export interface SaveRequest<T> {
  mode: SaveMode;
  data: T;
}

export interface SaveResponse {
  success: boolean;
  message?: string;
}
