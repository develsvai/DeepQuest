---
name: update-infrastructure
description: 현재 검증된 인프라 구조와 실행 경계를 기준으로 infra/docs/infrastructure.md를 동기화한다.
---

# 구조 문서 갱신

## 목표

`infra/docs/infrastructure.md`를 실제 인프라 구조와 일치시킨다.

## 작업 순서

1. `infra/docs/status/README.md`와 가장 최신 `status-YYYY-MM-DD.md`를 읽는다
2. `infra/docs/infrastructure.md`를 읽는다
3. 변경 영향을 받은 인프라 영역을 확인한다
4. 바뀐 부분만 갱신한다

## 규칙

- 실제 구조만 반영한다
- 추측을 피한다
- 경계를 분명하게 유지한다
