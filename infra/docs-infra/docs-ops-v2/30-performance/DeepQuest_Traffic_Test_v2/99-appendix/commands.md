# Commands

## 클러스터 상태
```bash
kubectl get all -n deep-quest
kubectl get ingress -n deep-quest -o wide
kubectl get hpa -n deep-quest
kubectl top pods -n deep-quest
```

## 워크로드 상세
```bash
kubectl get deploy -n deep-quest ai-server web-server -o wide
kubectl get pods -n deep-quest -o wide
kubectl logs -n deep-quest deploy/ai-server --tail=200
kubectl logs -n deep-quest deploy/web-server --tail=200
```

## 이벤트/장애 분석
```bash
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 80
kubectl describe pod -n deep-quest <pod-name>
```
