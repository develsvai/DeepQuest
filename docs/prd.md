# AI Interview Coaching Service Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals

#### 1차 목표 (이번 MVP 범위)

  * **기술 전문성 검증:** 개발자의 이력서에 기재된 기술 역량의 실제 깊이를 검증하여 면접 준비의 신뢰도를 향상시킨다.
  * **초개인화된 면접 경험 제공:** 후보자의 이력서, 목표 직무, 회사 특성을 종합하여 고도로 맥락화된 맞춤형 면접 질문을 생성한다.
  * **지식 격차 발견 및 개선:** 동적 후속 질문을 통해 사용자의 기술적 지식 한계를 파악하고, 고품질의 피드백으로 이를 개선하여 면접을 철저히 준비할 수 있도록 돕는다.
  * **효율적인 다중 면접 관리:** 여러 면접을 동시에 준비하는 개발자들이 각 회사의 요구사항에 맞춰 체계적으로 준비할 수 있는 워크플로우를 제공한다.

#### 2차 목표 (Next Scope)

  * **AI 채팅 튜터링:** 특정 기술이나 개념에 대해 모르는 부분을 AI 개인 코치에게 질문하고 학습하여 지식을 보충한다.
  * **AI 실전 화상 면접:** AI와 함께 실제와 유사한 환경에서 화상 면접을 시뮬레이션한다.

#### 3차 목표 (Later Scope)

  * **실전 면접 후기 시스템:** 실제 면접 후 받은 질문, 답변 수준, 개선점 등을 기록하고, 이를 바탕으로 맞춤형 개선안을 제안받는다.

#### 최종 목표

  * **궁극적인 면접 합격 지원:** 이 모든 과정을 통해, 사용자가 최종적으로 목표하는 회사의 면접 프로세스를 통과할 수 있도록 실질적인 도움을 제공한다.

### Background Context

현재 기술 면접 시장, 특히 초기 경력 개발자 영역에서는 이력서에 기재된 역량과 실제 기술 깊이 간의 간극을 객관적으로 검증할 방법이 부족한 핵심적인 문제가 있습니다. 개발자들은 여러 회사에 각기 다른 이력서와 직무 기술서로 지원하며 복잡한 면접 준비 과정을 체계적으로 관리하는 데 어려움을 겪고 있습니다. 기존의 코딩 테스트나 일반적인 시스템 설계 질문 같은 솔루션들은 후보자의 고유한 경험과 이력서 기반의 전문성을 검증하지 못하는 한계가 있습니다. 이러한 획일적인 접근 방식은 지능적인 후속 질문 없이는 피상적인 지식을 걸러내지 못하며, 실제 면접의 핵심 요소인 '이력서 + 직무기술서 + 회사'라는 맥락의 삼위일체를 간과합니다.

이러한 시장의 문제점은 곧 거대한 기회로 이어집니다. 전 세계 수백만 명에 달하는 0-5년 차 소프트웨어 개발자들은 끊임없이 더 나은 면접 준비 도구를 찾고 있으며, 이 시장은 신규 개발자들의 유입으로 계속해서 성장하고 있습니다. 본 서비스는 이 명확한 필요성에 부응하여, 개발자들이 자신의 실제 기술 깊이를 정확히 파악하고 각 회사별 면접에 맞춤형으로 준비할 수 있도록 돕는 것을 목표로 합니다. 이를 통해 면접 성공률을 실질적으로 높여, 높은 가치를 제공하는 프리미엄 서비스로 자리매김할 수 있으며, 향후 다른 전문 분야로의 확장 가능성 또한 열려 있습니다.

## 2. Requirements

