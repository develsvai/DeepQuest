# Tailscale Funnel 테스트 로그

## 파일 목록

### stress-test-funnel.log
- **수집 대상:** Tailscale Funnel 파드 로그 (`kubectl logs -n deep-quest -l app.kubernetes.io/component=tailscale-funnel`)
- **내용:** Funnel 경유 부하 테스트 중 Funnel 파드 로그
- **용도:** Funnel 프록시 동작, 연결 처리 확인

## 테스트 배경

**초기 구조:** Tailscale Funnel을 사이드카로 구성하여 Web Pod에 포함

**문제점:** Funnel 경유 시 `unexpected EOF` 다수 발생

**원인 분석:**
- Funnel은 localhost 기반으로 동작
- 사이드카 구성 시 Web Pod 내부에서만 접근 가능
- 외부에서 접근 시 연결 불안정

**해결:** Standalone Funnel Deployment로 분리, 이후 부하 테스트는 내부 도메인 사용으로 변경

## 참고

- Funnel 구조 변경 상세: `../트러블슈팅.md` §7 참고
- 이후 테스트: 내부 도메인 사용 (`../internal_domain_test/` 참고)
