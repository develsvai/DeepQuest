---
name: verify-deploy
description: 배포 후 rollout, ingress, hpa, cronjob, health endpoint를 표준 순서로 점검한다. deep-quest 운영 검증용으로 사용한다.
---

# 배포 검증

## 목표

배포 직후 `deep-quest`의 핵심 리소스가 정상 상태인지 빠르게 검증한다.

## 기본 검증 순서

1. rollout 상태 확인
2. 파드 / 서비스 / ingress 확인
3. HPA / CronJob / PVC 확인
4. health endpoint 확인
5. 실패 시 logs / describe로 추가 확인

가능하면 아래 스크립트를 우선 사용한다.

```bash
infra/scripts/verify/verify-deploy.sh
```

옵션:

- namespace 변경: `infra/scripts/verify/verify-deploy.sh <namespace>`
- 외부 ingress health 포함: `INGRESS_URL=https://example.com/api/health infra/scripts/verify/verify-deploy.sh`
- 실패 시 추가 진단 생략: `DEBUG_ON_FAILURE=0 infra/scripts/verify/verify-deploy.sh`

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

### 3. 외부/내부 진입점

```bash
kubectl get ingress -n deep-quest
kubectl get svc -n deep-quest
```

### 4. health check

내부 서비스 기준:

```bash
kubectl run -n deep-quest deploy-check --rm -it --image=curlimages/curl --restart=Never -- curl -fsS http://web-service/api/health
kubectl run -n deep-quest deploy-check-ai --rm -it --image=curlimages/curl --restart=Never -- curl -fsS http://ai-service:8000/ok
```

외부 ingress 기준:

```bash
curl -fsS https://deepquest.192.168.0.110.nip.io/api/health
```

### 5. 실패 시 추가 확인

```bash
kubectl describe pod -n deep-quest <pod-name>
kubectl logs -n deep-quest deploy/web-server --tail=100
kubectl logs -n deep-quest deploy/ai-server --tail=100
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
```

## 최소 성공 기준

- `web-server`, `ai-server` rollout 성공
- 주요 파드가 Running 또는 Completed 상태
- ingress host와 service가 존재
- HPA와 CronJob이 조회 가능
- web `/api/health`, ai `/ok` 응답 성공

## 규칙

- 검증 결과는 성공/실패와 근거 명령 결과를 함께 정리한다
- 실패 시 바로 원인 추정으로 넘어가지 말고 `logs`, `describe`, `events`를 먼저 확인한다
- 재발 가능하거나 비단순 장애면 `check-troubleshooting` 후 `update-troubleshooting`을 고려한다
