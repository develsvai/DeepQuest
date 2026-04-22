---
name: web-performance-patterns
description: `web/`의 Next.js 16, React 19 화면과 서버 코드를 성능 관점에서 작성하거나 리뷰할 때 사용하는 스킬이다. waterfall, bundle, rerender, server/client 경계, 데이터 페칭 구조를 점검한다.
---

# Web 성능 패턴

## 목표

`web/` 변경이 기능만 맞고 느려지는 방향으로 가지 않게, 현재 스택 기준의 성능 패턴을 적용한다.
핵심은 "최적화 기교"보다 waterfall 제거, 경계 정리, 불필요한 client 확장을 막는 것이다.

## 언제 쓰나

- 새 페이지나 대형 컴포넌트를 만들 때
- 데이터 페칭 흐름을 바꿀 때
- bundle 크기나 hydration 비용이 걱정될 때
- React rerender, 느린 리스트, 무거운 client component를 리뷰할 때

## 작업 순서

1. 먼저 아래를 확인한다
   - `web/docs/rules/view/patterns/performance.md`
   - `web/docs/rules/view/patterns/react.md`
   - `web/docs/rules/view/patterns/server-client-components.md`
   - 필요 시 `web/docs/rules/backend/data-fetching-rules.md`
2. 현재 변경을 아래 범주 중 어디로 볼지 정한다
   - waterfall
   - bundle/hydration
   - rerender
   - server/client 경계
   - 리스트/렌더링 비용
3. `references/review-checklist.md` 기준으로 주요 리스크를 빠르게 점검한다
4. 코드 수정 후에는 `pnpm check-all`과 실제 사용자 흐름 체감 저하 여부를 함께 본다

## 규칙

- server component로 둘 수 있으면 먼저 server component를 유지한다
- 데이터는 늦게 기다리고 일찍 시작하는 방향을 우선 검토한다
- 무거운 client dependency는 화면 진입 초기에 전부 싣지 않는다
- React 19/Next 16 환경에서는 기존 습관처럼 `useMemo`/`useCallback`을 무차별적으로 추가하지 않는다
- `startTransition`, `useDeferredValue`는 실제 비긴급 업데이트 구분이 있을 때만 사용한다
- barrel import, 불필요한 provider 중첩, 거대한 client tree를 경계한다
- 성능 최적화가 기존 설계 규칙을 깨면 먼저 구조를 고친다

