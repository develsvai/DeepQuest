---
name: verify-deploy
description: 배포 후 rollout, ingress, hpa, cronjob, health endpoint를 표준 순서로 점검한다. deep-quest 운영 검증용으로 사용한다.
---

# 배포 검증

## 목표

배포 직후 `deep-quest`의 핵심 리소스가 정상 상태인지 빠르게 검증한다.
이 저장소에서는 단순 rollout만 보지 않고 Jenkins BUILD_TAG, overlay image tag, ArgoCD Application, live Deployment image가 같은 release를 가리키는지 함께 본다.

## 기본 검증 순서

1. rollout 상태 확인
2. ArgoCD Application sync/health/revision 확인
3. overlay image tag와 live Deployment image tag 정합성 확인
4. 파드 / 서비스 / ingress 확인
5. HPA / CronJob / PVC 확인
6. health endpoint 확인
7. 실패 시 logs / describe로 추가 확인

가능하면 아래 스크립트를 우선 사용한다.

```bash
scripts/verify/verify-deploy.sh
```

옵션:

- namespace 변경: `scripts/verify/verify-deploy.sh <namespace>`
- 환경 변경: `DEPLOY_ENV=dev ARGOCD_APP=deep-quest-dev scripts/verify/verify-deploy.sh`
- 특정 release tag 강제 검증: `EXPECTED_TAG=123-abcdef scripts/verify/verify-deploy.sh`
- 외부 ingress health 포함: `INGRESS_URL=https://example.com/api/health scripts/verify/verify-deploy.sh`
- 실패 시 추가 진단 생략: `DEBUG_ON_FAILURE=0 scripts/verify/verify-deploy.sh`
- ArgoCD CRD 확인 생략: `CHECK_ARGOCD=0 scripts/verify/verify-deploy.sh`

image tag 정합성 검증은 현재 checkout의 overlay를 기준으로 한다.
prod 배포 완료 후 검증은 `deploy` 브랜치 checkout 또는 동일한 overlay 파일을 `KUSTOMIZATION_FILE`로 지정한 상태에서 수행한다.

## 표준 명령 세트

### 1. rollout

```bash
kubectl rollout status deployment/web-server -n deep-quest
kubectl rollout status deployment/ai-server -n deep-quest
```

### 2. 리소스 상태

```bash
kubectl get all -n deep-quest -o wide
kubectl get ingress,hpa,pvc,cronjob -n deep-quest
kubectl get pods -n deep-quest
```

### 3. ArgoCD / image tag 정합성

```bash
kubectl get application deep-quest-prod -n argocd -o wide
kubectl get application deep-quest-prod -n argocd -o jsonpath='{.status.sync.status}{" health="}{.status.health.status}{" revision="}{.status.sync.revision}{"\n"}'
sed -n '/^images:/,/^[^[:space:]-]/p' k8s/overlays/prod/kustomization.yaml
kubectl get deployment web-server ai-server langgraph-run-metrics-exporter -n deep-quest -o jsonpath='{range .items[*]}{.metadata.name}{": "}{range .spec.template.spec.containers[*]}{.name}{"="}{.image}{" "}{end}{"\n"}{end}'
```

검증 기준:

- `ai`, `web`, `langgraph-run-metrics-exporter` overlay tag가 같은 `${BUILD_TAG}`를 가리킨다
- live Deployment image tag가 overlay tag와 같다
- ArgoCD Application은 `Synced` / `Healthy` 상태다
- `prod` / `dev`는 Harbor 이동 alias이므로 배포 완료 기준은 `${BUILD_TAG}`다
- prod는 ArgoCD 수동 sync 기준이므로 Jenkins 성공만으로 배포 완료로 보지 않는다

### 4. 외부/내부 진입점

```bash
kubectl get ingress -n deep-quest
kubectl get svc -n deep-quest
```

### 5. health check

내부 서비스 기준:

```bash
kubectl run -n deep-quest deploy-check --rm -it --image=curlimages/curl --restart=Never -- curl -fsS http://web-service/api/health
kubectl run -n deep-quest deploy-check-ai --rm -it --image=curlimages/curl --restart=Never -- curl -fsS http://ai-service:8000/ok
```

외부 ingress 기준:

```bash
curl -fsS https://deepquest.192.168.0.110.nip.io/api/health
```

### 6. 실패 시 추가 확인

```bash
kubectl describe pod -n deep-quest <pod-name>
kubectl logs -n deep-quest deploy/web-server --tail=100
kubectl logs -n deep-quest deploy/ai-server --tail=100
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
```

## 최소 성공 기준

- `web-server`, `ai-server` rollout 성공
- ArgoCD Application 조회 가능, `Synced` / `Healthy`
- overlay image tag와 live Deployment image tag 일치
- 주요 파드가 Running 또는 Completed 상태
- ingress host와 service가 존재
- HPA와 CronJob이 조회 가능
- web `/api/health`, ai `/ok` 응답 성공

## 규칙

- 검증 결과는 성공/실패와 근거 명령 결과를 함께 정리한다
- 실패 시 바로 원인 추정으로 넘어가지 말고 `logs`, `describe`, `events`를 먼저 확인한다
- 재발 가능하거나 비단순 장애면 `check-troubleshooting` 후 `update-troubleshooting`을 고려한다
- 검증 결과를 문서에 반영할 때 Markdown 링크는 작성 중인 문서 위치 기준 상대경로로 쓴다
- 로컬 절대경로 링크는 쓰지 않는다
