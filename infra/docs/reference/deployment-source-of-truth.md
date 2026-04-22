# Deployment Source Of Truth

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` Jenkins, Harbor, ArgoCD, Kubernetes deployment

## 목적

`deep-quest` 배포에서 무엇이 기준 상태인지 헷갈리지 않도록, 앱 commit부터 live Pod image까지 이어지는 기준선을 정의한다.

## 기준 흐름

```text
app repo commit
-> Jenkins BUILD_TAG
-> Harbor image
-> infra deploy branch overlay tag
-> ArgoCD Application
-> Kubernetes Deployment live image
-> health / metrics verification
```

## Source Of Truth

| 단계 | 기준 | 확인 방법 |
| --- | --- | --- |
| 앱 소스 | 앱 레포 commit SHA | Jenkins `Clone Repository` stage의 commit |
| 배포 식별자 | Jenkins `${BUILD_TAG}` | `BUILD_NUMBER-앱커밋짧은해시` |
| 이미지 | Harbor `${BUILD_TAG}` 태그 | `harbor.192.168.0.110.nip.io/deep-quest/<image>:${BUILD_TAG}` |
| GitOps desired state | infra repo `deploy` 브랜치 overlay | `k8s/overlays/<env>/kustomization.yaml` |
| ArgoCD 상태 | `deep-quest-prod` / `deep-quest-dev` Application | sync status, health, revision |
| live 상태 | Kubernetes Deployment image | `kubectl get deployment -n deep-quest -o jsonpath=...` |
| 서비스 상태 | health endpoint와 metrics | `scripts/verify/verify-deploy.sh` |

## 태그 의미

- `${BUILD_TAG}`는 배포 release identity다.
- `prod`와 `dev`는 Harbor의 이동 alias다.
- Jenkins는 실제로 빌드한 이미지를 `${BUILD_TAG}`와 `${DEPLOY_ENV}` alias로 push한다.
- Jenkins는 빌드하지 않은 이미지도 현재 `${DEPLOY_ENV}` alias를 pull한 뒤 같은 `${BUILD_TAG}`로 재태깅해 push한다.
- 따라서 부분 빌드 후에도 app image 세트의 GitOps desired state는 같은 `${BUILD_TAG}`를 가리켜야 한다.
- `k8s/overlays/prod/kustomization.yaml`의 `prod` 태그는 개발 브랜치의 placeholder이며, `deploy` 브랜치에서는 Jenkins가 `${BUILD_TAG}`로 갱신한다.
- `postgres:latest`는 현재 Jenkins release identity에 포함되지 않는 별도 DB image 기준이다. 앱 release 검증에서는 `ai`, `web`, `langgraph-run-metrics-exporter` 세 이미지를 우선 본다.

## 배포 정합성 체크

배포가 맞다고 판단하려면 아래가 함께 맞아야 한다.

1. Jenkins가 세 앱 이미지의 `${BUILD_TAG}`를 Harbor에 준비했다.
2. `deploy` 브랜치의 overlay에서 `ai`, `web`, `langgraph-run-metrics-exporter`가 같은 `${BUILD_TAG}`를 가리킨다.
3. ArgoCD Application이 해당 revision을 바라보고 sync/health가 정상이다.
4. live Deployment image tag가 overlay의 `${BUILD_TAG}`와 일치한다.
5. web `/api/health`, ai `/ok`, metrics exporter rollout이 정상이다.

`scripts/verify/verify-deploy.sh`는 현재 checkout의 overlay를 기준으로 비교한다.
prod 배포 직후 정합성을 보려면 `deploy` 브랜치 checkout에서 실행하거나, 검증하려는 `${BUILD_TAG}`와 그 태그가 반영된 `KUSTOMIZATION_FILE`을 명시한다.

## 예외

- Secret은 GitOps desired state에 직접 포함하지 않는다. Secret 값의 기준은 운영 env와 live Kubernetes Secret이다.
- PostgreSQL image는 현재 앱 release tag와 분리되어 있다.
- prod는 수동 ArgoCD sync 기준이므로 Jenkins 성공만으로 live 배포 완료로 보지 않는다.

## 관련 문서

- [Prod Deployment Runbook](../runbooks/prod-deployment.md)
- [dev/prod 차이](./infra-dev-vs-prod.md)
- [운영 메모](./operational-notes.md)
