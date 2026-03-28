# Infra Document Writing Rules

## 목적

인프라 문서를 갱신할 때 형식과 사실 기준을 통일한다.

## 규칙

- 상단에 확인 시점과 대상 환경을 명시한다
- 추정보다 매니페스트, 스크립트, 관측 결과를 우선한다
- 실행 절차와 배경 설명을 섞지 않는다
- 트러블슈팅은 재발 가능성이 있고 진단 가치가 있을 때만 분리한다
- 링크, 파일 경로, 명령은 실제 경로 기준으로 유지한다

## 문서 유형별 분리

- 반복 절차: `docs/runbooks/`
- 비교표/배경 문서: `docs/reference/`
- 장애 문서: `docs/troubleshooting/`
- 상태 스냅샷: `docs/infra_state/`
- 과거 원본: `docs/docs-infra/legacy/`

## 원본 문서

- `docs/docs-infra/legacy/문서_작성_룰.md`
