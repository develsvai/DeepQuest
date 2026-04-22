---
name: langgraph-stream-integration
description: `web/`에서 `@langchain/langgraph-sdk/react`의 `useStream()`을 붙이거나 수정할 때 사용하는 스킬이다. 질문 풀이, 실시간 피드백, 스트리밍 UI, thread 복원 흐름에 적용한다.
---

# LangGraph Stream 연동

## 목표

`web/`의 React UI와 `ai/`의 LangGraph 런타임 사이 스트리밍 흐름을 안정적으로 연결한다.
핵심은 메시지 표시보다 thread 유지, 에러 처리, 재연결, 상태 동기화를 먼저 맞추는 것이다.

## 언제 쓰나

- `useStream()`을 새 화면에 붙일 때
- 기존 스트리밍 UI를 리팩터링할 때
- 질문 풀이/피드백 화면의 실시간 응답 흐름을 수정할 때
- LangGraph run/thread 상태와 프론트 상태 동기화가 꼬일 때

## 작업 순서

1. 먼저 아래를 확인한다
   - 실제 사용 예시: `web/src/**`의 `useStream(` 호출부
   - `web/docs/rules/common/state-management-rules.md`
   - `web/docs/rules/view/patterns/server-client-components.md`
2. 현재 화면이 필요한 스트리밍 수준을 구분한다
   - 단순 응답 표시
   - thread 재진입
   - interrupt/승인 처리
   - 페이지 새로고침 후 복원
3. 아래 항목을 한 세트로 설계한다
   - `apiUrl`
   - `assistantId`
   - `threadId` 생성/복원 방식
   - 로딩/중단 UI
   - 에러 UI
   - 최종 완료 후 상태 반영
4. `references/integration-checklist.md` 기준으로 빠진 항목을 점검한다
5. 가능하면 `pnpm check-all`과 실제 사용자 흐름 확인을 함께 계획한다

## 규칙

- 스트리밍 UI는 메시지 렌더링만 맞추고 끝내지 않는다
- `threadId`를 어떻게 유지할지 먼저 정하지 않으면 구현을 시작하지 않는다
- client component 경계를 최소화하고, 서버에서 할 수 있는 데이터 준비는 먼저 서버에서 끝낸다
- optimistic UI를 넣을 때는 최종 서버 상태와 충돌 시 정정 흐름까지 함께 본다
- interrupt가 가능한 플로우라면 취소, 재시도, 재개 UI를 명시적으로 둔다
- 에러를 console 출력만으로 넘기지 않는다
- `ai/` 쪽 계약이 바뀌면 프론트 상태 키와 렌더링 가정도 함께 점검한다

