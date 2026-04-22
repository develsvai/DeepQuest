---
name: update-architecture
description: 루트 애플리케이션 작업 경계, 관리 대상, 기준 문서 링크가 바뀌었을 때 docs(haru2)/architecture.md를 최소 갱신한다.
---

# 구조 문서 갱신

## 목표

`docs(haru2)/architecture.md`를 저장소 작업 경계와 기준 문서 링크에 맞게 갱신한다.

이 저장소에서는 `docs(haru2)/architecture.md`를 전체 제품 상세 설계서로 키우지 않는다. 실제 세부 설계는 `docs(haru2)/reference/`, 검증된 구현 사실은 코드와 관련 하위 문서, 작업 의도는 `docs(haru2)/status/`와 `docs(haru2)/tasks/`를 우선한다.

## 작업 순서

1. `docs(haru2)/status/README.md`와 가장 최신 `status-YYYY-MM-DD.md`를 읽는다
2. `docs(haru2)/architecture.md`를 읽는다
3. 변경이 작업 경계, 관리 대상 디렉터리, 기준 문서 링크, `web/`·`ai/` 경계를 바꾸는지 확인한다
4. 실제 구조 설명이 길어질 것 같으면 `docs(haru2)/reference/`나 하위 영역 문서에 둘지 먼저 판단한다
5. `docs(haru2)/architecture.md`에는 바뀐 경계와 링크만 최소 갱신한다

## 규칙

- 실제 구조만 반영한다
- 추측을 추가하지 않는다
- 경계를 분명하게 유지한다
- `docs(haru2)/architecture.md`에 링크를 남길 때는 해당 파일 위치 기준 상대경로로 쓴다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로를 링크 대상으로 쓰지 않는다
- 코드 수준 상세 설계는 `docs(haru2)/reference/`, `web/docs/`, `ai/docs/` 등 더 적절한 위치에 둔다
