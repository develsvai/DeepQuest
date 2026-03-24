# Current Status (Traffic Test)

- 기준 시각: 2026-02-20 09:32 KST
- 실측 컨텍스트: `kubernetes-admin@kubernetes`, namespace `deep-quest`

## 라이브 클러스터 상태
- Web: 4 replicas running (`web:141-65141ab`)
- AI: 1 replica running (`ai:141-65141ab`)
- Redis/Postgres: running
- Ingress: `deepquest.192.168.0.110.nip.io` (TLS, cookie affinity)
- HPA:
  - web min 4 / max 10
  - ai min 1 / max 10

## 과거 실험과 현재의 연결
1. Task1(K6): HPA 적용 전/후와 ingress 경유 실패 패턴 확인 완료
2. Task2(Locust): LangGraph production 전환 + Redis 적용까지 완료
3. 남은 핵심: AI 동시성 실효성(노드 sync/async)과 실패율(soft failure) 최적화

## 우선순위
1. Locust 기준 p95/실패율 재측정 (현재 배포태그 기준)
2. AI 워커/노드 실행모델 검증 (`N_JOBS_PER_WORKER` 체감효과)
3. Web minReplicas=4 정책 비용 대비 효과 검토

## 원본 문서 진입점
- Task1 공통: `../raw/K6_RPS_TEST_TASK_1/Task1_공통_문서.md`
- Task2 공통: `../raw/LOCUST_TEST_TASK_2/Task2_공통_문서.md`
- Task2 최신 현황: `../raw/LOCUST_TEST_TASK_2/현황_정리.md`
