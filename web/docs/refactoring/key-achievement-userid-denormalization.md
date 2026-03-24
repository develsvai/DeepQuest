# KeyAchievement userId 역정규화 리팩토링

## 개요

**목적:** KeyAchievement 테이블에 `userId` 필드를 추가하여 4단계 관계 체인 탐색 없이 단일 쿼리로 ownership 검증 및 데이터 접근 가능하게 개선

**배경:**

현재 KeyAchievement의 ownership 검증을 위해 4단계 JOIN이 필요:

```
KeyAchievement → CareerExperience/ProjectExperience → Resume → InterviewPreparation → User
```

이로 인해 발생하는 문제:

- 복잡한 Prisma include 쿼리 (4단계 중첩)
- 이중 쿼리 발생 (Router와 Service에서 각각 조회)
- Authorization 로직 복잡성
- RLS(Row Level Security) 정책 적용 어려움

**변경 범위:**

- DB Schema 변경 및 마이그레이션
- Service Layer 단순화
- Router Layer 단순화
- 기존 코드 정리

---

## 1. userId 추가 Best Practice 기준

### 업계 표준 패턴

| 서비스   | 패턴                    | 설명                                       |
| -------- | ----------------------- | ------------------------------------------ |
| Stripe   | `customer_id` 직접 저장 | PaymentIntent, Subscription 등 모든 리소스 |
| Shopify  | `shop_id` 직접 저장     | 모든 리소스 테이블에 tenant ID             |
| Supabase | RLS +`user_id`          | 테이블에 `user_id` 필드 필수               |

### userId 추가 판단 기준

```
┌─────────────────────────────────────────────────────────────────┐
│  다음 조건 중 2개 이상 해당하면 userId 추가 권장:               │
│                                                                 │
│  1. 사용자가 "직접" CRUD하는 리소스인가?                        │
│  2. Authorization 검증이 빈번한가?                              │
│  3. 관계 체인이 3단계 이상인가?                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 프로젝트 테이블별 분석

| 테이블            | 직접 CRUD | 빈번한 Auth | 3단계+ | 결과      |
| ----------------- | --------- | ----------- | ------ | --------- |
| KeyAchievement    | ✅        | ✅          | ✅ (4) | **추가**  |
| Question          | ✅        | ✅          | ❌ (1) | 추후 검토 |
| CareerExperience  | ✅        | ✅          | ❌ (2) | 선택적    |
| ProjectExperience | ✅        | ✅          | ❌ (2) | 선택적    |
| WebhookEvent      | ❌        | ❌          | ❌ (1) | 불필요    |

---

## 2. 변경 사항 요약

### 스키마 변경

```prisma
model KeyAchievement {
  id     Int    @id @default(autoincrement())

  // 🆕 역정규화: 직접 ownership 검증
  userId String?

  // 기존 관계 (데이터 구조용 - 유지)
  careerExperienceId  Int?
  projectExperienceId Int?
  careerExperience    CareerExperience?  @relation(...)
  projectExperience   ProjectExperience? @relation(...)

  // 기존 필드들...
  title       String
  problems    String[] @default([])
  actions     String[] @default([])
  results     String[] @default([])
  reflections String[] @default([])
  orderIndex  Int      @default(0)

  // Relations
  questions Question[]

  @@index([userId])  // 🆕 인덱스 추가
  @@index([careerExperienceId])
  @@index([projectExperienceId])
  @@map("key_achievements")
}
```

### Before vs After 비교

#### Ownership 검증

```typescript
// ❌ Before: 4단계 중첩 include
const achievement = await prisma.keyAchievement.findUnique({
  where: { id },
  include: {
    careerExperience: {
      include: {
        resume: {
          include: {
            interviewPreparation: { select: { id: true, userId: true } },
          },
        },
      },
    },
    projectExperience: {
      /* 동일 구조 */
    },
  },
})
const userId =
  achievement.careerExperience?.resume.interviewPreparation?.userId ??
  achievement.projectExperience?.resume.interviewPreparation?.userId

