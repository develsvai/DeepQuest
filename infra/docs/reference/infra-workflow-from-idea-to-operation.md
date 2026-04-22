# Infra Workflow From Idea To Operation

- 확인 시점: 2026-04-20 KST
- 대상 환경: `deep-quest/infra` 문서 workflow, deep-quest Kubernetes 운영 작업
- 상태: accepted

## 목적

이 문서는 작업자가 인프라 작업 흐름이 헷갈릴 때 보는 기준 문서다.

특히 다음처럼 단순 장애 복구가 아니라 의도적으로 구조를 바꾸는 작업에 사용한다.

- Tailscale 노출 구조 재정리
- deep-quest 배포, autoscaling, ingress, session affinity 구조 변경
- LangGraph, Redis, Postgres, observability 운영 경계 변경
- CI/CD, Jenkins agent, registry, Secret/RBAC 같은 운영 경로 변경

핵심 흐름은 아래와 같다.

```text
구상 -> 현재 상태 수집 -> 설계 -> 작업 계획 -> 적용 -> 검증 -> 문서 승격
```

## 먼저 구분할 것

### 일반 배포

코드 또는 이미지 release를 운영에 반영하는 반복 배포 작업이다.

이 흐름은 이미 정해진 배포 경로를 실행하고 검증하는 작업이므로, 배포 구조 자체를 바꾸지 않는 한 `design-infra-change`까지 가지 않는다.

```text
status 확인 -> Jenkins 실행 -> Harbor BUILD_TAG 확인 -> deploy 브랜치 overlay 확인 -> ArgoCD sync -> verify-deploy -> update-task
```

확인 기준:

- Jenkins가 `${BUILD_TAG}` 이미지를 Harbor에 push했는가?
- `deploy` 브랜치 overlay의 `ai`, `web`, `langgraph-run-metrics-exporter` tag가 같은 `${BUILD_TAG}`인가?
- ArgoCD Application `deep-quest-prod` 또는 `deep-quest-dev`가 기대 revision을 sync했는가?
- live Deployment image tag와 health endpoint가 정상인가?

배포 source of truth는 [Deployment Source Of Truth](./deployment-source-of-truth.md)를 우선한다.

### 장애 대응

이미 문제가 발생했고 복구가 우선인 경우다.

```text
check-troubleshooting -> collect-live-state -> 복구 -> verify-deploy -> update-task -> update-troubleshooting
```

예:

- Tailscale funnel/session affinity 문제
- ai-server 또는 web-server CrashLoopBackOff
- Prisma/Postgres migration 실패
- Jenkins build agent 또는 image pull 실패

### 구조 변경

현재 시스템이 동작하지만 더 나은 구조로 바꾸려는 경우다.

이때는 바로 manifest나 values를 수정하지 않는다.

```text
status 확인 -> collect-live-state -> update-infra-state -> design-infra-change -> plan-task -> 적용 -> 검증
```

예:

- Tailscale serve/funnel 기준을 tailnet-only와 public exposure로 재분류
- autoscaling 기준, resource request/limit, HPA 정책 변경
- ingress/session affinity 구조 변경
- observability metric/log 수집 구조 변경

## 작업자 관점 전체 흐름

### 1. 현재 작업 의도 확인

먼저 아래 문서를 읽는다.

```text
docs/status/README.md
docs/infrastructure.md
docs/tasks/README.md
최신 docs/status/status-YYYY-MM-DD.md
최신 docs/tasks/task-YYYY-MM-DD.md
```

확인할 질문:

- 오늘의 작업 의도가 무엇인가?
- 지금 요청이 최신 status의 의도와 맞는가?
- 기존 작업에서 보류된 위험이나 다음 액션이 있는가?
- 긴급 장애 대응이 아직 우선인가?

요청이 현재 의도와 다르면 먼저 작업 축을 정리한다.

- 새 작업일이면 `new-status`
- 같은 날이지만 사고나 범위 변경으로 우선순위가 바뀌면 예외적으로 `update-status`

### 2. workflow skill 직접 사용

`new-status`, `plan-task`, `update-task`, `update-troubleshooting`, `create-runbook` 같은 문서 workflow는 대응 skill 절차를 직접 따른다.

- 생성된 초안이나 문서 변경은 실제 `docs/` 반영 전 반드시 검토한다
- helper 스크립트 유무와 관계없이 live 관측과 source of truth 우선순위는 그대로 유지한다

### 3. 라이브 상태 수집

현재 상태가 의사결정에 필요하면 `collect-live-state`를 사용한다.

deep-quest 구조 변경이라면 최소한 아래를 본다.

