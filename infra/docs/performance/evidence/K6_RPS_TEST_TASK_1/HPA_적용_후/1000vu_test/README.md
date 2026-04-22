# 1000 VU 테스트 로그

## 파일 목록

### stress-test-web.log
- **수집 대상:** Web 파드 로그 (`kubectl logs -n deep-quest -l app.kubernetes.io/component=web`)
- **내용:** 1000 VU 부하 테스트 중 Web 서버 애플리케이션 로그
- **용도:** Web 파드의 응답 처리, 에러, 초기화 과정 확인

### stress-test-ingress.log
- **수집 대상:** Ingress 컨트롤러 로그 (`kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller`)
- **내용:** 1000 VU 부하 테스트 중 Ingress로 들어오는 HTTP 요청 로그
- **용도:** Ingress 레벨의 요청 처리량, 라우팅, 에러 확인

### 스크린샷
| 파일명 | 설명 |
|--------|------|
| **1000vu_K6_요청실패_로그_Funnel경유_unexpected_EOF.png** | K6 1000 VU 실행 중 Funnel URL 경유 시 요청 실패 로그 (unexpected EOF·timeout) |
| **1000vu_K6_총결과_0퍼센트_실패_209RPS.png** | K6 1000 VU 총결과. 실패 0%, 약 209 RPS. 내부 도메인 사용 시 정상 처리 |

## 테스트 설정

- **K6 설정:** 30s 50 VU → 1m 500 VU → 1m 1000 VU
- **대상 엔드포인트:** `/api/health`
- **도메인:** 내부 도메인 (`deepquest.192.168.0.110.nip.io`)
- **TLS:** `K6_INSECURE_SKIP_TLS_VERIFY=true` (인증서 검증 스킵)

## 테스트 결과 요약

- **http_req_failed:** 0.00% (0 / 32,507)
- **총 요청 수:** 32,507
- **RPS (평균):** 약 209 req/s
- **http_req_duration:** avg 976ms, med 338ms, p95 3.5s, max 30.97s
- **Web Pod:** 2개 → 4개 (HPA 스케일업)
- **web-server-hpa:** REPLICAS 4, TARGETS 24%/70% (테스트 종료 후)

**상세 결과:** `../../Task1_공통_문서.md` §4.3 참고
