# Operational Notes

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest/infra` 운영 메모

## 목적

정식 runbook이나 troubleshooting으로 승격되기 전, 운영적으로 반복해서 떠올릴 만한 메모를 모은다.

## 현재 메모

- 부하 테스트 전에는 env, Clerk, Sentry, prod/dev 차이를 먼저 정리한다
- Jenkins / GitOps / 문서 갱신 누락이 운영 리스크로 자주 연결된다
- 문서 자체도 운영 자산으로 보고 유지해야 한다
- 일반 배포는 구조 변경이 아니므로 `design-infra-change` 없이 Jenkins, deploy branch, ArgoCD, `verify-deploy` 순서로 검증한다
- 구조 변경과 일반 배포를 섞어 기록하지 않는다

## 원본 문서

- `docs/docs-infra/legacy/RPS_테스트_전_최종_생각정리.md`
