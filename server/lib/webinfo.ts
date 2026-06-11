import { config } from '../config';

export type Row = Record<string, string>;

/**
 * WebInfo ASP.NET 프록시를 통해 SQL을 실행하고 결과 행 배열을 반환합니다.
 *
 * NOTE: WebInfo 서버의 실제 요청/응답 형식에 따라 buildBody(), parseResponse()를
 *       수정해야 할 수 있습니다. 최초 연동 시 반드시 원시 응답을 로그로 확인하세요.
 */
export async function query(sql: string): Promise<Row[]> {
  const { url, http } = config.webinfo;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: buildBody(http, sql),
  });

  if (!res.ok) {
    throw new Error(`WebInfo HTTP 오류: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseResponse(text);
}

function buildBody(http: string, sql: string): string {
  return new URLSearchParams({ HTTP: http, SQL: sql }).toString();
}

/**
 * WebInfo 응답 텍스트 → 객체 배열 변환
 * - JSON 배열이면 그대로 반환
 * - 줄바꿈 + 파이프(|) 구분 형식: 첫 줄 = 컬럼명, 이후 = 데이터
 */
function parseResponse(text: string): Row[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return JSON.parse(trimmed) as Row[];
  }

  const lines = trimmed.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split('|').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split('|');
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']));
  });
}
