**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# 애플리케이션 단 Dev vs Prod 차이

웹(web/)과 AI(ai/) 코드에서 **NODE_ENV**, **VERCEL_ENV**, **NEXT_PUBLIC_SENTRY_ENV**, **ENVIRONMENT**에 따라 달라지는 동작을 정리한 문서입니다.  
인프라(레플리카, HPA, 리소스, ConfigMap 주입값 등)는 같은 폴더의 [인프라_dev_prod](./인프라_dev_prod.md)를 참고하세요.

---

## 1. 환경 감지 우선순위

### Web (Next.js)

| 순위 | 변수 | 용도 |
|------|------|------|
| 1 | `NEXT_PUBLIC_SENTRY_ENV` | Sentry 환경 (development / staging / production) |
| 2 | `VERCEL_ENV` | Vercel 배포 시 (production / preview) |
| 3 | `NODE_ENV` | development / production / test |

K8s 배포 시 ConfigMap으로 **NODE_ENV**, **NEXT_PUBLIC_SENTRY_ENV** 주입 (dev overlay: `development`, prod overlay: `production`).

### AI (Python)

- **ENVIRONMENT**: `development` vs 그 외(prod로 간주).
- ConfigMap의 **NODE_ENV** / **LOG_LEVEL**은 웹·AI 공통 주입, AI는 **ENVIRONMENT**로 모델 등 분기.

---

## 2. Web (web/) — Dev vs Prod 동작

### 2.1 Sentry

| 항목 | Development | Production |
|------|-------------|------------|
| 활성화 | 비활성화 | 활성화 |
| DSN 없을 때 | 경고만, 앱 동작 | 에러 throw (DSN 필수) |
| Hydration 에러 | Sentry 미전송 (필터) | 전송 |
| 샘플링 (traces / Session Replay / Replay on Error / Profiles) | 100% / 100% / 100% / 100% | 50% / 5% / 100% / 30% |

**파일**: `web/src/types/sentry.types.ts`, `sentry.common.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

### 2.2 tRPC

| 항목 | Development | Production |
|------|-------------|------------|
| 에러 포맷터 | `console.error` 상세 로그 | 상세 로그 없음 |
| Sentry 전송 | 전송 안 함 | UNAUTHORIZED 제외하고 `captureException` |
| onError (route) | path + error.message 로그 | onError 없음 |
| loggerLink | 활성화 (요청/응답 로깅) | 비활성화 |

**파일**: `web/src/server/api/trpc.ts`, `web/src/app/api/trpc/[trpc]/route.ts`, `web/src/trpc/provider.tsx`

### 2.3 Webhook (AI → Web)

| 항목 | Development | Production |
|------|-------------|------------|
| 서명 검증 | 하지 않음 (`validateRequest`에서 항상 valid) | query `signature` vs `AI_WEBHOOK_SECRET` 검증 |

**파일**: `web/src/app/api/webhooks/ai-workflow/services/webhook-validator.ts`

### 2.4 Webhook URL (Web → AI 콜백)

| 항목 | Development | Production |
|------|-------------|------------|
| 스킴 | `http://` | `https://` |

**파일**: `web/src/server/services/ai/langgraph/service.ts` — `_generateWebhookUrl` 내부 `scheme`

### 2.5 PostHog

| 항목 | Development | Production |
|------|-------------|------------|
| 서버/클라이언트 | 비활성화 (null, init 안 함) | API 키 있으면 활성화 |

**파일**: `web/src/lib/posthog-server.ts`, `web/src/lib/posthog-client.ts`

### 2.6 Prisma

| 항목 | Development | Production |
|------|-------------|------------|
| PrismaClient | global 캐시 (HMR 시 재사용) | 캐시 안 함 |

**파일**: `web/src/lib/db/prisma.ts`

### 2.7 Supabase Realtime

| 항목 | Development | Production |
|------|-------------|------------|
| Realtime log_level | `info` | `error` |

**파일**: `web/src/lib/db/supabase/hooks/clientSupabase.tsx`

### 2.8 에러 페이지 (Error Boundary)

| 항목 | Development | Production |
|------|-------------|------------|
| 에러 상세 (message, digest) | 표시 (Dev Only 접기 영역) | 표시 안 함 |

**파일**: `web/src/app/[locale]/(protected)/error.tsx`

### 2.9 서비스 레이어 에러

| 항목 | Development | Production |
|------|-------------|------------|
| handleServiceError | `console.error` 전체 객체 출력 | 로그 없음 |

**파일**: `web/src/server/services/common/trpc-error-handler.ts`

### 2.10 개발 전용 API

| 항목 | Development | Production |
|------|-------------|------------|
| GET /api/dev/test-file | 테스트 PDF 반환 | 404 Not Found |

**파일**: `web/src/app/api/dev/test-file/route.ts`

### 2.11 기타

- **getBaseUrl**: `APP_URL` → `VERCEL_URL` → `http://localhost:${PORT}` 순. 환경별 분기 없음.
- **i18n**: development에서 누락 번역 주석만 있고 동작 차이 없음.

---

## 3. AI (ai/) — Dev vs Prod 동작

**ENVIRONMENT === "development"** 여부로만 구분.

### 3.1 모델 선택

| 그래프 | Development | Production |
|--------|-------------|------------|
| Resume Parser | gemini-3-flash-preview | gemini-3-pro-preview |
| JD Structuring | google_genai:gemini-2.5-flash | google_genai:gemini-2.5-pro |
| Question Gen | gemini-2.5-flash | gemini-3-pro-preview |

- Dev: Flash 계열 (빠름/저렴), Prod: Pro 계열 (품질 우선).

**파일**: `ai/src/graphs/resume_parser/configuration.py`, `ai/src/graphs/jd_structuring/configuration.py`, `ai/src/graphs/question_gen/configuration.py`

---

## 4. 요약 (Web)

| 기능 | Development | Production |
|------|-------------|------------|
| Sentry | 꺼짐, DSN 없어도 OK | 켜짐, DSN 필수 |
| tRPC | 상세 console + loggerLink | Sentry만, console 최소화 |
| Webhook 서명 | 안 함 | 함 |
| Webhook URL 스킴 | http | https |
| PostHog | 꺼짐 | 켜짐 |
| Prisma | global 캐시 | 캐시 안 함 |
| Supabase Realtime 로그 | info | error |
| 에러 페이지 상세 | 표시 | 숨김 |
| /api/dev/test-file | 200 + PDF | 404 |

---

## 5. 요약 (AI)

| 그래프 | Development | Production |
|--------|-------------|------------|
| Resume Parser | gemini-3-flash-preview | gemini-3-pro-preview |
| JD Structuring | gemini-2.5-flash | gemini-2.5-pro |
| Question Gen | gemini-2.5-flash | gemini-3-pro-preview |
