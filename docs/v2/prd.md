# 📄 Deep Quest: Technical Interview Prep Platform (MVP)

## 1. 개요 (Overview)

**Deep Quest**는 개발자 구직자를 위한 초개인화된 기술 면접 대비 플랫폼입니다. 사용자의 **이력서(PDF)**와 **채용공고(JD)**를 분석하여 예상 질문을 생성하고, 모의 면접을 통해 AI 피드백을 제공하여 면접 합격률을 높이는 것을 목표로 합니다.

- **Target Audience**: 이직을 준비하는 경력직 개발자, 신입 개발자
- **Core Value**: 내 경험(Resume)과 목표 기업(JD)에 딱 맞는 질문으로 효율적인 대비
- **Design Philosophy**: "Clean, Minimalist, Trustworthy" (개발자 친화적인 IDE-like UI)

---

## 2. 유저 저니 (User Journey)

1. **Workspace 생성**: 지원하려는 직무 컨텍스트(Title) 설정 및 이력서 업로드
2. **경험 분석 및 선택**: 파싱된 이력서 경험 중 면접에서 어필할 경험 선택 (Scope Setting)
3. **상세 분석 및 관리**: 각 경험을 STAR 기법으로 구조화하고, 부족한 부분 수정 및 다이어그램 분석 확인
4. **문제 생성 (Generation)**: 특정 경험(STAR)이나 JD에 대해 예상 면접 질문 생성
5. **실전 연습 (Mock Interview)**: 생성된 질문에 대해 답변(음성/텍스트)하고, AI 피드백 및 꼬리 질문(Deep Dive) 수행

---

## 3. 화면별 기능 명세 (Feature Specifications)

### 3.1. 대시보드 (Dashboard)

사용자의 모든 면접 준비 공간(Workspace)을 모아보는 메인 허브입니다.

- **UI 구성**:

  - 상단 헤더: 'New Interview Prep' 생성 버튼
  - Workspace 카드 리스트: 타이틀, 지원 직무, 생성일, 분석된 경험 수 표시
  - Empty State / Create Placeholder 제공

- **주요 기능**:

  - 기존 Workspace로 이동
  - 신규 Workspace 생성 프로세스 진입

### 3.2. 워크스페이스 생성 (Create Workspace)

새로운 면접 준비 세션을 시작하는 단계입니다.

- **입력 프로세스**:

  1. **Title 입력**: 직무 + 레벨 + 도메인 형태의 네이밍 가이드 제공 (e.g., Backend Senior - Fintech)
  2. **이력서 업로드**: PDF 파일 드래그 앤 드롭 또는 파일 선택 (최대 10MB)
  3. **PDF 프리뷰**: 업로드한 파일 즉시 미리보기 제공 (우측 패널)

- **경험 분석 (Scope Analysis)**:

  - 파일 업로드 시 자동 분석 시뮬레이션 (Skeleton Loading)
  - 추출된 경험 리스트 표시 (Check/Uncheck로 분석 대상 포함 여부 결정)
  - **Edit Experience**: 파싱된 경험명 수정 기능 (오인식 대비)

- **Action**: 'Create Workspace' 버튼으로 분석 확정 및 상세 화면 이동

### 3.3. 워크스페이스 상세 (Workspace Detail)

이력서 분석 결과와 JD를 관리하는 핵심 화면입니다.

#### A. 프로필 헤더 (Profile Header)

- **정보 표시**: Workspace Title, 희망 직무, 총 경력 연차, 한 줄 요약(Summary)
- **수정 모드 (Edit Profile)**: 위 정보들을 인라인 폼으로 수정 가능

#### B. 탭 구성 (Tabs)

1. **Resume Analysis (Default)**

   - **경험 리스트 (Experience List)**: 회사명, 직무, 기간, 요약 표시
   - **STAR Achievements**:

     - 각 경험 하위에 성과를 **S(상황) / A(행동) / R(결과)** 구조로 카드화
     - **CRUD**: 성과 카드 추가, 수정, 삭제 가능
     - **Tech Keywords**: 해당 성과에 사용된 기술 태그 관리

   - **질문 생성 (Generate Questions)**:

     - 각 STAR 카드별 'Generate' 버튼 제공
     - **Topic Selection Modal**: CS, Implementation, Architecture 등 생성할 질문의 주제 선택

