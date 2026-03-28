# K6 Day1 Summary

## 범위

K6 기반 관측 준비, Grafana 대시보드, HPA 적용 전후 거동 확인을 요약한다.

## 남겨야 하는 결론

- Prometheus / Grafana / ingress-nginx metrics 준비 여부가 부하 테스트 품질을 좌우한다
- Web/AI 파드, 노드 메트릭, ingress RPS/latency 패널이 모두 보여야 Day1 결과를 신뢰할 수 있다
- HPA 미적용 breaking point와 HPA 적용 후 결과는 분리해서 봐야 한다

## 운영 관점 핵심

- 테스트 전에 모니터링 수집 상태를 먼저 검증한다
- HPA max, min, scaleUp 정책과 실제 pod 증가를 함께 기록한다
- 부하 수치만이 아니라 ingress 503/504와 backend endpoint 상태를 같이 본다

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/K6_RPS_TEST_TASK_1/Task1_공통_문서.md`
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/K6_RPS_TEST_TASK_1/Task1-1_사전점검_결과.md`
