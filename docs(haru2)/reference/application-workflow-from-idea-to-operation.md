# Application Workflow From Idea To Operation

- 확인 시점: `2026-04-23 KST`
- 대상 환경: `deep-quest` 루트 애플리케이션 문서 workflow, `web/`, `ai/` 작업 조정
- 상태: accepted

## 목적

이 문서는 작업자가 루트 애플리케이션 작업 흐름이 헷갈릴 때 보는 기준 문서다.

특히 다음처럼 단순 문서 수정이 아니라, `web/`와 `ai/`를 함께 조율하거나 작업 경계 자체를 바꾸는 작업에 사용한다.

- `web/`와 `ai/`를 함께 건드리는 기능 구현
- 공통 API 계약, 데이터 흐름, 질문 생성 파이프라인 구조 변경
- 문서 구조와 workflow 규칙 개편
- 앱 레이어 source of truth 정리와 reference 문서 승격

핵심 흐름은 아래와 같다.

```text
구상 -> 현재 의도 확인 -> 관련 코드/문서 조회 -> 작업 계획 -> 적용 -> 검증 -> 문서 승격
```

## 먼저 구분할 것

### 일반 구현

이미 정해진 애플리케이션 작업 경계 안에서 `web/` 또는 `ai/` 코드를 수정하는 작업이다.

이 흐름은 기존 구조를 크게 바꾸지 않는 한 `architecture.md`나 별도 reference 설계 문서까지 바로 수정하지 않는다.

```text
status 확인 -> 관련 코드/문서 조회 -> plan-task -> 구현 -> 검증 -> update-task
```

확인 기준:

- 최신 `status`의 의도와 지금 요청이 맞는가?
- 관련 구현이 `web/`인지 `ai/`인지, 아니면 둘 다인지 명확한가?
- 관련된 기존 reference, troubleshooting, 하위 문서가 이미 있는가?
- 변경 후 바로 확인할 수 있는 테스트나 검증 지점이 있는가?
- `web/`를 건드리면 어떤 `web/docs/`를 먼저 읽어야 하는가?
- `ai/`를 건드리면 어떤 `ai/docs/`와 `ai/README.md`를 먼저 읽어야 하는가?

### 장애 대응

이미 문제가 발생했고 복구나 원인 확인이 우선인 경우다.

```text
check-troubleshooting -> 관련 코드/문서 조회 -> 복구 또는 수정 -> 검증 -> update-task -> update-troubleshooting
```

예:

- Clerk webhook 이후 사용자 동기화 실패
- `web/` API 계약과 `ai/` 응답 구조 불일치
- Sentry, analytics, env 차이로 인한 prod/dev 동작 차이

### 구조 변경

현재 시스템이 동작하지만 더 나은 구조로 바꾸려는 경우다.

이때는 바로 코드부터 바꾸지 말고, 루트 reference와 architecture 경계를 먼저 확인한다.

```text
status 확인 -> architecture/reference 확인 -> 관련 설계 메모 정리 -> plan-task -> 적용 -> 검증 -> 문서 승격
```

예:

- 루트 문서 구조와 workflow 규칙 개편
- `web/`와 `ai/` 사이 책임 재배치
- 질문 생성/파싱/피드백 흐름의 상위 조정 구조 변경
- 루트 source of truth 기준 변경

## 작업자 관점 전체 흐름

### 1. 현재 작업 의도 확인

먼저 아래 문서를 읽는다.

```text
docs(haru2)/status/README.md
docs(haru2)/architecture.md
docs(haru2)/tasks/README.md
최신 docs(haru2)/status/status-YYYY-MM-DD.md
최신 docs(haru2)/tasks/task-YYYY-MM-DD.md
```

확인할 질문:

- 오늘의 작업 의도가 무엇인가?
- 지금 요청이 최신 status의 의도와 맞는가?
- 기존 작업에서 보류된 위험이나 다음 액션이 있는가?
- 지금 작업이 `web/`, `ai/`, 루트 문서 중 어디까지 건드리는가?

요청이 현재 의도와 다르면 먼저 작업 축을 정리한다.

- 새 작업일이면 `new-status`
- 같은 날이지만 사고나 범위 변경으로 우선순위가 바뀌면 예외적으로 `update-status`

### 2. workflow skill 직접 사용

