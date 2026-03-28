---
name: collect-live-state
description: 현재 클러스터와 운영 호스트의 실측 상태를 표준 명령 세트로 수집한다. infra_state 갱신이나 운영 점검 전에 사용한다.
---

# 실측 상태 수집

## 목표

`kubectl`, `kubectl top`, `ssh station`을 기준으로 현재 운영 상태를 빠르게 수집한다.

## 기본 수집 순서

1. Kubernetes context 확인
2. 노드 상태 수집
3. 대상 namespace 워크로드 수집
4. ingress / service / hpa / pvc / cronjob 수집
5. 리소스 사용량 수집
6. 필요 시 `station` 호스트 상태 수집

가능하면 아래 스크립트를 우선 사용한다.

```bash
infra/scripts/collect/collect-live-state.sh
```

옵션:

- namespace 변경: `infra/scripts/collect/collect-live-state.sh <namespace>`
- station 조회 제외: `INCLUDE_STATION=0 infra/scripts/collect/collect-live-state.sh`

## 표준 명령 세트

### 1. 클러스터 기본 상태

```bash
kubectl get ns
kubectl get nodes -o wide
kubectl top nodes
kubectl get cronjob -A
kubectl get svc -A
```

### 2. deep-quest 기준 워크로드 상태

```bash
kubectl get all -n deep-quest -o wide
kubectl get ingress,hpa,pvc,cronjob -n deep-quest
kubectl top pods -n deep-quest
```

### 3. 필요 시 상세 리소스

```bash
kubectl get configmap,secret -n deep-quest
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
```

### 4. station 운영 호스트

```bash
ssh station 'timedatectl | sed -n "1,8p"'
ssh station 'sed -n "1,120p" /etc/cron.d/station-image-prune'
ssh station 'sed -n "1,220p" /usr/local/sbin/station-image-prune.sh'
ssh station 'tail -n 20 /var/log/station-image-prune.log 2>/dev/null || true'
```

## 출력 정리 기준

- 노드
  - Ready 상태, 버전, IP, 런타임
- 스토리지
  - PVC 상태와 용량
- 네트워크
  - ingress host, external IP, 주요 service
- 서비스
  - deployment/statefulset ready 수, 이미지 태그
- 예약 작업
  - K8s CronJob과 host cron/timer

## 규칙

- 수집 결과는 사실 그대로만 정리한다
- 증거 없이 상태를 추정하지 않는다
- `infra_state/` 갱신이 목적이면 `update-infra-state` 형식에 맞춘다
- 문제 조사 시작 전이면 `check-troubleshooting`을 먼저 고려한다
