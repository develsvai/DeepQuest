# Interview Workflow 레이턴시 최적화를 위한 Thread 재사용 리팩토링 계획

## 요약

본 문서는 인터뷰 워크플로우 시스템의 `startAnalysis` 함수 레이턴시를 개선하기 위한 종합적인 리팩토링 계획을 제시합니다. 핵심 최적화는 모든 AI 워크플로우 단계에서 단일 스레드를 재사용하는 패턴을 구현하여 중복된 스레드 생성 작업을 제거하고 전체 시스템 성능을 향상시키는 것입니다.

**예상 효과**: API 레이턴시 약 60% 감소 (5.8초 → 약 2.3초)

## 문제 분석

### 현재 아키텍처의 문제점

1. **다중 스레드 생성 문제**
   - `processJobPosting`: `_runGraph`를 통해 새 스레드 생성
   - `processResumeParsing`: `_runGraph`를 통해 새 스레드 생성
   - `startQuestionGeneration`: 경험당 하나씩 여러 개의 새 스레드 생성

2. **병목 지점 식별**
   - 위치: `/src/server/services/ai/langgraph/service.ts:190`
   - 메서드: `_runGraph`가 매 실행마다 새 스레드 생성
   - 영향: 인터뷰 준비당 2-3개의 불필요한 스레드 생성
   - 추가 오버헤드: 질문 생성 시 N개의 경험에 대해 N개의 스레드 생성

3. **성능 지표**
   - 현재 총 레이턴시: ~5.8초
   - 스레드 생성 오버헤드: 스레드당 ~1.5-2초
   - 불필요한 작업: 워크플로우당 3-5개의 스레드 생성

## 제안 솔루션

### 핵심 개념: 단일 스레드 라이프사이클

인터뷰 준비 프로세스 시작 시 하나의 스레드를 생성하고 모든 워크플로우 단계에서 재사용하는 단일 스레드 패턴 구현:

```
[스레드 생성] → [JD 구조화] → [이력서 파싱] → [질문 생성] → [정리]
      ↑                                                    ↓
      └────────────── 단일 스레드 재사용 ──────────────────┘
```

### 구현 전략

#### 1단계: 스키마 업데이트

**파일**: `/prisma/schema.prisma`

`InterviewPreparation` 모델에 `threadId` 필드 추가:

```prisma
model InterviewPreparation {
  // ... 기존 필드들 ...

  // 스레드 관리
  threadId        String?   // 워크플로우 재사용을 위한 LangGraph 스레드 ID

  // ... 나머지 모델 ...
}
```

#### 2단계: 서비스 레이어 리팩토링

**파일**: `/src/server/services/ai/langgraph/service.ts`

1. 스레드 관리 메서드 추가:

```typescript
// 스레드 생성 및 ID 반환
async createThread(): Promise<string>

// 기존 스레드로 그래프 실행
async runGraphWithThread(
  threadId: string,
  graphName: GraphNameType,
  payload: GraphRunPayload
): Promise<Run>

// 모든 워크플로우 완료 후 스레드 정리
async cleanupThread(threadId: string): Promise<boolean>
```

2. 기존 메서드를 선택적 `threadId` 매개변수 지원하도록 수정:

```typescript
async runJdStructuring(
  input: JdStructuringGraphInput,
  threadId?: string
): Promise<Run>

async runResumeParsing(
  input: ResumeParsingGraphInput,
  preparationId: string,
  locale: string,
  threadId?: string
): Promise<Run>

async runQuestionGen(
  input: QuestionGenGraphInput,
  preparationId: string,
  locale?: string,
  threadId?: string
): Promise<Run>
```

#### 3단계: 워크플로우 라우터 업데이트

**파일**: `/src/server/api/routers/interview-workflow/router.ts`

`startAnalysis` 뮤테이션 수정:

