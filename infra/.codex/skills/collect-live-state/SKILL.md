---
name: collect-live-state
description: 현재 클러스터와 운영 호스트의 실측 상태를 표준 명령 세트로 수집한다. infra_state 갱신이나 운영 점검 전에 사용한다.
---

# 실측 상태 수집

## 목표

`kubectl`, `kubectl top`, Proxmox host SSH, Tailscale 노출 상태, 필요 시 `station`을 기준으로 현재 운영 상태를 빠르게 수집한다.
이 저장소에서는 deep-quest namespace 상태를 중심으로 보되, 운영에 영향을 주는 인프라 host와 외부 노출 경로도 함께 본다.

## 기본 수집 순서

1. Kubernetes context 확인
2. 노드 상태 수집
3. GitOps desired state와 배포 image tag 수집
4. ArgoCD Application sync/health/revision 수집
5. 대상 namespace 워크로드와 live Deployment image 수집
6. ingress / service / hpa / pvc / cronjob 수집
7. 리소스 사용량 수집
8. Tailscale sidecar/funnel/serve 상태 수집
9. 필요 시 Proxmox host와 VM 상태 수집
10. 필요 시 `station` 호스트 상태 수집

가능하면 아래 스크립트를 우선 사용한다.

```bash
scripts/collect/collect-live-state.sh
```

옵션:

- namespace 변경: `scripts/collect/collect-live-state.sh <namespace>`
- 환경 변경: `DEPLOY_ENV=dev scripts/collect/collect-live-state.sh`
- ArgoCD App 변경: `ARGOCD_APP=deep-quest-dev scripts/collect/collect-live-state.sh`
- station 조회 제외: `INCLUDE_STATION=0 scripts/collect/collect-live-state.sh`

overlay image tag는 현재 checkout의 `k8s/overlays/<env>/kustomization.yaml` 기준이다.
prod 배포 정합성 조사는 가능하면 `deploy` 브랜치 기준 파일과 함께 수집한다.

## 표준 명령 세트

### 1. 클러스터 기본 상태

```bash
kubectl get ns
kubectl get nodes -o wide
kubectl top nodes
kubectl get cronjob -A
kubectl get svc -A
```

### 2. deep-quest 기준 워크로드 상태

```bash
kubectl get all -n deep-quest -o wide
kubectl get ingress,hpa,pvc,cronjob -n deep-quest
kubectl top pods -n deep-quest
```

### 3. 배포 정합성 상태

```bash
git status --short
git log -1 --oneline
sed -n '/^images:/,/^[^[:space:]-]/p' k8s/overlays/prod/kustomization.yaml
kubectl get application deep-quest-prod -n argocd -o wide
kubectl get application deep-quest-prod -n argocd -o jsonpath='{.status.sync.status}{" health="}{.status.health.status}{" revision="}{.status.sync.revision}{"\n"}'
kubectl get deployment web-server ai-server langgraph-run-metrics-exporter -n deep-quest -o jsonpath='{range .items[*]}{.metadata.name}{": "}{range .spec.template.spec.containers[*]}{.name}{"="}{.image}{" "}{end}{"\n"}{end}'
```

확인 기준:

- `ai`, `web`, `langgraph-run-metrics-exporter` overlay tag가 같은 release tag인지 본다
- live Deployment image tag가 overlay tag와 같은지 본다
- ArgoCD sync/health와 live image 중 하나라도 어긋나면 배포 완료로 보지 않는다
- 자세한 기준은 `docs/reference/deployment-source-of-truth.md`를 따른다

### 4. 필요 시 상세 리소스

```bash
kubectl get configmap,secret -n deep-quest
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
```

### 5. station 운영 호스트

```bash
ssh station 'timedatectl | sed -n "1,8p"'
ssh station 'sed -n "1,120p" /etc/cron.d/station-image-prune'
ssh station 'sed -n "1,220p" /usr/local/sbin/station-image-prune.sh'
ssh station 'tail -n 20 /var/log/station-image-prune.log 2>/dev/null || true'
```

### 6. Tailscale 노출 상태

```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{" "}{range .spec.containers[*]}{.name}{":"}{.image}{" "}{end}{"\n"}{end}' | rg 'tailscale'
kubectl get deploy,sts -A -o yaml | rg -n 'TS_KUBE_SECRET|TS_HOSTNAME|tailscale|serve|funnel|socket|state=kube' -C 4
```

컨테이너 내부 조회는 대상 Pod와 socket 경로를 확인한 뒤 수행한다.

```bash
kubectl exec -n deep-quest <pod> -c tailscale -- sh -lc 'ps w; find /tmp /var/run /run -name "*tailscale*" -o -name "*.sock" 2>/dev/null'
kubectl exec -n deep-quest <pod> -c tailscale -- tailscale --socket=/tmp/tailscaled.sock status --self
kubectl exec -n deep-quest <pod> -c tailscale -- tailscale --socket=/tmp/tailscaled.sock serve status
kubectl exec -n deep-quest <pod> -c tailscale -- tailscale --socket=/tmp/tailscaled.sock funnel status
```

### 7. Proxmox host와 VM 상태

Proxmox 접근이 필요한 작업에서는 현재 Tailscale IP `100.64.100.2` 접근을 우선 사용한다.

```bash
ssh root@100.64.100.2 'hostname; date; uptime; who -b'
ssh root@100.64.100.2 'qm list'
ssh root@100.64.100.2 'systemctl is-active pve-guests tailscaled'
ssh root@100.64.100.2 'tailscale status --self; tailscale serve status'
```

장애 조사 모드에서만 아래를 추가한다.

```bash
ssh root@100.64.100.2 'journalctl --list-boots | tail -n 10'
ssh root@100.64.100.2 'last -x -F | head -n 20'
ssh root@100.64.100.2 'find /sys/fs/pstore -maxdepth 1 -type f -print'
ssh root@100.64.100.2 'lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL,UUID,MOUNTPOINTS,MODEL,SERIAL'
```

## 출력 정리 기준

- 노드
  - Ready 상태, 버전, IP, 런타임
- 스토리지
  - PVC 상태와 용량
- 네트워크
  - ingress host, external IP, 주요 service
- 서비스
  - deployment/statefulset ready 수, 이미지 태그
- 배포 정합성
  - Git HEAD, overlay image tag, ArgoCD sync/health/revision, live Deployment image
- 예약 작업
  - K8s CronJob과 host cron/timer
- Tailscale
  - sidecar/host daemon, `TS_KUBE_SECRET`, serve/funnel 상태, tailnet-only/public 여부
- Proxmox
  - host boot time, VM running/stopped, pve-guests 상태

## 규칙

- 수집 결과는 사실 그대로만 정리한다
- 증거 없이 상태를 추정하지 않는다
- `infra_state/` 갱신이 목적이면 `update-infra-state` 형식에 맞춘다
- 문제 조사 시작 전이면 `check-troubleshooting`을 먼저 고려한다
- Proxmox나 raw disk 확인은 가능한 한 stable identifier(`/dev/disk/by-id`, UUID, VMID)를 함께 기록한다
- 수집 결과를 문서에 반영할 때 Markdown 링크는 작성 중인 문서 위치 기준 상대경로로 쓴다
- 로컬 절대경로 링크는 쓰지 않는다
