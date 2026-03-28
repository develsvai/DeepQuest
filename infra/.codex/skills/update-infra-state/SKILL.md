---
name: update-infra-state
description: 수집기, 매니페스트, 관측 증거를 바탕으로 infra/docs/infra_state에 검증된 인프라 상태를 기록한다.
---

# 인프라 상태 갱신

## 목표

현재 인프라 상태를 `infra/docs/infra_state/`에 기록한다.

## 작업 순서

1. `infra/scripts/collect/`를 확인한다
2. 수집기가 있으면 실행한다
3. 없으면 검증된 매니페스트, 스크립트, 증거를 확인한다
4. `infra/docs/infra_state/YYYY-MM-DD-live.md` 형식의 사실 기반 상태 스냅샷을 작성하거나 갱신한다

## 출력 형식

파일명:

`infra/docs/infra_state/YYYY-MM-DD-live.md`

문서 형식:

# INFRA STATE

- Captured at: YYYY-MM-DD KST
- Kubernetes context: `...`
- Primary namespace: `...`

## 노드
### Kubernetes nodes
### 기타 운영 호스트

## 스토리지
### PVC / PV / 백업 저장소
### 디스크 정리 또는 trim 증거

## 네트워크
### ingress
### 서비스
### 외부 노출 서비스

## 서비스
### 워크로드
### 실행 중 파드
### Autoscaling
### Scheduled jobs
### 호스트 시스템 cron / timer

## 최소 포함 항목

- 현재 Ready 노드와 핵심 런타임 정보
- 운영에 영향 주는 PVC 또는 저장소 정보
- 현재 ingress / service / 외부 노출 정보
- 실제 배포 중인 주요 workload와 이미지 태그
- 현재 HPA 또는 스케일링 정보
- 현재 확인된 CronJob 또는 호스트 예약 작업

## 작성 메모

- 기존 스냅샷이 있더라도 새로운 시점이면 새 날짜 파일을 우선 추가한다
- 수집 스크립트가 없으면 `kubectl`, 시스템 명령, 원격 호스트 조회 결과를 근거로 직접 작성한다
- 클러스터 외부 호스트 작업이 운영 흐름에 직접 연결되면 함께 적는다

## 규칙

- 사실만 기록한다
- 추정하지 않는다
- 설계 설명을 넣지 않는다
- 파일명, 헤더, 섹션 구조를 `infra/docs/infra_state/README.md`와 일치시킨다
