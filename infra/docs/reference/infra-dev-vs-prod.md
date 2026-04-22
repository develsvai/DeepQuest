# Infra Dev Vs Prod

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` Kubernetes overlays, ArgoCD Applications

## 목적

Kubernetes overlay, ArgoCD, 리소스, HPA 기준에서 dev와 prod의 차이를 빠르게 확인한다.

## 핵심 차이

| 구분 | Dev | Prod |
|---|---|---|
| Overlay | `k8s/overlays/dev` | `k8s/overlays/prod` |
| ArgoCD Application | `deep-quest-dev` | `deep-quest-prod` |
| ArgoCD sync | 자동 sync 기준 | 수동 sync 기준 |
| Replica | 더 작게 운영 | 더 크게 운영 |
| HPA | min/max가 작음 | min/max가 더 큼 |
| ConfigMap env | development | production |
| AI log level | debug 성향 | info 성향 |
| Image tag | `dev` alias 또는 `${BUILD_TAG}` | `prod` alias 또는 `${BUILD_TAG}` |

## 운영 메모

- dev/prod 차이는 앱 코드보다 overlay와 ArgoCD 정책에서 먼저 확인한다
- 배포 완료 기준은 alias tag 자체가 아니라 `deploy` 브랜치 overlay와 live image가 같은 `${BUILD_TAG}`를 가리키는지 여부다
- 실제 현재 상태는 항상 `kubectl`과 `docs/infra_state/` 기준으로 다시 검증한다

## 관련 파일

- `k8s/overlays/dev`
- `k8s/overlays/prod`
- `k8s/argocd/application-dev.yaml`
- `k8s/argocd/application-prod.yaml`
- `deployment-source-of-truth.md`

## 원본 문서

- `docs/docs-infra/legacy/인프라_dev_prod.md`
