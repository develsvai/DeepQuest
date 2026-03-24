# DeepQuest Traffic Test v2

이 디렉토리는 `DeepQuest_Traffic_Test` 자료의 v2 정리본입니다.

## 구성 원칙
- 원본 증적 보존: `raw/` (원문서/로그/이미지 전체 복제)
- 실행 문서 분리: 상위 폴더의 runbook만 읽으면 재현 가능
- 현재 운영 상태 연동: 2026-02-20 실측 클러스터 상태 반영

## 빠른 시작
1. `00-start-here/current-status.md`
2. `10-k6-task1/runbook.md`
3. `20-locust-task2/runbook.md`
4. 필요 시 `raw/`에서 근거 확인

## 디렉토리
- `00-start-here`: 목표/현재 상태/우선순위
- `10-k6-task1`: Task1(K6 RPS) 실행/해석 가이드
- `20-locust-task2`: Task2(Locust + LangGraph/Redis) 실행/해석 가이드
- `99-appendix`: 공통 명령/체크리스트
- `raw`: 원본 `docs-infra/DeepQuest_Traffic_Test` 전체 복제본