```typescript
// 1단계: 스레드를 한 번만 생성
const threadId = await aiService.createThread()

// 2단계: 준비 데이터와 함께 스레드 ID 저장
const preparation = await createInterviewPreparation(ctx.prisma, ctx.userId, {
  ...input,
  threadId,
})

// 3단계: 모든 워크플로우에 스레드 ID 전달
const [jobPostingResult, resumeParsingResult] = await Promise.all([
  processJobPosting(ctx.prisma, preparation.id, input, threadId),
  processResumeParsing(
    ctx.prisma,
    preparation.id,
    input.locale,
    input.resumeFileUrl,
    threadId
  ),
])
```

#### 4단계: 개별 서비스 업데이트

**업데이트할 파일들**:

- `/src/server/api/routers/interview-workflow/services/jd-structuring.service.ts`
- `/src/server/api/routers/interview-workflow/services/resume-parsing.service.ts`
- `/src/server/api/routers/interview-workflow/services/question-generation.service.ts`

각 서비스는:

1. `threadId` 매개변수 수락
2. LangGraph 서비스 호출에 스레드 ID 전달
3. 개별 스레드 생성 로직 제거

#### 5단계: 정리 로직 구현

**파일**: `/src/app/api/webhooks/ai-workflow/handlers/question-generation.handler.ts`

모든 질문 생성 완료 후:

```typescript
// 모든 워크플로우 완료 확인
if (isAllWorkflowsComplete) {
  // 스레드 정리
  if (preparation.threadId) {
    await aiService.cleanupThread(preparation.threadId)

    // 준비 데이터에서 스레드 ID 제거
    await prisma.interviewPreparation.update({
      where: { id: preparationId },
      data: { threadId: null },
    })
  }
}
```

## 구현 단계

### 1단계: 데이터베이스 마이그레이션 (5분)

1. 스키마에 `threadId` 필드 추가
2. 마이그레이션 생성: `pnpm prisma migrate dev --name add-thread-id-to-preparation`
3. 마이그레이션 적용 및 클라이언트 재생성

### 2단계: LangGraph 서비스 개선 (30분)

1. 스레드 관리 메서드 구현
2. 기존 메서드에 스레드 재사용 지원 추가
3. 선택적 threadId로 하위 호환성 보장

### 3단계: 워크플로우 라우터 리팩토링 (20분)

1. `startAnalysis`를 단일 스레드 생성하도록 업데이트
2. 모든 서비스 호출에 스레드 ID 전달
3. 스레드 정리를 위한 오류 처리 업데이트

### 4단계: 서비스 레이어 업데이트 (30분)

1. JD 구조화 서비스 업데이트
2. 이력서 파싱 서비스 업데이트
3. 질문 생성 서비스 업데이트
4. 스레드 ID 전파 확인

### 5단계: 정리 로직 (15분)

1. 최종 웹훅 핸들러에서 스레드 정리 구현
2. 오류 시나리오를 위한 폴백 정리 추가
3. 정리 후 데이터베이스에서 스레드 ID 제거

### 6단계: 테스트 및 검증 (30분)

1. 스레드 재사용으로 전체 워크플로우 테스트
2. 레이턴시 개선 검증
3. 오류 시나리오 및 정리 테스트
4. 연결 누수 모니터링

## 적용된 클린 코드 원칙

### 1. 단일 책임 원칙 (Single Responsibility Principle)

- 스레드 관리를 전용 메서드로 분리
- 각 서비스는 핵심 기능에 집중
- 스레드 라이프사이클과 비즈니스 로직의 명확한 분리

### 2. 개방-폐쇄 원칙 (Open/Closed Principle)

- 선택적 threadId로 하위 호환성 구현
- 기존 코드 경로는 기능 유지
- 기존 기능을 깨뜨리지 않고 새 기능 추가

### 3. 의존성 역전 원칙 (Dependency Inversion)

- 서비스는 구현이 아닌 추상화(스레드 ID)에 의존
- LangGraph 서비스에서 스레드 관리 추상화
- 스레드 세부사항에서 워크플로우 로직 분리