// ✅ After: 단일 필드 조회
const achievement = await prisma.keyAchievement.findFirst({
  where: {
    id: keyAchievementId,
    userId: ctx.userId, // 한 번에 검증!
  },
})
```

#### 이중 쿼리 제거

```typescript
// ❌ Before: Router와 Service에서 각각 getById 호출 (4쿼리)
// Router
const achievement = await keyAchievementService.getById(id) // 2 쿼리
// Service
const achievement = await keyAchievementService.getById(id) // 2 쿼리 (중복!)

// ✅ After: Router에서 한 번만 조회, Service에 전달
const achievement = await prisma.keyAchievement.findFirst({
  where: { id, userId: ctx.userId },
})
// Service는 이미 검증된 데이터 사용
```

---

## 3. 수정 대상 파일

### DB Schema & Migration

| 파일                    | 변경 내용                           |
| ----------------------- | ----------------------------------- |
| `prisma/schema.prisma`  | KeyAchievement에 userId 필드 추가   |
| `prisma/migrations/...` | 마이그레이션 (기존 데이터 업데이트) |

### Service Layer

| 파일                                                             | 변경 내용                                  |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `src/server/services/key-achievement/key-achievement.service.ts` | `getById` 단순화, `verifyOwnership` 단순화 |
| `src/server/services/key-achievement/types.ts`                   | 타입 정의 업데이트                         |
| `src/server/services/question/generation.service.ts`             | 이중 조회 제거                             |
| `src/server/services/interview-prep/resume-data.service.ts`      | KeyAchievement 생성 시 userId 설정         |

### Router Layer

| 파일                                              | 변경 내용                          |
| ------------------------------------------------- | ---------------------------------- |
| `src/server/api/routers/question/index.ts`        | `startGeneration` 검증 로직 단순화 |
| `src/server/api/routers/key-achievement/index.ts` | ownership 검증 단순화              |

### Webhook Handlers

| 파일                                                                     | 변경 내용                          |
| ------------------------------------------------------------------------ | ---------------------------------- |
| `src/app/api/webhooks/ai-workflow/handlers/resume-parsing-v2.handler.ts` | KeyAchievement 생성 시 userId 포함 |

---

## 4. 마이그레이션 전략

### Prisma 마이그레이션 워크플로우

```bash
# Step 1: schema.prisma 수정 후 마이그레이션 생성
pnpm db:migrate dev --name add_userid_to_key_achievement

# Step 2: 마이그레이션 SQL 수동 편집 (기존 데이터 업데이트 로직 추가)
# prisma/migrations/[timestamp]_add_userid_to_key_achievement/migration.sql 편집

# Step 3: Prisma Client 재생성
pnpm db:generate

# Step 4: 타입 체크
pnpm type-check
```

### 마이그레이션 SQL (자동 생성 + 수동 추가)

Prisma가 자동 생성하는 부분:

```sql
-- Prisma 자동 생성
ALTER TABLE "key_achievements" ADD COLUMN "user_id" TEXT;
CREATE INDEX "key_achievements_user_id_idx" ON "key_achievements"("user_id");
```

수동으로 추가해야 하는 부분 (기존 데이터 업데이트):

```sql
-- 🔧 수동 추가: 기존 데이터 업데이트 (Career 경로)
UPDATE key_achievements ka
SET user_id = ip.user_id
FROM career_experiences ce
JOIN resumes r ON ce.resume_id = r.id
JOIN interview_preparations ip ON r.interview_preparation_id = ip.id
WHERE ka.career_experience_id = ce.id
  AND ka.user_id IS NULL;

-- 🔧 수동 추가: 기존 데이터 업데이트 (Project 경로)
UPDATE key_achievements ka
SET user_id = ip.user_id
FROM project_experiences pe
JOIN resumes r ON pe.resume_id = r.id
JOIN interview_preparations ip ON r.interview_preparation_id = ip.id
WHERE ka.project_experience_id = pe.id
  AND ka.user_id IS NULL;
```

### 프로덕션 배포 시 주의사항

```bash
# 프로덕션 마이그레이션 (deploy 명령어 사용)
pnpm db:migrate deploy

