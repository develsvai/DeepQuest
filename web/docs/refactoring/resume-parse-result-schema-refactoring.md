# ResumeParseResult 스키마 변경 리팩토링

**버전**: v1.0.0
**생성일**: 2025-11-28
**범위**: Webhook 처리 + DB 스키마 Migration
**상태**: 진행 중

---

## 1. 변경 개요

### 1.1 AI 서버 스키마 변경 요약

AI 서버(`ai/src/graphs/resume_parser/`)의 `ResumeParseResult` 스키마가 STAR-L 방법론을 도입하면서 대폭 변경되었습니다.

| 영역              | 이전 구조                                            | 새 구조                                                   |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| **STAR 데이터**   | `situation[]`, `task[]`, `action[]`, `result[]` 배열 | `KeyAchievement[]` 객체 배열 (STAR-L 방법론)              |
| **날짜**          | `startDate`, `endDate` 문자열                        | `Duration { start_date, end_date, is_current }` 객체      |
| **아키텍처**      | `architecture: string`                               | `Architecture { description, mermaid }` 객체              |
| **프로젝트 정보** | `teamSize: number`                                   | `team_composition: string`, `project_description: string` |
| **링크**          | 없음                                                 | `links: string[]`                                         |
| **EmployeeType**  | `EMPLOYEE`                                           | `FULL_TIME`, `PART_TIME`                                  |

### 1.2 결정사항

| 항목                    | 결정                 | 이유                                    |
| ----------------------- | -------------------- | --------------------------------------- |
| **KeyAchievement 저장** | 별도 테이블로 정규화 | 향후 확장성, 개별 achievement 관리 용이 |
| **기존 STAR 필드**      | Deprecated로 유지    | 호환성 보장, 점진적 이전                |
| **새 필드들**           | 모두 DB에 저장       | AI가 추출한 정보 완전 보존              |
| **Enum 처리**           | AI 기준으로 통일     | 일관된 데이터 모델                      |
| **기존 데이터**         | 마이그레이션 필요    | 프로덕션 데이터 유지                    |

---

## 2. 작업 범위

### 이번 리팩토링에 포함

1. Prisma 스키마 변경 및 마이그레이션
2. TypeScript 스키마/타입 정의 업데이트
3. Webhook 핸들러 수정
4. 기존 데이터 마이그레이션 스크립트

### 이번 리팩토링에서 제외 (후속 작업)

- UI 컴포넌트 업데이트
- Question Generation 서비스 수정
- API 라우터 응답 형식 변경

---

## 3. Phase 1: Prisma 스키마 변경

### 3.1 새 테이블: `KeyAchievement`

```prisma
model KeyAchievement {
  id Int @id @default(autoincrement())

  // Polymorphic relation (belongs to Career OR Project)
  careerExperienceId  Int?
  projectExperienceId Int?
  careerExperience    CareerExperience?  @relation(fields: [careerExperienceId], references: [id], onDelete: Cascade)
  projectExperience   ProjectExperience? @relation(fields: [projectExperienceId], references: [id], onDelete: Cascade)

  // STAR-L methodology fields
  title      String  // Summary of the achievement
  problem    String? @db.Text // Situation/Task - The challenge or requirement
  action     String? @db.Text // Technical actions taken
  result     String? @db.Text // Quantitative/qualitative outcomes
  reflection String? @db.Text // Learning - Insights and takeaways

  orderIndex Int @default(0)

  @@index([careerExperienceId])
  @@index([projectExperienceId])
  @@map("key_achievements")
}
```

### 3.2 `CareerExperience` 변경

**추가 필드:**

- `isCurrent Boolean @default(false)` - 현재 재직 여부
- `links String[]` - GitHub, 포트폴리오 URL 등
- `architectureMermaid String? @db.Text` - Mermaid 다이어그램 코드

**Relation 추가:**

- `keyAchievements KeyAchievement[]`

**Deprecated 필드 (유지):**

- `situation`, `task`, `action`, `result` - JSDoc @deprecated 주석 추가

### 3.3 `ProjectExperience` 변경

**추가 필드:**

- `projectDescription String @default("")` - 프로젝트 목적/범위
- `teamComposition String?` - 팀 구성 설명
- `isCurrent Boolean @default(false)` - 진행 중 여부
- `links String[]` - GitHub, 배포 URL 등
- `architectureMermaid String? @db.Text` - Mermaid 다이어그램 코드

**Relation 추가:**

- `keyAchievements KeyAchievement[]`

