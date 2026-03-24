# Deprecated 필드 제거 리팩토링 계획

> **Version**: 1.0.0
> **Created**: 2025-12-17
> **Status**: Planning

---

## 개요

### 목표

Prisma 스키마에서 `@deprecated` 표시된 필드들과 관련 코드를 완전히 제거하여 코드베이스를 정리한다.
마이그레이션 시 해당 컬럼들을 **DROP**하는 것을 원칙으로 한다.

### 배경

- **InterviewPreparation**: `companyName`, `jobDescription`은 `title`과 `StructuredJD`로 대체됨
- **threadId**: LangGraph thread 재사용 기능 폐지로 불필요
- **totalQuestions/completedQuestions**: 동적 계산으로 대체 (데이터 정합성 문제 해결)
- **STAR 필드**: `KeyAchievement` 모델의 `problems`, `actions`, `results`, `reflections`로 완전 대체
- **importance**: 별점 기능 미사용으로 폐지
- **Question 필드**: `keyAchievementId` 중심 아키텍처로 전환 완료

### 제거 대상 요약

| 모델                 | 필드                                    | 제거 이유                            |
| -------------------- | --------------------------------------- | ------------------------------------ |
| InterviewPreparation | `companyName`                           | `title` 사용                         |
| InterviewPreparation | `jobDescription`                        | `StructuredJD`로 이동                |
| InterviewPreparation | `threadId`                              | thread 재사용 불필요                 |
| InterviewPreparation | `totalQuestions`                        | 동적 계산으로 대체                   |
| InterviewPreparation | `completedQuestions`                    | 동적 계산으로 대체                   |
| CareerExperience     | `situation`, `task`, `action`, `result` | `KeyAchievement`로 대체              |
| CareerExperience     | `importance`                            | 미사용 기능                          |
| ProjectExperience    | `situation`, `task`, `action`, `result` | `KeyAchievement`로 대체              |
| ProjectExperience    | `importance`                            | 미사용 기능                          |
| Question             | `interviewPreparationId`                | `keyAchievementId` 경로로 추적       |
| Question             | `experienceType`                        | `KeyAchievement`에서 파생            |
| Question             | `experienceId`                          | `KeyAchievement`에서 파생            |
| Question             | `guideAnswer`                           | `Feedback.guideAnswer`로 이동        |
| Enum                 | `ImportanceLevel`                       | 전체 enum 삭제                       |
| Enum                 | `EmployeeType.EMPLOYEE`                 | `FULL_TIME`으로 마이그레이션 후 제거 |

### 전제 조건

- ✅ `KeyAchievement` 모델로 STAR 데이터 완전 이전됨
- ✅ `Feedback.guideAnswer`로 가이드 답변 이전됨
- ✅ Question은 `keyAchievementId` 기반으로 생성됨
- ⚠️ 프로덕션 데이터 존재 - 백업 필수

---

## Phase 1: 코드 정리 (스키마 변경 전)

> **목표**: deprecated 필드 참조를 모두 제거하여 스키마 변경 후 타입 오류가 발생하지 않도록 준비

### Step 1.1: InterviewPreparation 필드 정리

#### 1.1.1 companyName, jobDescription 제거

**파일**: `src/server/api/routers/interview-workflow/services/preparation.service.ts`

```typescript
// 변경 전 (Line ~15-25)
const preparation = await tx.interviewPreparation.create({
  data: {
    userId,
    title,
    companyName, // ← 제거
    jobDescription, // ← 제거
    // ...
  },
})

// 변경 후
const preparation = await tx.interviewPreparation.create({
  data: {
    userId,
    title,
    // companyName, jobDescription은 StructuredJD에서 관리
  },
})
```

**체크리스트**:

- [ ] `preparation.service.ts`: `companyName`, `jobDescription` 파라미터 및 할당 제거
- [ ] `types.ts`: `JobPostingData` 타입에서 해당 필드 제거 (UI용 타입은 유지)

#### 1.1.2 threadId 제거

**파일**: `src/server/services/interview-preparation/preparation.service.ts`

**체크리스트**:

- [ ] `threadId` 필드 업데이트 로직 제거 (Line ~105)
- [ ] `WebhookEvent.threadId`가 유일한 소스가 되도록 확인

