# Infra Dev Vs Prod

## 목적

Kubernetes overlay, ArgoCD, 리소스, HPA 기준에서 dev와 prod의 차이를 빠르게 확인한다.

## 핵심 차이

| 구분 | Dev | Prod |
|---|---|---|
| Overlay | `k8s/overlays/dev` | `k8s/overlays/prod` |
| ArgoCD sync | 자동 sync 기준 | 수동 sync 기준 |
| Replica | 더 작게 운영 | 더 크게 운영 |
| HPA | min/max가 작음 | min/max가 더 큼 |
| ConfigMap env | development | production |
| AI log level | debug 성향 | info 성향 |

## 운영 메모

- dev/prod 차이는 앱 코드보다 overlay와 ArgoCD 정책에서 먼저 확인한다
- 실제 현재 상태는 항상 `kubectl`과 `docs/infra_state/` 기준으로 다시 검증한다

## 관련 파일

- `infra/k8s/overlays/dev`
- `infra/k8s/overlays/prod`
- `infra/k8s/argocd/application-dev.yaml`
- `infra/k8s/argocd/application-prod.yaml`

## 원본 문서

- `docs/docs-infra/legacy/인프라_dev_prod.md`