**Deprecated 필드 (유지):**

- `situation`, `task`, `action`, `result`

### 3.4 `EmployeeType` Enum 변경

```prisma
enum EmployeeType {
  FULL_TIME // Regular full-time employment (신규)
  PART_TIME // Part-time employment (신규)
  INTERN
  CONTRACT
  FREELANCE
  EMPLOYEE // @deprecated Use FULL_TIME instead
}
```

### Phase 1 완료 체크리스트

- [x] `KeyAchievement` 모델 추가
- [x] `CareerExperience` 모델 필드 추가
- [x] `ProjectExperience` 모델 필드 추가
- [x] `EmployeeType` enum 수정
- [x] Prisma migration 생성 (`20251128080935_add_key_achievements_and_new_fields`)
- [x] Prisma Client 재생성 (`pnpm db:generate`)
- [x] 타입 체크 통과 (`pnpm type-check`)

---

## 4. Phase 2: TypeScript 스키마 업데이트

### 4.1 AI Contract 스키마 수정

**파일**: `web/src/server/services/ai/contracts/schemas/resumeParsingV2.ts`

새 AI 응답 구조에 맞는 Zod 스키마 정의:

```typescript
// KeyAchievement 스키마 (AI 응답용)
export const KeyAchievementSchema = z.object({
  title: z.string(),
  problem: z.string().nullable(),
  action: z.string().nullable(),
  result: z.string().nullable(),
  reflection: z.string().nullable(),
})

// Duration 스키마
export const DurationSchema = z.object({
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean().default(false),
})

// Architecture 스키마
export const ArchitectureSchema = z.object({
  description: z.string(),
  mermaid: z.string().nullable(),
})

// CareerExperience 스키마 업데이트
export const CareerExperienceV2Schema = z.object({
  company: z.string(),
  companyDescription: z.string().nullable(),
  employeeType: EmployeeTypeEnum,
  jobLevel: z.string().nullable(),
  duration: DurationSchema.nullable(),
  techStack: z.array(z.string()).default([]),
  architecture: ArchitectureSchema.nullable(),
  position: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  keyAchievements: z.array(KeyAchievementSchema).default([]),
})

// ProjectExperience 스키마 업데이트
export const ProjectExperienceV2Schema = z.object({
  projectName: z.string(),
  projectDescription: z.string(),
  projectType: ProjectTypeEnum,
  teamComposition: z.string().nullable(),
  duration: DurationSchema.nullable(),
  techStack: z.array(z.string()).default([]),
  architecture: ArchitectureSchema.nullable(),
  position: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  keyAchievements: z.array(KeyAchievementSchema).default([]),
})
```

### 4.2 Enum 유틸리티 업데이트

**파일**: `web/src/lib/db/utils/prisma-to-zod.ts`

`EmployeeType` enum에 `FULL_TIME`, `PART_TIME` 추가 반영

### Phase 2 완료 체크리스트

- [x] `KeyAchievementSchema` Zod 스키마 생성
- [x] `DurationSchema` Zod 스키마 생성
- [x] `ArchitectureSchema` Zod 스키마 생성
- [x] `CareerExperienceV2Schema` 업데이트
- [x] `ProjectExperienceV2Schema` 업데이트
- [x] `ResumeParseResultV2Schema` 업데이트
- [x] Prisma enum 유틸리티 업데이트 (Prisma 재생성 시 자동 반영)
- [x] 타입 체크 통과

---

## 5. Phase 3: Webhook 핸들러 + 서비스 레이어 (V2 신규 생성)

### 5.0 아키텍처 전략: Controller-Service 패턴

DB 저장 로직을 **재사용 가능한 서비스 레이어로 분리**합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  Webhook Handler (Controller)                                    │
│  - 요청 검증, 에러 핸들링, 상태 업데이트                           │
│  - 데이터 변환 (snake_case → camelCase)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 호출
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer (재사용 가능)                                      │
│  - DB CRUD 로직                                                  │
│  - 트랜잭션 관리                                                  │
│  - 비즈니스 로직                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 파일 구조 및 역할

| 파일                                             | 역할                     | 상태     |
| ------------------------------------------------ | ------------------------ | -------- |
| **Handler (Controller)**                         |                          |          |
| `handlers/resume-parsing.handler.ts`             | V1 핸들러 (deprecated)   | 유지     |
| `handlers/resume-parsing-v2.handler.ts`          | V2 핸들러 - 요청 처리    | **신규** |
| **Service Layer**                                |                          |          |
| `services/interview-prep/resume-data.service.ts` | Resume 관련 DB 저장 로직 | **신규** |
| **Registry**                                     |                          |          |
| `services/webhook-processor.ts`                  | 핸들러 등록/라우팅       | 수정     |

