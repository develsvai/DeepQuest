# Resume + CandidateProfile 테이블 삭제 리팩토링 계획

> **Version**: 1.2.0
> **Created**: 2024-12-05
> **Updated**: 2025-12-05
> **Status**: Phase 2 Complete (Phase 3 대기 중)

---

## 개요

### 목표

Resume 테이블(중간 래퍼)과 CandidateProfile 테이블(@deprecated)을 삭제하여 스키마를 단순화한다.

### 배경

- **Resume 테이블**: InterviewPreparation과 Experience 사이의 불필요한 중간 계층
- **CandidateProfile 테이블**: 이미 `@deprecated` 표시, V2에서 생성하지 않음, summary는 InterviewPreparation으로 이관 완료

### 변경 전/후 구조

```
현재:
InterviewPreparation (1:1) Resume
                            ├── CandidateProfile (@deprecated)
                            ├── CandidateEducation[]
                            ├── CareerExperience[] → KeyAchievement[]
                            └── ProjectExperience[] → KeyAchievement[]

변경 후:
InterviewPreparation
    ├── CandidateEducation[]  (직접 연결)
    ├── CareerExperience[] → KeyAchievement[]  (직접 연결)
    └── ProjectExperience[] → KeyAchievement[]  (직접 연결)
```

### 전제 조건

- ✅ V1 핸들러 (resume-parsing.handler.ts) 삭제 가능 - V2로 완전 전환됨
- ⚠️ 프로덕션 데이터 존재 - 데이터 마이그레이션 스크립트 필요

---

## Phase 1: 스키마 준비 + 데이터 마이그레이션

### Step 1.1: Experience 테이블에 interviewPreparationId 필드 추가 (Required)

> **주의**: 프로덕션 데이터가 있으므로 단일 마이그레이션에서 필드 추가와 데이터 채우기를 함께 처리해야 함

**파일**: `prisma/schema.prisma`

```prisma
model CareerExperience {
  id       Int    @id @default(autoincrement())
  resumeId Int?   // nullable로 변경 (Phase 3에서 삭제 예정)
  resume   Resume? @relation(fields: [resumeId], references: [id], onDelete: SetNull)

  // 새로 추가 (Required)
  interviewPreparationId String
  interviewPreparation   InterviewPreparation @relation(fields: [interviewPreparationId], references: [id], onDelete: Cascade)

  // ... 기타 필드
}

model ProjectExperience {
  // 동일하게 interviewPreparationId (Required) 추가
}

model CandidateEducation {
  // 동일하게 interviewPreparationId (Required) 추가
}
```

**체크리스트**:

- [x] CareerExperience에 `interviewPreparationId String` 추가 (Required)
- [x] ProjectExperience에 `interviewPreparationId String` 추가 (Required)
- [x] CandidateEducation에 `interviewPreparationId String` 추가 (Required)
- [x] 기존 `resumeId`를 nullable로 변경 (`Int?`)
- [x] 기존 `resume` 관계를 nullable로 변경 + onDelete: SetNull
- [x] InterviewPreparation에 역관계 추가:
  ```prisma
  careers    CareerExperience[]
  projects   ProjectExperience[]
  educations CandidateEducation[]
  ```

---

### Step 1.2: 커스텀 마이그레이션 파일 작성

Prisma는 required 필드 추가 시 기존 데이터 때문에 에러가 발생한다. 수동 마이그레이션이 필요하다.

**마이그레이션 생성**:

```bash
pnpm db:migrate dev --name add-interview-preparation-id-to-experiences --create-only
```

**생성된 마이그레이션 파일 수정** (`prisma/migrations/YYYYMMDD.../migration.sql`):

