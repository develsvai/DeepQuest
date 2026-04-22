---
name: sync-repo-workflows
description: `deep-quest`, `deep-quest/infra`, `INFRA-MANIFEST`의 공통 workflow 문서와 skills를 비교하고, 같아야 하는 축을 동기화할 때 사용한다.
---

# 저장소 워크플로 동기화

## 목표

세 저장소의 workflow 문서와 skill 구성을 비교해 공통 축은 맞추고, 의도적으로 다른 축은 보존한다.
특히 `deep-quest/infra`와 `INFRA-MANIFEST`에서 새 skill이나 workflow가 추가되면, 관련 `AGENTS.md`, 문서 허브, 공통 skill 정의까지 함께 맞춘다.

이 skill은 일반 인프라 운영, 장애 대응, 배포 검증에는 사용하지 않는다. 여러 저장소의 workflow 규칙 자체를 맞추라는 요청이 있거나, skill/AGENTS/docs workflow를 repo 간 동기화해야 할 때만 사용한다.

## 대상 저장소

- `deep-quest`
- `deep-quest/infra`
- `INFRA-MANIFEST`

## 작업 순서

1. 먼저 현재 저장소의 parity 메모 또는 기준 문서를 읽는다
2. 아래 whitelist 경로만 비교 대상으로 삼는다
   - `AGENTS.md`
   - `docs/README.md`
   - `docs/reference/document-writing-rules.md`
   - `docs/troubleshooting/README.md`
   - `docs/runbooks/README.md`
   - `.codex/skills/` 아래 공통 workflow skill
3. 아래를 구분한다
   - 반드시 같아야 하는 공통 workflow 축
   - 저장소 성격 때문에 의도적으로 달라야 하는 축
4. 먼저 차이 목록을 정리하고, 그 다음 공통 축만 선택적으로 동기화한다
5. 외부 저장소를 수정할 때는 저장소별 git 상태를 먼저 확인하고, 변경 범위를 분리한다
6. 동기화 후에는 저장소별로 무엇이 같아졌고 무엇을 의도적으로 남겼는지 요약한다

## 규칙

- 루트 앱 레포에 인프라 전용 skill을 억지로 복제하지 않는다
- 단일 저장소 내부 문서 정리나 일반 운영 작업에는 이 skill을 사용하지 않는다
- `deep-quest/infra`와 `INFRA-MANIFEST`는 가능한 한 높은 parity를 유지한다
- 전체 디렉터리 단위 `diff -rq`를 기본 전략으로 쓰지 않는다
- whitelist에 없는 경로는 자동 동기화 대상으로 보지 않는다
- `docs/status/**`, `docs/tasks/**`, 개별 `docs/runbooks/*.md`, 개별 `docs/troubleshooting/*.md`, `docs/infra_state/**`는 비교만 하더라도 기본적으로 동기화 대상에서 제외한다
- 저장소 고유 운영 기록, 실측 상태, 장애 사례 본문은 공통 workflow 문서와 분리해서 취급한다
- 문서 구조를 맞출 때는 skill만 바꾸지 말고 `AGENTS.md`, 문서 허브, README 연결까지 함께 본다
- 새 skill을 여러 저장소에 추가할 때는 이름, 목적, 출력 형식, 선확인 문서를 함께 맞춘다
- 저장소마다 이미 사용 중인 경로 차이가 있으면 경로만 다르게 두고 의도와 구조는 맞춘다
- Markdown 링크 대상은 각 저장소의 해당 문서 위치 기준 상대경로로 맞춘다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로 링크를 동기화 결과에 남기지 않는다
- 동기화 결과는 커밋도 저장소별로 분리하는 것을 기본으로 한다