### 5.2 서비스 레이어 설계 원칙

**Best Practices:**

```typescript
// ✅ DO: Function-based, 명시적 의존성 주입
export async function saveResumeParsingResult(
  tx: Prisma.TransactionClient,  // 트랜잭션 클라이언트 주입
  preparationId: string,
  data: ResumeParseResultV2
): Promise<SaveResumeResult> {
  // 단일 책임: DB 저장만 담당
}

// ✅ DO: 타입 안전한 반환값
interface SaveResumeResult {
  resumeId: string
  careerExperienceIds: number[]
  projectExperienceIds: number[]
}

// ❌ DON'T: 새 PrismaClient 인스턴스 생성
const prisma = new PrismaClient() // NEVER!

// ❌ DON'T: 서비스에서 데이터 변환 (핸들러 책임)
export async function saveResume(snakeCaseData: any) { ... }
```

### 5.3 서비스 파일 구조

**파일**: `web/src/server/services/interview-prep/resume-data.service.ts`

```typescript
import type { Prisma } from '@/generated/prisma'
import type { ResumeParseResultV2 } from '@/server/services/ai/contracts/schemas/resumeParsingV2'

// ============= Types =============
export interface SaveResumeResult {
  resumeId: string
  careerExperienceIds: number[]
  projectExperienceIds: number[]
}

// ============= Main Functions =============

/**
 * Resume 파싱 결과를 DB에 저장 (트랜잭션 내에서 실행)
 *
 * @param tx - Prisma 트랜잭션 클라이언트
 * @param preparationId - InterviewPreparation ID
 * @param data - 파싱된 이력서 데이터 (V2 스키마)
 */
export async function saveResumeParsingResult(
  tx: Prisma.TransactionClient,
  preparationId: string,
  data: ResumeParseResultV2
): Promise<SaveResumeResult>

/**
 * CareerExperience + KeyAchievements 저장
 */
export async function saveCareerExperiences(
  tx: Prisma.TransactionClient,
  resumeId: string,
  careers: CareerExperienceV2[]
): Promise<number[]>

/**
 * ProjectExperience + KeyAchievements 저장
 */
export async function saveProjectExperiences(
  tx: Prisma.TransactionClient,
  resumeId: string,
  projects: ProjectExperienceV2[]
): Promise<number[]>
```

### 5.4 핸들러 (Controller) 역할 - 단순화된 V2

**파일**: `web/src/app/api/webhooks/ai-workflow/handlers/resume-parsing-v2.handler.ts`

**핵심 원칙**: AI 응답(이력서 파싱 결과) 저장만 수행. 후속 워크플로우 트리거 없음.

```typescript
// 핸들러 책임 (단순화):
// 1. WebhookEvent 조회 및 검증
// 2. AI 응답 데이터 변환 (snake_case → camelCase)
// 3. 서비스 호출로 DB 저장 (트랜잭션)
// 4. WebhookEvent 상태 업데이트 (SUCCESS/ERROR)

// ❌ V1에서 제거된 책임:
// - StructuredJD 조회 없음
// - Question Generation 트리거 없음
// - InterviewPreparation 상태 업데이트 없음

export async function handleResumeParsingV2Result(
  runId: string,
  payload: WebhookPayload<ResumeParsingV2GraphOutput>
): Promise<void> {
  // Step 1: WebhookEvent 조회
  const webhookEvent = await prisma.webhookEvent.findFirst({
    where: { runId },
    include: { preparation: true },
  })

  if (!webhookEvent || !webhookEvent.preparationId) {
    throw new Error('WebhookEvent not found or no preparationId')
  }

  // Step 2: AI 응답 변환 및 검증
  const transformedPayload = snakeToCamelCase(payload)
  const resumeData = ResumeParseResultV2Schema.parse(
    transformedPayload.result?.resumeParseResult
  )

  // Step 3: 트랜잭션으로 DB 저장
  const result = await prisma.$transaction(async tx => {
    return saveResumeParsingResult(tx, webhookEvent.preparationId!, resumeData)
  })

  // Step 4: WebhookEvent 상태 업데이트
  await prisma.webhookEvent.update({
    where: { id: webhookEvent.id },
    data: {
      status: 'SUCCESS',
      completedAt: new Date(),
      metadata: { ...webhookEvent.metadata, result },
    },
  })
}
```

