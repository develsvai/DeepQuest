# Sentry에서 self-hosted 환경의 Vercel Analytics 404 노이즈가 쌓일 때

## 발생 조건

- `ngrok` 또는 self-hosted 환경에서 웹 애플리케이션을 실행한다
- 브라우저가 `/_vercel/insights/script.js`를 요청한다
- 해당 경로가 실제로는 제공되지 않아 `404`가 발생한다
- 이 실패가 Sentry 에러로 수집돼 실제 애플리케이션 장애와 섞인다

## 증상

- `/_vercel/insights/script.js` 요청이 `404`로 반복된다
- Sentry에 `Failed to fetch` 류 네트워크 에러가 누적된다
- 실제 앱 오류가 아닌데도 Sentry 이슈가 계속 열린다
- self-hosted 또는 터널링 환경에서만 유독 Sentry 노이즈가 커진다

## 판단 과정

1. Sentry 이슈가 실제 앱 핸들러 실패인지 외부 리소스 로딩 실패인지 먼저 구분한다
2. 마지막 `fetch` 또는 `xhr` breadcrumb에서 실패 URL을 확인한다
3. 실패 URL에 `/_vercel/insights`가 포함되는지 본다
4. 같은 시점의 앱 로그와 네트워크 패널을 비교해, 서버 내부 오류가 아니라 외부 스크립트 요청 실패인지 확인한다
5. 메시지 문자열이 아니라 실제 실패 URL 기준으로 필터링 가능한지 검토한다

## 근본 원인

- self-hosted 환경에서는 Vercel 전용 Analytics 리소스가 존재하지 않을 수 있다
- 그 결과 `/_vercel/insights/script.js` 요청이 `404`로 실패하고, Sentry는 이를 일반 네트워크 오류처럼 수집한다
- 메시지 기반 필터링은 범위가 너무 넓어 실제 네트워크 장애까지 지워버릴 수 있으므로 적절하지 않다

## 해결 방법

1. `web/sentry.common.config.ts`의 공통 훅에서 실패 URL을 기준으로 필터링한다
2. `createBeforeSendHook` 내부에서 마지막 `fetch` 또는 `xhr` breadcrumb를 뒤에서부터 찾는다
3. `failedUrl.includes('_vercel/insights')` 조건으로 Vercel Analytics 스크립트 실패를 제외한다
4. `web/sentry.edge.config.ts`, `web/sentry.server.config.ts`는 공통 설정을 사용하도록 단순화해 런타임별 필터링 불일치를 막는다
5. `@sentry/nextjs`를 최신 패치 버전으로 유지해 SDK 내부 이슈 가능성을 줄인다

권장 패턴:

```tsx
const lastFetchBreadcrumb = [...breadcrumbs]
  .reverse()
  .find(b => b.category === 'fetch' || b.category === 'xhr')

if (lastFetchBreadcrumb?.data?.url) {
  const failedUrl = lastFetchBreadcrumb.data.url as string
  const isAnalyticsUrl = failedUrl.includes('_vercel/insights')

  if (isAnalyticsUrl) return null
}
```

구성 원칙:

- 메시지 기반 필터링 대신 URL 기반 필터링을 사용한다
- 필터링 로직은 `sentry.common.config.ts` 한 곳에서 관리한다
- `server`, `edge` 설정은 공통 설정을 재사용하는 최소 래퍼로 유지한다
- 개발 전용 hydration 필터링과 production 노이즈 필터링은 서로 구분한다

## 확인 방법

- self-hosted 또는 `ngrok` 환경에서 페이지 진입 후 `/_vercel/insights/script.js` 요청이 `404`인지 확인한다
- 같은 조건에서 Sentry에 동일 이슈가 새로 쌓이지 않는지 확인한다
- 실제 API 실패나 앱 런타임 오류는 계속 수집되는지 확인한다
- `web/sentry.edge.config.ts`와 `web/sentry.server.config.ts`가 공통 설정만 호출하는 구조인지 확인한다
- `web/package.json`에서 `@sentry/nextjs` 버전이 의도한 범위인지 확인한다

## 검색 키워드

- sentry vercel insights 404
- self-hosted vercel analytics noise
- sentry beforeSend breadcrumb fetch url
- _vercel insights script.js 404
- failed to fetch sentry noise

## 관련 파일

- `web/sentry.common.config.ts`
- `web/sentry.edge.config.ts`
- `web/sentry.server.config.ts`
- `web/package.json`
