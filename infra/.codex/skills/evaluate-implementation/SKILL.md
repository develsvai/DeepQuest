---
name: evaluate-implementation
description: 인프라 변경 사항을 최신 status/task, 관련 reference 설계 문서, 최신 infra_state, docs/infrastructure.md의 작업 경계에 맞춰 검증한다.
---

# 구현 평가

## 목표

인프라 구현이 현재 의도, 설계 문서, 실측 상태, 저장소 작업 경계에 맞는지 평가한다.

## 작업 순서

1. 아래 기준 문서를 읽는다:
   - 최신 `docs/status/status-YYYY-MM-DD.md`
   - 최신 `docs/tasks/task-YYYY-MM-DD.md`
   - 관련 `docs/reference/*design*.md` 또는 구조 설계 문서
   - 최신 `docs/infra_state/YYYY-MM-DD-live.md`
   - `docs/infrastructure.md`
2. 변경 diff와 live 관측이 있으면 함께 비교한다
3. 아래를 점검한다:
   - 정확성
   - 범위 정합성
   - 설계 문서의 목표 구조와 일치 여부
   - 비범위 침범 여부
   - live 상태와 문서 상태의 drift
   - 의도하지 않은 외부 노출, Secret/RBAC 영향, 배포 경로 영향
   - 불필요한 복잡성
4. 아래 형식으로 반환한다:
   - `OK` 또는 `NOT OK`
   - 이슈 목록
   - 잔여 위험
   - 수정 제안

## 규칙

- 엄격하게 판단한다
- 검증된 관찰을 우선한다
- 경계 밖으로 번지는 변경은 명확히 지적한다
- 설계 문서가 없는데 구조 변경이 진행됐다면 설계 누락을 이슈로 지적한다
- `docs/infrastructure.md`는 canonical architecture가 아니라 작업 경계 문서로 본다
- 새로 작성되거나 수정된 문서의 Markdown 링크 대상이 작성 파일 기준 상대경로인지 확인한다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로 링크가 남아 있으면 이슈로 지적한다
