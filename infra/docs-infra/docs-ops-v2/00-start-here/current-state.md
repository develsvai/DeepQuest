# Current State (Live Cluster)

- Captured at: 2026-02-20 09:32 KST
- Context: `kubernetes-admin@kubernetes`
- Namespace: `deep-quest`

## 서비스 상태 요약


| Component  | Live State                                          |
| ---------- | --------------------------------------------------- |
| Web        | 4/4 running (`web-server`, image `web:141-65141ab`) |
| AI         | 1/1 running (`ai-server`, image `ai:141-65141ab`)   |
| PostgreSQL | StatefulSet 1/1 (`postgres-0`)                      |
| Redis      | Deployment 1/1                                      |
| Ingress    | `deepquest.192.168.0.110.nip.io` (TLS enabled)      |
| Backup     | `postgres-backup` cronjob 정상 완료 이력 존재               |


## 오토스케일


| HPA            | Min | Max | Current | Metric Target       |
| -------------- | --- | --- | ------- | ------------------- |
| ai-server-hpa  | 1   | 10  | 1       | CPU 35%, Memory 80% |
| web-server-hpa | 4   | 10  | 4       | CPU 70%, Memory 80% |


## 실측 리소스 사용량 (kubectl top)

- AI: `3m CPU`, `252Mi`
- Web (pod당): 대략 `1~3m CPU`, `130~145Mi`
- Redis: `5m CPU`, `4Mi`
- Postgres: `2m CPU`, `81Mi`

## 네트워크/세션 어피니티

- Ingress: nginx cookie affinity enabled (`INGRESSCOOKIE`)
- AI Service: `ClientIP` session affinity (timeout 10800s)

## 현재 운영 해석

1. 클러스터는 안정 상태(워크로드 전부 Running, 백업 cron 정상).
2. Web은 `minReplicas=4`가 하한으로 고정되어 유휴 시간에도 4개 유지.
3. AI는 현재 부하가 낮아 1개로 유지되며, 필요 시 HPA로 10개까지 확장 가능.

## 즉시 확인 포인트

1. AI 동시성 전략(`N_JOBS_PER_WORKER=40` + 그래프 동기/비동기)과 실제 처리량 검증
2. Web 최소 4 replica 정책의 비용 대비 효과 재검토
3. 주기적(일 1회) 스냅샷으로 문서와 실상태 드리프트 점검

