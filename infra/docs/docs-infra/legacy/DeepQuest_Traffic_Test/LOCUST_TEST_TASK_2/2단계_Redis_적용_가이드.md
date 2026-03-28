# 2단계: Redis 배포 및 LangGraph 연결 가이드

**적용일:** 2026-02-18

---

## 적용 내용 요약

1. **Redis**  
   - `infra/k8s/base/redis/`: Deployment 1 replica, Service `redis-service:6379`
2. **AI Deployment**  
   - initContainer `wait-for-redis` 추가  
   - env `REDIS_URI=redis://redis-service:6379`  
   - env `DATABASE_URI` from secret `ai-secret` key `LANGGRAPH_DATABASE_URI` (optional)
3. **Postgres**  
   - 애플리케이션 DB(Prisma)와 **동일 인스턴스** 사용, **DB 이름만 분리** 권장  
   - LangGraph 전용 DB: `langgraph` 생성 후 `DATABASE_URI`에 연결

---

## 배포 전 필수 작업

### 1. Postgres에 LangGraph 전용 DB 생성

동일 Postgres 인스턴스에 DB 하나만 더 만들면 됩니다.

```bash
# Postgres Pod에서 실행 (네임스페이스/파드 이름은 환경에 맞게)
kubectl exec -n deep-quest postgres-0 -- psql -U deepquest -d postgres -c 'CREATE DATABASE langgraph;'
```

(또는 기존 `deepquest` DB를 쓰려면 아래 시크릿만 `deepquest`로 맞추면 됨. 스키마 분리를 권장하면 `langgraph` 사용.)

### 2. Secret에 LANGGRAPH_DATABASE_URI 추가

`LANGGRAPH_DATABASE_URI`는 **LangGraph(AI)** 가 쓰는 값이므로 **ai-secret** 에 들어갑니다.

**권장:** `docker/ai/.env.prod` 에 `LANGGRAPH_DATABASE_URI=postgres://...@postgres-service:5432/langgraph?sslmode=disable` 를 넣고, **apply-secrets.sh** 한 번 실행하면 ai-secret 에 자동 반영됩니다.

```bash
./infra/k8s/scripts/apply-secrets.sh
```

수동으로만 넣을 때:

```bash
kubectl patch secret ai-secret -n deep-quest --type=json -p='[
  {"op": "add", "path": "/data/LANGGRAPH_DATABASE_URI", "value": "'$(echo -n "postgres://deepquest:YOUR_PASSWORD@postgres-service:5432/langgraph?sslmode=disable" | base64)'"}
]'
```

---

## 배포 순서

1. Redis 리소스 적용  
   - `kubectl apply -k infra/k8s/base` (또는 overlay 포함한 경로)
2. 위에서 Postgres DB 생성 + 시크릿 패치
3. AI Deployment 재배포 (이미지/설정 변경 시 롤아웃)

---

## 참고

- **AI 이미지 (2026-02 적용 완료)**  
  - **`langgraph build`** 로 빌드한 공식 프로덕션 이미지를 사용 중. REDIS_URI/DATABASE_URI로 Redis·Postgres 연동.
  - Jenkins: `cd ai && uv run langgraph build -t ...` 후 Harbor 푸시. K8s는 포트 **8000** 사용 (공식 이미지 기본 포트).
- **동일 Postgres, DB만 분리**  
  - 애플리케이션 DB와 별도 DB가 하나 더 필요하다는 뜻이지, Postgres 인스턴스가 하나 더 필요한 것은 아님.  
  - Redis만 새로 도입하고, Postgres는 기존 것 + `langgraph` DB만 추가하면 됨.
