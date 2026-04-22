# Tailscale Funnel And Session Affinity

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` Tailscale Funnel, ingress/session affinity

## 발생 조건

- 외부 접속 경로를 Funnel로 바꾸거나, in-memory 상태를 가진 요청 라우팅을 안정화할 때

## 대표 증상

- 외부 접근은 되지만 session/thread가 다른 파드로 튀어 404 발생
- 동일 사용자의 요청이 다른 Web/AI 파드로 가면서 상태를 잃음
- Funnel 공개 URL은 열렸지만 SSL/state 관련 에러로 외부 연동이 불안정함
- HPA 또는 replica 증가 후 Tailscale sidecar가 같은 auth key를 동시에 써 충돌함

## 판단 과정

- Ingress cookie affinity 확인
- AI Service `sessionAffinity: ClientIP` 여부 확인
- thread 생성 파드와 run 처리 파드가 같은지 비교
- Funnel Pod의 auth secret, state secret, `tailscale serve` 설정 확인
- Tailscale sidecar가 여러 replica에 동시에 붙는 구조인지 확인

## 근본 원인

- in-memory thread/run 상태는 파드 로컬에만 존재
- 라우팅 고정이 없으면 후속 요청이 다른 파드로 간다
- `state=mem` 같은 임시 상태 저장 구성에서는 재기동 후 SSL / Funnel 상태가 유지되지 않는다
- 동일 auth key를 쓰는 Tailscale sidecar가 HPA로 복제되면 중복 등록 또는 충돌이 발생할 수 있다

## 해결 방법

- Web ingress는 cookie affinity 적용
- AI service는 `ClientIP` affinity 적용
- Funnel은 외부 진입 경로로 두되, 내부 session affinity와 함께 본다
- Funnel 운영 시 auth secret과 state secret을 분리해서 유지하고, `tailscale serve` 경로를 현재 서비스 포트와 함께 확인한다
- HPA 대상 Pod에 Tailscale sidecar를 같이 복제하지 않거나, sidecar를 별도 고정 파드로 분리하는 구조를 검토한다

## 확인 방법

```bash
kubectl get ingress -n deep-quest -o yaml
kubectl get svc ai-service -n deep-quest -o yaml
kubectl get deploy -n deep-quest tailscale-funnel -o yaml
kubectl logs -n deep-quest -l app.kubernetes.io/component=tailscale-funnel --tail=200
```

## 검색 키워드

- session affinity
- tailscale funnel
- thread 404
- clientip affinity
- tailscale state secret
- tailscale auth key duplicate
- funnel ssl

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 7장
- `scripts/verify-session-affinity.sh`