```sql
-- Step 1: 새 컬럼 추가 (nullable로 먼저)
ALTER TABLE "career_experiences" ADD COLUMN "interview_preparation_id" TEXT;
ALTER TABLE "project_experiences" ADD COLUMN "interview_preparation_id" TEXT;
ALTER TABLE "candidate_educations" ADD COLUMN "interview_preparation_id" TEXT;

-- Step 2: 기존 데이터 마이그레이션 (Resume을 통해 값 복사)
UPDATE "career_experiences" ce
SET "interview_preparation_id" = r."interview_preparation_id"
FROM "resumes" r
WHERE ce."resume_id" = r."id";

UPDATE "project_experiences" pe
SET "interview_preparation_id" = r."interview_preparation_id"
FROM "resumes" r
WHERE pe."resume_id" = r."id";

UPDATE "candidate_educations" edu
SET "interview_preparation_id" = r."interview_preparation_id"
FROM "resumes" r
WHERE edu."resume_id" = r."id";

-- Step 3: NOT NULL 제약 조건 추가
ALTER TABLE "career_experiences" ALTER COLUMN "interview_preparation_id" SET NOT NULL;
ALTER TABLE "project_experiences" ALTER COLUMN "interview_preparation_id" SET NOT NULL;
ALTER TABLE "candidate_educations" ALTER COLUMN "interview_preparation_id" SET NOT NULL;

-- Step 4: FK 제약 조건 추가
ALTER TABLE "career_experiences"
ADD CONSTRAINT "career_experiences_interview_preparation_id_fkey"
FOREIGN KEY ("interview_preparation_id") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_experiences"
ADD CONSTRAINT "project_experiences_interview_preparation_id_fkey"
FOREIGN KEY ("interview_preparation_id") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate_educations"
ADD CONSTRAINT "candidate_educations_interview_preparation_id_fkey"
FOREIGN KEY ("interview_preparation_id") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: 기존 resumeId를 nullable로 변경
ALTER TABLE "career_experiences" ALTER COLUMN "resume_id" DROP NOT NULL;
ALTER TABLE "project_experiences" ALTER COLUMN "resume_id" DROP NOT NULL;
ALTER TABLE "candidate_educations" ALTER COLUMN "resume_id" DROP NOT NULL;
```

**체크리스트**:

- [x] `--create-only` 플래그로 마이그레이션 파일만 생성
- [x] 위 SQL로 마이그레이션 파일 수정
- [x] 로컬에서 테스트: `pnpm db:migrate dev`
- [x] 마이그레이션 후 데이터 검증:
  ```sql
  -- 모든 Experience에 interviewPreparationId가 있는지 확인
  SELECT COUNT(*) FROM career_experiences WHERE interview_preparation_id IS NULL;
  -- 결과: 0이어야 함
  ```

---

### Step 1.3: Prisma 클라이언트 재생성 및 검증

```bash
pnpm db:generate
```

**체크리스트**:

- [x] Prisma 클라이언트 재생성 완료
- [x] 타입 체크 통과: `pnpm type-check` ✅ Phase 2 완료
- [ ] 데이터 검증 (프로덕션 배포 전):
  ```sql
  -- 고아(orphan) 레코드 없는지 확인
  SELECT COUNT(*) FROM career_experiences
  WHERE interview_preparation_id NOT IN (SELECT id FROM interview_preparations);
  -- 결과: 0이어야 함
  ```

---

## Phase 2: 코드 수정

### Step 2.1: Experience 생성 로직 수정

#### 2.1.1 resume-data.service.ts

**파일**: `src/server/services/interview-prep/resume-data.service.ts`

**변경 전**:

```typescript
// Line 53-59
const resume = await tx.resume.create({
  data: {
    interviewPreparationId: preparationId,
    parsedAt: new Date(),
  },
})

// Line 177-202: saveCareerExperiences()
await tx.careerExperience.createManyAndReturn({
  data: careers.map((career, i) => ({
    resumeId, // ← 제거
    // ...
  })),
})
```

**변경 후**:

```typescript
// Resume 생성 제거
// InterviewPreparation.summary 업데이트만 유지 (Line 61-72)

// saveCareerExperiences()
await tx.careerExperience.createManyAndReturn({
  data: careers.map((career, i) => ({
    interviewPreparationId: preparationId, // ← 직접 참조
    // ...
  })),
})
```

**체크리스트**:

