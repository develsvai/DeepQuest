# Kubernetes And Secrets Issues

## 발생 조건

- overlay 수정, Secret 재적용, ArgoCD sync, 초기 K8s bootstrap 시

## 대표 증상

- immutable field 오류
- HPA 중복
- `commonLabels deprecated`
- ServiceAccount 중복
- ArgoCD namespace 생성 실패
- Secret base64 오류
- Service endpoints 비어 있음
- AI ImagePullBackOff
- AI license verification failed

## 판단 과정

- overlay patch와 base 리소스 중복 확인
- Secret 생성 경로와 base64 인코딩 확인
- selector와 label이 endpoint를 만들 수 있는지 확인
- Harbor 태그와 image pull secret 확인

## 근본 원인

- 매니페스트 중복 정의
- patch 방향과 실제 리소스 구조 불일치
- Secret 값 형식 오류
- 이미지/라이선스/selector 문제

## 해결 방법

- 중복 정의는 한 파일로 모은다
- Secret은 `apply-secrets.sh` 또는 명시적 `kubectl create secret` 기준으로 통일
- endpoint 문제는 pod label과 service selector를 먼저 대조
- image pull과 license는 실행 중 이미지와 secret을 함께 확인

## 확인 방법

```bash
kubectl get all -n deep-quest
kubectl get events -n deep-quest --sort-by=.lastTimestamp | tail -n 50
kubectl get secret -n deep-quest
kubectl get endpoints -n deep-quest
```

## 검색 키워드

- immutable field
- hpa duplicate
- secret base64
- endpoints none
- imagepullbackoff
- license verification failed

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 6장, 10장, 11장, 12장
