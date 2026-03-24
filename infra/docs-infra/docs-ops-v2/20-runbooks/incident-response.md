# Incident Response (First 30 Minutes)

## P0 공통 절차
1. 영향도 판단 (전면 장애/부분 장애)
2. 최근 변경 확인 (배포 태그, 시크릿 변경)
3. 롤백 가능성 판단 (이전 이미지 태그)

## 빠른 진단 명령
```bash
kubectl get all -n deep-quest
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
kubectl get hpa -n deep-quest
kubectl top pods -n deep-quest
```

## 증상별 우선 점검

### 1) 5xx/타임아웃 증가
- `web-ingress` annotation(affinity/timeout) 확인
- `web-server` Pod 수가 HPA min 이하로 떨어지지 않았는지 확인
- `ai-server`가 1 pod에서 병목인지 확인

### 2) AI 응답 지연/실패
- ai 로그에서 Redis/Postgres 연결 오류 확인
- `redis-service`, `postgres-service` endpoint 정상 확인
- 필요 시 AI 수동 스케일 아웃:
```bash
kubectl scale deploy/ai-server -n deep-quest --replicas=2
```

### 3) ImagePullBackOff/CrashLoopBackOff
- 이미지 태그 존재 여부 확인 (Harbor + deploy tag)
- 라이선스/키 이슈는 ai-secret 우선 점검

## 복구 후 필수
1. 재발방지 액션 1개 이상 기록
2. `../00-start-here/current-state.md` 영향 요약 갱신
