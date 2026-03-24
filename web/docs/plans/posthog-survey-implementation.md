# PostHog User Survey 구현 계획

> **버전:** v1.3.0
> **작성일:** 2026-01-20
> **상태:** Draft

---

## 1. 개요

### 1.1 목적

사용자 여정의 핵심 지점에서 피드백을 수집하여 제품 개선에 활용합니다.

**목표:**

- Landing → 유입 경로 및 관심 분야 파악
- 분석 완료 → 이력서 분석 품질 평가
- 첫 피드백 → AI 피드백 품질 평가
- NPS → 전반적인 서비스 만족도 및 추천 의향

### 1.2 범위

| Survey ID | 이름               | 트리거 시점         | 조건                 |
| --------- | ------------------ | ------------------- | -------------------- |
| 0         | Landing 페인포인트 | Landing 페이지 방문 | 익명 사용자, 첫 방문 |
| 1         | 분석 완료 만족도   | 분석 완료 시        | 유저당 최초 1회      |
| 2         | 첫 피드백 만족도   | 피드백 수신 시      | 유저당 최초 1회      |
| 3         | NPS                | 피드백 3회 이상 후  | 유저당 최초 1회      |

### 1.3 관련 시스템

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PostHog       │◄────│   Next.js       │────►│   Prisma DB     │
│   Survey API    │     │   Frontend      │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  PostHog        │     │  tRPC Server    │
│  Dashboard      │     │  (상태 변경)     │
└─────────────────┘     └─────────────────┘
```

---

## 2. Survey 설계

### 2.1 Survey 0: Landing 페인포인트

**목적:** 사용자의 면접 준비 관련 페인포인트 파악

| 항목       | 값                       |
| ---------- | ------------------------ |
| **타입**   | Popover                  |
| **트리거** | Landing 페이지 10초 체류 |
| **대상**   | 익명 사용자 (비로그인)   |
| **빈도**   | 유저당 1회               |

**질문:**

1. (Multiple Choice) 기술 면접 준비할 때 어려운 점은? (복수 선택 가능)
   - 어떤 질문이 나올지 예측이 안 돼요
   - 내 경험을 기술적으로 설명하기 어려워요
   - 피드백 받을 곳이 없어요
   - 준비할 시간이 부족해요
   - 면접 회고를 개선에 연결하기 어려워요
   - 회사별 맞춤 준비 방법을 모르겠어요
   - 기타 (직접 입력)

### 2.2 Survey 1: 분석 완료 만족도

**목적:** 이력서 분석 결과 페이지 전반의 만족도 및 개선점 파악

| 항목       | 값                                                 |
| ---------- | -------------------------------------------------- |
| **타입**   | Popover                                            |
| **트리거** | `InterviewPreparation.status = READY` 최초 도달 시 |
| **대상**   | 로그인 사용자                                      |
| **빈도**   | 유저당 최초 1회                                    |

**질문:**

1. (Rating 1-5) 분석 결과 페이지가 면접 준비에 도움이 됐나요?
2. (Conditional Multiple Choice - Rating 4-5) 어떤 부분이 도움이 됐나요? (복수 선택)
   - 핵심 면접 질문 (Today's Quest)
   - 이력서 파싱 결과
   - 기타 (직접 입력)
3. (Conditional Multiple Choice - Rating 1-3) 아쉬운 점이 있다면? (복수 선택)
   - 질문이 기대와 달랐어요
   - 이력서 내용이 잘못 파싱됐어요
   - 정보가 부족해요
   - 기타 (직접 입력)

### 2.3 Survey 2: 첫 피드백 만족도

**목적:** AI 피드백 품질 평가

| 항목       | 값                                       |
| ---------- | ---------------------------------------- |
| **타입**   | Popover                                  |
| **트리거** | 첫 `Feedback` 생성 후 피드백 페이지 도달 |
| **대상**   | 로그인 사용자                            |
| **빈도**   | 유저당 최초 1회                          |

**질문:**

1. (Rating 1-5) AI 피드백이 면접 준비에 도움이 됐나요?
2. (Conditional Multiple Choice - Rating 4-5) 어떤 부분이 도움이 됐나요? (복수 선택)
   - 강/약점 분석
   - 개선점 제안
   - 예시 답안
   - 기타 (직접 입력)
3. (Conditional Multiple Choice - Rating 1-3) 아쉬운 점이 있다면? (복수 선택)
   - 텍스트가 너무 많아요
   - 강점/약점 분석이 부정확해요
   - 개선점이 구체적이지 않아요
   - 예시 답안이 도움이 안 돼요
   - 기타 (직접 입력)

### 2.4 Survey 3: NPS (Net Promoter Score)

**목적:** 서비스 추천 의향 및 전반적 만족도 측정

| 항목       | 값                                        |
| ---------- | ----------------------------------------- |
| **타입**   | Popover                                   |
| **트리거** | `Feedback` 3회 이상 생성 후 대시보드 접근 |
| **대상**   | 로그인 사용자                             |
| **빈도**   | 유저당 최초 1회                           |

**질문:**

1. (NPS 0-10) Deep Quest를 동료나 친구에게 추천할 의향이 얼마나 되시나요?
2. (Conditional Open - Score 0-6) 어떤 점이 아쉬웠나요?
3. (Conditional Open - Score 7-10) 가장 마음에 드는 점은 무엇인가요?

---

## 3. 구현 요구사항

### 3.1 수정 대상 파일

| 파일                                       | 용도                                         |
| ------------------------------------------ | -------------------------------------------- |
| `src/server/api/routers/interview-prep.ts` | 분석 완료 mutation에 PostHog property 설정   |
| `src/server/api/routers/feedback.ts`       | 피드백 생성 mutation에 PostHog property 설정 |
| `src/lib/analytics/posthog-events.ts`      | 이벤트/property 상수 정의                    |
| `src/lib/analytics/posthog-client.ts`      | 서버사이드 PostHog 클라이언트                |

### 3.2 PostHog 이벤트 정의

| 이벤트명                | 트리거 시점          | 용도                                 |
| ----------------------- | -------------------- | ------------------------------------ |
| `preparation_completed` | 분석 완료 mutation   | 첫 분석 완료 시 person property 설정 |
| `feedback_received`     | 피드백 생성 mutation | 피드백 카운트 및 NPS 자격 설정       |

### 3.3 PostHog Person Property 정의

| Property 키               | 타입         | 설명                 | 설정 시점               |
| ------------------------- | ------------ | -------------------- | ----------------------- |
| `first_prep_completed`    | boolean      | 첫 분석 완료 여부    | 최초 READY 상태 도달 시 |
| `first_prep_completed_at` | ISO datetime | 첫 분석 완료 시각    | 최초 READY 상태 도달 시 |
| `first_feedback_received` | boolean      | 첫 피드백 수신 여부  | 최초 피드백 생성 시     |
| `feedback_count`          | number       | 총 피드백 수         | 매 피드백 생성 시       |
| `nps_eligible`            | boolean      | NPS Survey 대상 여부 | 피드백 3회 이상 시      |

### 3.4 조건 확인 방식

**핵심 원리:** 상태 변경 시점(mutation)에서 DB 조회 후 PostHog person property 설정

#### "유저당 최초 prep 완료" 조건

- **확인 방법:** 해당 유저의 `READY` 상태 prep 카운트 == 1
- **Prisma 모델:** `InterviewPreparation` (직접 `userId` 연결)
- **설정할 Property:** `first_prep_completed: true`, `first_prep_completed_at: ISO datetime`

#### "유저당 최초 feedback" 조건

- **확인 방법:** 해당 유저의 feedback 카운트 == 1
- **Prisma 경로:** `Feedback` → `Answer` → `Question` → `KeyAchievement.userId`
- **설정할 Property:** `first_feedback_received: true`, `feedback_count: 1`

#### "3회 이상 feedback" 조건

- **확인 방법:** 해당 유저의 feedback 카운트 >= 3
- **Prisma 경로:** 위와 동일
- **설정할 Property:** `nps_eligible: true`

### 3.5 주의사항

- **Property 설정 누락 시 복구 어려움:** 네트워크 실패 등으로 property 미설정 시 해당 Survey 영구 미표시 (치명적이지 않음 - 피드백 수집 목적)
- **기존 유저 미지원:** 구현 전 가입한 유저는 property 없음 → Survey 미표시 허용 (별도 마이그레이션 불필요)

### 3.6 개발 가이드라인

| 원칙                         | 설명                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| **낮은 결합도, 높은 응집도** | 모듈 간 의존성 최소화, 관련 기능은 하나의 모듈에 집중                    |
| **기존 코드베이스 숙지**     | 구현 전 관련 파일의 기존 패턴 분석 필수                                  |
| **상수 기반 관리**           | 하드코딩 금지, `posthog-events.ts`에 상수 정의 후 사용                   |
| **PostHog 최신 정보 확인**   | PostHog 관련 구현/에러 시 PostHog MCP 또는 Context7 MCP로 최신 문서 확인 |

---

## 4. 데이터 모델 참조

### 4.1 데이터 모델 경로 분석

```
User (id)
  │
  ├── InterviewPreparation (userId) ← 직접 연결
  │     │
  │     ├── CareerExperience
  │     │     └── KeyAchievement (userId 비정규화) ← 직접 연결 가능!
  │     │           └── Question
  │     │                 └── Answer
  │     │                       └── Feedback
  │     │
  │     └── ProjectExperience
  │           └── KeyAchievement (userId 비정규화)
  │                 └── Question
  │                       └── Answer
  │                             └── Feedback
