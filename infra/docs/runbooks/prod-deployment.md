# Prod Deployment Runbook

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest prod`, Jenkins, Harbor, ArgoCD

## 목적

`deep-quest` 프로덕션 배포 시 Jenkins, Secret, ArgoCD, 배포 후 점검 순서를 한 문서에서 확인한다.

## 실행 위치

- Jenkins 배포는 Jenkins UI에서 실행한다.
- Secret 스크립트는 상위 앱 레포 기준으로 `./infra/k8s/scripts/apply-secrets.sh`를 실행한다.
- 이 `infra` 저장소 안에서만 작업 중이면 같은 스크립트는 `k8s/scripts/apply-secrets.sh`로 본다.
- 배포 정합성 기준은 [Deployment Source Of Truth](../reference/deployment-source-of-truth.md)를 따른다.

## 사전 확인

1. Jenkins credential `web-build-env` 최신화
2. Harbor / GitHub credential 유효성 확인
3. 상위 앱 레포 기준 `infra/k8s/overlays/prod`, infra repo 기준 `k8s/overlays/prod` 변경 사항 확인
4. Secret 적용에 필요한 `.env.prod` 준비
5. ArgoCD repo / project 연결 상태와 prod Application 설정 확인
6. 외부 연동이 필요한 경우 Funnel / webhook 공개 경로가 현재 값과 일치하는지 확인

## 표준 배포 흐름

1. Jenkins에서 `DEPLOY_ENV=prod`로 빌드 실행
2. Harbor에 세 이미지(`AI`/`Web`/`LangGraph metrics exporter`)가 모두 같은 `${BUILD_TAG}`로 준비되었는지 확인
3. 실제 빌드한 이미지는 `${BUILD_TAG}`와 `prod` 태그로 push 되었는지, 빌드하지 않은 이미지는 기존 `prod` alias 이미지를 `${BUILD_TAG}`로 재태깅해 push 했는지 확인
4. `deploy` 브랜치의 `k8s/overlays/prod/kustomization.yaml`에서 세 이미지 항목이 모두 같은 `${BUILD_TAG}`로 갱신되었는지 확인
5. 필요 시 Secret 스크립트 실행
6. ArgoCD에서 `deep-quest-prod` sync
7. `scripts/verify/verify-deploy.sh`로 ArgoCD 상태, overlay/live image tag, rollout, HPA, ingress, health endpoint를 확인

## ArgoCD 사전 점검

- Settings → Repositories 에 대상 레포가 정상 연결돼 있는지 확인한다
- Settings → Projects 에 prod Application이 속할 프로젝트 권한이 정상인지 확인한다
- Application 생성 또는 수정 시 repo / project가 정상 연결돼 있어야 path / directory 인식이 자연스럽게 따라온다
- prod는 `Auto-Create Namespace`를 켜 두면 편하지만, 실제 namespace 생성 정책은 프로젝트 권한과 함께 확인한다
- repo 또는 project 연결이 어긋나면 Application 생성 단계에서 directory 인식이 비정상적이거나 sync 에러가 반복될 수 있다

## Secret / ENV 확인 포인트

- web은 빌드 타임에 필요한 값과 런타임 값을 분리해서 본다
- `NEXT_PUBLIC_*`, Sentry 관련 값, 빌드에 직접 포함되는 값은 Jenkins `web-build-env` 기준으로 먼저 확인한다
- web / ai 런타임 값은 `web-secret`, `ai-secret`, `postgres-secret` 기준으로 확인한다
- Secret 값은 Pod 주입 시 문자열로 전달되는지 확인하고, 이미 escape 또는 literal 변환된 값을 다시 넣지 않는다
- 특히 DB password, `APP_URL`, Clerk webhook secret, Sentry DSN, LangSmith key는 빌드/런타임 어느 쪽에서 쓰이는지 구분해서 본다

## 공개 경로 / Funnel 확인 포인트

- Clerk webhook 같은 외부 서비스 연동이 있으면 공개 URL이 실제 현재 도메인과 일치하는지 먼저 확인한다
- Funnel 사용 시 `tailscale-auth`, state Secret, `tailscale serve` 설정이 현재 deployment와 맞는지 본다
- HPA 또는 replica 증가가 있는 구성에서는 Tailscale sidecar 중복과 auth key 중복 가능성을 같이 점검한다

## Jenkins 확인 포인트

- Job 파라미터
  - `BRANCH`
  - `INFRA_BRANCH`
  - `DEPLOY_ENV=prod`
  - `BUILD_AI=true`
  - `BUILD_WEB=true`
  - `BUILD_LANGGRAPH_METRICS=true`
- 주요 credential
  - `web-build-env`
  - `harbor-credentials`
  - `github-credentials`

추가 확인:
- `${BUILD_TAG}`와 `prod` alias의 의미는 [Deployment Source Of Truth](../reference/deployment-source-of-truth.md)를 기준으로 본다.
- prod Application은 `deploy` 브랜치를 보지만 자동 sync는 꺼져 있으므로 ArgoCD 수동 sync가 필요하다.
- submodule 기반 빌드라면 main / develop 어느 브랜치에 실제 submodule 설정이 반영돼 있는지 같이 확인한다.

## Secret 반영

```bash
cd /path/to/deep-quest
./infra/k8s/scripts/apply-secrets.sh
kubectl get secrets -n deep-quest
```

infra repo 내부에서 실행 중이면:

```bash
k8s/scripts/apply-secrets.sh
kubectl get secrets -n deep-quest
```

확인 대상:
- `postgres-secret`
- `ai-secret`
- `web-secret`
- `tailscale-auth`

## ArgoCD 대상

- Application: `deep-quest-prod`
- Application file: 상위 앱 레포 기준 `infra/k8s/argocd/application-prod.yaml`, infra repo 기준 `k8s/argocd/application-prod.yaml`
- Overlay path: 상위 앱 레포 기준 `infra/k8s/overlays/prod`, infra repo 기준 `k8s/overlays/prod`
- 일반 규칙:
  - prod는 자동 sync보다 수동 sync 기준으로 다룬다
  - HPA replica 차이는 `ignoreDifferences` 대상인지 확인한다

## 배포 후 검증

```bash
EXPECTED_TAG=<BUILD_TAG> DEPLOY_ENV=prod scripts/verify/verify-deploy.sh
kubectl get all -n deep-quest -o wide
kubectl get hpa,ingress,cronjob,pvc -n deep-quest
kubectl rollout status deployment/web-server -n deep-quest
kubectl rollout status deployment/ai-server -n deep-quest
kubectl get pods -n deep-quest
```

추가 확인:
- `scripts/verify/verify-deploy.sh`는 현재 checkout의 overlay를 기준으로 보므로, image tag 정합성까지 보려면 `deploy` 브랜치 기준에서 실행한다
- ingress host: `deepquest.192.168.0.110.nip.io`
- web health: `/api/health`
- AI health: `/ok`
- `postgres-backup` CronJob 정상 상태
- 로그인, webhook, 프로젝트 생성 같은 앱 연동 이슈가 있으면 rollout 직후 `APP_URL`, Clerk webhook secret, DB password, LangSmith key를 먼저 재검증한다

## 관련 파일

- `Jenkinsfile`
- `k8s/overlays/prod/kustomization.yaml`
- `k8s/argocd/application-prod.yaml`
- `k8s/scripts/apply-secrets.sh`
- `../reference/deployment-source-of-truth.md`

## 원본 문서

- `docs/docs-infra/legacy/K8S_배포 가이드.md`