#### 1.1.3 totalQuestions, completedQuestions 제거

> 이 필드들은 이미 동적으로 계산되고 있음. 쓰기 작업만 제거하면 됨.

**영향 파일**:

| 파일                                                               | 변경 내용               | Lines    |
| ------------------------------------------------------------------ | ----------------------- | -------- |
| `src/server/services/interview-preparation/preparation.service.ts` | 필드 업데이트 로직 제거 | ~187-213 |
| `src/server/services/experience/experience.service.ts`             | 필드 업데이트 로직 제거 | ~312-394 |
| `src/server/services/key-achievement/key-achievement.service.ts`   | 필드 업데이트 로직 제거 | ~61-62   |

**체크리스트**:

- [ ] `preparation.service.ts`: `totalQuestions`, `completedQuestions` 업데이트 로직 제거
- [ ] `experience.service.ts`: 관련 업데이트 로직 제거
- [ ] `key-achievement.service.ts`: 관련 업데이트 로직 제거
- [ ] 읽기 로직은 계산된 값 사용 확인 (이미 구현됨)

---

### Step 1.2: Experience STAR 필드 정리

#### 1.2.1 situation, task, action, result 배열 할당 제거

**파일**: `src/server/services/interview-preparation/preparation.service.ts`

```typescript
// 변경 전 (Line ~412-415, ~466-469)
await tx.careerExperience.createManyAndReturn({
  data: careers.map(career => ({
    // ...
    situation: [], // ← 제거
    task: [], // ← 제거
    action: [], // ← 제거
    result: [], // ← 제거
  })),
})

// 변경 후
await tx.careerExperience.createManyAndReturn({
  data: careers.map(career => ({
    // STAR 필드 제거됨 - KeyAchievement 사용
  })),
})
```

**체크리스트**:

- [ ] `saveCareerExperiences()`: STAR 배열 할당 제거 (Line ~412-415)
- [ ] `saveProjectExperiences()`: STAR 배열 할당 제거 (Line ~466-469)

#### 1.2.2 importance 필드 정리

**파일**: `src/server/services/experience/experience.service.ts`

```typescript
// 변경 전 (Line ~340, ~365)
const careerSelectForUI = {
  // ...
  importance: true, // ← 제거
}

// 변경 후
const careerSelectForUI = {
  // importance 제거됨
}
```

**체크리스트**:

- [ ] `experience.service.ts`: `careerSelectForUI`에서 `importance: true` 제거 (Line ~340)
- [ ] `experience.service.ts`: `projectSelectForUI`에서 `importance: true` 제거 (Line ~365)
- [ ] `preparation.service.ts`: omit 로직에서 importance 처리 확인 (Line ~180, ~205)

---

### Step 1.3: ImportanceLevel 관련 코드 제거

**파일**: `src/types/experience.ts`

```typescript
// 삭제할 코드 (Line ~47-73)
export { ImportanceLevel }

export function importanceToStars(importance: ImportanceLevel): 1 | 2 | 3 {
  // ...
}

export function starsToImportance(stars: 1 | 2 | 3): ImportanceLevel {
  // ...
}
```

**체크리스트**:

- [ ] `src/types/experience.ts`: `ImportanceLevel` re-export 및 유틸리티 함수 삭제
- [ ] `src/lib/db/utils/prisma-to-zod.ts`: `ImportanceLevelZod` 제거 (Line ~26, ~63)
- [ ] 사용처 검색하여 모든 참조 제거

---

### Step 1.4: Question deprecated 필드 정리

#### 1.4.1 interviewPreparationId 경로 제거

> `keyAchievementId` → `CareerExperience/ProjectExperience` → `InterviewPreparation` 경로로 추적

**파일**: `src/server/services/interview-preparation/preparation.service.ts`

**체크리스트**:

- [ ] `getExperienceQuestionCounts()`: `KeyAchievement` 경로로 쿼리 리팩토링 (Line ~814-836)
- [ ] Question 생성 시 `interviewPreparationId` 설정 제거

#### 1.4.2 experienceType, experienceId 정리

**파일**: `src/server/api/routers/question/schema.ts`

