# Performance Baseline And Next Actions

## Live baseline (2026-02-20)
- Web replicas: `4` (HPA min=4)
- AI replicas: `1` (HPA min=1)
- Web memory usage: pod당 약 `130~145Mi` / request `256Mi`
- AI memory usage: 약 `252Mi` / request `2Gi`
- HPA target:
  - Web: CPU 70%, Memory 80%
  - AI: CPU 35%, Memory 80%

## 해석
1. 현재는 트래픽 여유 구간이며, Web은 최소 4개 정책으로 비용이 고정됨.
2. AI는 유휴 시 1개로 내려가며, 급증 트래픽 순간에 scale-up 지연 가능성이 있음.
3. AI request memory(2Gi)가 실제 사용량 대비 크게 잡혀 있어 스케줄링 여유를 갉아먹을 수 있음.

## 다음 액션 (우선순위)
1. AI 동시성 실측: 부하(Locust) 중 `ai-server` replicas, p95 latency, 실패율 상관관계 측정
2. AI request memory 재평가: 2Gi -> 단계적 하향 실험(예: 1Gi) 후 OOM/latency 검증
3. Web minReplicas=4 정책 재검증: 오프피크 비용 vs 스파이크 대응효과 비교
4. 운영 대시보드 표준화: HPA, pod restart, ingress 5xx, AI latency를 단일 패널로 고정

## 측정 명령 템플릿
```bash
kubectl get hpa -n deep-quest -w
kubectl top pods -n deep-quest
kubectl get pods -n deep-quest -o wide
```
