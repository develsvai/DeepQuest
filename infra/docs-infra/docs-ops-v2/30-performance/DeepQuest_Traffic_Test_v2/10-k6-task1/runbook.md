# Task1 (K6 RPS) Runbook

## 목적
- Web/Ingress/HPA 조합에서 RPS 한계와 실패 패턴을 파악

## 테스트 자산
- 스크립트: `../raw/K6_RPS_TEST_TASK_1/load_test.js`
- 공통 문서: `../raw/K6_RPS_TEST_TASK_1/Task1_공통_문서.md`
- 사전점검: `../raw/K6_RPS_TEST_TASK_1/Task1-1_사전점검_결과.md`

## 시나리오
1. HPA 미적용 baseline
2. HPA 적용 후 1000 VU
3. HPA 적용 후 3000 VU
4. Funnel/internal-domain 비교

## 실행 전 체크
```bash
kubectl get pods -n deep-quest
kubectl get hpa -n deep-quest
kubectl top pods -n deep-quest
```

## 결과 해석 포인트
- 실패율 증가 구간에서 ingress timeout/connection reset 동반 여부
- web-server scale-up 타이밍과 요청 증가 램프의 시차
- pod당 메모리 사용량이 request/limit 근처인지 여부

## 주요 증적 위치
- HPA 미적용: `../raw/K6_RPS_TEST_TASK_1/HPA_미적용/`
- HPA 적용 1000vu: `../raw/K6_RPS_TEST_TASK_1/HPA_적용_후/1000vu_test/`
- HPA 적용 3000vu: `../raw/K6_RPS_TEST_TASK_1/HPA_적용_후/3000vu_test/`
- funnel/internal: `../raw/K6_RPS_TEST_TASK_1/HPA_적용_후/funnel_test/`, `../raw/K6_RPS_TEST_TASK_1/HPA_적용_후/internal_domain_test/`

## 다음 액션
1. 같은 부하 램프로 현재 배포태그(`141-65141ab`) 재측정
2. ingress timeout/keepalive 파라미터 A/B 테스트
3. web HPA scaleUp policy와 minReplicas=4 정책의 효율 비교