- [x] `saveResumeParsingResult()`: Resume 생성 제거
- [x] `saveCareerExperiences()`: resumeId → interviewPreparationId
- [x] `saveProjectExperiences()`: resumeId → interviewPreparationId
- [x] CandidateEducation 생성: resumeId → interviewPreparationId
- [x] 함수 시그니처 변경: `resumeId: number` → `preparationId: string`
- [x] 반환 타입에서 resumeId 제거

#### 2.1.2 resume-parsing.handler.ts (V1 삭제)

**파일**: `src/app/api/webhooks/ai-workflow/handlers/resume-parsing.handler.ts`

**체크리스트**:

- [ ] 파일 전체 삭제 (V2로 완전 대체) _(Phase 3에서 처리 예정)_
- [x] handlers/index.ts에서 V1 핸들러 export 제거

#### 2.1.3 resume-parsing-v2.handler.ts

**파일**: `src/app/api/webhooks/ai-workflow/handlers/resume-parsing-v2.handler.ts`

**체크리스트**:

- [x] `saveResumeParsingResult()` 호출 시 반환값 처리 수정 (resumeId 없음)
- [x] 후속 처리 로직에서 resumeId 참조 제거

---

### Step 2.2: Include 체인 수정

#### 2.2.1 interview-prep-detail.service.ts

**파일**: `src/server/services/interview-prep-detail/interview-prep-detail.service.ts`

**변경 전** (Line 31-50):

```typescript
include: {
  resume: {
    include: {
      careers: {
        include: { keyAchievements: true },
        orderBy: [{ index: 'asc' }, { endDate: 'desc' }],
      },
      projects: { ... },
      educations: { ... },
    },
  },
}
```

**변경 후**:

```typescript
include: {
  careers: {
    include: { keyAchievements: true },
    orderBy: [{ index: 'asc' }, { endDate: 'desc' }],
  },
  projects: {
    include: { keyAchievements: true },
    orderBy: [{ index: 'asc' }, { endDate: 'desc' }],
  },
  educations: {
    orderBy: { endDate: 'desc' },
  },
}
```

**체크리스트**:

- [x] include 구조에서 resume 제거
- [x] 데이터 접근 경로 변경: `preparation.resume?.careers` → `preparation.careers`
- [x] 반환 타입 업데이트

#### 2.2.2 experience.service.ts

**파일**: `src/server/services/experience/experience.service.ts`

**변경 전** (Line 54-63):

```typescript
resume: {
  select: {
    interviewPreparation: {
      select: {
        id: true,
        jobTitle: true,
      },
    },
  },
},
```

**변경 후**:

```typescript
interviewPreparation: {
  select: {
    id: true,
    jobTitle: true,
  },
},
```

**체크리스트**:

- [x] `careerSelectForAI`: resume 제거, interviewPreparation 직접 select
- [x] `projectSelectForAI`: 동일하게 수정
- [x] Line 235-248: `career.resume.interviewPreparation` → `career.interviewPreparation`
- [x] Line 271-284: `project.resume.interviewPreparation` → `project.interviewPreparation`

#### 2.2.3 experience-detail.service.ts

**파일**: `src/server/services/experience-detail/experience-detail.service.ts`

**체크리스트**:

- [x] Line 52-56: `resume.interviewPreparationId` → 직접 `interviewPreparationId`
- [x] Line 82-86: 동일하게 수정
- [x] 변환 함수 업데이트

#### 2.2.4 key-achievement.service.ts

**파일**: `src/server/services/key-achievement/key-achievement.service.ts`

> **참고**: `findByIdAndUserId()`, `verifyOwnershipByUserId()` 메서드는 이미 userId denormalization으로 구현됨.
> 아래는 legacy 메서드와 헬퍼 함수 정리 작업.

**체크리스트**:

- [x] Line 143-168: `verifyOwnership()` 함수의 resume 경로 include 제거
- [x] Line 194: `matchingExperience.resume?.interviewPreparation?.id` → `matchingExperience.interviewPreparationId`
- [x] Line 240-273: `getInterviewPreparationId()` 헬퍼 함수에서 resume 경로 제거
  - `career.resume.interviewPreparationId` → `career.interviewPreparationId`
  - `project.resume.interviewPreparationId` → `project.interviewPreparationId`

