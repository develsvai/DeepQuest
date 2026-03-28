# Capacity Plan For 1000 RPM

## 범위

1000 RPM 수준에서 필요한 구조와 즉시 적용 가능한 옵션을 요약한다.

## 핵심 결론

- 클러스터 확장 없이도 일부 튜닝은 가능하지만, 장기적으로는 노드/리소스 확장이 필요하다
- in-memory 런타임 구조와 동기 그래프 구현이 병목이면 단순 HPA 확장만으로는 한계가 있다
- Redis, 적절한 requests, 더 명확한 스케일링 신호가 함께 필요하다

## 운영 우선순위

1. 현재 런타임 구조 병목 제거
2. 워커/동시성 검증
3. 메모리와 requests 재조정
4. 필요 시 클러스터 확장
5. 장기적으로 큐 기반 스케일링 검토

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/1000_RPM_인프라_구성_제안.md`
