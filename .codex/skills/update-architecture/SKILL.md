---
name: update-architecture
description: 의미 있는 변경 뒤에, 검증된 저장소 구조와 실행 경계를 기준으로 활성 루트 docs/architecture.md를 동기화한다.
---

# 구조 문서 갱신

## 목표

루트 `docs/architecture.md`를 저장소의 실제 활성 구조와 일치시킨다.

## 작업 순서

1. `docs/status/README.md`와 가장 최신 `status-YYYY-MM-DD.md`를 읽는다
2. `docs/architecture.md`를 읽는다
3. 최근 변경의 영향을 받은 영역만 확인한다
4. 문서 전체를 갈아엎지 말고 변경된 부분만 갱신한다

## 규칙

- 실제 구조만 반영한다
- 추측을 추가하지 않는다
- 간결한 실행 경계를 유지한다