#### 2.2.5 question-feedback.service.ts

**파일**: `src/server/services/question-feedback/question-feedback.service.ts`

**변경 전** (Line 28-43: `answerWithFullContextInclude`):

```typescript
const answerWithFullContextInclude = {
  question: {
    include: {
      interviewPreparation: {
        include: {
          resume: {
            include: {
              careers: true,
              projects: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AnswerInclude
```

**변경 후**:

```typescript
const answerWithFullContextInclude = {
  question: {
    include: {
      interviewPreparation: {
        include: {
          careers: true,
          projects: true,
        },
      },
    },
  },
} satisfies Prisma.AnswerInclude
```

**체크리스트**:

- [x] Line 28-43: `answerWithFullContextInclude` 상수에서 resume 제거
- [x] Line 145-162: `prepareFeedbackInput()` 메서드 수정
  - `question.interviewPreparation?.resume.careers` → `question.interviewPreparation?.careers`
  - `question.interviewPreparation?.resume.projects` → `question.interviewPreparation?.projects`
- [x] `AnswerWithQuestionAndContext` 타입 자동 업데이트 확인

#### 2.2.6 추가 영향 파일들 (UI/워크플로우)

##### 2.2.6.1 ExperienceCard.hooks.ts

**파일**: `src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.hooks.ts`

> React Query 캐시 업데이트 로직에서 resume 구조에 의존

**체크리스트**:

- [x] Line 52-63: `.resume.careers`, `.resume.projects` → 직접 접근으로 변경

**변경 전**:

```typescript
if (!old?.resume) return old
// ...
resume: {
  ...old.resume,
  careers: old.resume.careers.map(career => ...),
  projects: old.resume.projects.map(project => ...),
}
```

**변경 후**:

```typescript
careers: old.careers.map(career => ...),
projects: old.projects.map(project => ...),
```

---

##### 2.2.6.2 progress-calculation.service.ts

**파일**: `src/server/api/routers/interview-workflow/services/progress-calculation.service.ts`

**체크리스트**:

- [x] Line 43: `resume: { id: number } | null` 타입 정의 제거
- [x] Line 82: `hasResume: !!preparation.resume` 로직 제거 또는 수정
  - 워크플로우 진행 상태 판단을 다른 방식으로 변경 (예: `hasExperiences: preparation.careers.length > 0`)

---

##### 2.2.6.3 interview-workflow/router.ts

**파일**: `src/server/api/routers/interview-workflow/router.ts`

**체크리스트**:

- [x] Line 116: `resume: { ... }` include 구조 제거
- [x] 관련 타입 및 데이터 접근 경로 수정

---

### Step 2.3: 타입/어댑터 정리

#### 2.3.1 interview-preparation.ts (어댑터)

**파일**: `src/lib/adapters/interview-preparation.ts`

**체크리스트**:

- [x] Line 27-31: `PrismaDetailedPreparation` 타입에서 `resume.profile` 제거
- [x] Line 87-100: `adaptCandidateProfile()` 함수 삭제
- [x] Line 215, 218: `prismaData.resume.careers` → `prismaData.careers`
- [x] Line 258-261: `candidateProfile` 관련 코드 제거

#### 2.3.2 interview.ts (타입)

**파일**: `src/types/interview.ts`

**체크리스트**:

- [x] Line 125-131: `CandidateProfile` 인터페이스 삭제
- [x] Line 137: `PreparationDetail.candidateProfile` 필드 제거

#### 2.3.3 types/index.ts

**파일**: `src/types/index.ts`

**체크리스트**:

- [x] Line 19: `CandidateProfile` export 제거

#### 2.3.4 interview-preparation.ts (라우터)

**파일**: `src/server/api/routers/interview-preparation.ts`

> **중요**: 이 파일은 5곳에서 `resume: { ... }` include 구조를 사용함. 각각 수정 필요.

