# InterviewPreparation 생성 로직 리팩토링 계획

## 개요

**목적:** InterviewPreparation 생성 방식을 새로운 UI/UX에 맞게 변경

**변경 범위:**

- DB Schema 변경
- tRPC API 신규 생성 (기존 API 유지)
- LangGraph 연동 로직
- 프론트엔드 컴포넌트 연동

---

## 1. 변경 사항 요약

### 과거 방식 vs 새로운 방식

| 구분      | 과거 (InterviewCreationFlow)                  | 신규 (NewInterviewPrep)     |
| --------- | --------------------------------------------- | --------------------------- |
| UI 플로우 | 2단계 위자드                                  | 단일 페이지 폼              |
| 필수 입력 | companyName, jobTitle, jobDescription, resume | title, jobTitle, resume     |
| 선택 입력 | -                                             | experiences (이름 목록)     |
| JD 처리   | 필수 입력                                     | 보류 (향후 1:N 관계로 확장) |

### 필드 매핑

| UI 필드     | DB 필드             | AI Server 필드                | 비고            |
| ----------- | ------------------- | ----------------------------- | --------------- |
| title       | `title` (신규)      | -                             | 프로젝트 식별용 |
| jobTitle    | `jobTitle` (기존)   | `applied_position`            | 지원 직무       |
| experiences | - (저장 안함)       | `experience_names_to_analyze` | AI에만 전달     |
| resume      | `resumeFile` (기존) | `resume_file_path`            | 기존 유지       |

---

## 2. DB Schema 변경

### InterviewPreparation 테이블

```prisma
model InterviewPreparation {
  // 추가
  title String  // 필수, 프로젝트명

  // Deprecated (유지, 점진적 제거)
  companyName String?  // @deprecated - 향후 제거 예정, 새 API에서 미사용

  // 유지 (변경 없음)
  jobTitle       String?  // 지원 직무
  jobDescription String?  // 향후 JD 기능용 보류
}
```

### Migration 전략

1. `title` 필드 추가 (nullable로 시작)
2. 기존 데이터에 기본값 설정 (`jobTitle` 또는 생성일 기반)
3. `title`을 required로 변경
4. ~~`companyName` 필드 제거~~ → **유지 (Deprecation)**

### companyName Deprecation 전략

**영향 범위:** 29개 파일 (Generated 제외 24개)

| 단계 | 작업                                | 시점                |
| ---- | ----------------------------------- | ------------------- |
| 1    | DB 필드 유지 (optional)             | 현재 리팩토링       |
| 2    | 새 API (`create`)에서 미사용        | 현재 리팩토링       |
| 3    | 기존 코드에 `@deprecated` 주석 추가 | 현재 리팩토링       |
| 4    | UI에서 companyName 표시 제거/대체   | 추후 별도 작업      |
| 5.   | DB 필드 제거                        | 모든 사용처 정리 후 |

**장점:**

- 기존 기능 정상 동작 유지
- Breaking change 없음
- 점진적 마이그레이션 가능

---

## 3. tRPC API 신규 생성

### 전략: 새 라우터 생성 + 기존 API 유지

기존 `interviewWorkflow` 라우터는 유지하고, 새로운 `interviewPrep` 라우터를 생성한다.

| API                               | 상태              | 용도               |
| --------------------------------- | ----------------- | ------------------ |
| `interviewWorkflow.startAnalysis` | 유지 (deprecated) | 기존 플로우 호환성 |
| `interviewPrep.create`            | **신규**          | 새로운 생성 플로우 |

### 패턴: 새 라우터 디렉토리 생성

**전략:** 기존 `interview-preparation.ts`를 수정하지 않고, 새 라우터를 별도 디렉토리에 생성

```
routers/
├── interview-prep/           # ← 신규 생성
│   ├── router.ts            # interviewPrep 라우터
│   └── schemas.ts           # 입력/출력 스키마
├── interview-preparation.ts  # 기존 유지 (조회/수정 등)
├── interview-workflow/       # 기존 유지 (deprecated)
├── user.ts
└── file-upload.ts
```

**장점:**