#### 기능적 요구사항 (Functional)

  * FR1: 사용자 가입 및 인증: 깃헙(Github) 및 구글(Google) 계정을 이용한 소셜 로그인(OAuth)만 지원한다. (이메일/비밀번호 방식의 회원가입은 지원하지 않는다.)
  * FR2: 기술 역량 추출 및 분석 엔진: 이력서, 직무 기술서, 회사 정보를 심층 분석하여 초개인화된 질문 생성을 위한 기술 프로필을 생성한다.
  * FR3: 초개인화된 기술 질문 생성: 사용자의 기술 프로필을 기반으로 이력서의 주장을 검증하는 맞춤형 기술 질문을 생성한다.
      * 초기 질문은 이력서 내용에 STAR(Situation, Task, Action, Result) 기법을 적용하여, 특히 'Result'나 사용자의 강점이 드러나는 부분을 검증하는 형태로 생성한다. 심층 질문은 해당 내용의 기술적 세부사항을 파고드는 방식으로 진행된다.
      * MVP 단계에서는 객관적인 피드백이 가능한 소프트웨어 기술 질문으로 범위를 한정한다.
  * FR4: 기술 깊이 평가 및 피드백: 사용자의 답변을 분석하여 기술 지식의 깊이를 평가하고, 구체적인 지식 격차와 개선점을 제시한다.
      * '지식의 깊이'는 다음과 같이 정의한다: Surface(개념 암기 수준), Intermediate(원리 설명 가능 수준), Deep(실무 적용 및 트레이드오프 설명 가능 수준)
      * 피드백은 [잘한 점, 부족한 점, 개선점]의 3가지 항목으로 구성된다.
      * 답변이 질문과 무관할 경우, '관련 없는 답변으로 채점 불가' 메시지를 표시하고, '개선점' 항목에 '불확실하더라도 답변을 시도하는 것이 중요하다'는 취지의 코칭을 제공한다.
  * FR5: 인터랙티브 연습 인터페이스: 다국어(한/영)를 지원하는 사용자 친화적 인터페이스를 통해 질문을 확인하고 답변을 제출하며, 면접 준비별 진행 상황을 추적한다.
  * FR6: 적응형 심층 질문 시스템: 답변의 품질을 분석하여, 지식의 한계를 파악할 때까지 점진적으로 깊이를 더해가는 지능적인 후속 질문을 동적으로 생성한다.
  * FR7: 다중 면접 준비 관리: 사용자가 여러 개의 면접 준비 과정을 동시에 생성하고 관리할 수 있는 대시보드를 제공한다. 각 면접 준비는 별개의 진행 상황 추적, 컨텍스트 전환, 보관/삭제 기능을 지원해야 한다.
      * '진행 상황'은 각 면접 준비별로 초기 생성된 질문 대비 사용자가 완료한 질문의 비율로 정의한다.
  * FR8: 설정 과정에서의 오류 처리: 이력서 업로드 실패, 직무 기술서 URL 분석 실패 등 면접 준비 설정 과정에서 발생하는 오류에 대해 사용자에게 명확한 원인과 해결 방법을 안내해야 한다.
  * FR9: 입력 데이터 유효성 검증: 시스템은 업로드된 이력서와 입력된 직무 기술서가 모두 소프트웨어 개발 분야와 관련이 있는지 검증한다. 관련이 없을 경우, '분석 불가' 메시지와 함께 명확한 이유를 사용자에게 안내한다.
  * FR10: 비동기 면접 준비 생성: 이력서/JD 분석 및 초기 질문 생성 프로세스(약 2분 소요 예상)는 백그라운드 작업(background job)으로 처리한다. 작업이 완료되면 사용자에게 웹 알림(Web Notification) 및 인앱(In-app) 모달/토스트를 통해 알려준다.

