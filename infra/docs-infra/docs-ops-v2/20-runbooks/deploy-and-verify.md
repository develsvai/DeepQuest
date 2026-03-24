# Deploy And Verify Runbook

## 1) 배포 전 확인
```bash
kubectl config current-context
kubectl get ns deep-quest
```

## 2) 배포 적용
GitOps(ArgoCD) 기준으로 `deploy` 브랜치 태그 변경 후 sync.
수동 적용 시:
```bash
kubectl apply -k k8s/overlays/prod
```

## 3) 1차 검증 (5분)
```bash
kubectl get deploy -n deep-quest
kubectl get pods -n deep-quest -o wide
kubectl get ingress -n deep-quest -o wide
kubectl get hpa -n deep-quest
```

성공 기준:
- deploy READY == desired
- Pod 상태 Running/Completed만 존재
- ingress host/address 정상
- HPA min/current/max가 의도와 일치

## 4) 2차 검증 (기능)
```bash
kubectl logs -n deep-quest deploy/web-server --tail=100
kubectl logs -n deep-quest deploy/ai-server --tail=100
```

체크 포인트:
- web: startup 에러/DB 연결 에러 없음
- ai: Redis/Postgres 연결 실패 없음

## 5) 배포 후 스냅샷 갱신
아래 문서를 즉시 갱신:
- `../00-start-here/current-state.md`
- `../30-performance/baseline-and-next.md`
