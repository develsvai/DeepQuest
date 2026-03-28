# 수집 스크립트

`infra/` 작업 영역의 인프라 상태 수집 스크립트는 이곳에 둔다.

가이드:

- 재현 가능한 스크립트를 우선한다
- 설계 설명이 아니라 상태 수집에 집중한다
- `docs/infra_state/`를 채울 수 있는 출력물을 만든다

주요 스크립트:

- `collect-live-state.sh`
  - 클러스터 노드, namespace 워크로드, 예약 작업, 필요 시 `station` 호스트 상태까지 한 번에 수집한다
  - 기본 namespace는 `deep-quest`다
  - 예시: `infra/scripts/collect/collect-live-state.sh`
  - 예시: `INCLUDE_STATION=0 infra/scripts/collect/collect-live-state.sh deep-quest`