**체크리스트**:

- [ ] `listByExperienceSchema`: `keyAchievementId` 기반으로 수정
- [ ] Question 생성 시 `experienceType`, `experienceId` 설정 제거

#### 1.4.3 guideAnswer 정리 (Question 모델에서)

> `Feedback.guideAnswer`가 이미 사용 중. Question.guideAnswer는 참조만 제거하면 됨.

**체크리스트**:

- [ ] Question 모델에서 `guideAnswer` 필드 읽기/쓰기 제거 확인

---

### Step 1.5: 타입 정의 정리

**파일**: `src/server/services/common/experience-fields.ts`

```typescript
// 변경 전
type DeprecatedStarFields = 'situation' | 'task' | 'action' | 'result'
type OmittedExperienceFields =
  | DeprecatedStarFields
  | 'importance'
  | 'index'
  | 'interviewPreparationId'

// 변경 후 (Phase 3 이후)
type OmittedExperienceFields = 'index' | 'interviewPreparationId'
```

**체크리스트**:

- [ ] Phase 1에서는 타입 유지 (Prisma 스키마 변경 전까지)
- [ ] Phase 3 이후 `DeprecatedStarFields` 타입 삭제
- [ ] `OmittedExperienceFields`에서 `importance` 제거

---

## Phase 2: 마이그레이션 준비

### Step 2.1: 데이터 백업 SQL

> ⚠️ **중요**: 프로덕션 배포 전 반드시 백업 실행

```sql
-- 백업 테이블 생성
CREATE TABLE interview_preparations_deprecated_backup AS
SELECT id, company_name, job_description, thread_id, total_questions, completed_questions
FROM interview_preparations;

CREATE TABLE career_experiences_deprecated_backup AS
SELECT id, situation, task, action, result, importance
FROM career_experiences;

CREATE TABLE project_experiences_deprecated_backup AS
SELECT id, situation, task, action, result, importance
FROM project_experiences;

CREATE TABLE questions_deprecated_backup AS
SELECT id, interview_preparation_id, experience_type, experience_id, guide_answer
FROM questions;
```

**체크리스트**:

- [ ] 백업 SQL 실행 확인
- [ ] 백업 데이터 무결성 검증

---

### Step 2.2: EmployeeType 데이터 마이그레이션

```sql
-- EMPLOYEE → FULL_TIME 변환
UPDATE career_experiences
SET employee_type = 'FULL_TIME'
WHERE employee_type = 'EMPLOYEE';

-- 변환 확인
SELECT COUNT(*) FROM career_experiences WHERE employee_type = 'EMPLOYEE';
-- 결과: 0이어야 함
```

**체크리스트**:

- [ ] `EMPLOYEE` 사용 데이터 확인
- [ ] `FULL_TIME`으로 변환 실행
- [ ] 변환 완료 검증

---

### Step 2.3: 마이그레이션 파일 생성

```bash
pnpm db:migrate:create remove-deprecated-fields
```

**생성될 마이그레이션 SQL 구조**:

```sql
-- ============================================================
-- Step 1: 인덱스 삭제 (Question 모델)
-- ============================================================
DROP INDEX IF EXISTS "questions_interview_preparation_id_idx";
DROP INDEX IF EXISTS "questions_experience_type_experience_id_idx";
DROP INDEX IF EXISTS "questions_interview_preparation_id_experience_type_experience_id_idx";

-- ============================================================
-- Step 2: InterviewPreparation 컬럼 삭제
-- ============================================================
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "company_name";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "job_description";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "thread_id";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "total_questions";
ALTER TABLE "interview_preparations" DROP COLUMN IF EXISTS "completed_questions";

-- ============================================================
-- Step 3: CareerExperience 컬럼 삭제
-- ============================================================
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "situation";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "task";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "action";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "result";
ALTER TABLE "career_experiences" DROP COLUMN IF EXISTS "importance";

-- ============================================================
-- Step 4: ProjectExperience 컬럼 삭제
-- ============================================================
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "situation";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "task";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "action";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "result";
ALTER TABLE "project_experiences" DROP COLUMN IF EXISTS "importance";

-- ============================================================
-- Step 5: Question 컬럼 삭제
-- ============================================================
ALTER TABLE "questions" DROP COLUMN IF EXISTS "interview_preparation_id";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "experience_type";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "experience_id";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "guide_answer";

-- ============================================================
-- Step 6: ImportanceLevel enum 삭제
-- ============================================================
DROP TYPE IF EXISTS "ImportanceLevel";

-- ============================================================
-- Step 7: EmployeeType enum에서 EMPLOYEE 값 제거
-- (PostgreSQL은 enum 값 삭제가 복잡하므로 enum 재생성 필요)
-- ============================================================
-- Option A: 새 enum 생성 후 교체
CREATE TYPE "EmployeeType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT', 'FREELANCE');
ALTER TABLE "career_experiences" ALTER COLUMN "employee_type" TYPE "EmployeeType_new" USING "employee_type"::text::"EmployeeType_new";
DROP TYPE "EmployeeType";
ALTER TYPE "EmployeeType_new" RENAME TO "EmployeeType";
```

