---
name: web-server-architecture
description: `web/src/server/**`의 router, service, 공통 계층을 건드릴 때 사용하는 스킬이다. tRPC router와 service 책임 분리, 도메인 구조, Prisma 사용 경계를 맞춘다.
---

# Web 서버 아키텍처

## 목표

`web/src/server/**` 변경이 현재 서버 레이어 구조와 어긋나지 않게 유지한다.
핵심은 router, service, 공통 유틸의 책임을 섞지 않는 것이다.

## 언제 쓰나

- 새 tRPC router를 만들 때
- service를 추가하거나 쪼갤 때
- router에 비즈니스 로직이 비대해졌을 때
- Prisma 쿼리 위치, 에러 처리 위치, 도메인 경계를 정리할 때

## 작업 순서

1. 먼저 아래를 확인한다
   - `web/docs/rules/backend/index.md`
   - `web/docs/rules/backend/api/trpc-rules.md`
   - 관련 `web/src/server/api/routers/**`
   - 관련 `web/src/server/services/**`
2. 변경 대상이 아래 중 어디인지 먼저 분류한다
   - router 입력/출력 계약
   - service 비즈니스 로직
   - Prisma query / transaction
   - 공통 에러 처리
3. `references/layer-checklist.md` 기준으로 책임이 섞였는지 점검한다
4. 코드 수정 후 `pnpm check-all`과 관련 흐름 테스트 범위를 정리한다

## 규칙

- router는 입력 검증, 인증, service 호출, 에러 변환에 집중한다
- 비즈니스 로직과 조합 규칙은 service에 둔다
- Prisma query는 가능한 한 service 계층에서 다룬다
- 페이지 이름이 아니라 도메인 이름으로 구조를 유지한다
- 한 service가 UI 흐름 세부사항까지 알기 시작하면 책임을 다시 나눈다
- 공통 에러 패턴은 각 router에서 중복 구현하지 않는다

