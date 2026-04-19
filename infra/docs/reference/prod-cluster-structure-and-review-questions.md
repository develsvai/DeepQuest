# 현재 prod 클러스터 구조와 리뷰 질문

- 확인 시점: `2026-04-09 KST`
- 대상 환경: `deep-quest prod`
- 근거: `docs/infra_state/2026-04-09-live.md`, `Jenkinsfile`, `k8s/argocd/application-prod.yaml`, `k8s/base/*`, `k8s/overlays/prod/*`

## 한눈에 보는 구조

- 호스트 / 스토리지
  - 직접 확인된 것은 `station = jenkins-build = 192.168.0.7`
  - `nfs-storage`는 `192.168.0.7:/data/nfs`를 backend로 쓴다
  - Proxmox 자체 계층은 현재 컨텍스트에서 직접 관측되지 않았다
- Kubernetes
  - control-plane `1`, worker `5`
  - `deep-quest`, `argocd`, `harbor`, `jenkins`, `monitoring`, `keda`가 같은 클러스터에 공존한다
- 접근 경로
  - 사용자 앱: `ingress-nginx` LoadBalancer `192.168.0.110` -> `web-ingress` -> `web-service`
  - CI: `jenkins` LoadBalancer `192.168.0.111`
  - 관리/관측: ArgoCD, Grafana, Jenkins 일부 workload는 Tailscale sidecar를 함께 쓴다
- 배포
  - Jenkins가 이미지를 build/push한다
  - Harbor가 runtime image registry 역할을 맡는다
  - Jenkins가 `deploy` 브랜치 `k8s/overlays/prod/kustomization.yaml` tag를 갱신한다
  - ArgoCD application `deepquest-infra`가 `deploy` 브랜치 `k8s/overlays/prod`를 sync한다
- DeepQuest runtime
  - `web-server`: HPA 기반
  - `ai-server`: prod에서 base HPA를 제거하고 KEDA + PDB 기반
  - `postgres`: StatefulSet + NFS PVC
  - `redis`, `langgraph-run-metrics-exporter`, `tailscale-funnel`이 보조 역할을 맡는다

## 1. 호스트 / 스토리지 계층

### 확인된 구조

- `nfs-storage` StorageClass는 `k8s-sigs.io/nfs-subdir-external-provisioner`를 사용한다
- `kube-system/nfs-provisioner`는 `192.168.0.7:/data/nfs`를 마운트한다
- `station`은 `jenkins-build` 호스트이며 IP `192.168.0.7`를 가진다
- `station`에서 `pvesh`, `qm`, `pvecm` 같은 Proxmox CLI는 확인되지 않았다
- `station`에서 `/data/nfs`는 `/dev/sdb1` ext4로 마운트되어 있고 `118G` 중 `46G`가 사용 중이다
- `deep-quest`의 Postgres data/backup PVC와 Harbor registry/database/jobservice/redis PVC가 모두 `nfs-storage`를 사용한다
- Jenkins controller PVC는 `local-path` `8Gi`를 사용한다

### 바로 나올 질문

- `192.168.0.7`가 Proxmox host 자체인지, 별도 VM인지, 전용 스토리지 노드인지?
- `/data/nfs` 단일 경로가 Harbor와 DeepQuest를 함께 받는데 장애 시 영향 범위가 어디까지인지?
- NFS 백엔드에 대한 snapshot / backup / restore 테스트를 어디까지 해봤는지?
- `postgres-data-postgres-0`는 `RWO`인데 backend는 NFS다. 이 조합의 성능과 장애복구 기준을 검증했는지?
- Harbor와 Postgres backup을 같은 NFS backend에 두는 현재 분리 수준이 의도된 것인지?

## 2. 네트워크 / Tailscale 접근 계층

### 확인된 구조

- 외부 LoadBalancer는 현재 `ingress-nginx-controller(192.168.0.110)`와 `jenkins(192.168.0.111)` 두 개가 확인된다
- `web-ingress` host는 `deepquest.192.168.0.110.nip.io`다
- `deep-quest`에는 standalone `tailscale-funnel` deployment가 있고 `tailscale-auth`, `tailscale-funnel-prod-state` secret을 사용한다
- `argocd-server`, `prometheus-grafana`, `jenkins` workload는 Tailscale sidecar를 포함한다

