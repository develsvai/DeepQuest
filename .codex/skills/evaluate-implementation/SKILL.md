---
name: evaluate-implementation
description: 완료되었거나 제안된 구현을 루트 docs/architecture.md와 docs/status/ 아래 가장 최신 상태 파일 의도에 맞춰 검증한다. 정확성, 범위 적합성, 불필요한 복잡성을 점검할 때 사용한다.
---

# 구현 평가

## 목표

구현이 현재 의도와 아키텍처에 맞는지 평가한다.

## 작업 순서

1. 구현을 아래 기준과 비교한다:
   - `docs/architecture.md`
   - `docs/status/` 아래 가장 최신 `status-YYYY-MM-DD.md`
2. 아래를 점검한다:
   - 정확성
   - 범위 정합성
   - 불필요한 복잡성
3. 아래 형식으로 반환한다:
   - `OK` 또는 `NOT OK`
   - 이슈 목록
   - 수정 제안

## 규칙

- 엄격하게 판단한다
- 검증된 관찰을 우선한다
- 범위 확장은 명확히 지적한다