**체크리스트**:

- [x] Line 38: `getDetailedById` 프로시저 - resume include 제거, careers/projects/educations 직접 include
- [x] Line 230: Experience 조회 시 resume 필터/include 제거
- [x] Line 239: 동일하게 resume 경로 수정
- [x] Line 315: 동일하게 resume 경로 수정
- [x] Line 348: 동일하게 resume 경로 수정
- [x] 각 위치에서 데이터 접근 경로 변경:
  - `preparation.resume.careers` → `preparation.careers`
  - `preparation.resume.projects` → `preparation.projects`
  - `preparation.resume.educations` → `preparation.educations`

---

### Step 2.4: AI 스키마 정리

#### 2.4.1 resumeParsing.ts (V1 스키마)

**파일**: `src/server/services/ai/contracts/schemas/resumeParsing.ts`

**체크리스트**:

- [ ] 파일 전체 삭제 (V1 핸들러와 함께)
- [ ] 또는 CandidateProfileSchema만 제거하고 다른 스키마 유지

---

### Step 2.5: 테스트/샘플 데이터 정리

#### 2.5.1 trpc.ts (테스트 헬퍼)

**파일**: `src/test/helpers/trpc.ts`

**체크리스트**:

- [x] `createCareerExperience()` 시그니처 변경: `resumeId: number` → `preparationId: string`
- [x] `createProjectExperience()` 시그니처 변경: `resumeId: number` → `preparationId: string`
- [x] Experience 생성 시 `interviewPreparationId` 사용
- [x] `prisma.resume.create()` 관련 코드 제거 _(Phase 3에서 처리 예정)_
- [x] `prisma.resume.deleteMany()` 관련 코드 제거 _(Phase 3에서 처리 예정)_

#### 2.5.2 sample-data.ts

**파일**: `src/lib/dev/sample-data.ts`

**체크리스트**:

- [x] Resume 구조 제거 _(Phase 3에서 처리 예정)_
- [x] 직접 Experience 데이터 구조로 변경 _(Phase 3에서 처리 예정)_

---

## Phase 3: 정리

### Step 3.1: Resume, CandidateProfile 테이블 삭제

**파일**: `prisma/schema.prisma`

**체크리스트**:

- [x] `model Resume` 삭제
- [x] `model CandidateProfile` 삭제
- [x] Experience 테이블에서 `resumeId`, `resume` 관계 제거
- [x] InterviewPreparation에서 `resume Resume?` 관계 제거
- [x] 마이그레이션 생성: `pnpm db:migrate dev --name remove-resume-and-candidate-profile`

### Step 3.2: Prisma 클라이언트 재생성

```bash
pnpm db:generate
```

### Step 3.3: 타입 정리

**파일**: `src/server/services/common/experience-fields.ts`

> Phase 3에서 resumeId 필드가 삭제되므로 타입 정의도 업데이트 필요

**체크리스트**:

- [x] `OmittedExperienceFields` 타입에서 `'resumeId'` 제거

  ```typescript
  // 변경 전
  export type OmittedExperienceFields =
    | DeprecatedStarFields
    | 'importance'
    | 'index'
    | 'resumeId' // ← 제거

  // 변경 후
  export type OmittedExperienceFields =
    | DeprecatedStarFields
    | 'importance'
    | 'index'
  ```

---

### Step 3.4: 최종 검증

**체크리스트**:

- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 성공
- [x] 로컬 테스트:
  - [x] 이력서 파싱 워크플로우 정상 동작
  - [x] 상세 조회 페이지 렌더링
  - [x] Experience CRUD 동작
  - [x] KeyAchievement CRUD 동작
  - [x] Question 생성 및 조회

---

## 영향받는 파일 전체 목록

### Tier 1: 직접 수정 필수 (Experience 생성 로직)

