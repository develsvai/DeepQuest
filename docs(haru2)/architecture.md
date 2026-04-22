# 아키텍처

## 목적
이 문서는 저장소 루트에서 수행하는 애플리케이션 중심 Codex 작업의 활성 실행 경계를 정의한다.

이 문서는 전체 제품의 모든 세부 설계를 담는 canonical architecture 문서가 아니다. 실제 구현 사실은 `web/`, `ai/` 코드와 관련 하위 문서, 현재 작업 우선순위는 최신 `status/`, 실제 진행은 최신 `tasks/`를 우선한다.

## 저장소 구조

- `web/`: Next.js 애플리케이션, API 계층, Prisma, 프론트엔드 및 백엔드 제품 코드
- `ai/`: Python LangGraph 서비스와 AI 처리 그래프
- `infra/`: 자체 운영 문서를 가진 별도 인프라 작업 영역
- `evidence/`: 실험 결과, 스크린샷, 벤치마크 증거물
- `common-contents/`: 공용 콘텐츠 자산
- `lagacy/`: 루트 과거 문서 보관 위치
- `docs-lagacy/`: 기존 문서 트리 보관 위치

## 제품 맥락

- 이 저장소의 애플리케이션은 AI 기반 기술 면접 코칭 플랫폼이다
- `web/`는 사용자 인터페이스, API, 데이터 저장소 연동을 담당한다
- `ai/`는 질문 생성, 피드백 생성, 이력서/공고 파싱 등 AI 처리 흐름을 담당한다
- 루트 플로우는 `web/`와 `ai/`를 함께 조율하는 상위 문서 계층이다

## 활성 운영 문서 계층

- `AGENTS.md`: Codex 실행 규칙
- `docs(haru2)/status/`: 날짜별 상태 기록
- `docs(haru2)/architecture.md`: 작업 경계와 제약
- `docs(haru2)/tasks/`: 날짜별 작업 계획
- `docs(haru2)/runbooks/`: 반복 실행 절차
- `docs(haru2)/troubleshooting/`: 재사용 가능한 운영 이슈 지식
- `docs(haru2)/reference/`: 배경 설명, workflow 기준, source of truth
- `.codex/skills/`: 애플리케이션 작업용 재사용 워크플로

## 인프라 경계

- `infra/`는 별도 저장소처럼 취급한다
- 인프라 작업은 반드시 `infra/AGENTS.md`를 따른다
- 루트 애플리케이션 워크플로를 인프라 변경의 기준 문서로 사용하지 않는다

## 운영 제약

- `lagacy/`와 `docs-lagacy/`를 활성 기준 문서로 취급하지 않는다
- 애플리케이션 영역과 `infra/`의 경계를 유지한다
- 과거 문서를 다시 쓰기보다 활성 루트 문서를 갱신한다
- 작업이 `infra/`에 속하면 인프라 운영 상태를 루트 문서에 기록하지 않는다
- `web/`와 `ai/`는 서로 다른 실행 문맥을 갖기 때문에, 변경 시 해당 디렉터리의 실제 규칙과 구조를 함께 확인한다

## 의사결정 경계

요청이 여러 영역을 함께 건드리는 리팩터링이라면, 작업 전에 범위를 다시 확인한다.

## 관련 기준 문서

- 현재 의도와 우선순위: `status/`
- 실제 작업 진행: `tasks/`
- 작업 workflow 기준: `reference/application-workflow-from-idea-to-operation.md`
- source of truth 기준: `reference/application-source-of-truth.md`
- 운영 메모: `reference/operational-notes.md`
- 반복 절차: `runbooks/`
- 재발 가능한 장애 대응: `troubleshooting/`
