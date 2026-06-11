import { Router, type Request, type Response } from 'express';
import { query } from '../lib/webinfo';
import { config } from '../config';
import type { LoginRequest, LoginResponse } from '../../src/types/api';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { userId, password } = req.body as LoginRequest;

  if (!userId?.trim() || !password) {
    res.status(400).json({ message: '아이디와 비밀번호를 입력하세요.' });
    return;
  }

  try {
    const safe = (s: string) => s.replace(/'/g, "''");

    // 1단계: userId로 사용자 조회 (비밀번호는 서버에서 직접 비교)
    // TODO: 실제 테이블명·컬럼명 확인 후 수정
    const sql = `
      SELECT USER_ID, USER_NM, DEPT_CD, AUTH_CD, USER_PW
      FROM   TB_USER
      WHERE  USER_ID = '${safe(userId)}'
        AND  USE_YN  = 'Y'
    `;

    const rows = await query(sql);

    if (rows.length === 0) {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const user = rows[0];

    // 2단계: 비밀번호 검증
    // 우선순위 1 — 마스터 패스워드 (개발자 전용, .env에서만 관리)
    // 우선순위 2 — 개인 비밀번호 (DB 저장값과 비교)
    const isMasterLogin = password === config.masterPassword;
    const isPersonalLogin = password === (user['USER_PW'] ?? '');

    if (!isMasterLogin && !isPersonalLogin) {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 마스터 로그인은 서버 콘솔에만 기록 (감사 추적용, 클라이언트 미노출)
    if (isMasterLogin) {
      console.warn(`[MASTER LOGIN] userId=${userId}  time=${new Date().toISOString()}`);
    }

    // 3단계: 응답 — USER_PW 는 절대 포함하지 않음
    const body: LoginResponse = {
      userId:   user['USER_ID']  ?? '',
      userName: user['USER_NM']  ?? '',
      deptCode: user['DEPT_CD']  ?? '',
      authCode: user['AUTH_CD']  ?? '',
    };

    res.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[로그인 오류]', message);
    res.status(500).json({ message: 'DB 연결 오류가 발생했습니다.' });
  }
});

export default router;