### 5.5 데이터 변환 로직 (핸들러 내)

#### snake_case → camelCase 변환

```typescript
// AI 응답 (Python snake_case)
{
  start_date: "2023-01",
  end_date: "2024-06",
  is_current: false,
  tech_stack: ["React", "Node.js"],
  key_achievements: [...]
}

// 변환 후 (TypeScript camelCase)
{
  startDate: "2023-01",
  endDate: "2024-06",
  isCurrent: false,
  techStack: ["React", "Node.js"],
  keyAchievements: [...]
}
```

#### Duration 객체 → DB 필드 분리

```typescript
// AI 서버에서 이미 'YYYY-MM' 형식으로 전송 (날짜 변환 불필요)
duration: { startDate: "2023-01", endDate: "2024-06", isCurrent: false }

// DB 저장 형태 - 그대로 매핑
{
  startDate: "2023-01",
  endDate: "2024-06",
  isCurrent: false
}
```

#### Architecture 객체 → DB 필드 분리

```typescript
// 변환된 데이터
architecture: { description: "MSA 구조...", mermaid: "graph TD..." }

// DB 저장 형태
{
  architecture: "MSA 구조...",
  architectureMermaid: "graph TD..."
}
```

### 5.6 트랜잭션 구조

```
prisma.$transaction(async (tx) => {
  // 1. Resume + CandidateProfile 생성
  const resume = await tx.resume.create({...})
  await tx.candidateProfile.create({...})

  // 2. CandidateEducation bulk 생성
  await tx.candidateEducation.createMany({...})

  // 3. CareerExperience bulk 생성 → KeyAchievement bulk 생성
  const careers = await tx.careerExperience.createManyAndReturn({...})
  for (const career of careers) {
    await tx.keyAchievement.createMany({
      data: career.keyAchievements.map((ka, idx) => ({
        careerExperienceId: career.id,
        ...ka,
        orderIndex: idx
      }))
    })
  }

  // 4. ProjectExperience bulk 생성 → KeyAchievement bulk 생성
  const projects = await tx.projectExperience.createManyAndReturn({...})
  for (const project of projects) {
    await tx.keyAchievement.createMany({
      data: project.keyAchievements.map((ka, idx) => ({
        projectExperienceId: project.id,
        ...ka,
        orderIndex: idx
      }))
    })
  }

  return { resumeId: resume.id, ... }
})
```

### 5.7 EmployeeType 매핑

AI 응답 `FULL_TIME` → DB `FULL_TIME` (직접 매핑, 변환 불필요)

### Phase 3 완료 체크리스트

**서비스 레이어:**

- [x] `resume-data.service.ts` 신규 생성
- [x] `saveResumeParsingResult()` 함수 구현
- [x] `saveCareerExperiences()` 함수 구현
- [x] `saveProjectExperiences()` 함수 구현
- [x] KeyAchievement 생성 로직 구현

**핸들러 (Controller):**

- [x] `resume-parsing-v2.handler.ts` 신규 생성
- [x] snake_case → camelCase 변환 로직
- [x] Duration/Architecture 필드 분리 로직
- [x] 서비스 호출 및 트랜잭션 관리
- [x] 에러 핸들링 및 상태 업데이트

**통합:**

- [x] `webhook-processor.ts`에 V2 핸들러 등록
- [x] 타입 체크 통과 (`pnpm type-check`)

---

## 6. Phase 4: 데이터 마이그레이션

### 6.1 마이그레이션 전략

1. **EmployeeType 변환**: `EMPLOYEE` → `FULL_TIME`
2. **STAR 배열 → KeyAchievement 변환**:
   - 기존 situation/task/action/result 배열을 KeyAchievement 레코드로 변환
   - 배열 요소 수가 다를 경우 가장 긴 배열 기준으로 생성

### 6.2 마이그레이션 스크립트

**파일**: `web/prisma/migrations/scripts/migrate-star-to-key-achievements.ts`

```
작업 흐름:
1. 모든 CareerExperience 조회
2. 각 experience의 STAR 배열에서 KeyAchievement 생성
   - title: `Achievement ${index + 1}` (임시)
   - problem: situation[i] + task[i] 결합
   - action: action[i]
   - result: result[i]
3. EmployeeType.EMPLOYEE → FULL_TIME 업데이트
4. ProjectExperience 동일 처리
```

### 6.3 롤백 계획

- 마이그레이션 전 DB 스냅샷 생성
- STAR 필드는 삭제하지 않으므로 롤백 시 원본 데이터 유지

