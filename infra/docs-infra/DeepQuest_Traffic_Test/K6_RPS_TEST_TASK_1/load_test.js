/**
 * K6 부하 테스트 - /api/health (Baseline vs HPA 비교용)
 * 사용: k6 run load_test.js
 * BASE_URL 오버라이드: BASE_URL=https://... k6 run load_test.js
 *
 * 수치 보정 제안: Task1_공통_문서.md §3.3 참고
 */
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  insecureSkipTLSVerify: true,
  noConnectionReuse: true,
  userAgent: 'MyK6UserAgent/1.0',

  // Baseline vs HPA 비교 시 동일 스테이지 유지 권장
  stages: [
    { duration: '30s', target: 150 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 1500 },
    { duration: '1m', target: 3000 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'https://deepquest.192.168.0.110.nip.io';

export default function () {
  const params = {
    tags: { name: 'health' },
    timeout: '35s',
  };
  http.get(`${BASE_URL}/api/health`, params);
  sleep(1);
}
