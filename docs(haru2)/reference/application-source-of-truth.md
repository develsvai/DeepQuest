# Application Source Of Truth

확인 시점: `2026-04-23 KST`  
대상 환경: `deep-quest` 루트 애플리케이션 작업, `web/`, `ai/`, `docs(haru2)/`

## 목적

루트 애플리케이션 작업에서 무엇을 기준 상태로 볼지 헷갈리지 않도록, 문서와 코드의 우선순위를 정의한다.

루트 `docs(haru2)/`는 작업 의도와 상위 경계를 조율하는 문서 계층이다.
실제 구현 사실은 `web/`, `ai/` 코드와 관련 하위 문서를 우선한다.

## 기준 흐름

```text
요청
-> 최신 status
-> 최신 task
-> 관련 코드와 하위 문서
-> 검증 결과
-> 루트 문서 승격
```

## Source Of Truth

| 항목 | 기준 | 확인 방법 |
| --- | --- | --- |
| 현재 작업 의도 | 최신 `docs(haru2)/status/status-YYYY-MM-DD.md` | `의도`, `다음 작업` 확인 |
| 현재 작업 진행 | 최신 `docs(haru2)/tasks/task-YYYY-MM-DD.md` | `진행`, `보류 / 다음 액션` 확인 |
| 루트 작업 경계 | `docs(haru2)/architecture.md` | `web/`, `ai/`, `infra/` 경계 확인 |
| 웹 구현 사실 | `web/` 코드와 필요한 `web/docs/` | route, schema, server code, 하위 문서 확인 |
| AI 구현 사실 | `ai/` 코드와 필요한 `ai/docs/` | graph, parser, runtime, tests, 하위 문서 확인 |
| 환경 차이 | `application-dev-vs-prod.md`와 실제 env/config 경로 | build/runtime 차이 확인 |
| 재발 장애 대응 | `docs(haru2)/troubleshooting/` | 기존 사례 먼저 검색 |
| 반복 절차 | `docs(haru2)/runbooks/` | 재현 가능한 절차 여부 확인 |
| 배경 설명과 작업 메모 | `docs(haru2)/reference/` | source of truth, workflow 기준, 메모 확인 |

## 문서 충돌 시 우선순위

1. 실제 코드, 설정, 검증된 실행 결과
2. 최신 `docs(haru2)/status/`
3. 최신 `docs(haru2)/tasks/`
4. `docs(haru2)/architecture.md`
5. 관련 `web/docs/`, `ai/docs/`
6. `docs(haru2)/reference/`, `runbooks/`, `troubleshooting/`
7. 루트 `README.md`와 legacy 문서

## 해석 원칙

- `status`는 현재 의도와 우선순위의 기준이다
- `task`는 실제 진행과 중단 지점의 기준이다
- `architecture.md`는 세부 설계서가 아니라 루트 작업 경계 문서다
- `reference/`는 배경 설명, source of truth, workflow 기준을 담는다
- 실제 구현 동작을 판단할 때는 루트 문서보다 `web/`, `ai/` 코드를 우선한다
- 하위 구현 문서가 필요할 때는 루트 `reference/`보다 관련 `web/docs/`, `ai/docs/`를 먼저 본다
- `web/docs/`, `ai/docs/`와 루트 `reference/`가 충돌하면, 실제 코드와 더 가까운 하위 문서를 우선하고 루트 문서를 후속 정리 대상으로 본다
- `infra/` 관련 사실은 루트 문서가 아니라 `infra/docs/`를 우선한다

## 자주 틀리는 포인트

- 루트 문서에 적혀 있다고 해서 구현 사실까지 확정되는 것은 아니다
- `web/`와 `ai/`의 상세 설계는 루트 `architecture.md`가 아니라 해당 코드와 하위 문서를 우선한다
- 루트에서 인프라 상태를 설명하기 시작하면 `infra/`와 책임이 섞인다
- 같은 변경을 `status`, `task`, `reference`에 중복으로 길게 복제하면 drift가 생기기 쉽다

## 관련 문서

- [Application Workflow From Idea To Operation](./application-workflow-from-idea-to-operation.md)
- [Application Dev Vs Prod](./application-dev-vs-prod.md)
- [Operational Notes](./operational-notes.md)