```

**핵심 발견:** `KeyAchievement`에 `userId`가 비정규화되어 있음!
→ `Feedback` → `Answer` → `Question` → `KeyAchievement.userId`로 3단계 JOIN만 필요

### 4.2 성능 고려사항

| 쿼리           | 예상 복잡도   | 인덱스 필요                        |
| -------------- | ------------- | ---------------------------------- |
| Prep count     | O(1)          | `(userId, status)` ✅ 존재         |
| Feedback count | O(n) JOIN 3회 | `key_achievements.user_id` ✅ 존재 |

**최적화 방안:**

1. `KeyAchievement.userId` 인덱스 활용 (이미 존재)
2. 카운트만 필요하므로 `SELECT COUNT(*)` 사용
3. 필요시 `Feedback` 테이블에도 `userId` 비정규화 고려 (향후)

---

## 5. PostHog 설정

### 5.1 PostHog Survey 자동 표시 방식

**핵심 원리:** PostHog Survey가 Person Property를 기반으로 자동 표시

```
┌─────────────────┐
│  상태 변경       │  (분석 완료, 피드백 생성)
│  (tRPC Mutation)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DB 조회         │  (조건 확인: 최초 여부, 개수)
│  (Prisma Count) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostHog        │  ($set: { first_prep_completed: true })
│  Property 설정   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostHog Survey │  (Targeting: person.first_prep_completed = true)
│  자동 표시       │
└─────────────────┘
```

**장점:**

- 클라이언트 코드 최소화 (별도 Survey 컴포넌트 불필요)
- PostHog 내장 Survey 표시 로직 활용
- 조건 변경 시 PostHog UI에서만 수정

### 5.2 PostHog UI 설정 방법

**Survey 1: 분석 완료 만족도**

```
PostHog Dashboard → Surveys → Create Survey
├── Display conditions
│   ├── URL: /interview-prep/* (분석 결과 페이지)
│   └── Delay: 2초 (페이지 로드 후)
│
├── User targeting
│   └── Person property: first_prep_completed = true
│
└── Frequency
    └── Once per user
```

**Survey 2: 첫 피드백 만족도**

```
PostHog Dashboard → Surveys → Create Survey
├── Display conditions
│   ├── URL: /feedback/* (피드백 페이지)
│   └── Delay: 2초
│
├── User targeting
│   └── Person property: first_feedback_received = true
│
└── Frequency
    └── Once per user
```

**Survey 3: NPS**

```
PostHog Dashboard → Surveys → Create Survey
├── Display conditions
│   ├── URL: /dashboard (대시보드)
│   └── Delay: 5초
│
├── User targeting
│   └── Person property: nps_eligible = true
│
└── Frequency
    └── Once per user
```

---

## 6. 구현 계획

### Phase 1: 기반 작업 (0.5일)

| Task | 설명                                     | 담당     |
| ---- | ---------------------------------------- | -------- |
| 1.1  | POSTHOG_EVENTS에 Survey 관련 이벤트 추가 | Frontend |
| 1.2  | POSTHOG_PERSON_PROPERTIES 상수 정의      | Frontend |

### Phase 2: Mutation 수정 (1일)

| Task | 설명                                              | 담당    |
| ---- | ------------------------------------------------- | ------- |
| 2.1  | 분석 완료 mutation에 PostHog property 설정 추가   | Backend |
| 2.2  | 피드백 생성 mutation에 PostHog property 설정 추가 | Backend |
| 2.3  | PostHog 서버사이드 클라이언트 설정 확인           | Backend |

### Phase 3: PostHog Survey 생성 (1일)

| Task | 설명                                             | 담당 |
| ---- | ------------------------------------------------ | ---- |
| 3.1  | PostHog에서 Survey 0 (Landing) 생성              | -    |
| 3.2  | PostHog에서 Survey 1 (분석 완료) 생성            | -    |
| 3.3  | PostHog에서 Survey 2 (첫 피드백) 생성            | -    |
| 3.4  | PostHog에서 Survey 3 (NPS) 생성                  | -    |
| 3.5  | 각 Survey Targeting 조건 설정                    | -    |
| 3.6  | 각 Survey 질문/선택지 다국어 콘텐츠 작성 (ko/en) | -    |

### Phase 4: 테스트 & 배포 (1일)

| Task | 설명                                | 담당   |
| ---- | ----------------------------------- | ------ |
| 4.1  | Staging 환경에서 Survey 동작 테스트 | QA     |
| 4.2  | Person Property 설정 확인           | QA     |
| 4.3  | Production 배포                     | DevOps |
| 4.4  | PostHog 대시보드에서 응답 확인      | -      |

### 예상 총 소요 시간: 3.5일

---

## 7. 테스트 계획

### 7.1 테스트 시나리오

#### Mutation 통합 테스트

| 시나리오            | 입력 조건                | 기대 결과                                            |
| ------------------- | ------------------------ | ---------------------------------------------------- |
| 첫 번째 분석 완료   | 기존 READY prep 없음     | `first_prep_completed: true` 설정                    |
| 두 번째 분석 완료   | 기존 READY prep 1개 존재 | property 설정 없음                                   |
| 첫 번째 피드백 생성 | 기존 feedback 없음       | `first_feedback_received: true`, `feedback_count: 1` |
| 두 번째 피드백 생성 | 기존 feedback 1개        | `feedback_count: 2`, `nps_eligible: false`           |
| 세 번째 피드백 생성 | 기존 feedback 2개        | `feedback_count: 3`, `nps_eligible: true`            |

### 7.2 E2E 시나리오

| 시나리오                          | 기대 결과                                |
| --------------------------------- | ---------------------------------------- |
| 신규 유저가 첫 분석 완료          | PostHog에 first_prep_completed=true 설정 |
| 동일 유저가 분석 결과 페이지 방문 | Survey 1 자동 표시                       |
| 기존 유저가 두 번째 분석 완료     | Property 변경 없음, Survey 미표시        |
| 신규 유저가 첫 피드백 수신        | first_feedback_received=true 설정        |
| 유저가 3번째 피드백 수신          | nps_eligible=true 설정                   |
| NPS 자격 유저가 대시보드 접근     | Survey 3 (NPS) 표시                      |
| 같은 유저가 다시 조건 충족        | 이미 응답했으면 표시 안됨                |

### 7.3 PostHog Survey Targeting 검증

| Survey   | Targeting 조건               | 검증 방법                             |
| -------- | ---------------------------- | ------------------------------------- |
| Survey 0 | URL + 익명 유저              | Landing 페이지 10초 체류 시 표시 확인 |
| Survey 1 | first_prep_completed=true    | 조건 충족 유저만 표시 확인            |
| Survey 2 | first_feedback_received=true | 조건 충족 유저만 표시 확인            |
| Survey 3 | nps_eligible=true            | 조건 충족 유저만 표시 확인            |

---

## 8. 구현 시 고려사항

### 8.1 개발 환경 처리

**현재 상태:** `src/lib/analytics/posthog-client.ts`에서 dev 환경 PostHog 비활성화됨

**Survey 테스트를 위한 옵션:**

1. **Staging 환경에서 테스트 (권장)**
2. 임시로 dev 환경 활성화 후 테스트
3. PostHog의 "Test mode" 활용

### 8.2 Survey 응답 중복 방지

PostHog Survey의 기본 동작으로 자동 처리됨:

- 한 번 응답한 사용자에게 같은 Survey 재표시 안함
- `$survey_responded` 이벤트로 응답 여부 추적

별도의 클라이언트 측 중복 방지 코드 불필요

---

## 9. 참고 자료

- [PostHog Surveys Documentation](https://posthog.com/docs/surveys)
- [PostHog Person Properties](https://posthog.com/docs/data/persons)
- [기존 PostHog 설정](./posthog-setup-report.md)
- [DB Schema](../../prisma/schema.prisma)

---

## 변경 이력

| 버전   | 날짜       | 변경 내용                                                                                                      |
| ------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| v1.0.0 | 2026-01-20 | 초안 작성                                                                                                      |
| v1.1.0 | 2026-01-20 | Option B (PostHog Person Property) 방식으로 단순화: eligibility API 제거, mutation 기반 property 설정으로 변경 |
| v1.2.0 | 2026-01-20 | 구현 코드 제거, 조건/요구사항/파일경로 중심 문서로 재구성                                                      |
| v1.3.0 | 2026-01-20 | 개발 가이드라인 섹션 추가                                                                                      |