**체크리스트**:

- [ ] 마이그레이션 파일 생성
- [ ] SQL 검토 및 수정
- [ ] 로컬 환경에서 테스트

---

## Phase 3: 스키마 변경 실행

### Step 3.1: Prisma 스키마 수정

**파일**: `prisma/schema.prisma`

#### InterviewPreparation에서 제거

```prisma
model InterviewPreparation {
  // 삭제할 필드들:
  // /// @deprecated Use `title` for project display.
  // companyName    String?
  // /// @deprecated
  // jobDescription String?
  // threadId String?
  // totalQuestions      Int       @default(0)
  // completedQuestions  Int       @default(0)
}
```

#### CareerExperience/ProjectExperience에서 제거

```prisma
model CareerExperience {
  // 삭제할 필드들:
  // /// @deprecated Use keyAchievements relation instead
  // situation String[]
  // task      String[]
  // action    String[]
  // result    String[]
  // importance ImportanceLevel @default(MEDIUM)
}

model ProjectExperience {
  // 동일하게 삭제
}
```

#### Question에서 제거

```prisma
model Question {
  // 삭제할 필드들:
  // /// @deprecated
  // interviewPreparationId String?
  // interviewPreparation   InterviewPreparation? @relation(...)
  // experienceType ExperienceType? @default(GENERAL)
  // experienceId   Int?
  // guideAnswer Json?

  // 삭제할 인덱스들:
  // @@index([interviewPreparationId])
  // @@index([experienceType, experienceId])
  // @@index([interviewPreparationId, experienceType, experienceId])
}
```

#### Enum 삭제/수정

```prisma
// 전체 삭제
// enum ImportanceLevel {
//   HIGH
//   MEDIUM
//   LOW
// }

// EMPLOYEE 값 제거
enum EmployeeType {
  FULL_TIME
  PART_TIME
  INTERN
  CONTRACT
  FREELANCE
  // EMPLOYEE 제거됨
}
```

**체크리스트**:

- [ ] InterviewPreparation: 5개 필드 삭제
- [ ] CareerExperience: 5개 필드 삭제
- [ ] ProjectExperience: 5개 필드 삭제
- [ ] Question: 4개 필드 + 3개 인덱스 삭제
- [ ] `ImportanceLevel` enum 삭제
- [ ] `EmployeeType.EMPLOYEE` 값 제거

---

### Step 3.2: 마이그레이션 실행

```bash
# 마이그레이션 실행
pnpm db:migrate dev

# Prisma Client 재생성
pnpm db:generate
```

**체크리스트**:

- [ ] 마이그레이션 성공
- [ ] Prisma Client 재생성 완료

---

### Step 3.3: 타입 정리 (Phase 1에서 보류된 항목)

**파일**: `src/server/services/common/experience-fields.ts`

```typescript
// 변경 후
export type OmittedExperienceFields = 'index' | 'interviewPreparationId'
// DeprecatedStarFields 타입 삭제
// 'importance' 제거
```

**체크리스트**:

- [ ] `DeprecatedStarFields` 타입 삭제
- [ ] `OmittedExperienceFields` 업데이트

---

## Phase 4: 검증

### Step 4.1: 품질 검사