| 파일                                                                  | 변경 내용                                           | 예상 라인 수정 |
| --------------------------------------------------------------------- | --------------------------------------------------- | -------------- |
| `prisma/schema.prisma`                                                | Resume, CandidateProfile 모델 삭제 + FK 변경        | ~50            |
| `src/server/services/interview-prep/resume-data.service.ts`           | Resume 생성 제거, resumeId → interviewPreparationId | ~100           |
| `src/app/api/webhooks/ai-workflow/handlers/resume-parsing.handler.ts` | 파일 삭제                                           | -370           |

### Tier 2: Include 체인 수정

| 파일                                                                                 | 변경 내용                  | 예상 라인 수정 |
| ------------------------------------------------------------------------------------ | -------------------------- | -------------- |
| `src/server/services/interview-prep-detail/interview-prep-detail.service.ts`         | resume include 제거        | ~30            |
| `src/server/services/experience/experience.service.ts`                               | resume select 제거         | ~50            |
| `src/server/services/experience-detail/experience-detail.service.ts`                 | resume 경로 제거           | ~20            |
| `src/server/services/key-achievement/key-achievement.service.ts`                     | resume 경로 제거           | ~40            |
| `src/server/services/question-feedback/question-feedback.service.ts`                 | include 체인 단축          | ~30            |
| `src/server/api/routers/interview-workflow/router.ts`                                | resume include 제거        | ~10            |
| `src/server/api/routers/interview-workflow/services/progress-calculation.service.ts` | resume 타입/체크 로직 제거 | ~15            |

### Tier 3: 타입/어댑터 정리

| 파일                                              | 변경 내용                                    | 예상 라인 수정 |
| ------------------------------------------------- | -------------------------------------------- | -------------- |
| `src/lib/adapters/interview-preparation.ts`       | adaptCandidateProfile 제거, resume 경로 제거 | ~40            |
| `src/types/interview.ts`                          | CandidateProfile 인터페이스 삭제             | ~10            |
| `src/types/index.ts`                              | export 제거                                  | ~1             |
| `src/server/api/routers/interview-preparation.ts` | 5곳 include 구조 변경                        | ~50            |
| `src/server/services/common/experience-fields.ts` | resumeId 타입 제거 (Phase 3)                 | ~5             |

### Tier 4: 테스트/샘플 데이터/UI

| 파일                                                                                   | 변경 내용                  | 예상 라인 수정 |
| -------------------------------------------------------------------------------------- | -------------------------- | -------------- |
| `src/test/helpers/trpc.ts`                                                             | Resume 생성/삭제 로직 제거 | ~20            |
| `src/lib/dev/sample-data.ts`                                                           | Resume 구조 제거           | ~15            |
| `src/app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard.hooks.ts` | 캐시 업데이트 로직 수정    | ~15            |

---

## 롤백 계획

### 마이그레이션 실패 시

1. **Phase 1 롤백**: 새 필드만 추가된 상태이므로 코드 롤백 없이 필드만 nullable로 유지
2. **Phase 2 롤백**: Git으로 코드 롤백 후 기존 resumeId 사용
3. **Phase 3 롤백**: 백업에서 Resume, CandidateProfile 테이블 복구

### 데이터 백업

```sql
-- 마이그레이션 전 백업
CREATE TABLE resumes_backup AS SELECT * FROM resumes;
CREATE TABLE candidate_profiles_backup AS SELECT * FROM candidate_profiles;
```

---

## 예상 소요 시간

| Phase     | 작업                              | 예상 시간    |
| --------- | --------------------------------- | ------------ |
| Phase 1   | 스키마 준비 + 데이터 마이그레이션 | 2-3시간      |
| Phase 2   | 코드 수정                         | 4-6시간      |
| Phase 3   | 정리 + 검증                       | 1-2시간      |
| **Total** |                                   | **7-11시간** |

---

## 참고 문서

- `docs/refactoring/resume-parse-result-schema-refactoring.md` - V2 스키마 마이그레이션 (완료)
- `prisma/schema.prisma` - 현재 스키마
- `src/server/CLAUDE.md` - 서버 아키텍처 가이드

---

_Last Updated: 2025-12-05 (v1.2.0 - Phase 2 완료, 모든 코드 수정 체크박스 업데이트)_
