**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Deep Quest Kubernetes 배포 가이드

이 문서는 **Kubernetes 클러스터에 Deep Quest를 배포할 때** 참고하는 가이드입니다.  
Web(Next.js), AI(LangGraph), PostgreSQL을 Kustomize로 묶어 dev/prod 환경별로 적용하는 방법, 배포 전 준비·배포·확인·접속·트러블슈팅까지 순서대로 정리되어 있습니다.

## 한눈에 보기

| 단계 | 내용 |
|------|------|
| 1 | Harbor에 이미지 푸시, Secrets·Harbor Pull Secret 설정 |
| 2 | `kubectl apply -k k8s/overlays/dev` 또는 `prod`로 배포 |
| 3 | Pod·Ingress 상태 확인 후 브라우저/API로 접속 |

배포 대상: **Web Server**(Next.js), **AI Server**(LangGraph), **PostgreSQL**.  
환경: **dev**(개발), **prod**(운영, HPA 포함).

## 목차

- [1. 디렉토리 구조](#1-디렉토리-구조)
- [2. 배포 전 준비사항](#2-배포-전-준비사항)
  - [2.1 Harbor 프로젝트](#21-harbor-프로젝트)
  - [2.2 Secrets 설정](#22-secrets-설정)
  - [2.3 Dev: Tailscale Funnel (Clerk webhook)](#23-dev-tailscale-funnel-clerk-webhook)
  - [2.4 TLS 인증서 (선택)](#24-tls-인증서-선택)
- [3. 배포 방법](#3-배포-방법)
  - [3.1 kubectl + Kustomize](#31-kubectl--kustomize)
  - [3.2 Jenkins Pipeline](#32-jenkins-pipeline)
  - [3.3 ArgoCD (GitOps)](#33-argocd-gitops)
- [4. 배포 확인](#4-배포-확인)
- [5. 접속 정보](#5-접속-정보)
- [6. 트러블슈팅](#6-트러블슈팅)
- [7. 모니터링](#7-모니터링)
- [8. 삭제](#8-삭제)

---

## 1. 디렉토리 구조

배포 시 **base** 매니페스트에 **overlays/dev** 또는 **overlays/prod**를 적용합니다. base는 공통 리소스(네임스페이스, RBAC, Secrets, ConfigMap)와 서비스별 리소스(PostgreSQL, AI, Web)를 담고, overlay에서 환경별 차이(예: prod의 HPA)만 덮어씁니다.

```
k8s/
├── base/                           # 기본 매니페스트
│   ├── namespace.yaml              # deep-quest 네임스페이스
│   ├── rbac.yaml                   # ServiceAccount, Role, RoleBinding
│   ├── secrets.yaml                # 민감 정보 (수정 필요)
│   ├── configmap.yaml              # 환경 설정
│   ├── kustomization.yaml
│   │
│   ├── postgres/                   # PostgreSQL StatefulSet
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   ├── init-configmap.yaml
│   │   └── kustomization.yaml
│   │
│   ├── ai/                         # AI Server (LangGraph)
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   │
│   └── web/                        # Web Server (Next.js)
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── kustomization.yaml
│
└── overlays/                       # 환경별 오버레이
    ├── dev/                        # 개발 환경
    │   └── kustomization.yaml
    └── prod/                       # 운영 환경
        ├── kustomization.yaml
        └── hpa.yaml                # HorizontalPodAutoscaler
```

### 1.1 설정 변경 시 Overlay로 덮어쓰기 (원칙)

리소스(request/limit), HPA(min/max), replicas, 이미지 태그, ConfigMap(환경변수) 등 **설정을 바꿀 때**는 base만 수정하지 않고 **해당 환경 overlay에서 덮어쓰도록** 한다.

- **환경별로 다른 값** → `overlays/dev` 또는 `overlays/prod`의 `kustomization.yaml`에 `patches` 추가·수정.
- **모든 환경 공통** 기본값만 base 수정.
- 이렇게 하면 dev/prod가 각각 다른 리소스·HPA·env를 가져가며, 배포 시 overlay가 base를 덮어쓴다.

---

## 2. 배포 전 준비사항

### 2.1 Harbor 프로젝트

컨테이너 이미지를 저장할 Harbor 레지스트리에 프로젝트가 있어야 합니다. 클러스터가 이 레지스트리에서 이미지를 Pull합니다.

- Harbor UI에서 `deep-quest` 프로젝트 생성, 또는 Harbor API 사용

### 2.2 Secrets 설정

배포된 Pod가 DB·Clerk·API 키 등을 사용하려면 Kubernetes Secret이 필요합니다. 로컬 `.env`에서 한 번에 적용하는 방법을 권장합니다.

**간편 적용 (권장):** 로컬 `.env`에서 값을 읽어 자동 적용

```bash
# 로컬 .env 값을 읽어 deep-quest 네임스페이스에 Secret 생성
./infra/k8s/scripts/apply-secrets.sh
```

필수: `infra/docker/web/.env`, `infra/docker/ai/.env` 파일이 존재해야 합니다.

**수동 적용:** `k8s/base/secrets.yaml`의 `REPLACE_WITH_*` 값을 실제 값으로 바꾼 뒤:

```bash
# base/secrets.yaml을 클러스터에 적용 (infra 또는 k8s 기준 경로에서 실행)
kubectl apply -f base/secrets.yaml
```

**Harbor Pull Secret:** base64 형식이라 위 스크립트에 포함되지 않습니다. 클러스터가 private 레지스트리에서 이미지를 당겨오려면 별도 생성합니다.

```bash
# private 레지스트리 인증용 시크릿 생성 (이미지 Pull 시 사용)
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.192.168.0.110.nip.io \
  --docker-username=<USER> \
  --docker-password=<PASS> \
  -n deep-quest
```

### 2.3 Dev: Tailscale Funnel (Clerk webhook)

Dev overlay에서는 Web Pod에 Tailscale Funnel 사이드카가 붙습니다. port-forward 없이 Clerk webhook을 공개 URL로 받을 수 있습니다.

**사전 요구사항:**
1. [Tailscale Admin](https://login.tailscale.com)에서 MagicDNS, HTTPS 활성화
2. ACL에 funnel용 node attribute 추가
3. `tailscale-auth` Secret에 `TS_AUTHKEY` 설정 (Ephemeral + Reusable 권장)

**배포 후:** Pod 로그에서 Funnel URL 확인 후 Clerk Webhook 엔드포인트에 등록  
- 예: `https://<pod-name>.<tailnet>.ts.net/api/webhooks/clerk`

### 2.4 TLS 인증서 (선택)

Ingress에서 HTTPS를 쓰려면 TLS Secret이 필요합니다. Self-signed 또는 Let's Encrypt 등으로 발급한 인증서를 사용합니다.

```bash
# Ingress HTTPS용 TLS 시크릿 생성 (인증서·키 경로는 실제 값으로 변경)
kubectl create secret tls deepquest-tls-secret \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n deep-quest
```

---

## 3. 배포 방법

### 3.1 kubectl + Kustomize

Kustomize로 overlays를 적용해 한 번에 배포합니다. 개발은 dev, 운영은 prod overlay를 사용합니다.

```bash
# Kustomize로 dev overlay 적용 후 리소스 생성/갱신
kubectl apply -k k8s/overlays/dev

# Kustomize로 prod overlay 적용 후 리소스 생성/갱신
kubectl apply -k k8s/overlays/prod

# 적용될 매니페스트만 출력 (실제 적용 없음)
kubectl apply -k k8s/overlays/dev --dry-run=client -o yaml
```

### 3.2 Jenkins Pipeline

CI에서 이미지 빌드·푸시 후 배포까지 자동화할 때 사용합니다.

1. Jenkins에 Credentials 등록:
   - `harbor-credentials`: Harbor 로그인 (Username/Password)
   - GitHub credentials: 저장소 접근용 (Secret file 또는 Username/Password)

2. Pipeline Job 생성 후 `Jenkinsfile` 지정

3. 파라미터 선택 후 빌드 실행

### 3.3 ArgoCD (GitOps)

Git 저장소의 매니페스트를 기준으로 클러스터를 동기화할 때 사용합니다. Application은 아래 YAML로 `kubectl apply`하거나, **ArgoCD UI**에서 "New App"으로 동일한 소스·대상·경로(`k8s/overlays/prod` 또는 dev)를 지정해 등록할 수 있습니다. 상세 워크플로우는 [운영 배포 Runbook](../docs/runbooks/prod-deployment.md) 참고.

```bash
# stdin으로 전달한 YAML을 적용해 ArgoCD Application 등록
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: deep-quest
  namespace: argocd
spec:
  project: default
  source:
    repoURL: <YOUR_GIT_REPO_URL>
    targetRevision: HEAD
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: deep-quest
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

---

## 4. 배포 확인

배포 후 네임스페이스·Pod·Service·Ingress가 기대대로 생성되었는지 확인합니다.

```bash
# deep-quest 네임스페이스 존재 여부 확인
kubectl get ns deep-quest

# 네임스페이스 내 Deployment, Service, Pod 등 목록 조회
kubectl get all -n deep-quest

# Pod 상태 실시간 감시 (Ctrl+C로 종료)
kubectl get pods -n deep-quest -w

# AI Server / Web Server Pod 로그 스트리밍
kubectl logs -f deployment/ai-server -n deep-quest
kubectl logs -f deployment/web-server -n deep-quest

# Ingress 리소스 및 부여된 호스트 확인
kubectl get ingress -n deep-quest

# 최근 이벤트 시간순 정렬 (실패 원인 파악용)
kubectl get events -n deep-quest --sort-by='.lastTimestamp'
```

---

## 5. 접속 정보

배포가 정상이면 아래 주소로 접근할 수 있습니다. Web은 Ingress를 통해 외부에서, AI·PostgreSQL은 클러스터 내부에서만 사용합니다.

| 서비스 | URL |
|--------|-----|
| Web (외부) | https://deepquest.tail2dac17.ts.net/ |
| AI Server (내부) | http://ai-service:8123 |
| PostgreSQL (내부) | postgres-service:5432 |

---

## 6. 트러블슈팅

### Pod가 Pending 상태인 경우

리소스 부족, PVC 바인딩 실패 등 원인 확인 시 사용합니다.

```bash
# Pod 상세 이벤트·조건·리소스 요청 등 확인 (Pending 원인 파악)
kubectl describe pod <pod-name> -n deep-quest
```

### ImagePullBackOff 에러

Harbor 인증 실패 또는 이미지 경로 오류일 때 확인합니다.

```bash
# harbor-pull-secret 존재 및 데이터 키 확인
kubectl get secret harbor-pull-secret -n deep-quest -o yaml

# 레지스트리 인증·이미지 경로가 올바른지 로컬에서 검증
docker pull harbor.192.168.0.110.nip.io/deep-quest/web:prod
```

### PostgreSQL 연결 실패

Web/AI Pod가 DB에 연결되지 않을 때 PostgreSQL 상태와 로그를 봅니다.

```bash
# postgres 컴포넌트 Pod 목록 및 상태 확인
kubectl get pods -l app.kubernetes.io/component=postgres -n deep-quest

# PostgreSQL StatefulSet 로그로 연결 오류 등 확인
kubectl logs statefulset/postgres -n deep-quest
```

---

## 7. 모니터링

Prometheus/Grafana가 클러스터에 이미 설치되어 있다면, ServiceMonitor를 추가해 Deep Quest 메트릭을 수집할 수 있습니다.

```bash
# Prometheus가 deep-quest 서비스를 스크랩하도록 ServiceMonitor 등록
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: deep-quest
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: deep-quest
  namespaceSelector:
    matchNames:
      - deep-quest
  endpoints:
    - port: http
      interval: 30s
EOF
```

---

## 8. 삭제

배포한 리소스를 제거할 때 사용합니다. 네임스페이스 삭제 시 해당 네임스페이스 안의 리소스는 함께 삭제되며, PVC는 기본적으로 남으므로 데이터를 지우려면 수동 삭제가 필요합니다.

```bash
# 적용했던 overlay 기준으로 생성된 리소스만 삭제 (dev 또는 prod)
kubectl delete -k k8s/overlays/dev

# 네임스페이스 삭제 시 그 안의 모든 리소스 함께 삭제됨
kubectl delete ns deep-quest

# deep-quest 라벨이 붙은 PVC 삭제 (영구 데이터 제거 시에만)
kubectl delete pvc -l app.kubernetes.io/name=deep-quest -n deep-quest
```
