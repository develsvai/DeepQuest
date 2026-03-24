# 배포 후 개선 포인트 (PR/이슈용)

배포 환경에서 발견한 개선 사항입니다. 개발자 분께 PR 띄우실 때 함께 전달하시면 됩니다.

---

## 1. 예외 처리 애매한 부분 / 응답 오류

**현상**  
- 일부 구간에서 응답이 잘못 오는 경우가 있음  
- 정확한 재현은 테스트 필요

**참고 코드**  
- tRPC 에러 변환: `web/src/server/services/common/trpc-error-handler.ts`  
  - 도메인 에러 → `TRPCError`로 변환 시 `error.message` 그대로 전달  
- 라우터에서 `handleServiceError` 사용하는 모든 procedure  
- Clerk 웹훅 등 외부 연동 구간의 try/catch 및 응답 코드(2xx vs 4xx/5xx) 일관성 점검

**제안**  
- 실패 시나리오별로 테스트 케이스 추가 (특히 에러 경로)  
- 에러 코드/타입별로 응답 형식이 일관되는지 검토  

---

## 2. 사용자 노출 메시지가 너무 추상적임

**현상**  
- UI에 `error.message`를 그대로 노출하는 부분이 있음  
- 기술/내부 메시지가 사용자에게 보임

**참고 코드**  
- 폼 에러: `web/src/components/ui/form.tsx`  
  - `FormMessage`에서 `error?.message` 그대로 표시  
- 인터뷰 준비 생성 실패: `web/src/app/[locale]/(protected)/interview-prep/new/_components/NewInterviewPrep.hooks.ts`  
  - `toast.error(error.message || tErrors('createFailed'))`  
- 질문 풀이/제출 실패: `QuestionSolveBody.tsx`  
  - `description: error.message` 로 토스트  
- tRPC → 클라이언트: `trpc-error-handler.ts`에서 도메인 에러의 `message`가 그대로 내려감  

**제안**  
- 에러 **코드**(또는 타입) 기준으로 i18n 키 매핑  
- 사용자용 메시지는 `locales/ko/`, `locales/en/`에 정의하고, `error.message`는 로그/모니터링용으로만 사용  
- BAD_REQUEST / NOT_FOUND / INTERNAL_SERVER_ERROR 등 코드별로 한 문장씩 사용자 문구 정의  

---

## 3. 경험 추가 – 회사 설명(컨텍스트) 크기 제한이 너무 작음

**현상**  
- “경험 추가”에서 회사 설명(회사 요구사항 등)에 넣으려 했는데 **글자 수 제한 때문에 입력이 안 됨**

**참고 코드**  
- 스키마 제한: `web/src/server/api/routers/interview-preparation/schema.ts`  
  - `createCareerInputSchema` / `updateCareerInputSchema`  
  - `companyDescription: z.string().max(500, 'Company description is too long')`  
  - 현재 **500자** 상한  
- DB/Prisma: `CareerExperience.companyDescription` (TEXT라 DB 상한은 충분할 가능성 높음)  
- AI 컨텍스트: `web/src/server/services/ai/contracts/schemas/common.ts` 등에서 `companyDescription` 사용 시 토큰 제한만 고려하면 됨  

**제안**  
- 회사 요구사항/JD 요약 용도로 500자로는 부족하다는 피드백이 있으므로,  
  - 예: **1000~2000자** 정도로 상한 완화 검토  
  - 완화 시 AI 호출 시 토큰/비용 영향만 점검  

---

## 4. (추가 발견 시)

배포/운영 중 추가로 발견되는 개선점은 여기에 번호 이어서 적어두시면 됩니다.

---

## PR 시 함께 포함된 변경

- **Clerk 웹훅 멱등 처리**  
  - `user.created` → `upsert`  
  - `user.deleted` → `deleteMany`  
  - 재시도 시 500 반복으로 Failed 쌓이던 문제 완화  
  - 파일: `web/src/server/services/user/user.service.ts`