#### 비기능적 요구사항 (Non-Functional)

  * NFR1: 답변 피드백 성능: 사용자가 질문에 대한 답변을 제출한 후, 피드백은 5초 이내에 제공되어야 한다. (P95 기준) 이 시간 동안에는 로딩 상태를 표시한다.
  * NFR2: 언어 지원(Localization): 시스템의 모든 UI는 한국어와 영어를 완벽하게 지원하며, 사용자가 전역적으로 언어를 전환할 수 있어야 한다.
  * NFR3: 사용성: 이력서(PDF/DOCX), 직무 기술서(URL/텍스트)는 한국어와 영어 모두 별도의 전처리 없이 시스템에서 분석 가능해야 한다.
  * NFR4: 신뢰성: 답변 제출 중 데이터가 유실되지 않도록 자동 저장 기능이 지원되어야 한다.
  * NFR5: 초기 설정 응답성: 면접 준비 생성(분석 및 질문 생성)은 비동기적으로 처리되며, 시스템은 작업이 시작되었음을 즉시 사용자에게 알려야 한다.
  * NFR6: 개인정보 보호 및 데이터 보안: 사용자의 이력서 정보는 암호화하여 안전하게 저장해야 하며, 사용자는 원할 때 자신의 모든 데이터를 영구적으로 삭제할 수 있어야 한다.

## 3. User Interface (UI) Design Goals

### Overall UX Vision

  * '신뢰할 수 있는 전문 코치'라는 인상을 주는 것에 집중합니다. 사용자가 자신의 커리어 발전을 위해 사용하는 전문적인 도구로 느껴져야 합니다.
  * 복잡한 AI 기능을 사용자가 직관적으로 이해하고 사용할 수 있도록, 명확하고 간결한 인터페이스를 제공합니다.
  * 사용자가 면접 준비에 온전히 몰입할 수 있도록 불필요한 장식이나 방해 요소를 최소화합니다.

### Key Interaction Paradigms

  * 분리된 진입 경험: 비로그인 사용자를 위한 랜딩 페이지(상단 네비게이션)와 로그인 후의 핵심 애플리케이션(사이드바 네비게이션)을 명확히 분리하여 제공합니다.
  * 대시보드 중심: 로그인 후, 사용자는 모든 면접 준비 현황을 한눈에 파악할 수 있는 카드 기반의 대시보드를 마주합니다.
  * 단계별 흐름: '면접 준비 생성 → 질문 확인 → 답변 → 피드백 확인 → 심층 질문'으로 이어지는 핵심 연습 과정은 명확한 단계별 흐름을 따릅니다.
  * 데이터 시각화: 기술 깊이, 진행 상황 등 복잡한 데이터는 사용자가 쉽게 해석할 수 있는 차트나 그래프로 시각화하여 보여줍니다.

### Core Screens and Views

  * 랜딩 페이지: 서비스의 가치를 소개하고 '앱 열기(Open app)' 버튼을 통해 로그인/진입을 유도하는 첫 화면입니다. 상단 헤더 네비게이션을 가집니다.
  * 로그인 페이지: GitHub/Google OAuth를 통한 소셜 로그인 화면입니다.
  * 대시보드: 로그인 후 진입하는 메인 화면. 토글 가능한 사이드바 네비게이션을 통해 다른 메뉴로 접근하며, 중앙에는 '면접 준비' 목록이 카드로 표시됩니다.
  * 면접 준비 생성 화면: 이력서 업로드, JD 입력을 통해 새로운 면접 준비를 설정하는 화면.
  * 면접 준비 상세 화면: 특정 면접 준비의 회사명, 포지션, 파싱된 이력서 내용을 확인하고, 개별 면접 준비에 대한 대시보드 역할을 합니다.
  * 문제 목록 화면: 생성된 문제의 전체 목록과 심층 질문을 확인하고, 풀이할 문제를 선택하는 화면. 완료/미완료 상태를 구분하여 표시합니다.
  * 문제 풀이 화면: 선택한 문제에 대해 답변을 제출하고 피드백을 받는 핵심 인터페이스. 심층 질문 선택, 재답변, 다음 문제 이동이 가능합니다.

