# Operational Notes

확인 시점: `2026-04-23 KST`  
대상 환경: `deep-quest` 루트 애플리케이션 작업 메모

## 목적

정식 runbook이나 troubleshooting으로 승격되기 전, 루트 애플리케이션 작업에서 반복해서 떠올릴 만한 메모를 모은다.

## 현재 메모

- 루트 `docs(haru2)`는 `web/`, `ai/`, `infra/`를 설명하는 상세 설계서가 아니라 상위 작업 조정 문서 계층이다
- 실제 구현 사실은 루트 문서보다 `web/`, `ai/` 코드와 관련 하위 문서를 우선 확인해야 한다
- 같은 작업이 `web/`와 `ai/`를 함께 건드리면 root task에서 공통 작업 축을 먼저 정리하고, 세부 구현은 각 영역 코드와 하위 문서에서 확인한다
- 인프라 상태나 운영 절차를 루트 문서에 다시 옮기기보다 `infra/docs/`를 링크하는 편이 drift를 줄인다
- 일반 애플리케이션 구현과 구조 변경을 같은 task 안에서 섞지 않는 편이 다음날 status 승격에 유리하다
- 문서 자체도 구현 자산으로 보고, canonical 경로와 source-of-truth 문서를 먼저 고정해야 이후 drift를 줄일 수 있다

## 원본 메모 축

- `repo-workflow-parity.md`
- `application-dev-vs-prod.md`