- 기존 코드 영향 없음
- 생성 로직만 독립적으로 관리
- 향후 확장 용이 (JD 추가 등)

### `interviewPrep.create` 구현

```typescript
// src/server/api/routers/interview-prep/schemas.ts
export const createInput = z.object({
  title: z.string().min(1).max(50),
  jobTitle: z.string().min(1).max(50),
  experienceNames: z.array(z.string()).default([]),
  resumeFileId: z.cuid(),
  resumeFileUrl: z.url(),
  locale: z.string(),
})

// src/server/api/routers/interview-prep/router.ts
export const interviewPrepRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      // 서비스 호출
    }),
})
```

### 서비스 로직 분리 (필수)

**원칙:** 낮은 결합도, 높은 응집도

- tRPC에 의존하지 않는 순수 함수는 별도 서비스로 분리
- 복잡도와 관계없이 비즈니스 로직은 서비스 레이어에 위치

```
src/server/services/
└── interview-prep/
    └── create.service.ts  # 생성 관련 비즈니스 로직
```

**create.service.ts 책임:**

- `title` → DB `title` 필드에 저장
- `jobTitle` → DB `jobTitle` 필드에 저장
- `experienceNames` → LangGraph API에만 전달 (DB 저장 안함)
- LangGraph thread 생성 및 Resume Parsing 트리거
- JD structuring workflow: 호출 안함

**router (interview-prep/router.ts) 책임:**

- 입력 검증 (Zod 스키마)
- 인증/인가 (protectedProcedure)
- 서비스 호출 및 응답 반환

### root.ts 등록

```typescript
// src/server/api/root.ts
import { interviewPrepRouter } from './routers/interview-prep/router'

export const appRouter = createTRPCRouter({
  // 기존 라우터들...
  interviewPrep: interviewPrepRouter, // ← 신규 추가
})
```

---

## 4. LangGraph 연동 변경

### Contract Schema V2 신규 생성

기존 `ResumeParsingInputSchema`는 `structuredJd`를 필수로 요구하지만, 새로운 플로우에서는 JD Structuring을 스킵하므로 V2 스키마를 별도로 생성한다.

**파일:** `src/server/services/ai/contracts/schemas/resumeParsingV2.ts`

```typescript
// V2 Input: AI Server InputState와 1:1 매핑
export const ResumeParsingV2InputSchema = z.object({
  resumeFilePath: z.string(),
  appliedPosition: z.string(),
  experienceNamesToAnalyze: z.array(z.string()).default([]),
})

// Output: 기존 스키마 재사용
export { ResumeParseResultSchema } from './resumeParsing'
```

**장점:**

- 기존 `resumeParsing.ts` 스키마 영향 없음
- `interviewWorkflow.startAnalysis` (기존 API) 정상 동작 유지
- 명확한 버전 분리로 유지보수 용이

### Resume Parser 입력

```python
# AI Server: resume_parser/state.py InputState
{
  "resume_file_path": resumeFileUrl,
  "applied_position": jobTitle,  # UI의 jobTitle 필드
  "experience_names_to_analyze": experienceNames,  # UI의 experiences
}
```

### Workflow 흐름 변경

**변경 전:**

```
startAnalysis → JD Structuring → Resume Parsing → Question Generation
```

**변경 후:**

```
startAnalysis → Resume Parsing → Question Generation
```

- JD Structuring: 스킵 (향후 별도 API로 분리 예정)

---

## 5. 프론트엔드 변경

### NewInterviewPrep.tsx 연동 작업

1. Form 제출 핸들러 구현
2. `api.interviewPrep.create` mutation 연결
3. 성공 시 대시보드로 리다이렉트
4. 에러 핸들링 구현

### 제거 대상 컴포넌트

- `InterviewCreationFlow.tsx` (사용 중지됨)
- `JobPostingForm.tsx` (더 이상 사용 안함)
- 관련 step indicator 로직

---

## 6. 리팩토링 체크리스트

### Phase 1: DB Schema 변경

