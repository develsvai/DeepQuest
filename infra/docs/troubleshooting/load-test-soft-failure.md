# Load Test Soft Failure

## 발생 조건

- Locust 또는 대량 동시 요청 테스트에서 “성공률은 높은데 실제 처리량이 맞지 않을 때”

## 증상

- Locust는 대부분 성공으로 집계
- 평균 응답 시간이 10~15ms처럼 비정상적으로 짧음
- 실제 AI 처리된 run 수는 극히 적음
- 모니터링에서는 504가 보이는데 AI 로그에는 대응 오류가 적음
- backlog 관측 실험인데도 Locust 결과만 보면 성공처럼 보임
- 재배포 직후 실험 결과가 throughput 병목처럼 보이지만 실제로는 파드 초기화 지연이 섞여 있음

## 판단 과정

- Locust 성공 수와 실제 run_id 수를 비교
- ingress 오류 시점과 AI 파드 로그를 비교
- LangGraph API가 즉시 200을 반환하는 비동기 흐름인지 확인
- 부하 테스트 시나리오가 동기 처리 API 가정인지, enqueue 중심 비동기 구조 기준인지 먼저 구분한다
- 재실험 전 `PodInitializing`, 이미지 pull, readiness 지연이 남아 있는지 확인한다
- queue를 비운 baseline 상태와 재배포 직후 불안정 상태를 구분해서 본다

## 근본 원인

- HTTP 성공과 실제 백그라운드 처리 성공을 같은 것으로 집계
- LangGraph 런타임 구조, 큐, 라우팅, ingress 구간이 합쳐져 “soft failure”로 보임
- 기존 Locust 시나리오가 동기 처리 기준 실패 판정을 사용해 비동기 queue 구조와 맞지 않았다
- 재배포 직후에는 성능 문제가 아니라 init container, 이미지 pull, readiness 지연이 실험 결과를 오염시킬 수 있다

## 해결 방법

- 부하 테스트 결과를 run 생성/완료 수와 함께 해석
- Web, ingress, AI 각 레이어에 명시적 추적 로그를 추가
- soft failure는 단순 HTTP 200 비율로 판정하지 않는다
- Locust는 enqueue 중심 시나리오로 바꾸고, 상태코드나 명시적 에러만 실패로 본다
- 재배포 직후 상태가 섞인 실험은 버리고, 파드 안정화와 queue 초기화 후 baseline에서 다시 측정한다

## 확인 방법

```bash
kubectl logs -n deep-quest deploy/ai-server --tail=200
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

## 검색 키워드

- soft failure
- locust fake success
- 10ms response but no processing
- ingress 504 ai no log
- enqueue scenario
- podinitializing benchmark contamination
- redeploy after load test baseline

## 원본 문서

- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/Soft_Failure_트러블슈팅.md`

## 원본 판단 로그

- backlog 관측은 되는데 실험 의도가 잘못된 Locust 시나리오
- KEDA 실험 중 결과가 이상하게 보였던 재배포 직후 상태