```text
Kubernetes:
- current-context
- nodes
- deep-quest namespace pod/deploy/sts/service/ingress/hpa/pvc/cronjob
- web-server, ai-server, postgres, redis, langgraph 관련 workload
- Tailscale sidecar/funnel/serve 상태
- Secret/RBAC 참조

운영 호스트:
- 필요 시 Proxmox host와 VM 상태
- 필요 시 station host cron/log 상태
```

이 단계의 결과는 판단이 아니라 관측값이다.

### 4. 현재 상태 스냅샷 기록

수집한 상태가 작업 판단의 기준이 되면 `update-infra-state`로 `docs/infra_state/YYYY-MM-DD-live.md`를 만든다.

`infra_state`에는 사실만 쓴다.

넣는 것:

- 실제 리소스 이름
- 상태, IP, hostname, image, Secret 이름
- Ready/Running 여부
- HPA, ingress, service, PVC 상태
- 관측된 serve/funnel 상태
- 로그에서 확인된 짧은 사실

넣지 않는 것:

- 위험 판단
- 개선 방향
- 다음 후보
- “이 구조가 안전하다” 같은 평가

판단은 `tasks/`, `troubleshooting/`, `reference/`에 둔다.

### 5. 구조 변경 설계

의도적인 구조 변경이면 `design-infra-change`를 사용해 `docs/reference/`에 설계 문서를 만든다.

설계 문서에는 아래 항목을 넣는다.

- 현재 구조
- 변경 동기
- 목표 구조
- 변경 범위
- 비범위
- 영향과 위험
- 적용 순서
- 검증 기준
- 문서화 계획

설계 문서는 작업 전에 멈춰서 합의하는 장소다.

권장 상태값:

```text
draft -> accepted -> superseded
```

- `draft`: 아직 검토 중
- `accepted`: 이 설계를 기준으로 작업 가능
- `superseded`: 더 최신 설계나 실제 상태로 대체됨

작업자는 `accepted`가 되기 전에는 영향 큰 변경을 적용하지 않는다.

### 6. 작업 계획 생성

설계가 정해지면 `plan-task`로 최신 `docs/tasks/task-YYYY-MM-DD.md`에 실행 단위를 만든다.

좋은 계획은 설계의 범위와 비범위를 그대로 반영한다.

예:

```text
1. live Tailscale serve/funnel 상태를 설계 문서와 대조한다.
2. deep-quest 운영 노출 등급을 tailnet-only, ingress, public-funnel로 분류한다.
3. 변경 대상 manifest/Secret/RBAC를 확인한다.
4. web/ai rollout과 health endpoint 검증 기준을 정한다.
5. 변경 후 의도하지 않은 public exposure 여부를 검증한다.
```

### 7. 실제 적용

이제 manifest, overlay, Secret/RBAC, host 설정을 수정한다.

작업 중 기록은 `status`가 아니라 `task`에 남긴다.

나쁜 기록:

```text
- kubectl get pod 했다
- logs 봤다
- kustomize apply 했다
```

좋은 기록:

```text
### Tailscale funnel 구조 확인

- deep-quest public endpoint는 Funnel 대상으로 분류했다.
- live Deployment command에서 funnel 실행 여부와 state Secret을 확인했다.
- 검증 결과 tailnet-only와 public exposure 대상이 분리되어 있었다.
- 남은 작업은 manifest에 source of truth를 명확히 남기는 것이다.
```

### 8. 중간 장애 대응

작업 중 장애가 발생하면 먼저 기존 문서를 검색한다.

```text
check-troubleshooting
```

기존 문서로 설명되면 그 절차를 따른다.

새 장애군이거나 재발 가능성이 있으면 `update-troubleshooting`으로 문서화한다.

단, 장애 대응 중에도 설계의 비범위를 침범하지 않는다.

### 9. 배포 검증

적용 후 `verify-deploy`를 사용한다.

일반 검증:

- rollout 완료
- Pod Ready
- Service/Ingress 영향 확인
- HPA/CronJob/PVC 영향 확인
- web `/api/health`, ai `/ok` 등 health endpoint 확인

Tailscale 특화 검증:

- sidecar logs
- `tailscale status`
- `tailscale serve status`
- `tailscale funnel status`
- tailnet DNS 접근
- 의도하지 않은 public endpoint 없음

### 10. 변경 후 상태 재수집

적용 전 상태와 적용 후 상태는 분리한다.

변경이 운영 상태를 바꿨다면 다시 수집한다.

```text
collect-live-state -> update-infra-state
```

같은 날짜 파일을 갱신하더라도 `Captured at`과 변경 후 상태가 명확해야 한다.

상태 변화가 크면 새 스냅샷을 추가하는 쪽이 더 좋다.

