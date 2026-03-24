# Answer Domain Router/Service 재편성 계획

## 개요

사용자 응답(answer) 제출 및 피드백 생성/저장 기능을 domain-centric 아키텍처로 완전히 새로 구현

### 결정사항

- **완전 새로 작성** - 기존 코드 deprecated 처리
- **answer 도메인 통합** - Answer + Feedback 동일 생명주기 관리
- **V2 Only** - `rating.level + rating.rationale` 스키마

---

## 목표 파일 구조

```
src/server/
├── api/routers/
│   └── answer/                     # [신규] Answer 도메인 라우터
│       ├── index.ts                # Router definition
│       └── schema.ts               # Zod schemas (SINGULAR)
│
└── services/
    └── answer/                     # [신규] Answer 도메인 서비스
        ├── index.ts                # Exports
        ├── answer.service.ts       # Answer CRUD + submission
        ├── feedback.service.ts     # Feedback 생성 입력 준비 + 저장
        └── types.ts                # TypeScript types
```

---

## 구현할 tRPC 엔드포인트

| Endpoint                       | Type     | 설명                              |
| ------------------------------ | -------- | --------------------------------- |
| `answer.submitAnswer`          | Mutation | 답변 제출, Question 완료 처리     |
| `answer.getFeedbackGenInput`   | Query    | LangGraph 스트리밍용 V2 입력 준비 |
| `answer.saveFeedbackResult`    | Mutation | 스트리밍 완료 후 피드백 저장      |
| `answer.getAnswerWithFeedback` | Query    | 저장된 답변+피드백 조회           |

---

## 단계별 구현 순서

### Phase 1: 서비스 레이어 (의존성 없음)

1. **`/src/server/services/answer/types.ts`**
   - `SubmitAnswerInput`, `SubmitAnswerResult`
   - `FeedbackV2Input`, `SaveFeedbackResultInput`
   - `GetFeedbackGenInputInput`, `AnswerWithFeedbackResult`

2. **`/src/server/services/answer/answer.service.ts`**
   - `verifyQuestionOwnership()` - keyAchievement.userId 기반 검증
   - `submit()` - Answer 생성/업데이트, Question.isCompleted = true
   - `getWithFeedback()` - Answer + Feedback 조인 조회

3. **`/src/server/services/answer/feedback.service.ts`**
   - `verifyAnswerOwnership()` - Answer → Question → KeyAchievement → userId
   - `mapCareerExperience()` / `mapProjectExperience()` - V2 AI 스키마 매핑
   - `getFeedbackGenInput()` - `QuestionFeedbackGenGraphInputV2` 반환
   - `saveFeedbackResult()` - Feedback 생성/업데이트, Answer.status = 'EVALUATED'

4. **`/src/server/services/answer/index.ts`**
   - `answerService`, `feedbackService` export

### Phase 2: 라우터 레이어 (Phase 1 의존)

5. **`/src/server/api/routers/answer/schema.ts`**
   - `submitAnswerSchema` - questionId, answerText
   - `getFeedbackGenInputSchema` - answerId
   - `saveFeedbackResultSchema` - answerId, feedback (V2), guideAnswer
   - `getAnswerWithFeedbackSchema` - questionId
   - Output schemas: `SubmitAnswerOutput`, `SaveFeedbackResultOutput`, etc.

6. **`/src/server/api/routers/answer/index.ts`**
   - `handleServiceError()` 헬퍼 - DomainError → TRPCError 변환
   - 4개 procedure 정의 (thin layer, 비즈니스 로직 없음)

7. **`/src/server/api/root.ts`** 수정

   ```typescript
   import { answerRouter } from '@/server/api/routers/answer'
   // ...
   answer: answerRouter,  // 추가
   ```

### Phase 3: UI 통합 (Phase 2 의존)

