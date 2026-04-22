# Application Code Change Summary

## 목적

Docker 기반 로컬/배포 전환 과정에서 앱 코드 자체에 들어간 의미 있는 변경을 요약한다.

## 핵심 변경

- `web/next.config.ts`
  - standalone output 활성화
- `web/src/server/api/trpc.ts`
  - 로컬/개발 흐름에서 사용자 자동 생성 보완
- `web/sentry.common.config.ts`
  - 환경별 Sentry DSN 처리 보완

## 사용 목적

- 인프라 변경이 앱 코드까지 건드린 시점을 추적할 때
- Docker / 로컬 개발 전환 배경을 복기할 때

## 원본 문서

- `../../infra/docs/docs-infra/legacy/애플리케이션_코드_변경_정리.md`