- [x] Migration 파일 생성 (`title` 추가)
- [x] 기존 데이터에 `title` 기본값 설정 스크립트 작성/실행
- [x] `title` 필드를 required로 변경하는 migration 추가
- [x] Prisma schema에 `companyName` deprecated 주석 추가
- [x] Prisma Client 재생성 (`pnpm db:generate`)
- [x] 타입 체크 통과 확인

### Phase 2: Backend API 신규 생성

- [x] `src/server/api/routers/interview-prep/` 디렉토리 생성
- [x] `interview-prep/schemas.ts` 생성 (`createInput` 스키마)
- [x] `interview-prep/router.ts` 생성 (`create` procedure)
- [x] `src/server/services/interview-prep/create.service.ts` 생성
- [x] 서비스: DB 저장 로직 구현 (title, jobTitle)
- [x] 서비스: LangGraph 호출 로직 구현 (`experience_names_to_analyze` 전달)
- [x] `root.ts`에 `interviewPrepRouter` 등록
- [x] 타입 체크 통과 확인
- [x] Contract Schema 신규 생성 (`resumeParsingV2.ts`) - 기존 스키마 영향 없음

### Phase 3: Frontend 연동

- [x] `NewInterviewPrep.tsx`에 API 연동 로직 추가
- [x] Form validation 구현 (title 필수, jobTitle 필수, PDF만 허용)
- [x] 파일 업로드 → API 제출 플로우 구현 (useFileUpload 훅 재사용)
- [x] 에러 핸들링 및 로딩 상태 구현 (Inline + Toast 이중 전략)
- [x] 성공 시 리다이렉트 구현 (/dashboard)

### Phase 4: 정리 및 검증

- [x] `InterviewCreationFlow.tsx` deprecate 주석 추가
- [x] `interviewWorkflow.startAnalysis` deprecate 주석 추가
- [x] `pnpm check-all` 통과
- [x] E2E 플로우 수동 테스트 (새 API 경로)
- [x] 기존 InterviewPreparation 목록/상세 페이지 정상 동작 확인

### Phase 5: AI Server 확인 (필요시)

- [x] `resume_parser` InputState 필드 확인
- [x] `experience_names_to_analyze` 처리 로직 확인
- [x] Front ↔ AI 통합 테스트

---

## 7. 향후 고려사항 (Out of Scope)

- **JD 1:N 관계**: 하나의 InterviewPrep에 여러 JD 등록 기능
- **StructuredJD 테이블**: 현재 유지, 향후 활용 방안 결정 필요
- **JD Structuring Workflow**: 코드 보류, 별도 API로 분리 예정

---

## 8. 롤백 계획

문제 발생 시:

1. Migration rollback (`pnpm db:migrate rollback`)
2. `page.tsx`에서 `InterviewCreationFlow` 주석 해제
3. `NewInterviewPrep` 주석 처리

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                                                 |
| ---------- | ---- | ----------------------------------------------------------------------------------------- |
| 2025-11-28 | v1.0 | 초안 작성                                                                                 |
| 2025-11-28 | v1.1 | tRPC API 전략 변경: 기존 API 리팩토링 → 신규 API 생성                                     |
| 2025-11-28 | v1.2 | tRPC 패턴 변경: 폴더 분리 → 단일 파일 (Best Practice 적용)                                |
| 2025-11-28 | v1.3 | 서비스 레이어 분리 필수화 (낮은 결합도, 높은 응집도)                                      |
| 2025-11-28 | v1.4 | companyName 처리: 즉시 제거 → Deprecation 전략으로 변경                                   |
| 2025-11-28 | v1.5 | UI/API 필드명 통일: role → jobTitle (DB 필드명과 일치)                                    |
| 2025-11-28 | v1.6 | tRPC 패턴 변경: 단일 파일 → 새 라우터 디렉토리 (`interview-prep/`)                        |
| 2025-11-28 | v1.7 | Phase 2 완료: Contract Schema V2 신규 생성 (`resumeParsingV2.ts`) - 기존 스키마 영향 없음 |
| 2025-11-28 | v1.8 | Phase 3 완료: Frontend 연동 (useFileUpload 훅 재사용, API 연동, 에러 처리)                |
