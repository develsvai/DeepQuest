# 내부 도메인 테스트 로그

## 파일 목록

### stress-test-web-internal.log
- **수집 대상:** Web 파드 로그 (`kubectl logs -n deep-quest -l app.kubernetes.io/component=web`)
- **내용:** 내부 도메인 사용 테스트 중 Web 서버 애플리케이션 로그
- **용도:** 내부 네트워크 경유 시 Web 파드 동작 확인

### stress-test-ingress-internal.log
- **수집 대상:** Ingress 컨트롤러 로그 (`kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller`)
- **내용:** 내부 도메인 사용 테스트 중 Ingress로 들어오는 HTTP 요청 로그
- **용도:** 내부 네트워크 경유 시 Ingress 라우팅 확인

## 테스트 목적

**배경:** 초기 부하 테스트에서 Tailscale Funnel 경유 시 `unexpected EOF` 다수 발생

**해결:** 내부 도메인(`deepquest.192.168.0.110.nip.io`)으로 변경하여 Funnel 우회

**결과:** 내부 도메인 사용 시 정상 동작 확인 → 이후 모든 부하 테스트는 내부 도메인 사용

## 참고

- 내부 도메인 사용 시 TLS 인증서 불일치로 `K6_INSECURE_SKIP_TLS_VERIFY=true` 필요
- Funnel 테스트 로그: `../funnel_test/stress-test-funnel.log` 참고
