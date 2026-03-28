# 아키텍처

## 목적

이 문서는 저장소 루트에서 수행하는 애플리케이션 중심 Codex 작업의 활성 실행 경계를 정의한다.

## 저장소 구조

- `web/`: 프론트엔드, API, 데이터 저장소 연동
- `ai/`: AI 처리 로직과 그래프
- `infra/`: 별도 인프라 작업 영역
- `docs/`: 활성 운영 문서 계층
- `lagacy/`, `docs-lagacy/`: 과거 문서 보관 위치

## 활성 운영 문서 계층

- `AGENTS.md`: 실행 규칙
- `docs/status/`: 날짜별 상태 기록
- `docs/architecture.md`: 작업 경계와 제약
- `docs/tasks/`: 날짜별 작업 계획
- `docs/troubleshooting/`: 재사용 가능한 문제 해결 문서
- `docs/reference/`: 배경 설명과 비교표
- `.codex/skills/`: 재사용 워크플로

## 운영 제약

- `infra/` 작업은 루트 문서 기준으로 처리하지 않는다
- 과거 문서를 활성 기준 문서로 취급하지 않는다
- 작업이 여러 영역을 함께 건드리면 범위를 다시 분명히 한다
