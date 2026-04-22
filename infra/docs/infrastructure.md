# 인프라 작업 경계

## 목적
이 문서는 `deep-quest/infra` 저장소 내부 인프라 작업의 활성 실행 경계를 정의한다.

이 문서는 전체 인프라의 canonical architecture 문서가 아니다. 실제 현재 구조와 실행 상태는 최신 `docs/infra_state/` 스냅샷, 작업 우선순위는 최신 `docs/status/`, 작업 진행은 최신 `docs/tasks/`를 우선한다.

## 작업 영역

- `docker/`: 로컬 및 컨테이너 기반 서비스 오케스트레이션 자산
- `k8s/`: Kubernetes 매니페스트, 오버레이, 모니터링, 배포 스크립트
- `docs/runbooks/`: 반복 실행 절차
- `docs/reference/`: 비교표, 배경 설명, 운영 메모
- `docs/performance/`: 부하 테스트 요약과 도구
- `docs/docs-infra/`: 기존 원본 문서 아카이브
- `docs/troubleshooting/`: 활성 인프라 이슈 지식
- `docs/infra_state/`: 검증된 현재 상태 스냅샷
- `.codex/skills/`: 인프라 전용 워크플로

## 운영 제약

- `infra/`를 일상적인 인프라 작업의 저장소 경계처럼 취급한다
- 설명성 문서보다 매니페스트, 스크립트, 측정된 증거를 우선한다
- 루트 애플리케이션 문서를 인프라 실행 기준 문서로 사용하지 않는다
- 인프라 상태와 인프라 트러블슈팅은 `infra/` 내부에서 관리한다

## 의사결정 경계

인프라 작업이 애플리케이션 코드 변경까지 요구한다면, 진행 전에 교차 경계를 분명히 알린다.

## 관련 기준 문서

- 현재 실측 상태: `docs/infra_state/`
- 현재 의도와 우선순위: `docs/status/`
- 실제 작업 진행: `docs/tasks/`
- 작업 workflow 기준: `docs/reference/infra-workflow-from-idea-to-operation.md`
- 배포 source of truth 기준: `docs/reference/deployment-source-of-truth.md`
- 반복 절차: `docs/runbooks/`
- 재발 가능한 장애 대응: `docs/troubleshooting/`