```bash
pnpm db:generate    # Prisma Client 재생성
pnpm type-check     # TypeScript 타입 검사
pnpm lint           # ESLint 검사
pnpm format:check   # Prettier 검사
pnpm build          # 프로덕션 빌드
```

**체크리스트**:

- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공

---

### Step 4.2: 기능 테스트

**핵심 플로우 테스트**:

- [ ] InterviewPreparation 생성 (이력서 파싱 워크플로우)
- [ ] InterviewPreparation 상세 페이지 렌더링
- [ ] Experience 상세 페이지 렌더링
- [ ] KeyAchievement 생성/수정/삭제
- [ ] Question 생성 (KeyAchievement 기반)
- [ ] Answer 제출 및 Feedback 생성 (guideAnswer 포함)
- [ ] 사이드바 질문 카운트 표시

---

## 영향받는 파일 전체 목록

### Tier 1: 핵심 서비스 (직접 수정 필수)

| 파일                                                                        | 변경 내용               | 예상 라인 |
| --------------------------------------------------------------------------- | ----------------------- | --------- |
| `prisma/schema.prisma`                                                      | 필드/enum 삭제          | ~80       |
| `src/server/services/interview-preparation/preparation.service.ts`          | 필드 업데이트/할당 제거 | ~100      |
| `src/server/api/routers/interview-workflow/services/preparation.service.ts` | 생성 로직 정리          | ~30       |
| `src/server/services/experience/experience.service.ts`                      | select 설정 정리        | ~20       |

### Tier 2: 타입/스키마 정리

| 파일                                              | 변경 내용                     | 예상 라인 |
| ------------------------------------------------- | ----------------------------- | --------- |
| `src/types/experience.ts`                         | ImportanceLevel 유틸리티 제거 | ~30       |
| `src/server/services/common/experience-fields.ts` | 타입 정의 업데이트            | ~10       |
| `src/lib/db/utils/prisma-to-zod.ts`               | Zod 스키마 제거               | ~5        |
| `src/server/api/routers/question/schema.ts`       | API 스키마 정리               | ~15       |

### Tier 3: 기타 영향 파일

| 파일                                                             | 변경 내용            | 예상 라인 |
| ---------------------------------------------------------------- | -------------------- | --------- |
| `src/server/services/key-achievement/key-achievement.service.ts` | 카운트 업데이트 제거 | ~10       |
| `src/server/services/key-achievement/types.ts`                   | 타입 정리            | ~5        |
| `src/server/services/experience/types.ts`                        | 타입 정리            | ~10       |
| `src/server/services/webhook-event/webhook-event.service.ts`     | threadId 참조 확인   | ~5        |

---

## 롤백 전략

### Phase 1 롤백

- Git으로 코드 롤백
- 스키마 변경 없으므로 DB 롤백 불필요

### Phase 2 롤백

- EmployeeType 마이그레이션 롤백:
  ```sql
  UPDATE career_experiences
  SET employee_type = 'EMPLOYEE'
  WHERE employee_type = 'FULL_TIME'
    AND id IN (SELECT id FROM career_experiences_deprecated_backup WHERE employee_type = 'EMPLOYEE');
  ```

### Phase 3 롤백

- 백업 테이블에서 컬럼 복구
- Prisma 스키마 롤백 후 마이그레이션 재실행

```sql
-- 컬럼 복구 예시
ALTER TABLE interview_preparations ADD COLUMN company_name TEXT;
UPDATE interview_preparations ip
SET company_name = backup.company_name
FROM interview_preparations_deprecated_backup backup
WHERE ip.id = backup.id;
```

---

## 예상 소요 시간

| Phase     | 작업              | 예상 시간    |
| --------- | ----------------- | ------------ |
| Phase 1   | 코드 정리         | 4-6시간      |
| Phase 2   | 마이그레이션 준비 | 2-3시간      |
| Phase 3   | 스키마 변경       | 1-2시간      |
| Phase 4   | 검증              | 2-3시간      |
| **Total** |                   | **9-14시간** |

---

## 참고 문서

- `prisma/schema.prisma` - 현재 스키마

---

_Last Updated: 2025-12-17 (v1.0.0 - Initial Planning)_