### URL Structure and Page Hierarchy

  * **다국어 지원 URL**: 모든 페이지는 `/[locale]/` 접두사 사용 (ko/en)
  * **인증 기반 라우팅**: Route Groups를 활용한 public/protected 영역 분리
  * **핵심 URL 구조**:
    - `/[locale]/` - 랜딩 페이지 (공개)
    - `/[locale]/auth/signin` - 로그인 페이지 (공개)
    - `/[locale]/dashboard` - 대시보드 (보호됨)
    - `/[locale]/interview-prep/new` - 새 면접 준비 생성 (보호됨)
    - `/[locale]/interview-prep/[id]` - 면접 준비 상세 (보호됨)
    - `/[locale]/interview-prep/[id]/[experienceType]/[experienceId]` - 문제 목록 (보호됨)
    - `/[locale]/interview-prep/[id]/[experienceType]/[experienceId]/[questionId]` - 문제 풀이 (보호됨)
  * **재진입 정책**: 완료된 문제 재진입 시 읽기 전용 모드로 이전 답변과 피드백 확인 가능

### Accessibility

  * WCAG AA 수준을 목표로 하여, 모든 사용자가 불편함 없이 서비스의 핵심 기능을 이용할 수 있도록 합니다.

### Branding

  * 'Claude' AI와 유사한 브랜딩: 전반적으로 깔끔하고, 미니멀하며, 전문적인 느낌을 추구합니다. 제공해주신 컬러 팔레트를 기준으로, 따뜻한 오프화이트(\#faf9f5)를 배경으로 사용하고 차분한 오렌지/레드(\#c96442)를 포인트 색상으로 활용합니다. 텍스트와 주요 요소에는 짙은 회색/갈색(\#3d3929)을 사용하여 가독성과 전문성을 높이며, 사이드바 등에는 짙은 회색(\#1c1c1c) 배경을 적용하여 시각적 계층을 구분합니다.

### Target Device and Platforms

  * 웹 반응형 (Web Responsive): MVP 단계에서는 데스크톱 웹 브라우저 사용을 중심으로 하되, 모바일 기기에서도 기본적인 사용이 가능한 반응형 웹을 목표로 합니다.

## 4. Technical Assumptions

### Repository Structure

  * 폴리레포 (Polyrepo): 웹 애플리케이션(front)과 AI 서버(ai)를 각각 독립된 저장소로 관리합니다.

### Service Architecture

  * T3 Stack: Next.js 15 + Typescript + tRPC + Prisma + TailwindCSS
  * 웹 애플리케이션 (Web Application): Next.js를 사용하여 프론트엔드와 주요 백엔드 API를 함께 개발합니다. API 통신은 tRPC를 사용합니다.
  * 인증 및 데이터베이스 (Auth & DB): 인증은 Clerk, 데이터베이스는 Supabase(PostgreSQL)를 사용하며, ORM으로는 Prisma을 활용합니다.
  * AI 서버 (AI Server): 핵심 AI 로직(질문 생성, 피드백 등)은 별도의 Python 서버로 구축하며, LangGraph 프레임워크를 사용합니다. Next.js 백엔드는 이 AI 서버를 내부적으로 호출하여 사용합니다.
  * 폴더 구조:
    ```
    / (root)
    |-- web/      (Next.js App: front + tRPC backend)
    |-- ai/       (Python LangGraph App)
    ```

### Testing Requirements

  * 접근 방식: 단위 테스트와 통합 테스트를 병행하되, MVP의 핵심 기능 및 리스크가 큰 부분에 집중합니다.
  * 중점 테스트 대상:
      * AI 서버의 핵심 로직 (이력서 분석, 질문/피드백 생성)
      * `web`과 `ai` 서버 간의 API 연동
      * 사용자 인증(Clerk) 및 주요 데이터 처리(Prisma) 로직

## 5. Epic List

#### Epic 1: UI Foundation and User Experience

  * **목표:** UI-first 접근으로 전체 사용자 흐름을 시각화하고, 목업 데이터로 작동하는 완전한 프론트엔드를 구축하여 사용성을 빠르게 검증합니다.

#### Epic 2: Backend Integration and Real Data

  * **목표:** 구축된 UI에 백엔드 서비스를 점진적으로 통합하여, AI 기반 면접 준비와 피드백 기능을 실제로 작동하도록 만듭니다.

## 6. Epic Details

### Epic 1: UI Foundation and User Experience

**에픽 목표:** UI-first 접근으로 목업 데이터를 활용한 완전한 프론트엔드를 1-2주 내에 구축하여, 전체 사용자 경험을 시각화하고 사용성을 빠르게 검증합니다. 이를 통해 실제 백엔드 개발 전에 제품의 핵심 가치를 명확히 하고 피드백을 수집합니다.

#### Story 1.0: 프로젝트 초기화 및 UI 기반 설정

  * **As a** developer,
  * **I want to** set up the frontend development environment with UI libraries and design system,
  * **so that** I can rapidly prototype and build all user interfaces with mock data.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **Next.js 프로젝트 초기화:** Next.js 15 App Router 기반 프로젝트가 생성되고, TypeScript와 Tailwind CSS가 설정된다.
2.  **shadcn/ui 설정:** shadcn/ui 컴포넌트 라이브러리가 설치되고, 필요한 기본 컴포넌트들이 추가된다.
3.  **글로벌 스타일 구성:** `globals.css`에 디자인 토큰과 색상 팔레트가 정의되고, 일관된 스타일 시스템이 구축된다.
4.  **목업 데이터 구조:** 면접 준비, 질문, 피드백 등의 목업 데이터를 위한 TypeScript 타입과 샘플 데이터가 생성된다.
5.  **레이아웃 컴포넌트:** 상단 네비게이션, 사이드바, 기본 레이아웃 컴포넌트가 구현된다.
6.  **반응형 설정:** 모바일/태블릿/데스크톱 브레이크포인트가 설정되고, 기본 반응형 동작이 검증된다.
7.  **개발 환경 검증:** `pnpm dev`로 로컬 서버가 실행되고, 모든 UI 컴포넌트가 정상 렌더링된다.
8.  **컴포넌트 개발 환경:** shadcn/ui 컴포넌트를 기반으로 재사용 가능한 컴포넌트들이 구성되고, 실제 사용 맥락에서 테스트된다.
    - **핵심 컴포넌트 (Story 1.0에서 구현):**
      - InterviewPreparationCard: 모든 상태 (PROCESSING, READY, FAILED)
      - FeedCard: 3가지 변형 (Question, Answer, Feedback)
      - LanguageToggle: 언어 전환 컴포넌트
      - LoadingStates: 스켈레톤, 스피너, 프로그레스
      - FileUpload: 드래그앤드롭 상태
      - URLInput: 검증 상태 (유효, 무효, 로딩)
    - **지원 컴포넌트 (Story 1.7 전에):**
      - Navigation 컴포넌트 (사이드바, 헤더)
      - EmptyStates: 빈 상태 UI
      - Toast/Alert 컴포넌트

#### Story 1.0.5: URL 구조 정의 및 라우팅 구현 (추가됨)

  * **As a** developer,
  * **I want to** establish URL structure and implement routing with authentication,
  * **so that** UI components can be placed in proper page contexts with secure access control.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **Route Groups 구조:** `(public)`과 `(protected)` 그룹으로 인증 영역 분리
2.  **URL 체계 확정:** 7개 핵심 페이지 URL 구조 정의
3.  **Dynamic Routes:** `[id]`, `[questionId]` 파라미터 처리
4.  **인증 통합:** Clerk middleware로 protected 영역 보호
5.  **레이아웃 구성:** Public/Protected 별도 레이아웃
6.  **재진입 정책:** 완료된 문제 읽기 전용 모드
7.  **Epic 2 대비:** 백엔드 통합 위치 TODO 마킹

#### Story 1.1: 다국어(i18n) 시스템 설정

  * **As a** developer,
  * **I want to** set up internationalization from the start,
  * **so that** all UI text can support Korean and English without refactoring.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **i18n 라이브러리 설치:** next-intl 또는 next-i18next가 설치되고 설정된다.
2.  **언어 파일 구조:** `/locales/ko`, `/locales/en` 디렉토리 구조가 생성된다.
3.  **기본 번역 키:** 공통 UI 텍스트(버튼, 레이블, 메시지)의 번역 키가 정의된다.
4.  **언어 전환 컴포넌트:** 한국어/영어 토글 버튼이 구현된다.
5.  **라우팅 설정:** 언어별 URL 구조(/ko, /en)가 설정된다.
6.  **타입 안전성:** 번역 키에 대한 TypeScript 타입이 자동 생성된다.
7.  **기본 언어 설정:** 브라우저 언어 감지 및 기본 언어(한국어) 설정이 구현된다.
8.  **localStorage 연동:** 사용자의 언어 선택이 브라우저에 저장된다.

#### Story 1.2: 랜딩 페이지 및 인증 UI 구현

  * **As a** new user,
  * **I want to** see an attractive landing page and be able to sign in,
  * **so that** I can understand the service value and access the application.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **랜딩 페이지 구현:** 서비스 소개, 주요 기능, CTA 버튼이 포함된 랜딩 페이지가 완성된다.
2.  **상단 네비게이션:** 비로그인 상태의 헤더 네비게이션(서비스 소개, 기능, 앱 열기)이 구현된다.
3.  **로그인 모달:** GitHub/Google OAuth 버튼이 있는 로그인 모달이 구현된다. (실제 인증 없이 목업)
4.  **인증 상태 시뮬레이션:** localStorage를 사용한 간단한 로그인 상태 관리가 구현된다.
5.  **라우트 보호:** 로그인 상태에 따른 페이지 접근 제한이 구현된다.
6.  **시각 디자인:** PRD의 브랜딩 가이드라인에 따른 색상과 타이포그래피가 적용된다.
7.  **반응형 디자인:** 모바일/태블릿/데스크톱에서 적절히 표시된다.

#### Story 1.3: 대시보드 및 면접 준비 카드 UI

  * **As a** logged-in user,
  * **I want to** see my interview preparations on a dashboard,
  * **so that** I can manage and track my interview practice sessions.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **대시보드 레이아웃:** 사이드바와 메인 컨텐츠 영역이 있는 대시보드 레이아웃이 구현된다.
2.  **사이드바 네비게이션:** 토글 가능한 사이드바(대시보드, 계정 설정, 로그아웃)가 구현된다.
3.  **면접 준비 카드 컴포넌트:** 회사명, 직무, 진행률, 상태를 표시하는 카드 컴포넌트가 생성된다.
4.  **카드 그리드 레이아웃:** 반응형 그리드로 여러 카드가 배치된다.
5.  **상태별 스타일링:** 처리 중/준비 완료/실패 상태에 따른 시각적 구분이 구현된다.
6.  **목업 데이터 표시:** 다양한 상태의 샘플 면접 준비 데이터가 표시된다.
7.  **빈 상태 UI:** 면접 준비가 없을 때의 빈 상태 UI가 구현된다.
8.  **새 면접 준비 버튼:** 플로팅 액션 버튼 또는 헤더의 CTA 버튼이 구현된다.

#### Story 1.4: 면접 준비 생성 플로우 UI

  * **As a** logged-in user,
  * **I want to** create a new interview preparation by uploading my resume and JD,
  * **so that** I can start practicing for my interview.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **2단계 Stepper UI:** 진행 상황을 보여주는 스텝 인디케이터가 구현된다.
2.  **JD 입력 화면:** URL 입력 필드와 텍스트 직접 입력 옵션이 구현된다.
3.  **파싱 결과 표시:** 회사명, 직무명, JD 내용을 편집 가능한 형태로 표시하는 UI가 구현된다.
4.  **이력서 업로드:** 드래그 앤 드롭과 파일 선택이 가능한 업로드 UI가 구현된다.
5.  **파일 미리보기:** 업로드된 파일명과 크기가 표시되고 삭제 옵션이 제공된다.
6.  **폼 검증 UI:** 실시간 입력 검증과 오류 메시지 표시가 구현된다.
7.  **로딩 상태:** 분석 시작 시 로딩 애니메이션과 진행 메시지가 표시된다.
8.  **성공/실패 피드백:** 토스트 알림으로 작업 결과가 표시된다.

#### Story 1.5: 질문 목록 및 연습 세션 UI

  * **As a** user with a ready preparation,
  * **I want to** see questions and practice answering them,
  * **so that** I can prepare for my interview effectively.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **질문 목록 화면:** 카테고리별로 그룹화된 질문 목록이 표시된다.
2.  **질문 상태 표시:** 완료/미완료 상태가 뱃지나 체크마크로 표시된다.
3.  **진행률 표시:** 전체 진행률이 프로그레스 바로 표시된다.
4.  **질문 선택:** 질문 클릭 시 연습 세션 화면으로 전환된다.
5.  **연습 세션 레이아웃:** 질문-답변-피드백이 피드 형태로 표시되는 UI가 구현된다.
6.  **답변 입력:** 텍스트 에디터와 음성 입력 버튼이 있는 답변 입력 UI가 구현된다.
7.  **피드백 카드:** 잘한 점/부족한 점/개선점이 구조화된 피드백 카드가 구현된다.
8.  **심층 질문 표시:** 후속 질문들이 버튼 형태로 표시되고 선택 가능하다.

#### Story 1.6: 로딩 상태 및 오류 처리 UI

  * **As a** user,
  * **I want to** see clear loading states and error messages,
  * **so that** I understand what's happening and can take appropriate actions.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **스켈레톤 로더:** 데이터 로딩 중 스켈레톤 UI가 표시된다.
2.  **프로그레스 인디케이터:** 긴 작업에 대한 진행률 표시가 구현된다.
3.  **로딩 스피너:** 버튼과 폼 제출 시 로딩 스피너가 표시된다.
4.  **토스트 알림:** 성공/경고/오류 메시지가 토스트로 표시된다.
5.  **오류 상태 카드:** 실패한 면접 준비에 대한 오류 메시지와 재시도 버튼이 표시된다.
6.  **네트워크 오류 처리:** 연결 실패 시 적절한 안내 메시지가 표시된다.
7.  **빈 상태 일러스트:** 데이터가 없을 때 친근한 일러스트와 안내 메시지가 표시된다.
8.  **타임아웃 안내:** 장시간 처리 시 예상 시간과 안내 메시지가 표시된다.

#### Story 1.7: 전체 UI 통합 및 사용성 검증

  * **As a** product team,
  * **I want to** review the complete UI flow with mock data,
  * **so that** we can validate the user experience before backend development.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **전체 플로우 테스트:** 랜딩 → 로그인 → 대시보드 → 생성 → 연습의 전체 흐름이 작동한다.
2.  **다양한 시나리오:** 여러 상태의 면접 준비, 다양한 질문 유형이 목업으로 구현된다.
3.  **반응형 검증:** 모든 화면이 모바일/태블릿/데스크톱에서 적절히 표시된다.
4.  **접근성 기본 검증:** 키보드 네비게이션과 포커스 관리가 작동한다.
5.  **성능 측정:** Lighthouse로 Core Web Vitals를 측정하고 기준을 충족한다.
6.  **사용성 테스트 준비:** 실제 사용자 테스트를 위한 프로토타입이 준비된다.
7.  **디자인 QA:** 디자인 명세와 구현의 일치도가 검증된다.
8.  **피드백 수집:** 팀원과 초기 사용자로부터 UI/UX 피드백을 수집한다.

### Epic 2: Backend Integration and Real Data

**에픽 목표:** 구축된 UI에 백엔드 서비스를 점진적으로 통합하여, 목업 데이터를 실제 데이터베이스와 AI 기반 기능으로 교체합니다. 이를 통해 실제 면접 준비와 피드백 기능을 완전히 작동하도록 만듭니다.

#### Story 2.1: 데이터베이스 및 Prisma 설정

  * **As a** developer,
  * **I want to** set up the database schema and ORM,
  * **so that** the application can persist and manage data.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **Supabase 프로젝트 생성:** PostgreSQL 데이터베이스가 프로비저닝된다.
2.  **Prisma 스키마 정의:** 모든 모델(User, InterviewPreparation, Question 등)이 정의된다.
3.  **마이그레이션 실행:** 초기 데이터베이스 마이그레이션이 적용된다.
4.  **시드 데이터:** 개발용 샘플 데이터가 생성된다.

#### Story 2.2: 사용자 인증 실제 통합

  * **As a** developer,
  * **I want to** integrate real authentication with Clerk,
  * **so that** users can actually sign in and manage their sessions.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **Clerk 설정:** Clerk 계정이 생성되고 GitHub/Google OAuth가 구성된다.
2.  **인증 미들웨어:** Next.js 미들웨어로 라우트 보호가 구현된다.
3.  **세션 관리:** 사용자 세션이 유지되고 관리된다.
4.  **사용자 프로필:** 사용자 정보가 데이터베이스에 저장된다.
5.  **로그아웃 기능:** 사용자가 안전하게 로그아웃할 수 있다.
6.  **환경 변수:** Clerk API 키가 안전하게 관리된다.

#### Story 2.3: tRPC API 및 데이터 페칭

  * **As a** developer,
  * **I want to** implement tRPC routers and data fetching,
  * **so that** the frontend can communicate with the backend.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **tRPC 라우터 구현:** interviewPreparation, question, answer 라우터가 생성된다.
2.  **CRUD 작업:** 기본 생성/읽기/업데이트/삭제 작업이 구현된다.
3.  **타입 안전성:** 프론트엔드와 백엔드 간 타입이 완전히 동기화된다.
4.  **React Query 통합:** 데이터 페칭, 캐싱, 낙관적 업데이트가 구현된다.
5.  **오류 처리:** API 오류가 적절히 처리되고 사용자에게 표시된다.

#### Story 2.4: AI 서버 통합 및 비동기 처리

  * **As a** developer,
  * **I want to** integrate the AI server for question generation and feedback,
  * **so that** the application can provide real interview preparation functionality.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **AI 서버 API 클라이언트:** Python AI 서버와의 통신 모듈이 구현된다.
2.  **파일 업로드:** Supabase Storage로 이력서 파일 업로드가 구현된다.
3.  **비동기 작업 처리:** 분석 작업이 백그라운드에서 처리된다.
4.  **SSE 실시간 업데이트:** 진행 상황이 실시간으로 클라이언트에 전달된다.
5.  **Webhook 처리:** AI 서버 작업 완료 알림이 처리된다.
6.  **오류 처리:** 타임아웃, 재시도, 실패 처리가 구현된다.

#### Story 2.5: 전체 통합 테스트

  * **As a** product team,
  * **I want to** test the complete integrated system,
  * **so that** we can ensure all features work together properly.
    **인수 조건 (Acceptance Criteria):**

<!-- end list -->

1.  **End-to-End 테스트:** 전체 사용자 흐름이 실제 데이터로 작동한다.
2.  **성능 테스트:** AI 피드백 5초 이내 응답 (NFR1)이 검증된다.
3.  **모니터링 설정:** Vercel Analytics와 로깅이 구성된다.
4.  **배포 준비:** Vercel에 배포되고 프로덕션 환경이 준비된다.
5.  **문서화:** API 문서와 사용자 가이드가 작성된다.

## 7. Change Log

| 날짜 | 버전 | 설명 | 작성자 |
| :--- | :--- | :--- | :--- |
| 2025-08-11 | 1.0 | 문서 초안 작성 시작 | John (PM) |
| 2025-08-11 | 1.1 | UI-first 개발 접근법으로 에픽 및 스토리 재구성 | Sarah (PO) |
| 2025-08-11 | 1.2 | Story 1.1 다국어(i18n) 시스템 설정 추가, Repository 구조 수정 | Sarah (PO) |
| 2025-08-11 | 1.3 | 컴포넌트 개발 우선순위 정의, Story 1.0 인수조건 구체화 | Sarah (PO) |
| 2025-08-11 | 1.4 | MVP 간소화를 위한 Storybook 제거 | Sarah (PO) |
| 2025-08-12 | 1.5 | Story 1.0.5 추가 - URL 구조 정의 및 라우팅 구현, 페이지 체계 명확화 | Sarah (PO) |
