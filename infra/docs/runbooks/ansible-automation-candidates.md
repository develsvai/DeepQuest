# Ansible Automation Candidates

## 목적

현재 `infra/`에서 수동 또는 쉘 기반으로 처리하는 작업 중, Ansible로 표준화하기 좋은 대상을 정리한다.

## 우선순위

| 영역 | 현재 방식 | 후보 |
|---|---|---|
| Secret 적용 | `apply-secrets.sh` + 수동 secret 생성 | Vault + Playbook |
| 배포 검증 | 수동 `kubectl`, `curl` | rollout + health check playbook |
| K8s 배포 | ArgoCD / `kubectl apply -k` | apply / verify playbook |
| DB 마이그레이션 | 수동 `prisma migrate` | K8s exec / job playbook |
| Docker dev 기동 | `start-all.sh` | 호스트 준비 + compose playbook |

## 추천 순서

1. Secret 적용 자동화
2. 배포 후 검증 자동화
3. K8s 배포 자동화
4. DB 마이그레이션 자동화
5. 로컬 Docker dev 자동화

## 제외 또는 후순위

- Grafana 대시보드 적용
- 수동 백업/복원 래핑
- 노드 OS bootstrap

## 원칙

- GitOps를 대체하기보다 보조한다
- Git에 넣지 않는 Secret, 검증, 수동 운영 절차부터 자동화한다
- 기존 스크립트와 동일한 입력/출력을 먼저 보장한다

## 원본 문서

- `docs/docs-infra/legacy/앤서블_자동화_예정.md`
