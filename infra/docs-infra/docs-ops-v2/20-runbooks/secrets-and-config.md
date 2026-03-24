# Secrets And Config Runbook

## 원칙
- 비밀값은 파일에 저장하지 않고 K8s Secret으로만 관리
- `web`와 `ai` 환경변수 소스 순서에 의존하는 스크립트는 변경 시 주의

## 적용 절차
```bash
./k8s/scripts/apply-secrets.sh
kubectl rollout restart deployment/web-server -n deep-quest
kubectl rollout restart deployment/ai-server -n deep-quest
```

## 검증
```bash
kubectl get secret -n deep-quest
kubectl logs -n deep-quest deploy/web-server --tail=50
kubectl logs -n deep-quest deploy/ai-server --tail=100
```

## 자주 발생하는 문제
1. `ImagePullBackOff`: 태그 불일치 또는 레지스트리 pull secret 문제
2. `License verification failed`(AI): `LANGSMITH_API_KEY`/라이선스 키 문제
3. DB 인증 실패: URL 인코딩(`@ -> %40`) 누락

## 변경 후 문서 반영
- 설정 변경 시 `../10-platform/topology.md`와 `../00-start-here/current-state.md` 동시 갱신
