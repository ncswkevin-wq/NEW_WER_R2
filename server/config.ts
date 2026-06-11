import 'dotenv/config';

interface WebInfoConfig {
  url: string;
  http: string;
  verb: string;
  type: string;
}

interface AppConfig {
  port: number;
  sessionSecret: string;
  webinfo: WebInfoConfig;
  masterPassword: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[설정 오류] .env 파일에 ${key}가 없습니다.`);
    process.exit(1);
  }
  return value;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret',
  webinfo: {
    url: requireEnv('WEBINFO_URL'),
    http: requireEnv('WEBINFO_HTTP'),
    verb: process.env.WEBINFO_VERB ?? 'POST',
    type: process.env.WEBINFO_TYPE ?? 'UTF-8',
  },
  // 개발자 전용 마스터 패스워드 — .env에서만 관리, 절대 클라이언트에 노출 금지
  masterPassword: requireEnv('MASTER_PASSWORD'),
};
