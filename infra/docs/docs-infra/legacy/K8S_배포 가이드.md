**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# K8S 배포 가이드 (종합)

Jenkins 빌드 → Secrets 적용 → ArgoCD Sync까지 전체 배포 워크플로우와 문제 해결 방법을 정리한 문서입니다.

---

## 목차

1. [배포 워크플로우 개요](#배포-워크플로우-개요)
2. [단계별 배포 절차](#단계별-배포-절차)
3. [Kubernetes 프로덕션 설정](#3-kubernetes-프로덕션-설정)
4. [배포 후 점검](#배포-후-점검)
5. [주요 파일 경로](#주요-파일-경로)

---

## 배포 워크플로우 개요

| 순서 | 단계 | 담당 | 비고 |
|------|------|------|------|
| 1 | Jenkins 빌드 env 확인 및 업데이트 | 직접 업로드 | web-build-env credential |
| 2 | Jenkins 설정 변경 사항 점검 및 수정 | Jenkins UI/설정 | 파라미터, credential 등 |
| 3 | Jenkins 빌드 테스트 | Jenkins | prod 파라미터로 실행 |
| 4 | Secrets prod 값 재설정 | 로컬 + apply-secrets | web/.env.prod, ai/.env.prod |
| 5 | ArgoCD 패치/설정 수정 | 인프라 레포 또는 ArgoCD | 필요 시 |
| 6 | ArgoCD Sync 테스트 | ArgoCD UI/CLI | deep-quest-prod 동기화 |

---

## 단계별 배포 절차

### 1. Jenkins 빌드 시점 env 확인 및 업데이트

#### 1.1 개요

- **Credential ID**: `web-build-env`
- **타입**: Secret file (파일 credential)
- **용도**: Web Next.js 빌드 시 `NEXT_PUBLIC_*` 변수 번들 (빌드 시점에 코드에 삽입됨)
- **Jenkinsfile**: `withCredentials([file(credentialsId: 'web-build-env', variable: 'WEB_BUILD_ENV')])` → `cp $WEB_BUILD_ENV web/.env`

**중요**: `NEXT_PUBLIC_*` 변수는 빌드 시점에 번들되므로, 프로덕션 빌드 전 반드시 확인 필요.

#### 1.2 web-build-env에 포함할 변수

```bash
# === App URL (프로덕션 도메인) ===
# Tailscale Funnel 사용 시: Funnel URL (호스트명: deepquest)
NEXT_PUBLIC_APP_URL=https://deepquest.tail2dac17.ts.net

# 또는 Ingress 사용 시:
# NEXT_PUBLIC_APP_URL=https://deepquest.192.168.0.110.nip.io

# === Clerk (프로덕션 키) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # 프로덕션 빌드 시 test 키(pk_test_*)가 아닌 live 키(pk_live_*)로 설정. Clerk test 키는 개발용, live 키는 실제 사용자 인증용이므로 프로덕션에서는 반드시 live로 변경해야 함.

# === Supabase (프로덕션 프로젝트) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # 프로덕션 프로젝트의 anon key

# === Sentry (프로덕션 필수) ===
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx  # 프로덕션 필수
NEXT_PUBLIC_SENTRY_ENV=production

# === Git Commit SHA (Sentry Release 추적용) ===
# Jenkinsfile에서 자동 추가: NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=${BUILD_TAG}

# === Vercel Analytics (선택) ===
# Vercel에 배포할 때 웹 분석 데이터 수집용. 로컬 또는 K8s 배포에서는 선택 사항.
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx

# === 기타 ===
# Next.js CLI 원격 텔레메트리 비활성화.
NEXT_TELEMETRY_DISABLED=1
```

#### 1.3 업데이트 절차

1. Jenkins → **Manage Jenkins** → **Credentials** → `web-build-env` 선택
2. **Update** 또는 기존 파일 credential **교체**
3. 프로덕션 값으로 `.env` 파일 준비 후 업로드

**체크리스트:**
- [ ] `NEXT_PUBLIC_APP_URL`이 실제 prod 접속 URL (Funnel: `https://deepquest.tail2dac17.ts.net` 또는 Ingress)
- [ ] Clerk 키가 `pk_live_*` (프로덕션)로 변경됨
- [ ] Supabase가 프로덕션 프로젝트로 설정됨
- [ ] `NEXT_PUBLIC_SENTRY_DSN` 설정됨 (프로덕션 필수)
- [ ] `NEXT_PUBLIC_SENTRY_ENV=production` 설정됨

---

### 2. Jenkins 설정 변경 사항 점검 및 수정

#### 2.1 파라미터 확인

| 파라미터 | Prod 권장 | 설명 |
|----------|-----------|------|
| BRANCH | `main` 또는 `develop` | 앱 소스 브랜치 (prod 배포 시 main 권장) |
| INFRA_BRANCH | `main` 또는 `develop` | 인프라 레포 베이스 (deploy 브랜치 생성 기반) |
| DEPLOY_ENV | `prod` | 배포 환경 |
| BUILD_AI | `true` | AI 이미지 빌드 |
| BUILD_WEB | `true` | Web 이미지 빌드 |

**참고**: 빌드 브랜치는 프로덕션 배포와 무관하며, 단순히 소스 코드를 어느 브랜치에서 가져올지 결정합니다.

#### 2.2 Credential 확인

| Credential ID | 용도 |
|---------------|------|
| `web-build-env` | Web 빌드 시 .env (Secret file) |
| `harbor-credentials` | Harbor Registry push |
| `github-credentials` | Git clone, 인프라 레포 push |

#### 2.3 Jenkinsfile 확인

- `infra/Jenkinsfile` 위치 (앱 레포의 `infra/` 서브모듈)
- Image tag 형식: `{BUILD_NUMBER}-{git short sha}` (예: `115-be73c50`)
- Harbor 푸시 경로: `harbor.192.168.0.110.nip.io/deep-quest/{ai,web}:{tag}`
- 인프라 레포: `deep-quest-infra.git`, `deploy` 브랜치에 푸시

#### 2.4 점검 항목

- [ ] Agent label `docker-build` 사용 가능 여부
- [ ] Harbor, GitHub credential 유효
- [ ] `web-build-env` 최신 prod 값 반영
- [ ] 인프라 레포 `deploy` 브랜치 push 권한

---

### 3. Jenkins 빌드 테스트

#### 3.1 실행

1. Jenkins → **Deep Quest** (또는 해당 Job) → **Build with Parameters**
2. 파라미터 설정:
   - `BRANCH`: main 또는 develop
   - `INFRA_BRANCH`: main 또는 develop
   - `DEPLOY_ENV`: prod
   - `BUILD_AI`: ✓
   - `BUILD_WEB`: ✓
3. **Build** 클릭

#### 3.2 점검 포인트

| Stage | 확인 내용 |
|-------|-----------|
| Clone Repository | 앱 레포 + infra 서브모듈 클론 성공 |
| Setup Build Environment | `web-build-env` 로드 → `web/.env` 생성, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` 추가 |
| Build & Push Images | ai, web Docker 빌드 및 Harbor push (`BUILD_TAG`, `prod` 태그) |
| Update Image Tags (GitOps) | `infra` 레포 `deploy` 브랜치에 kustomization.yaml 태그 업데이트 |
| Trigger ArgoCD Sync | 메시지 출력 (수동 sync 안내) |

#### 3.3 실패 시

- **Build env 오류**: `web-build-env` credential 재확인
- **Docker 빌드 실패**: Dockerfile, 의존성, 네트워크 확인
- **Harbor push 실패**: harbor-credentials, 네트워크 확인
- **Git push 실패**: github-credentials, deploy 브랜치 권한 확인

---

### 4. Secrets prod 값 재설정

#### 4.1 사전 준비

- `infra/docker/web/.env.prod` — prod용 web env
- `infra/docker/ai/.env.prod` — prod용 ai env

#### 4.2 실행

```bash
cd /path/to/deep-quest
./infra/k8s/scripts/apply-secrets.sh
```

**동작:**
- `.env.prod` → `.env` 복사 후 환경 변수 로드
- `secrets.yaml`의 `REPLACE_*` 플레이스홀더를 실제 값으로 치환
- Kubernetes Secret 생성/업데이트

**적용 대상:**
- `postgres-secret` (POSTGRES_PASSWORD, DATABASE_URL, DIRECT_URL)
- `ai-secret` (GOOGLE_API_KEY, LANGSMITH_API_KEY, POSTGRES_*, AI_WEBHOOK_SECRET)
- `web-secret` (CLERK_*, SUPABASE_*, SENTRY_*, AI_WEBHOOK_SECRET, TS_AUTHKEY 등)
- `tailscale-auth` (TS_AUTHKEY)

#### 4.3 확인

```bash
kubectl get secrets -n deep-quest
# postgres-secret, ai-secret, web-secret, tailscale-auth 존재 확인

# Secret 값 확인 (예시)
kubectl get secret web-secret -n deep-quest -o jsonpath='{.data}' | jq
```

---

### 5. ArgoCD 패치/설정 수정

#### 5.1 Application 설정

- **파일**: `infra/k8s/argocd/application-prod.yaml`
- **적용**: ArgoCD가 이 Application을 관리 (수동 apply 또는 GitOps)

#### 5.2 주요 설정

| 항목 | 값 |
|------|-----|
| source.repoURL | https://github.com/develsvai/deep-quest-infra.git |
| source.targetRevision | deploy |
| source.path | k8s/overlays/prod |
| destination.namespace | deep-quest |
| syncPolicy | 수동 (automated 비활성화) |

#### 5.3 수정이 필요한 경우

- repoURL, targetRevision, path 변경
- `ignoreDifferences` 추가 (HPA replicas 등)
- `syncOptions` 변경

#### 5.4 ArgoCD에 반영

- ArgoCD가 Git에서 Application을 읽는 경우: 인프라 레포에 application YAML 커밋 후 ArgoCD가 자동 반영
- 수동 적용:
  ```bash
  kubectl apply -f infra/k8s/argocd/application-prod.yaml -n argocd
  ```

---

### 6. ArgoCD Sync 테스트

#### 6.1 Sync 실행

**UI:**
1. ArgoCD UI → `deep-quest-prod` Application
2. **Sync** 버튼
3. **Synchronize** (기본 옵션 또는 Prune 포함)

**CLI:**
```bash
argocd app sync deep-quest-prod
```

#### 6.2 확인

- **Sync Status**: Synced
- **Health**: Healthy
- 리소스 변경 여부 확인 (Deployment, ConfigMap, Secret 등)

---

## 3. Kubernetes 프로덕션 설정

### 3.1 Overlay 확인

**파일 위치**: `infra/k8s/overlays/prod/kustomization.yaml`

**주요 설정:**
- **Replica 수**: AI 3, Web 3
- **HPA**: AI/Web 모두 min 2, max 5 (base HPA 패치)
- **ConfigMap 패치**:
  - `ai-config`: `NODE_ENV=production`, `LOG_LEVEL=info`
  - `web-config`: `NODE_ENV=production`, `NEXT_PUBLIC_SENTRY_ENV=production`, `SENTRY_ALLOW_EMPTY_DSN=false`
- **이미지 태그**: Jenkins가 자동 업데이트 (빌드 태그)

**체크리스트:**
- [ ] Replica 수가 3개로 설정됨 (AI, Web)
- [ ] ConfigMap 패치에서 `NODE_ENV=production` 확인
- [ ] ConfigMap 패치에서 `LOG_LEVEL=info` 확인 (AI)
- [ ] ConfigMap 패치에서 `NEXT_PUBLIC_SENTRY_ENV=production` 확인 (Web)
- [ ] ConfigMap 패치에서 `SENTRY_ALLOW_EMPTY_DSN=false` 확인 (Web)

---

## 배포 후 점검

### 배포 상태 확인

| 구성 요소 | 상태 | 확인 명령 |
|----------|------|-----------|
| ai-server | 2/3 Running (HPA min 2) | `kubectl get pods -l app.kubernetes.io/component=ai -n deep-quest` |
| web-server | 2/3 Running (HPA min 2) | `kubectl get pods -l app.kubernetes.io/component=web -n deep-quest` |
| tailscale-funnel | 2/2 (socat + tailscale) Running | `kubectl get pods -l app.kubernetes.io/component=tailscale-funnel -n deep-quest` |
| postgres-0 | 1/1 Running | `kubectl get pods -l app.kubernetes.io/component=postgres -n deep-quest` |
| HPA | ai/web min 2, max 5 | `kubectl get hpa -n deep-quest` |
| ConfigMap | ai-config, web-config production 설정 | `kubectl get configmap -n deep-quest` |
| Secrets | postgres, web, ai, tailscale-auth, tailscale-funnel-prod-state | `kubectl get secrets -n deep-quest` |
| Ingress | deepquest.192.168.0.110.nip.io | `kubectl get ingress -n deep-quest` |
| Tailscale Funnel | https://deepquest.tail2dac17.ts.net | Tailscale Admin Console |
| Postgres Backup CronJob | 0 18 * * * (Asia/Seoul) | `kubectl get cronjob -n deep-quest` |

### 확인 권장 사항

- **Clerk Webhook URL**: `https://deepquest.tail2dac17.ts.net/api/webhooks/clerk` 등록 여부
- **APP_URL**: 내부 AI 웹훅은 `http://web-service` 사용, Clerk는 Funnel URL 사용
- **Sentry Release**: `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`가 빌드 태그로 설정되었는지 확인
- **Health Check**: Pod 헬스 상태 확인
  ```bash
  kubectl get pods -n deep-quest
  kubectl describe pod <pod-name> -n deep-quest
  ```

### 헬스체크 확인

```bash
# Web 서버 헬스체크
curl http://web-service/api/health

# AI 서버 헬스체크
curl http://deepquest-ai:8123/ok

# 외부 접근 (Funnel)
curl https://deepquest.tail2dac17.ts.net/api/health
```

### Pod 환경 변수 확인

```bash
# Pod 환경 변수 확인
kubectl exec -n deep-quest <web-pod-name> -- env | grep NODE_ENV
kubectl exec -n deep-quest <web-pod-name> -- env | grep NEXT_PUBLIC_SENTRY_ENV
kubectl exec -n deep-quest <ai-pod-name> -- env | grep NODE_ENV
kubectl exec -n deep-quest <ai-pod-name> -- env | grep LOG_LEVEL

# ConfigMap 확인
kubectl get configmap web-config -n deep-quest -o yaml
kubectl get configmap ai-config -n deep-quest -o yaml

# Secret 확인 (값은 base64로 인코딩됨)
kubectl get secret web-secret -n deep-quest -o yaml
kubectl get secret ai-secret -n deep-quest -o yaml
```

---

## 주요 파일 경로

| 구분 | 경로 |
|------|------|
| Jenkinsfile | `infra/Jenkinsfile` |
| prod overlay | `infra/k8s/overlays/prod/kustomization.yaml` |
| Tailscale Funnel (prod) | `infra/k8s/overlays/prod/tailscale-funnel-deployment.yaml` |
| ArgoCD Application (prod) | `infra/k8s/argocd/application-prod.yaml` |
| Secrets 적용 | `infra/k8s/scripts/apply-secrets.sh` |
| Secrets 템플릿 | `infra/k8s/base/secrets.yaml` |
| ConfigMap 템플릿 | `infra/k8s/base/configmap.yaml` |
| Web Deployment | `infra/k8s/base/web/deployment.yaml` |
| AI Deployment | `infra/k8s/base/ai/deployment.yaml` |
| Web env (prod) | `infra/docker/web/.env.prod` |
| AI env (prod) | `infra/docker/ai/.env.prod` |
| Clerk webhook | `web/src/app/api/webhooks/clerk/route.ts` |
| LangGraph 서비스 | `web/src/server/services/ai/langgraph/service.ts` |
| Next.js config | `web/next.config.ts` |
| tRPC | `web/src/server/api/trpc.ts` |