### 바로 나올 질문

- 외부 공개 경로와 Tailscale 내부 경로를 어떻게 구분해서 운영하는지?
- 현재 Tailscale 사용 범위가 admin plane 접근인지, webhook/funnel 경로까지 포함하는지?
- `jenkins`는 LoadBalancer와 Tailscale을 둘 다 쓰는데 공식 운영 경로가 무엇인지?
- Tailscale auth key rotation과 state secret 수명 관리는 어떻게 하고 있는지?
- Funnel 장애 시 ingress 경로, Clerk webhook, 운영자 접근 중 어디가 실제로 영향을 받는지?

## 3. Kubernetes / 노드 구조

### 확인된 구조

- 노드는 master `1`대 + worker `5`대다
- 각 worker는 allocatable 기준 `2 CPU`, 약 `7.65Gi` memory를 가진다
- 현재 pod 분포는 `k8s-worker-01`에 argocd/monitoring/nfs-provisioner/redis/tailscale/web가 몰려 있고, `k8s-worker-02`는 harbor + jenkins, `k8s-worker-03`는 postgres + web, `k8s-worker-04`는 ai + metrics exporter + keda, `k8s-worker-05`는 web + ingress-nginx에 가깝다
- web/ai deployment는 `preferredDuringSchedulingIgnoredDuringExecution` anti-affinity만 있고 nodeSelector나 dedicated node pool 설정은 없다
- 현재 할당 요약상 memory limit은 `k8s-worker-04`가 `100%`, CPU limit은 `k8s-worker-01`이 `375%`까지 overcommit 상태다

### 바로 나올 질문

- worker가 왜 `5`대인지, 증설 시점과 기준이 무엇이었는지?
- 지금의 node role separation이 의도적 운영 정책인지, 그냥 scheduler 결과인지?
- `k8s-worker-01`에 control / observability 성격 workload가 몰린 것이 괜찮은지?
- `k8s-worker-04` memory limit `100%`는 의도된 oversubscription인지?
- ingress, harbor, jenkins를 별도 node group이나 taint 기반으로 분리할 필요는 없는지?

## 4. CI/CD / 운영 도구 계층

### 확인된 구조

- Jenkins pipeline은 앱 레포를 clone하고 이미지를 build한 뒤 Harbor에 push한다
- 빌드하지 않은 서비스도 현재 `${DEPLOY_ENV}` 태그를 pull 후 새 `${BUILD_TAG}`로 retag 해 동일 build tag를 유지한다
- 이후 Jenkins가 infra repo `deploy` 브랜치의 `k8s/overlays/prod/kustomization.yaml` tag를 갱신한다
- ArgoCD application `deepquest-infra`는 `deploy` 브랜치 `k8s/overlays/prod`를 추적한다
- 현재 application은 `SYNC STATUS=Synced`, `HEALTH STATUS=Suspended`로 보인다
- Monitoring stack은 Prometheus, Alertmanager, Grafana, kube-state-metrics, node-exporter로 구성된다

### "Harbor가 왜 필요한가?"에 대한 현재 답

- 현재 배포 구조는 GitOps가 이미지 binary를 직접 전달하는 방식이 아니라 image tag만 전달하는 방식이다
- 그래서 Jenkins가 만든 이미지를 클러스터가 pull할 중앙 registry가 필요하고, 그 역할을 Harbor가 맡는다
- 실제 deployment image, `harbor-pull-secret`, Jenkinsfile 모두 Harbor를 runtime image source of truth로 전제하고 있다

### 바로 나올 질문

- Harbor backup / retention / GC / immutability 정책이 있는지?
- Jenkins controller가 `local-path` PVC 하나에 의존하는데 장애 복구 절차가 준비돼 있는지?
- `deepquest-infra` app health가 `Suspended`로 보이는 이유가 정책인지, 상태 이상인지?
- prod가 수동 sync 운영이라면 승인 주체와 rollback 기준은 무엇인지?
- Jenkins agent / worker 증설 기준과 Docker build cache 관리 정책은 무엇인지?