2. **Job Descriptions (JDs)**

   - 등록된 JD 리스트 카드 뷰 (D-day 표시)
   - 신규 JD 추가 (URL/Text 파싱 - _MVP에서는 Placeholder_)
   - JD 기반 질문 생성 트리거

### 3.4. 질문 은행 (Question List / Bank)

생성된 모든 예상 질문을 트리 구조로 탐색하는 화면입니다.

- **사이드바 연동**: 사이드바에서 특정 경험/JD/STAR 선택 시 해당 필터링 적용
- **질문 스레드 (Thread View)**:

  - **메인 질문 (Root)**: 1차 생성된 질문 카드
  - **꼬리 질문 (Follow-ups)**: 메인 질문 하위에 계층형(Tree)으로 연결되어 표시
  - **가지치기 옵션 (Alternative Paths)**: 이전 답변 시 선택하지 않았던 꼬리 질문 옵션들을 'Alternative Path'로 노출하여 탐색 가능하게 함

- **상태 표시**: 답변 완료 여부(Completed), 태그(#Architecture 등), 출처(Resume/JD)
- **Action**: 'Answer Now' 또는 'Review Answer' 버튼으로 문제 풀이 화면 진입

### 3.5. 문제 풀이 (Question Solver) - Mock Interview

실제 면접 상황을 시뮬레이션하고 피드백을 받는 화면입니다.

- **레이아웃**: 좌측(질문 및 입력) / 우측(피드백 및 인사이트) 2단 분할
- **세션 관리 (Depth Stack)**:

  - Breadcrumbs UI를 통해 `Root Question -> Depth 1 -> Depth 2` 이동 내역 시각화
  - 최대 3 Depth까지 꼬리 질문 유도

- **입력 모드**:

  - **Voice Input**: 마이크 버튼을 통한 음성 인식 시뮬레이션
  - **Text Input**: 텍스트 직접 입력

- **AI 피드백 (Analysis Result)**:

  - **Grade & Score**: A/B/C 등급 및 점수 (e.g., 78/100)
  - **Strengths / Weaknesses / Suggestions**: 구체적인 피드백 포인트
  - **Model Answer**: 모범 답안 예시 제공

- **꼬리 질문 선택 (Follow-up Selection)**:

  - 피드백 후 3가지 유형(Deep Dive, Concept Check, Alternative Scenario)의 꼬리 질문 제시
  - 사용자가 선택 시 다음 Depth로 진입하여 연속적인 대화 경험 제공

- **히스토리 (History)**: 같은 질문에 대해 여러 번 시도(Attempt #1, #2)한 내역 열람 가능

---

## 4. 디자인 시스템 (Design System)

- **Color Palette**:

  - Primary: `Crail (#C15F3C)` - 액션 버튼, 강조, 활성화 상태
  - Background: `Pampas (#F4F3EE)` - 전체 배경
  - Surface: `White (#FFFFFF)` - 카드, 모달, 패널

- **Typography**: `Inter` (Clean & Modern Sans-serif)
- **Component Style**:

  - **Shadcn/UI** 스타일의 간결한 보더와 그림자
  - **Lucide React** 아이콘을 활용한 직관적인 시각화

---

## 5. 데이터 스키마 요구사항 (Technical Constraints)

- **Resume Data**: `education`, `work_experiences` (Array), `side_projects` 구조
- **STAR Data**: `problem_situation`, `action`, `result`, `tech_keywords` 필수 포함
- **Interview Data**:

  - `QuestionContext`: 질문의 출처(Experience ID, STAR ID, JD ID) 링킹
  - `Attempt`: 사용자의 답변과 AI 피드백 히스토리 저장
  - `FollowUpOption`: 꼬리 질문의 난이도(Hard/Medium/Easy)와 유형 포함
