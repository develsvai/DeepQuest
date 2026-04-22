---
name: update-infrastructure
description: deep-quest/infra의 작업 경계, 관리 대상, 기준 문서 링크가 바뀌었을 때 docs/infrastructure.md를 최소 갱신한다.
---

# 구조 문서 갱신

## 목표

`docs/infrastructure.md`를 저장소 작업 경계와 기준 문서 링크에 맞게 갱신한다.

이 저장소에서는 `docs/infrastructure.md`를 canonical architecture 문서로 키우지 않는다. 실제 구조 개요는 `docs/reference/`, 검증된 live 상태는 `docs/infra_state/`, 작업 의도는 `docs/status/`를 우선한다.

## 작업 순서

1. `docs/status/README.md`와 가장 최신 `status-YYYY-MM-DD.md`를 읽는다
2. `docs/infrastructure.md`를 읽는다
3. 변경이 작업 경계, 관리 대상 디렉터리, 기준 문서 링크, 의사결정 경계를 바꾸는지 확인한다
4. 실제 구조 설명이 필요하면 `docs/reference/` 설계/개요 문서에 둘지 먼저 판단한다
5. `docs/infrastructure.md`에는 바뀐 경계와 링크만 최소 갱신한다

## 규칙

- 실제 구조 상세를 길게 반영하지 않는다
- 추측을 피한다
- 경계를 분명하게 유지한다
- `docs/infrastructure.md`에 링크를 남길 때는 해당 파일 위치 기준 상대경로로 쓴다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로를 링크 대상으로 쓰지 않는다
- live 상태는 `docs/infra_state/`에 기록한다
- 의도적인 목표 구조는 `docs/reference/` 설계 문서에 기록한다
