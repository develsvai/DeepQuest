# Live Query Commands

## 기본 상태
```bash
kubectl config current-context
kubectl get ns deep-quest
kubectl get all -n deep-quest
kubectl get ingress -n deep-quest -o wide
kubectl get hpa -n deep-quest
```

## 상세 스펙
```bash
kubectl get deploy -n deep-quest ai-server web-server -o wide
kubectl get svc -n deep-quest ai-service web-service -o yaml
kubectl get configmap -n deep-quest ai-config web-config -o yaml
kubectl get ingress -n deep-quest web-ingress -o yaml
```

## 운영 진단
```bash
kubectl top pods -n deep-quest
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
kubectl logs -n deep-quest deploy/web-server --tail=100
kubectl logs -n deep-quest deploy/ai-server --tail=100
```

## 스토리지/백업
```bash
kubectl get pvc -n deep-quest
kubectl get cronjob,jobs -n deep-quest -o wide
```