### 11. 구현 평가

적용이 끝나면 `evaluate-implementation`으로 설계와 실제 결과를 대조한다.

평가 기준:

- 최신 status의 의도를 벗어나지 않았는가?
- 최신 task의 계획과 진행이 일치하는가?
- reference 설계 문서의 목표 구조와 일치하는가?
- 비범위를 침범하지 않았는가?
- 최신 infra_state가 실제 변경 후 상태를 반영하는가?
- 의도하지 않은 public exposure나 Secret/RBAC drift가 생기지 않았는가?
- 반복 절차나 장애 지식이 올바른 문서 유형으로 분리됐는가?

결과는 `OK`, `NOT OK`, `잔여 위험`, `수정 제안`처럼 짧게 남긴다.

### 12. 작업 기록 정리

마지막으로 `update-task`로 실제 작업 단위별 결과를 정리한다.

task에는 다음날 작업자가 이어받을 수 있는 맥락을 남긴다.

- 완료한 작업
- 확인한 사실
- 적용한 변경
- 검증 결과
- 남은 위험
- 보류 / 다음 액션

### 13. 지식 문서 분리

실제로 반복할 수 있는 절차가 생기면 `create-runbook`을 사용한다.

재발 가능한 장애라면 `update-troubleshooting`을 사용한다.

구조 비교, 운영 기준, 설계 판단은 `docs/reference/`에 둔다.

## 문서별 역할

| 문서 | 역할 | 갱신 시점 |
| --- | --- | --- |
| `docs/status/` | 오늘의 의도와 시작 기준 상태 | 새 작업일 시작, 예외적 우선순위 변경 |
| `docs/tasks/` | 실제 작업 계획, 진행, 중단 지점 | 작업 중 계속 |
| `docs/infra_state/` | 검증된 라이브 상태 스냅샷 | 의미 있는 상태 수집 후 |
| `docs/reference/` | 설계, 비교, 운영 기준 | 구조 변경 전이나 기준 정리 시 |
| `docs/runbooks/` | 반복 가능한 실행 절차 | 실제 절차가 안정화된 후 |
| `docs/troubleshooting/` | 재발 가능한 장애 대응 | 복구 경험이 재사용 가능할 때 |
| `docs/infrastructure.md` | 이 저장소의 작업 경계 | 관리 대상이나 기준 링크가 바뀔 때 |

## `status`와 `task`의 관계

`status`는 하루 시작 기준의 방향판이다.

- 오늘 무엇을 하려는지
- 현재 무엇이 알려져 있는지
- 다음 작업 축이 무엇인지

`task`는 작업 중 실제 기록이다.

- 무엇을 확인했는지
- 무엇을 바꿨는지
- 어디서 막혔는지
- 검증이 어떻게 끝났는지

당일 작업 중 생기는 세부 진행은 `status`에 계속 덮어쓰지 않는다.

다음날 `new-status`가 전날 `task`에서 실제 완료된 것만 `현재 상태`로 승격한다.

## 구조 변경 작업의 승인 지점

의도적인 구조 변경은 아래 지점을 넘을 때 명확히 확인한다.

| 지점 | 질문 |
| --- | --- |
| 구상에서 설계로 | 이 작업이 현재 status의 의도와 맞는가? |
| 설계에서 작업으로 | reference 설계 문서가 `accepted`인가? |
| 작업 중 예외 | 비범위를 침범하는 임시 조치가 필요한가? |
| 적용 후 검증 | live 상태가 설계 목표와 일치하는가? |
| 문서 승격 | 다음날 status에 올릴 만큼 완료됐는가? |

## 세션이 중간에 끝날 때

작업이 끝나지 않았으면 `task`의 `보류 / 다음 액션`에 다음 작업자가 바로 이어갈 정보를 남긴다.

남길 것:

- 마지막으로 확인한 live 상태
- 아직 적용하지 않은 변경
- 이미 적용했지만 검증하지 못한 변경
- 다음에 먼저 볼 명령 또는 문서
- 중단 당시의 판단

남기지 않을 것:

- 긴 원본 로그
- 의미 없는 명령 나열
- 확인되지 않은 추정

## 판단 기준

문서 내용이 충돌하면 아래 순서를 따른다.

1. 실제 명령 결과와 라이브 관측
2. 최신 `docs/infra_state/`
3. 최신 `docs/status/`
4. 최신 `docs/tasks/`
5. `docs/infrastructure.md`
6. `docs/runbooks/`, `docs/troubleshooting/`, `docs/reference/`
7. 루트 `README.md`와 legacy 문서

이 문서도 reference이므로, 라이브 관측이나 최신 status/task와 충돌하면 최신 상태를 우선한다.