8. **`QuestionSolveBody.tsx`** 수정
   - `trpc.answer.submitAnswer.useMutation()` 추가
   - `trpc.answer.getFeedbackGenInput.useQuery()` 추가 (스트리밍 전)
   - `trpc.answer.saveFeedbackResult.useMutation()` 추가
   - `onFinish` 콜백에서 `saveFeedbackResult` 호출

9. **`QuestionDetail.tsx`** 수정
   - 제출 버튼 클릭 → `submitAnswer` mutation 호출
   - 성공 시 `thread.stream()` 트리거

### Phase 4: 기존 코드 Deprecation (Phase 3 완료 후)

10. 기존 파일에 deprecated 주석 추가:
    - `/src/server/api/routers/question-answer/`
    - `/src/server/services/question-answer/`
    - `/src/server/services/question-feedback/`

11. root.ts에서 `questionAnswer` 라우터 제거 (검증 후)

---

## 핵심 파일 참조

### 재사용할 기존 스키마

- `/src/server/services/ai/contracts/schemas/questionFeedbackGen.ts`
  - `QuestionFeedbackGenInputSchemaV2`
  - `FeedbackSchemaV2`, `RatingSchemaV2`
  - `StructuredGuideAnswerSchema`

### 재사용할 에러 클래스

- `/src/server/services/common/errors.ts`
  - `NotFoundError`, `ValidationError`, `ConflictError`

### 참조할 패턴 (question 서비스)

- `/src/server/services/question/question.service.ts`
- `/src/server/api/routers/question/index.ts`

---

## 통합 플로우

```
[User writes answer]
       ↓
QuestionSolveBody → answer.submitAnswer (tRPC mutation)
       ↓
     Answer created/updated (status: SUBMITTED)
     Question.isCompleted = true
       ↓
answer.getFeedbackGenInput → V2 입력 준비
       ↓
useStream → LangGraph QUESTION_FEEDBACK_GEN 스트리밍
       ↓
onFinish → answer.saveFeedbackResult (tRPC mutation)
       ↓
Feedback created (rating.level + rating.rationale)
Answer.status = EVALUATED
       ↓
UI displays saved feedback
```

---

## V2 스키마 매핑

### 입력 (getFeedbackGenInput → LangGraph)

```typescript
{
  experienceType: 'CAREER' | 'PROJECT',
  careerExperience: CareerExperienceBase | null,
  projectExperience: ProjectExperienceBase | null,
  question: { content: string, category?: QuestionCategory },
  answer: string,
  isGuideAnswerEnabled: true
}
```

### 출력 (LangGraph → saveFeedbackResult)

```typescript
{
  feedback: {
    strengths: string[],
    weaknesses: string[],
    suggestions: string[],
    rating: {
      level: 'DEEP' | 'INTERMEDIATE' | 'SURFACE',
      rationale: string[]  // V2 추가
    }
  },
  guideAnswer: {
    paragraphs: Array<{
      structureSectionName: string,
      content: string
    }>
  }
}
```

### DB 저장 (Prisma Feedback)

- `rating`: Rating enum (level 값만 저장)
- `ratingRationale`: string[] (rationale 별도 저장)
- `guideAnswer`: Json (구조화된 가이드 답변)

---

## 에러 처리 전략

### Service Layer

- `NotFoundError` - 엔티티 미발견 또는 권한 없음 (보안상 동일 처리)
- `ValidationError` - 비즈니스 규칙 위반

### Router Layer

```typescript
function handleServiceError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
}
```

---

## 체크리스트

### Router 작성 시

- [x] Zod 스키마 정의 (schema.ts - SINGULAR)
- [x] `protectedProcedure` 사용
- [x] 비즈니스 로직은 Service에 위임
- [x] `handleServiceError()`로 에러 변환
- [x] 직접 DB 쿼리 없음

### Service 작성 시

- [x] HTTP/tRPC 코드 없음 (TRPCError 사용 X)
- [x] 순수 비즈니스 로직만
- [x] Domain Error 사용
- [x] 명확한 타입 정의 (types.ts)
- [x] 단일 책임 원칙