## 5. DeepQuest 런타임 계층

### 확인된 구조

- `web-server`는 현재 `4` replica로 운영되고 `web-server-hpa`가 CPU `70%`, Memory `80%`, min `4`, max `10` 기준을 쓴다
- web pod request / limit은 `250m / 256Mi`, `1 CPU / 512Mi`다
- `ai-server`는 prod overlay에서 base HPA를 삭제하고 KEDA `ScaledObject` + `PDB`로 전환했다
- KEDA trigger는 Prometheus `sum(ai_job_queue_pending)` threshold `40`, activationThreshold `1`, min `1`, max `10`, polling `15s`, cooldown `300s`다
- 다만 현재 `ai-server-keda`는 `Active=True`인데도 `autoscaling.keda.sh/paused: true` 상태다
- `ai-server-pdb`는 `minAvailable: 1`이다
- `langgraph-run-metrics-exporter`와 `ServiceMonitor`가 존재하고, 클러스터에는 `metrics-server`와 `keda` namespace가 둘 다 있다
- secret은 Kustomize base에서 제외돼 있고 `k8s/scripts/apply-secrets.sh` 또는 직접 `kubectl apply`로 반영하는 구조다
- namespace RBAC은 `deep-quest-role`과 `tailscale-role`로 나뉜다

### "현재 HPA 산정 기준?"에 대한 현재 답

- web: CPU / Memory utilization 기반 HPA
- ai: prod에서는 HPA가 아니라 Prometheus queue metric 기반 KEDA

### "RBAC 권한?"에 대한 현재 답

- `deep-quest-role`: `configmaps`, `secrets`, `pods`, `pods/log`, `services`, `endpoints`에 대해 `get/list/watch`
- `tailscale-role`: `secrets create`, 지정된 Tailscale state secret에 대한 `get/update/patch`, `events create/patch/get`

### 바로 나올 질문

- KEDA가 왜 pause 상태인지? 임시 운영조치인지, 의도된 고정 `1` replica인지?
- `threshold 40`과 `N_JOBS_PER_WORKER=40` 조합이 실제 처리량 실험과 어떻게 연결되는지?
- web HPA min `4`는 startup latency 때문인지, baseline traffic 때문인지?
- PDB `minAvailable: 1`이면 drain / upgrade 때 어떤 제약이 생기는지?
- `secret` 직접 적용 구조에서 drift, rotation, audit은 어떻게 관리하는지?
- `deep-quest-role`이 secret read 권한을 넓게 주는 이유와 축소 여지가 있는지?

## 바로 follow-up 해볼 질문 8개

1. `ai-server-keda`를 pause 시킨 시점과 이유는 무엇인가?
2. worker `5`대 구성은 capacity planning 결과인가, 증상 대응 결과인가?
3. `192.168.0.7:/data/nfs` 장애 시 Harbor, Postgres backup, DeepQuest data 영향 범위는 무엇인가?
4. Proxmox에서 master / worker / `jenkins-build`가 어떻게 VM으로 매핑돼 있는가?
5. Jenkins는 LoadBalancer와 Tailscale 중 어느 경로를 표준 운영 경로로 쓰는가?
6. ArgoCD app `deepquest-infra` health가 `Suspended`로 보이는 이유는 무엇인가?
7. web HPA min `4` / max `10` 수치는 어떤 실험 결과에서 나온 것인가?
8. secret을 GitOps 대상에서 뺀 현재 구조의 변경 승인 / 감사 절차는 무엇인가?

## 관련 근거

- `docs/infra_state/2026-04-09-live.md`
- `Jenkinsfile`
- `k8s/argocd/application-prod.yaml`
- `k8s/base/kustomization.yaml`
- `k8s/base/rbac.yaml`
- `k8s/base/tailscale/rbac.yaml`
- `k8s/base/web/hpa.yaml`
- `k8s/overlays/prod/kustomization.yaml`
- `k8s/overlays/prod/ai-server-keda-scaledobject.yaml`
- `k8s/overlays/prod/ai-server-pdb.yaml`
- `k8s/scripts/apply-secrets.sh`