### 4. DRY (Don't Repeat Yourself)

- 단일 스레드 생성 지점
- 중앙화된 정리 로직
- 재사용 가능한 스레드 관리 메서드

### 5. YAGNI (You Aren't Gonna Need It)

- 목표 달성을 위한 최소한의 변경
- 스레드 풀링의 과도한 엔지니어링 없음
- 단순하고 집중된 솔루션

## 위험 분석 및 완화

### 위험 요소

1. **스레드 상태 오염**
   - 위험: 공유 스레드가 워크플로우 간 상태를 전달할 수 있음
   - 완화: 무상태 그래프 구현 보장

2. **정리 실패**
   - 위험: 스레드가 적절히 정리되지 않음
   - 완화: 고아 스레드를 위한 예약된 정리 작업 구현

3. **동시 접근**
   - 위험: 공유 스레드의 경합 조건
   - 완화: 필요한 경우 순차적 워크플로우 실행

4. **오류 복구**
   - 위험: 스레드 손상이 모든 워크플로우에 영향
   - 완화: 오류 시 새 스레드 생성으로 폴백

## 성공 지표

### 성능 지표

- [ ] API 레이턴시 5.8초에서 3초 미만으로 감소
- [ ] 스레드 생성 호출 3-5개에서 1개로 감소
- [ ] 네트워크 왕복 60% 감소

### 품질 지표

- [ ] 모든 기존 테스트 통과
- [ ] 오류율 증가 없음
- [ ] 스레드 정리율: 100%

### 모니터링 포인트

1. 스레드 생성 빈도 추적
2. 정리 성공률 모니터링
3. 종단 간 레이턴시 측정
4. 스레드 라이프사이클 기간 추적

## 롤백 계획

문제 발생 시:

1. **빠른 롤백**: 스레드 재사용을 비활성화하는 기능 플래그
2. **데이터 정리**: 모든 준비에서 threadId를 지우는 스크립트
3. **서비스 폴백**: 새 스레드 생성으로 자동 폴백
4. **모니터링**: 스레드 관련 오류에 대한 알림

## 타임라인

- **1일차**: 스키마 업데이트 및 서비스 레이어 변경
- **2일차**: 워크플로우 통합 및 테스트
- **3일차**: 프로덕션 배포 및 모니터링

## 결론

이 리팩토링 계획은 스레드 재사용에 대한 집중적이고 클린 코드 접근법을 통해 식별된 레이턴시 병목 현상을 해결합니다. 중복된 스레드 생성 작업을 제거함으로써 코드 품질과 시스템 안정성을 유지하면서 상당한 성능 개선을 달성할 것으로 예상됩니다.

구현은 확립된 클린 코드 원칙을 따르며, 하위 호환성을 보장하고, 포괄적인 위험 완화 전략을 포함합니다. 단계적 접근 방식은 점진적 검증과 필요시 쉬운 롤백을 허용합니다.

## 부록: 코드 참조

### 수정할 주요 파일

1. `/prisma/schema.prisma:44` - threadId 필드 추가
2. `/src/server/services/ai/langgraph/service.ts:184-202` - 스레드 관리
3. `/src/server/api/routers/interview-workflow/router.ts:58-135` - 메인 워크플로우
4. `/src/server/api/routers/interview-workflow/services/*.service.ts` - 서비스 업데이트
5. `/src/app/api/webhooks/ai-workflow/handlers/*.handler.ts` - 정리 로직

### 성능 기준선

- 현재: 평균 레이턴시 5.8초
- 스레드 생성: 작업당 ~1.5초
- 예상 개선: 3.5초 감소
- 목표: 총 레이턴시 2.5초 미만

---

_문서 버전: 1.0_
_작성일: 2025-01-26_
_작성자: AI Assistant_
_검토 상태: 대기 중_
