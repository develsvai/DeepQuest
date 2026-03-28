# Locust Day2 Summary

## 범위

Locust 기반 격리/튜닝 테스트, LangGraph prod 전환, Redis 연결, 동시성 한계 분석을 요약한다.

## 남겨야 하는 결론

- `langgraph build` 기반 prod 이미지 전환은 완료된 표준이다
- Redis 연동은 완료됐지만, 큐 기반 오토스케일(KEDA)은 아직 별도 과제다
- `N_JOBS_PER_WORKER` 숫자만으로 실제 동시성이 확보되지 않는다
- 그래프 노드가 동기 구현이면 GIL과 런타임 구조 때문에 1~3개 수준만 실질 병렬 처리될 수 있다

## 운영 관점 핵심

- 부하 테스트 결과는 AI 로그, run 수, ingress 오류, 평균 응답 시간까지 함께 봐야 한다
- “CPU 낮음 = 여유 있음”으로 해석하면 오판할 수 있다
- session affinity는 in-memory thread/run 라우팅 문제를 완화하는 핵심 설정이었다

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/Task2_공통_문서.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/현황_정리.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/체크포인트1.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/단계별_실행_가이드_검증.md`
