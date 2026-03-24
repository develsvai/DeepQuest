# Platform Topology (Prod Runtime)

## 트래픽 경로
`Client -> NGINX Ingress -> web-service:80 -> web-server:3000 -> ai-service:8000 -> ai-server`

## 데이터 경로
- Web DB: `postgres-service:5432` (app DB)
- AI Queue/Broker: `redis-service:6379`
- AI Checkpoint/Run DB: `postgres-service:5432` (LangGraph DB URI via secret)
- Backup: `postgres-backup` cronjob -> PVC (`postgres-backup`)

## 워크로드 구성
- Deployments: `web-server`, `ai-server`, `redis`, `tailscale-funnel`
- StatefulSet: `postgres`
- HPA: `web-server-hpa`, `ai-server-hpa`
- Ingress: `web-ingress` (`deepquest.192.168.0.110.nip.io`)

## 런타임 스펙 (live)
- Web image: `harbor.192.168.0.110.nip.io/deep-quest/web:141-65141ab`
- AI image: `harbor.192.168.0.110.nip.io/deep-quest/ai:141-65141ab`
- Web resources: req `250m/256Mi`, limit `1/512Mi`
- AI resources: req `1 CPU/2Gi`, limit 미설정

## 운영 규칙
1. 세션 이슈 발생 시 먼저 Ingress cookie affinity + AI service ClientIP affinity 점검
2. AI 성능 이슈는 Redis/AI/Postgres 3축을 함께 본다
3. 배포 검증은 이미지 태그와 HPA 하한(minReplicas) 확인을 필수로 한다
