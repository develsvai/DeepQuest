**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Dev vs Prod 환경 비교

프로젝트 전체 스캔 결과, dev와 prod의 차이를 정리한 문서입니다.

---

## 1. 요약 표

| 구분 | Dev | Prod |
|------|-----|------|
| **K8s Overlay** | `k8s/overlays/dev` | `k8s/overlays/prod` |
| **ArgoCD Application** | `deep-quest-dev` | `deep-quest-prod` |
| **ArgoCD 소스 레포** | `deep-quest-infra.git` | `deep-quest-infra.git` |
| **ArgoCD 소스 브랜치** | `deploy` | `deploy` |
| **ArgoCD 자동 Sync** | 켜짐 (prune, selfHeal) | 꺼짐 (수동 sync) |
| **Replica 수** | AI 1, Web 1 | AI 3, Web 3 |
| **HPA** | AI min 1/max 3, Web min 1/max 5 (base 기본값) | AI/Web 각 min 2, max 5 (패치) |
| **이미지 기본 태그** | `dev` / 빌드태그 | `prod` / 빌드태그 |
| **리소스 (AI)** | 500m~1 CPU, 1Gi~2Gi | 1~2 CPU, 2Gi~4Gi |
| **리소스 (Web)** | 250m~1 CPU, 256Mi~1Gi | 500m~2 CPU, 512Mi~2Gi |
| **PostgreSQL PVC** | base 기본값 (10Gi) | base 기본값 (10Gi) |
| **ConfigMap NODE_ENV** | development | production |
| **ConfigMap LOG_LEVEL (AI)** | debug | info |
| **ConfigMap SENTRY_ALLOW_EMPTY_DSN** | 없음 | false |
| **Sentry env** | development | production |

---

## 2. ArgoCD Application

### 2.1 Dev (`k8s/argocd/application-dev.yaml`)

```yaml
source:
  repoURL: https://github.com/develsvai/deep-quest-infra.git   # Git 소스 레포 (인프라 레포)
  targetRevision: deploy   # Jenkins가 이미지 태그 푸시하는 브랜치
  path: k8s/overlays/dev    # Kustomize overlay 경로 (dev 환경)

syncPolicy:
  automated:
    prune: true       # 삭제된 리소스 자동 정리
    selfHeal: true    # 수동 변경 자동 복구
    allowEmpty: false # 빈 적용 비허용
  syncOptions:
    - CreateNamespace=true   # 네임스페이스 없으면 생성
    - PruneLast=true         # Prune을 sync 마지막에 실행
  retry:
    limit: 5              # 동기화 실패 시 최대 5회 재시도
    backoff:
      duration: 5s         # 첫 재시도 대기 시간
      factor: 2           # 재시도 간격 배율
      maxDuration: 3m     # 최대 대기 시간

ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
      - /spec/replicas  # HPA 사용 시 replica 차이 무시
```

- **대상 레포**: `deep-quest-infra.git` (인프라 분리 완료)
- **대상 브랜치**: `deploy` (Jenkins가 이미지 태그 업데이트)
- **동작**: Git 변경 시 자동 sync, 삭제된 리소스 정리, 수동 변경 복구, HPA replica 차이 무시

### 2.2 Prod (`k8s/argocd/application-prod.yaml`)

```yaml
source:
  repoURL: https://github.com/develsvai/deep-quest-infra.git   # Git 소스 레포 (인프라 레포)
  targetRevision: deploy   # Jenkins가 이미지 태그 푸시하는 브랜치
  path: k8s/overlays/prod   # Kustomize overlay 경로 (prod 환경)

syncPolicy:
  # Prod는 수동 sync (자동 배포 위험)
  # automated: 를 주석 해제하면 자동 배포
  # automated:
  #   prune: true
  #   selfHeal: true
  syncOptions:
    - CreateNamespace=true   # 네임스페이스 없으면 생성
    - PruneLast=true         # Prune을 sync 마지막에 실행
  retry:
    limit: 5              # 동기화 실패 시 최대 5회 재시도
    backoff:
      duration: 5s         # 첫 재시도 대기 시간
      factor: 2            # 재시도 간격 배율
      maxDuration: 3m      # 최대 대기 시간

ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
      - /spec/replicas   # HPA 사용 시 replica 차이 무시
```

- **대상 레포**: `deep-quest-infra.git` (인프라 분리 완료)
- **대상 브랜치**: `deploy` (Jenkins가 이미지 태그 업데이트)
- **동작**: 자동 sync 없음. ArgoCD UI/CLI로 수동 sync 필요, HPA replica 차이 무시

---

## 3. Jenkins (Jenkinsfile)

| 항목 | Dev | Prod |
|------|-----|------|
| **파라미터 DEPLOY_ENV** | `dev` 선택 시 | `prod` 선택 시 |
| **클론 브랜치 (params.BRANCH)** | `main` / `develop` 중 선택 | 동일 |
| **인프라 브랜치 (params.INFRA_BRANCH)** | `main` / `develop` 중 선택 (deploy 브랜치 베이스) | 동일 |
| **이미지 푸시 태그** | `BUILD_TAG`, `dev` | `BUILD_TAG`, `prod` |
| **수정하는 overlay** | `infra/k8s/overlays/dev/kustomization.yaml` | `infra/k8s/overlays/prod/kustomization.yaml` |
| **푸시 대상** | 인프라 레포 `deploy` 브랜치 | 인프라 레포 `deploy` 브랜치 |
| **ArgoCD Sync 안내** | 출력만 (자동 sync) | prod 선택 시 "argocd app sync deep-quest-prod" 안내 |

- Jenkins는 앱 레포 deep-quest를 클론하며, 서브모듈 infra를 포함한다. 변경된 이미지 태그만 인프라 레포 deep-quest-infra의 `deploy` 브랜치에 푸시한다.
- `deploy` 브랜치는 선택한 `INFRA_BRANCH`(main 또는 develop)를 베이스로 생성·갱신된다.
- dev와 prod 구분: 수정 대상 overlay가 dev용 `kustomization.yaml`인지 prod용인지, 그리고 이미지에 붙는 태그가 `dev`인지 `prod`인지로만 결정된다.

환경 변수에 따른 **앱 코드 동작 상세**(Sentry·tRPC·Webhook·PostHog·Prisma·AI 모델 선택 등, 파일 경로 포함)는 [애플리케이션_dev_prod_정리](./애플리케이션_dev_prod_정리%20.md)를 참고하세요.

---

## 4. 정리

| 구분 | Dev | Prod |
|------|-----|------|
| 리소스 규모 | 소규모 | 대규모 |
| Replica 수 | 1 | 3 |
| HPA | 기본값 (min 1) | 오버라이드 (min 2, max 5) |
| 배포 방식 | 자동 | 수동 |
| 로그 레벨 | debug | info |
| 모드 | development | production |
| Sentry DSN | 선택 | 필수 |
| Tailscale Funnel | 포함 | 포함 |

---

## 5. HPA 설정 상세

### Base HPA (기본값)
- **AI Server**: min 1, max 3 (CPU 70%, Memory 80%)
- **Web Server**: min 1, max 5 (CPU 70%, Memory 80%)

### Dev 환경
- Base HPA 기본값 사용 (패치 없음)
- AI: min 1, max 3
- Web: min 1, max 5

### Prod 환경
- `kustomization.yaml`에서 HPA 패치로 오버라이드
- AI/Web 모두: min 2, max 5
- Deployment replica는 3으로 설정되지만, HPA가 최소 2개 유지
