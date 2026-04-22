---
name: prisma-v7
description: `web/`의 Prisma 7 설정과 generated client import 규칙을 맞추기 위한 스킬이다. 스키마 변경, migration, import 패턴 정리, Prisma 타입 사용 시 적용한다.
---

# Prisma 7 작업 가이드

## 목표

`web/prisma/schema.prisma`와 `web/src/generated/prisma`를 기준으로 Prisma 7 변경을 안전하게 적용한다.
핵심은 스키마, generated client, 서버/브라우저 import 경로가 서로 어긋나지 않게 유지하는 것이다.

## 언제 쓰나

- `web/prisma/schema.prisma`를 수정할 때
- migration을 추가하거나 점검할 때
- `@/generated/prisma/*` import 경로를 정리할 때
- enum, model type, `PrismaClient` 사용 위치를 바꿀 때

## 작업 순서

1. 먼저 아래를 확인한다
   - `web/prisma/schema.prisma`
   - `web/docs/rules/backend/api/trpc-rules.md`
   - `web/docs/rules/backend/index.md`
2. generator 설정과 output 경로를 확인한다
   - 현재 레포는 `provider = "prisma-client"`
   - output은 `../src/generated/prisma`
3. 변경 대상이 무엇인지 구분한다
   - schema 변경
   - migration 생성
   - import 경로 수정
   - type 사용 위치 조정
4. import는 `references/import-matrix.md` 기준으로 정리한다
5. schema를 바꿨다면 최소한 아래 검증 후보를 판단한다
   - `pnpm db:validate`
   - `pnpm db:generate`
   - `pnpm check-all`

## 규칙

- `web/` 코드에서 Prisma import는 현재 generated client 구조를 우선한다
- 서버 런타임 코드는 `@/generated/prisma/client`를 기준으로 본다
- enum만 필요하면 `@/generated/prisma/enums`를 우선한다
- 브라우저에서 타입만 필요하면 `@/generated/prisma/browser`를 우선 검토한다
- 예전 `@prisma/client` 직접 import 습관을 새 코드에 되살리지 않는다
- Prisma 변경은 스키마만 고치고 끝내지 말고 generated import 영향 범위까지 함께 본다
- 새 `PrismaClient` 인스턴스를 임의로 늘리지 않는다
- migration 이름은 변경 의도가 읽히게 짓는다

