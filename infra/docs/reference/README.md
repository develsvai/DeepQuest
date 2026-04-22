# Infra Reference

실행 절차는 아니지만 인프라 작업에서 자주 참조하는 비교표, 규칙, 배경 설명, 의도적인 구조 변경 설계를 이 디렉터리에 둔다.

이 디렉터리의 문서는 `document-writing-rules.md`를 기준으로 유지한다.

## 문서 목록

- `infra-dev-vs-prod.md`
- `document-writing-rules.md`
- `operational-notes.md`
- `infra-workflow-from-idea-to-operation.md`
- `deployment-source-of-truth.md`
- `prod-cluster-structure-and-review-questions.md`

## 사용 원칙

- 절차가 되기 시작하면 `../runbooks/`로 보낸다
- 장애 재현/해결 기록이면 `../troubleshooting/`로 보낸다
- 현재 상태를 찍는 문서는 `../infra_state/`로 보낸다
- 목표 구조, 변경 범위, 비범위, 검증 기준을 다루는 설계 문서는 이 디렉터리에 둔다