# 마이그레이션 상태 확인
pnpm prisma migrate status
```

### (선택) NOT NULL 제약 추가

모든 데이터 업데이트 확인 후 별도 마이그레이션으로 진행:

```sql
-- 별도 마이그레이션: NOT NULL 제약 추가
ALTER TABLE "key_achievements" ALTER COLUMN "user_id" SET NOT NULL;
```

### 데이터 무결성 보장

KeyAchievement 생성 시 자동으로 userId 설정:

```typescript
// resume-data.service.ts
async function createKeyAchievement(
  experienceId: number,
  experienceType: ExperienceType,
  achievement: KeyAchievementData,
  userId: string // 🆕 명시적으로 전달
) {
  return prisma.keyAchievement.create({
    data: {
      userId, // 🆕
      ...(experienceType === 'CAREER'
        ? { careerExperienceId: experienceId }
        : { projectExperienceId: experienceId }),
      title: achievement.title,
      problems: achievement.problems,
      actions: achievement.actions,
      results: achievement.results,
      reflections: achievement.reflections,
    },
  })
}
```

---

## 5. 리팩토링 체크리스트

### Phase 1: DB Schema 변경 ✅ (2025-12-05)

- [x] `schema.prisma`: KeyAchievement에 `userId String?` 필드 추가
- [x] `schema.prisma`: `@@index([userId])` 인덱스 추가
- [x] `pnpm db:migrate dev --name add_userid_to_key_achievement` 실행
- [x] 생성된 migration.sql 파일에 기존 데이터 업데이트 SQL 추가:
  - [x] Career 경로 UPDATE문 추가
  - [x] Project 경로 UPDATE문 추가
- [x] `pnpm db:generate` 실행 (Prisma Client 재생성)
- [x] `pnpm type-check` 통과 확인
- [x] 로컬 DB에서 마이그레이션 결과 확인 (261/261 레코드 user_id 설정 완료)

### Phase 2: Service Layer 리팩토링 ✅ (2025-12-05)

- [x] `key-achievement.service.ts`: `getById` 단순화 (4단계 include 제거)
- [x] `key-achievement.service.ts`: `verifyOwnershipByUserId` 추가 (단순화된 ownership 검증)
- [x] `key-achievement.service.ts`: `findByIdAndUserId` 추가 (userId 기반 조회 + 검증)
- [x] `generation.service.ts`: `findByIdAndUserId` 사용으로 이중 조회 제거
- [x] `resume-data.service.ts`: KeyAchievement 생성 시 userId 포함
- [x] `question/types.ts`: `StartQuestionGenerationInput`에 userId 추가
- [x] `pnpm type-check` 통과 확인

**추가 수정된 파일 (type-check 통과를 위한 호출부 수정):**

- `question/index.ts`: `startGeneration` 호출 시 `userId: ctx.userId` 전달
- `resume-parsing-v2.handler.ts`: `saveResumeParsingResult` 호출 시 userId 전달

### Phase 3: Router Layer 리팩토링 ✅ (2025-12-05)

- [x] `question/index.ts`: `listByExperience`에서 `verifyOwnership` → `verifyOwnershipByUserId` 변경 (4단계 JOIN 제거)
- [x] `question/index.ts`: `startGeneration`에서 `getById` → `findByIdAndUserId` 변경 (userId 검증 통합)
- [x] `key-achievement/index.ts`: `getById` + 수동 검증 → `findByIdAndUserId` 단일 호출로 통합
- [x] API 스키마에서 `interviewPreparationId` 제거 검토 → **유지 결정** (AI 서비스 appliedPosition 전달용 필수)
- [x] `pnpm type-check` 통과 확인
- [x] `pnpm check-all` 통과 확인

### Phase 4: Webhook Handler 업데이트 ✅ (2025-12-05)

- [x] `resume-parsing-v2.handler.ts`: KeyAchievement 생성 시 userId 포함 (Phase 2에서 이미 완료)
- [x] `pnpm check-all` 통과 확인

### Phase 5: 통합 테스트

- [x] 기존 데이터 마이그레이션 후 userId 정상 설정 확인
- [x] 새 KeyAchievement 생성 시 userId 자동 설정 확인
- [x] ownership 검증 정상 동작 확인 (본인 데이터만 접근 가능)
- [x] 질문 생성 API 정상 동작 확인
- [x] 성능 개선 확인 (쿼리 수 감소)

### Phase 6: 레거시 코드 정리 ✅ (2025-12-07)

- [x] `key-achievement.service.ts`: `getById`, `verifyOwnership` 완전 삭제 (4단계 include 제거)
- [x] `interview-prep-detail/types.ts`: `CreateKeyAchievementData`에 userId 필드 추가
- [x] `interview-prep-detail.service.ts`: `getKeyAchievementById` 단순화 (4단계 include → 직접 조회)
- [x] `interview-prep-detail.service.ts`: `createKeyAchievement` userId 설정 추가
- [x] `interview-prep-detail/index.ts`: Router 호출부 수정 (사전 ownership 검증 + userId 직접 설정)
- [x] `pnpm check-all` 통과 확인

**참고**: `interviewPreparationId` 파라미터는 Router 계층의 권한 검증용으로 유지 (AI 서비스 appliedPosition 전달 경로)

---

## 6. 성능 개선 예상

### 쿼리 수 비교

| 작업                     | Before   | After | 개선 |
| ------------------------ | -------- | ----- | ---- |
| Ownership 검증           | 2        | 1     | 50%  |
| startGeneration mutation | 4+       | 2     | 50%+ |
| KeyAchievement 목록 조회 | N+1 위험 | 1     | 대폭 |

### 쿼리 복잡도 비교

| 측면           | Before      | After       |
| -------------- | ----------- | ----------- |
| JOIN 깊이      | 4단계       | 0단계       |
| Include 복잡도 | 높음 (중첩) | 없음        |
| 인덱스 활용    | 비효율적    | 단일 인덱스 |
| RLS 적용 가능  | 어려움      | 쉬움        |

---

## 7. 롤백 계획

문제 발생 시:

1. userId 필드를 무시하고 기존 4단계 JOIN 로직 사용 (코드 레벨)
2. 필요 시 userId 컬럼 삭제 (DB 레벨)

```sql
-- 롤백 SQL
ALTER TABLE key_achievements DROP COLUMN user_id;
DROP INDEX IF EXISTS idx_key_achievements_user_id;
```

---

## 8. 향후 고려사항 (Out of Scope)

### 추가 역정규화 후보

현재 리팩토링 범위에서 제외하지만, 동일한 패턴 적용 가능:

| 테이블            | 현재 경로 | 우선순위 | 비고                                   |
| ----------------- | --------- | -------- | -------------------------------------- |
| Question          | 1단계     | 중       | interviewPreparationId deprecated 예정 |
| CareerExperience  | 2단계     | 낮       | 2단계로 비용 낮음                      |
| ProjectExperience | 2단계     | 낮       | 2단계로 비용 낮음                      |

### RLS 정책 적용

userId 추가 후 Supabase RLS 정책 적용 가능:

```sql
-- 향후 RLS 정책 예시
CREATE POLICY "Users can only access their own key achievements"
ON key_achievements
FOR ALL
USING (user_id = auth.uid());
```

### NOT NULL 제약 추가

모든 기존 데이터 마이그레이션 완료 후:

```sql
ALTER TABLE key_achievements ALTER COLUMN user_id SET NOT NULL;
```

---

## 9. 관련 문서

- [Question Generation API Plan](../plans/question-generation-api-plan.md) - Phase 4 tRPC Endpoint
- [server/CLAUDE.md](../../src/server/CLAUDE.md) - Service/Router 레이어 아키텍처

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                                                          |
| ---------- | ---- | -------------------------------------------------------------------------------------------------- |
| 2025-12-05 | v1.0 | 초안 작성 - Best Practice 분석 및 계획 수립                                                        |
| 2025-12-05 | v1.1 | Phase 1-2 완료                                                                                     |
| 2025-12-05 | v1.2 | Phase 3-4 완료 - Router Layer 리팩토링, 4단계 JOIN 완전 제거, 레거시 메서드 제거                   |
| 2025-12-07 | v1.3 | Phase 6 완료 - 레거시 코드 완전 정리, interview-prep-detail 서비스 4단계 include 제거, userId 설정 |
