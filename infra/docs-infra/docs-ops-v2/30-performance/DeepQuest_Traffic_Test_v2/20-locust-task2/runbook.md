# Task2 (Locust + LangGraph/Redis) Runbook

## 목적
- AI 동시요청 병목을 LangGraph production + Redis 기준으로 검증

## 테스트 자산
- 실행 가이드: `../raw/LOCUST_TEST_TASK_2/Locust_실행_가이드.md`
- 공통 문서: `../raw/LOCUST_TEST_TASK_2/Task2_공통_문서.md`
- 최신 상태: `../raw/LOCUST_TEST_TASK_2/현황_정리.md`
- 단계 검증: `../raw/LOCUST_TEST_TASK_2/단계별_실행_가이드_검증.md`
- 시나리오 코드: `../raw/LOCUST_TEST_TASK_2/locustfile.py`

## 현재 결론(요약)
1. `langgraph build` 전환 + Redis 적용은 완료
2. AI 파드당 워커 수 증가는 적용되었으나, 실효 동시성은 노드 구현 모델(sync/async)에 영향
3. soft failure/timeout은 외부 API 한도 + ingress/업스트림 타임아웃 + 스케일링 시차 복합 이슈 가능

## 실행 체크리스트
```bash
kubectl get deploy -n deep-quest ai-server web-server -o wide
kubectl get hpa -n deep-quest
kubectl top pods -n deep-quest
kubectl logs -n deep-quest deploy/ai-server --tail=200
```

## 결과 해석 기준
- 처리량: 총 요청 대비 성공 요청 비율
- 지연: p95/p99 latency
- 안정성: 5xx, timeout, retry 패턴
- 스케일: AI/web replicas 변화 시점과 latency 변화의 상관

## 다음 액션
1. Locust 재실행 후 `p95 + 실패율 + AI replicas` 3지표를 한 번에 기록
2. AI 노드 동기/비동기 실행모델 검증 결과를 별도 문서로 분리
3. KEDA 도입 여부를 CPU/메모리 HPA 한계 근거로 결정