### Phase 4 완료 체크리스트

- [x] SQL 마이그레이션 작성 (`20251202074217_migrate_star_to_key_achievements`)
- [x] 로컬 환경 테스트
- [ ] 스테이징 환경 테스트
- [ ] 프로덕션 백업 확인
- [ ] 프로덕션 마이그레이션 실행 (`pnpm db:migrate:deploy`)
- [ ] 데이터 무결성 검증

---

## 7. 수정 대상 파일 목록

### Prisma & Database

| 파일                                                                                  | 변경 내용                                                              | 상태 |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| `web/prisma/schema.prisma`                                                            | KeyAchievement 모델 추가, Experience 모델 수정, EmployeeType enum 수정 | 완료 |
| `web/prisma/migrations/20251202074217_migrate_star_to_key_achievements/migration.sql` | STAR → KeyAchievement 데이터 마이그레이션 SQL                          | 완료 |

### TypeScript Schemas

| 파일                                                              | 변경 내용                  | 상태        |
| ----------------------------------------------------------------- | -------------------------- | ----------- |
| `web/src/server/services/ai/contracts/schemas/resumeParsingV2.ts` | 새 AI 응답 스키마 정의     | 완료        |
| `web/src/lib/db/utils/prisma-to-zod.ts`                           | EmployeeType enum 업데이트 | 완료 (자동) |

### Service Layer (신규)

| 파일                                                            | 변경 내용                                     | 상태 |
| --------------------------------------------------------------- | --------------------------------------------- | ---- |
| `web/src/server/services/interview-prep/resume-data.service.ts` | Resume/Experience/KeyAchievement DB 저장 로직 | 대기 |

### Webhook Handlers (Controller)

| 파일                                                                         | 변경 내용                         | 상태 |
| ---------------------------------------------------------------------------- | --------------------------------- | ---- |
| `web/src/app/api/webhooks/ai-workflow/handlers/resume-parsing.handler.ts`    | V1 핸들러 - 유지 (deprecated)     | 유지 |
| `web/src/app/api/webhooks/ai-workflow/handlers/resume-parsing-v2.handler.ts` | V2 핸들러 (신규) - 요청 처리/변환 | 대기 |
| `web/src/app/api/webhooks/ai-workflow/services/webhook-processor.ts`         | V2 핸들러 등록                    | 대기 |

### Services (참조 업데이트)

| 파일                                                                                    | 변경 내용                                 | 상태 |
| --------------------------------------------------------------------------------------- | ----------------------------------------- | ---- |
| `web/src/server/services/interview-prep/create.service.ts`                              | 타입 참조 업데이트 (필요시)               | 대기 |
| `web/src/server/api/routers/interview-workflow/services/question-generation.service.ts` | Experience → AI 서비스 변환 로직 업데이트 | 대기 |

---

## 8. 위험 요소 및 대응

| 위험              | 영향         | 대응 방안                              |
| ----------------- | ------------ | -------------------------------------- |
| 마이그레이션 실패 | 서비스 중단  | 롤백 플랜 준비, 백업 확인              |
| 스키마 불일치     | 데이터 손실  | Zod 검증 강화, 로깅 추가               |
| 트랜잭션 타임아웃 | Webhook 실패 | 배치 처리, 재시도 로직                 |
| 기존 코드 호환성  | 런타임 에러  | STAR 필드 deprecated 유지, 점진적 이전 |

---

## 9. 전체 완료 체크리스트

### Phase 1: Prisma 스키마 (완료)

- [x] 모든 모델 변경 완료
- [x] 마이그레이션 적용 (`20251128080935_add_key_achievements_and_new_fields`)
- [x] Prisma Client 재생성

### Phase 2: TypeScript 스키마 (완료)

- [x] 모든 Zod 스키마 업데이트
- [x] 타입 체크 통과

### Phase 3: Webhook 핸들러

- [x] 변환 로직 구현
- [x] 트랜잭션 업데이트

### Phase 4: 데이터 마이그레이션

- [ ] 스크립트 작성
- [ ] 프로덕션 적용

### 최종 검증

- [ ] `pnpm check-all` 통과
- [ ] 수동 테스트 완료

---

## 10. 참고 문서

- AI 서버 스키마: `ai/src/common/schemas/project.py`
- AI 파서 상태: `ai/src/graphs/resume_parser/state.py`
- 기존 리팩토링 문서: `web/docs/refactoring/interview-prep-creation-refactoring.md`
