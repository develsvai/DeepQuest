# Infra Document Writing Rules

## 목적

인프라 문서를 갱신할 때 형식과 사실 기준을 통일한다.

## 규칙

- 상단에 확인 시점과 대상 환경을 명시한다
- 추정보다 매니페스트, 스크립트, 관측 결과를 우선한다
- 실행 절차와 배경 설명을 섞지 않는다
- 트러블슈팅은 재발 가능성이 있고 진단 가치가 있을 때만 분리한다
- Markdown 링크 대상은 문서가 있는 위치를 기준으로 한 상대경로로 쓴다
- 같은 디렉터리 문서는 `file.md`, 다른 docs 하위 디렉터리는 `../runbooks/file.md`처럼 쓰고, 레포 루트 자산은 필요한 만큼 `../../k8s/file.yaml`처럼 올라간다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로를 Markdown 링크 대상으로 쓰지 않는다
- 명령과 설명 속 파일 경로는 실행 위치가 명확해야 하며, 레포 내부 파일은 가능하면 레포 기준 상대경로로 적는다
- 새 문서는 하나의 주제, 하나의 반복 절차, 하나의 장애군을 기준으로 작게 만든다
- 이미 큰 문서에 새 내용을 붙일 때는 같은 원인/증상/절차인지 먼저 확인한다
- 서로 다른 운영 영역이나 다른 장애 원인이 섞이면 기존 문서에 계속 append하지 말고 별도 문서로 분리한다
- 원본 로그나 긴 추적 기록은 본문에 그대로 보존하지 말고, 필요한 사실만 요약한다

## 문서 유형별 분리

- 반복 절차: `docs/runbooks/`
- 비교표/배경 문서: `docs/reference/`
- 의도적인 구조 변경 설계: `docs/reference/`
- 장애 문서: `docs/troubleshooting/`
- 상태 스냅샷: `docs/infra_state/`
- 과거 원본: `docs/docs-infra/legacy/`

설계 문서는 현재 구조와 목표 구조를 분리해서 쓰고, 실제 적용 뒤 검증된 상태는 `docs/infra_state/`와 `docs/tasks/`에 남긴다.

## 충돌 판단 기준

문서 내용이 서로 충돌하면 아래 순서를 우선한다.

1. 실제 명령 결과와 라이브 관측
2. 최신 `docs/infra_state/`
3. 최신 `docs/status/`
4. 최신 `docs/tasks/`
5. `docs/infrastructure.md`
6. `docs/runbooks/`, `docs/troubleshooting/`, `docs/reference/`
7. 루트 `README.md`와 legacy 문서

`docs/infra_state/`에는 관측 사실만 남기고, 원인 해석이나 다음 후보는 `docs/tasks/` 또는 `docs/troubleshooting/`에 둔다.

## 원본 문서

- `docs/docs-infra/legacy/문서_작성_룰.md`