`new-status`, `plan-task`, `update-task`, `update-troubleshooting`, `create-runbook` 같은 문서 workflow는 대응 skill 절차를 직접 따른다.

- 생성된 초안이나 문서 변경은 실제 `docs(haru2)/` 반영 전 반드시 검토한다
- helper 스크립트 유무와 관계없이 실제 코드와 검증 결과 우선순위는 그대로 유지한다

### 3. 관련 코드와 문서 조회

현재 상태가 작업 판단에 필요하면 관련 영역을 직접 읽는다.

루트 애플리케이션 구조 변경이라면 최소한 아래를 본다.

```text
문서:
- docs(haru2)/reference/*
- docs(haru2)/troubleshooting/*
- `web/`를 건드리거나 `web/` 구현 판단이 필요하면 관련 `web/docs/*`
- `ai/`를 건드리거나 `ai/` 구현 판단이 필요하면 관련 `ai/docs/*`
- `ai/` 세부 작업이면 `ai/README.md`

코드:
- web/ 의 관련 route, API, schema, service
- ai/ 의 관련 graph, parser, runtime, tests
- web/ai 사이 계약을 드러내는 타입, env, API 응답 구조
```

이 단계의 결과는 판단이 아니라 현재 구현과 문서 상태를 확인하는 것이다.

### 4. 구조 변경 설계

의도적인 구조 변경이면 `docs(haru2)/reference/`에 설계 메모나 기준 문서를 먼저 만든다.

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

### 5. 작업 계획 생성

작업 방향이 정해지면 `plan-task`로 최신 `docs(haru2)/tasks/task-YYYY-MM-DD.md`에 실행 단위를 만든다.

좋은 계획은 구조 변경이면 설계 범위와 비범위를 반영하고, 일반 구현이면 관련 코드/문서/검증 지점을 먼저 드러낸다.

예:

```text
1. 관련 루트 문서와 `web/`, `ai/` 구현을 대조한다.
2. 수정이 필요한 허브 문서와 reference 문서를 구분한다.
3. 코드와 문서 중 어느 쪽이 source of truth인지 항목별로 고정한다.
4. 변경 후 검증 기준과 남길 기록 위치를 정한다.
```

### 6. 실제 적용

이제 문서나 코드를 수정한다.

작업 중 기록은 `status`가 아니라 `task`에 남긴다.

나쁜 기록:

```text
- 파일 열었다
- 문서 수정했다
- 코드 확인했다
```

좋은 기록:

```text
### 1. 루트 문서 허브 정리

- `docs(haru2)`를 canonical docs 경로로 고정했다.
- 루트 README와 reference 허브를 `infra/docs`의 골격에 맞춰 다시 정리했다.
- 남은 작업은 source-of-truth 문서와 최신 status/task 승격이다.
```

### 7. 중간 장애 대응

작업 중 문제를 새로 진단해야 하면 먼저 기존 문서를 검색한다.

```text
check-troubleshooting
```

기존 문서로 설명되면 그 절차를 따른다.

새 장애군이거나 재발 가능성이 있으면 `update-troubleshooting`으로 문서화한다.

단, 구조 변경 작업 중에도 비범위를 침범하지 않는다.

### 8. 검증

적용 후 `evaluate-implementation`을 사용한다.

일반 검증:

- 최신 status와 task의 의도와 맞는가
- `web/`와 `ai/` 경계를 불필요하게 침범하지 않았는가
- 관련 문서와 코드가 서로 어긋나지 않는가
- 절대경로 링크나 오래된 경로가 남아 있지 않은가

최소 실행 검증:

- `web/` 코드 변경이면 `pnpm check-all` 실행 여부를 확인하고, 생략 시 이유를 task나 최종 기록에 남긴다
- `ai/` 코드 변경이면 `uv run make lint` 실행 여부를 확인하고, 생략 시 이유를 task나 최종 기록에 남긴다
- `web/`와 `ai/`를 함께 바꾸면 두 검증 기준을 모두 확인한다
- 문서만 수정했다면 코드 검증 생략 가능 여부를 명시한다

### 9. 문서 승격

변경 결과가 반복 가능한 절차면 `runbooks/`로,
재발 가능한 장애 대응이면 `troubleshooting/`로,
상위 작업 기준이나 배경 설명이면 `reference/`로 올린다.
