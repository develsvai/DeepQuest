# Deep Quest 랜딩 페이지 구현 계획

> **기반 문서**: `landing-page-renewal.md` (v1.5)
> **설계 철학**: Simon Sinek "Start with Why"
> **미학 방향**: Editorial Warmth — 따뜻한 전문성

---

## 1. Creative Direction

### 1.1 Context Analysis

| 항목                | 분석                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Purpose**         | 기술면접 준비의 두려움을 해소하고, "방법을 만나지 못했을 뿐"이라는 리프레이밍 전달 |
| **Audience**        | 3-7년차 경력 개발자, 기술적 감성이 있지만 면접에 대한 불안감 보유                  |
| **Tone**            | **Editorial Warmth** — 잡지처럼 정제되었지만 따뜻하고 인간적인                     |
| **Differentiation** | 면접 질문이 "대화"처럼 느껴지는 시각적 경험. 차갑지 않은 기술 서비스.              |

### 1.2 Aesthetic Commitment

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   "Editorial Warmth"                                           │
│                                                                │
│   잡지의 정제된 레이아웃 + 카페의 따뜻한 조명                    │
│   기술적이지만 인간적인, 전문적이지만 부담스럽지 않은             │
│                                                                │
│   ─────────────────────────────────────────────────────────    │
│                                                                │
│   Key Visual Elements:                                         │
│   • 왼쪽 정렬 타이포그래피 (에디토리얼 느낌)                     │
│   • 대담한 사이즈 대비 (12px 캡션 ↔ 72px 헤드라인)             │
│   • 테라코타/코랄 포인트 (기존 디자인 시스템 활용)               │
│   • 미묘한 텍스처와 그라데이션 (플라스틱 느낌 제거)              │
│   • 비대칭 레이아웃 + 의도적 그리드 이탈                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.3 What Makes This Unforgettable

> **"면접 질문이 대화처럼 느껴지는 순간"**

- Problem 섹션의 면접관 질문이 실제 대화 버블처럼 보임
- "속마음"이 손글씨 느낌으로 표현됨
- 차가운 AI 서비스가 아닌, 공감하는 코치 느낌

---

## 2. Design System Integration

### 2.1 기존 CSS 변수 활용 (globals.css 기반)

```css
/* 기존 디자인 시스템의 핵심 변수들 */

/* Primary - 테라코타/코랄 (따뜻한 에너지) */
--primary: hsl(15.1111 55.5556% 52.3529%); /* Light */
--primary: hsl(14.7692 63.1068% 59.6078%); /* Dark */

/* Background - 따뜻한 크림/다크 */
--background: hsl(48 33.3333% 97.0588%); /* Light: 웜 크림 */
--background: hsl(60 2.7027% 14.5098%); /* Dark: 웜 다크 */

/* Accent - 골든 톤 */
--accent: hsl(46.1538 22.807% 88.8235%); /* Light */
--accent: hsl(48 10.6383% 9.2157%); /* Dark */

/* Muted - 서브텍스트용 */
--muted-foreground: hsl(50 2.3622% 50.1961%); /* Light */
--muted-foreground: hsl(51.4286 8.8608% 69.0196%); /* Dark */
```

### 2.2 랜딩페이지 전용 확장 변수

```css
/* 랜딩페이지에만 추가할 CSS 변수 (globals.css에 추가) */

:root {
  /* 랜딩페이지 타이포그래피 */
  --landing-tracking-tight: -0.03em;
  --landing-tracking-headline: -0.02em;

  /* 그라데이션 */
  --landing-gradient-warm: linear-gradient(
    135deg,
    hsl(48 33.3333% 97.0588%) 0%,
    hsl(46.1538 22.807% 92%) 100%
  );

  /* 텍스처 오버레이 (노이즈) */
  --landing-noise-opacity: 0.03;

  /* 면접 대화 스타일 */
  --interview-bubble-bg: hsl(48 20% 94%);
  --interview-emotion-bg: hsl(15 55% 52% / 0.08);
}

.dark {
  --landing-gradient-warm: linear-gradient(
    135deg,
    hsl(60 2.7027% 14.5098%) 0%,
    hsl(60 3% 18%) 100%
  );

  --landing-noise-opacity: 0.02;

  --interview-bubble-bg: hsl(60 3% 20%);
  --interview-emotion-bg: hsl(15 63% 60% / 0.1);
}
```

### 2.3 Typography System

**원칙**: 극단적 사이즈 대비 + 왼쪽 정렬 우선

```css
/* 타이포그래피 스케일 - 3배 이상 점프 */

/* Hero 헤드라인: 거대하고 임팩트 있게 */
.landing-headline {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: var(--landing-tracking-tight);
  line-height: 1.1;
}

/* 섹션 헤더: 충분히 크게 */
.landing-section-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  letter-spacing: var(--landing-tracking-headline);
  line-height: 1.2;
}

/* 서브헤드: 읽기 편하게 */
.landing-subhead {
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 400;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

/* 캡션/라벨: 작지만 존재감 있게 */
.landing-caption {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}
```

---

## 3. Section-by-Section Implementation

### 3.1 Section 1: Hero

#### Creative Vision

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]                                        [로그인] [시작하기]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│  ┌─ 작은 라벨 (DEEP QUEST) ──────────────────────────────────┐ │
│  │                                                           │ │
│  │  "왜 그 기술을                                            │ │
│  │   선택했나요?"              ╭─────────────────────────╮   │ │
│  │                             │                         │   │ │
│  │  ────────────────────────   │   [스크린샷: 경험 분석   │   │ │
│  │  서류는 붙는데 면접에서     │    결과 화면]           │   │ │
│  │  막힌다면,                  │                         │   │ │
│  │                             │   미묘하게 기울어짐      │   │ │
│  │  노력이 부족한 게           │   그림자로 깊이감        │   │ │
│  │  아닙니다.                  ╰─────────────────────────╯   │ │
│  │  방법을 만나지 못했을 뿐.                                 │ │
│  │                                                           │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │  이력서 업로드 → 경험 분석 → 맞춤 질문 → 피드백           │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │                                                           │ │
│  │       [ 내 경험으로 준비 시작하기 ]                        │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                            ↓                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Design Decisions

| 요소                            | 선택                           | 근거                                  |
| ------------------------------- | ------------------------------ | ------------------------------------- |
| **헤드라인 정렬**               | 왼쪽                           | 에디토리얼 느낌, 시선 흐름 자연스러움 |
| **따옴표 스타일**               | 큰 장식 따옴표 (Primary 컬러)  | 면접 질문임을 시각적으로 강조         |
| **"노력이 부족한 게 아닙니다"** | Primary 컬러 강조              | Why 메시지의 핵심                     |
| **스크린샷**                    | 2-3도 기울기 + 레이어드 섀도우 | 입체감, 실제 제품 느낌                |
| **Process Flow**                | 아이콘 + 점선 연결             | 단계 명확성                           |

#### Component Structure

```
src/app/[locale]/(public)/_components/
├── HeroSection.tsx           # 메인 컨테이너
│   ├── HeroContent.tsx       # 좌측: 텍스트 영역
│   │   ├── HeroLabel.tsx     # "DEEP QUEST" 라벨
│   │   ├── HeroHeadline.tsx  # 따옴표 + 헤드라인
│   │   ├── HeroSubhead.tsx   # 서브헤드 (Why 메시지)
│   │   └── ProcessFlow.tsx   # 4단계 플로우
│   ├── HeroVisual.tsx        # 우측: 스크린샷
│   └── HeroCTA.tsx           # CTA 버튼
```

#### Animation Choreography

```typescript
// 페이지 로드 시 스태거 애니메이션
const heroAnimations = {
  label: { delay: 0, duration: 0.5 }, // 라벨 먼저
  headline: { delay: 0.1, duration: 0.6 }, // 헤드라인
  subhead: { delay: 0.3, duration: 0.5 }, // 서브헤드
  visual: { delay: 0.2, duration: 0.8 }, // 스크린샷 (병렬)
  flow: { delay: 0.5, duration: 0.4 }, // 플로우
  cta: { delay: 0.7, duration: 0.4 }, // CTA
}

// CSS-only 구현 (Tailwind + tw-animate-css)
// animate-fade-up + animation-delay-[Xms]
```

#### Code Example: HeroHeadline

```tsx
// src/app/[locale]/(public)/_components/HeroHeadline.tsx
import { cn } from '@/lib/utils'

interface HeroHeadlineProps {
  quote: string
  className?: string
}

export function HeroHeadline({ quote, className }: HeroHeadlineProps) {
  return (
    <h1
      className={cn(
        'relative',
        'text-[clamp(2.5rem,6vw,4.5rem)]',
        'leading-[1.1] font-bold',
        'tracking-[-0.03em]',
        'text-foreground',
        className
      )}
    >
      {/* 장식 따옴표 - 왼쪽 상단에 크게 */}
      <span
        className={cn(
          'absolute -top-4 -left-4 md:-top-6 md:-left-8',
          'text-[4rem] md:text-[6rem]',
          'text-primary/20',
          'font-serif leading-none',
          'select-none'
        )}
        aria-hidden='true'
      >
        "
      </span>

      {quote}

      {/* 닫는 따옴표 */}
      <span className={cn('text-primary/30', 'font-serif')} aria-hidden='true'>
        "
      </span>
    </h1>
  )
}
```

---

### 3.2 Section 2: Problem (공감 섹션)

#### Creative Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─ Part 1: 면접장의 순간 ───────────────────────────────────┐ │
│  │                                                           │ │
│  │  기술면접, 이런 순간이                                     │ │
│  │  두렵지 않으셨나요?                                        │ │
│  │                                                           │ │
│  │  ╭──────────────────────────────╮                         │ │
│  │  │ "프로젝트에서 가장 어려웠던   │   → 머릿속이 하얘지는    │ │
│  │  │  점이 뭐였나요?"             │     순간                 │ │
│  │  ╰──────────────────────────────╯                         │ │
│  │                                                           │ │
│  │  ╭──────────────────────────────╮                         │ │
│  │  │ "그 성능 개선, 구체적으로     │   → 말이 안 나오는       │ │
│  │  │  어떻게 하셨어요?"           │                         │ │
│  │  ╰──────────────────────────────╯                         │ │
│  │                                                           │ │
│  │  ╭──────────────────────────────╮                         │ │
│  │  │ "트래픽이 10배면 어떻게       │   → 생각해본 적          │ │
│  │  │  대응하실 건가요?"           │     없는데...            │ │
│  │  ╰──────────────────────────────╯                         │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Part 2: 기존 방법의 한계 ────────────────────────────────┐ │
│  │                                                           │ │
│  │  그래서 어떻게 준비하셨나요?                               │ │
│  │                                                           │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ 👤      │  │ 🤖      │  │ 👥      │  │ 🎓      │      │ │
│  │  │ 혼자    │  │ ChatGPT │  │ 면접    │  │ 멘토링  │      │ │
│  │  │ 연습    │  │ 질문    │  │ 스터디  │  │         │      │ │
│  │  │         │  │         │  │         │  │         │      │ │
│  │  │ "그래서 │  │ "이런거 │  │ "일정도 │  │ "좋긴   │      │ │
│  │  │  뭐가   │  │  진짜   │  │  안맞고 │  │  한데.. │      │ │
│  │  │  부족했 │  │  물어   │  │  피드백 │  │  계속   │      │ │
│  │  │  던거지 │  │  보나   │  │  애매해 │  │  받기엔 │      │ │
│  │  │  ...?"  │  │  ...?"  │  │  ..."   │  │  부담"  │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              노력이 부족한 게 아닙니다.                          │
│              전달하는 '방법'을 만나지 못했을 뿐.                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Design Decisions

| 요소               | 선택                 | 근거                |
| ------------------ | -------------------- | ------------------- |
| **면접관 질문**    | 말풍선 스타일 (왼쪽) | 실제 대화 느낌      |
| **감정 표현**      | 이탤릭 + muted 컬러  | 속마음, 내면의 소리 |
| **기존 방법 카드** | 4개 그리드           | 한눈에 비교         |
| **속마음 텍스트**  | 따옴표 + "..." 끝    | 미완성/불만족       |
| **전환 메시지**    | 크게 + Primary 강조  | Why 메시지 전달     |

#### Component Structure

```
├── ProblemSection.tsx
│   ├── InterviewMoments.tsx      # Part 1
│   │   └── MomentCard.tsx        # 질문 + 감정 카드
│   ├── ExistingMethods.tsx       # Part 2
│   │   └── MethodCard.tsx        # 방법 + 속마음 카드
│   └── TransitionMessage.tsx     # 전환 메시지
```

#### Code Example: MomentCard

```tsx
// src/app/[locale]/(public)/_components/MomentCard.tsx
import { cn } from '@/lib/utils'

interface MomentCardProps {
  question: string
  emotion: string
  index: number
}

export function MomentCard({ question, emotion, index }: MomentCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-6 md:gap-8',
        'animate-fade-up opacity-0'
      )}
      style={{
        animationDelay: `${index * 150}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* 면접관 질문 - 말풍선 */}
      <div
        className={cn(
          'relative max-w-md flex-1',
          'px-5 py-4',
          'bg-[hsl(var(--interview-bubble-bg))]',
          'rounded-2xl rounded-tl-sm',
          'border border-border/50'
        )}
      >
        <p className='leading-relaxed font-medium text-foreground'>
          "{question}"
        </p>

        {/* 말풍선 꼬리 */}
        <div
          className={cn(
            'absolute top-4 -left-2',
            'h-0 w-0',
            'border-t-8 border-t-transparent',
            'border-r-8 border-r-[hsl(var(--interview-bubble-bg))]',
            'border-b-8 border-b-transparent'
          )}
        />
      </div>

      {/* 감정 - 화살표 + 이탤릭 */}
      <div className='flex items-center gap-3 pt-4'>
        <span className='text-muted-foreground'>→</span>
        <p
          className={cn('text-muted-foreground italic', 'text-sm md:text-base')}
        >
          {emotion}
        </p>
      </div>
    </div>
  )
}
```

#### Code Example: MethodCard

```tsx
// src/app/[locale]/(public)/_components/MethodCard.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MethodCardProps {
  icon: LucideIcon;
  method: string;
  innerThought: string;
  index: number;
}

export function MethodCard({
  icon: Icon,
  method,
  innerThought,
  index
}: MethodCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        "p-5 md:p-6",
        "bg-card",
        "border border-border/50",
        "rounded-xl",
        "opacity-0 animate-scale-in",
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* 아이콘 */}
      <div
        className={cn(
          "w-10 h-10 mb-4",
          "flex items-center justify-center",
          "bg-accent rounded-lg",
        )}
      >
        <Icon className="w-5 h-5 text-accent-foreground" />
      </div>

      {/* 방법 이름 */}
      <h4 className="font-semibold text-foreground mb-3">
        {method}
      </h4>

      {/* 속마음 - 따옴표 스타일 */}
      <p
        className={cn(
          "text-sm text-muted-foreground",
          "italic leading-relaxed",
          "before:content-['"'] after:content-['"']",
        )}
      >
        {innerThought}
      </p>
    </div>
  );
}
```

---

### 3.3 Section 3: Solution (How it works)

#### Creative Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              이제, 그 방법을 만나보세요                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Step 1 ─────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ╭───────────────────────╮                               │  │
│  │  │                       │    01                         │  │
│  │  │   [experience-result  │    ──                         │  │
│  │  │     스크린샷]         │    이력서를 업로드하세요       │  │
│  │  │                       │                               │  │
│  │  │   살짝 왼쪽으로       │    AI가 당신의 경험을          │  │
│  │  │   기울어짐            │    회사별, 프로젝트별로        │  │
│  │  │                       │    체계적으로 정리합니다.      │  │
│  │  ╰───────────────────────╯                               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼ (점선 연결)                          │
│                                                                 │
│  ┌─ Step 2 ─────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │                               ╭───────────────────────╮  │  │
│  │    02                         │                       │  │  │
│  │    ──                         │   [key-achievement    │  │  │
│  │    핵심 성과를 발굴합니다      │     스크린샷]         │  │  │
│  │                               │                       │  │  │
│  │    각 경험에서 STAR 기반의    │   살짝 오른쪽으로     │  │  │
│  │    핵심 성과를 도출합니다.    │   기울어짐            │  │  │
│  │                               ╰───────────────────────╯  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│        ... Step 3, 4 (지그재그 패턴 반복) ...                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Design Decisions

| 요소          | 선택                         | 근거                     |
| ------------- | ---------------------------- | ------------------------ |
| **레이아웃**  | 지그재그 (홀수: 이미지 왼쪽) | 시각적 리듬, 지루함 방지 |
| **스텝 넘버** | 큰 숫자 (반투명, 배경처럼)   | 진행 상황 명확           |
| **스크린샷**  | 2-3도 기울기 + 깊은 그림자   | 실제 제품 느낌, 입체감   |
| **연결선**    | 점선 + 화살표                | 단계 흐름 시각화         |
| **비율**      | 이미지 55% : 텍스트 45%      | 이미지 강조              |

#### Component Structure

```
├── SolutionSection.tsx
│   ├── SectionHeader.tsx        # "이제, 그 방법을 만나보세요"
│   └── StepCard.tsx             # 재사용 가능한 스텝 카드
│       ├── StepNumber.tsx       # 큰 숫자 배경
│       ├── StepContent.tsx      # 제목 + 설명
│       └── StepVisual.tsx       # 스크린샷 (기울기 + 그림자)
```

#### Code Example: StepVisual

```tsx
// src/app/[locale]/(public)/_components/StepVisual.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface StepVisualProps {
  src: string
  alt: string
  direction: 'left' | 'right'
}

export function StepVisual({ src, alt, direction }: StepVisualProps) {
  return (
    <div
      className={cn(
        'relative',
        // 방향에 따른 기울기
        direction === 'left' ? '-rotate-2' : 'rotate-2'
      )}
    >
      {/* 다중 레이어 그림자 */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-foreground/5',
          'rounded-xl',
          'translate-x-2 translate-y-2 transform',
          'blur-sm'
        )}
      />
      <div
        className={cn(
          'absolute inset-0',
          'bg-foreground/10',
          'rounded-xl',
          'translate-x-4 translate-y-4 transform',
          'blur-md'
        )}
      />

      {/* 이미지 컨테이너 */}
      <div
        className={cn(
          'relative',
          'overflow-hidden rounded-xl',
          'border border-border',
          'bg-card'
        )}
      >
        {/* 브라우저 프레임 모킹 */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-2',
            'border-b border-border bg-muted'
          )}
        >
          <div className='h-2.5 w-2.5 rounded-full bg-destructive/60' />
          <div className='h-2.5 w-2.5 rounded-full bg-chart-5/60' />
          <div className='h-2.5 w-2.5 rounded-full bg-feedback-strengths/60' />
        </div>

        <Image
          src={src}
          alt={alt}
          width={600}
          height={400}
          className='h-auto w-full'
        />
      </div>
    </div>
  )
}
```

---

### 3.4 Section 6: CTA (최종 전환)

#### Creative Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░ (미묘한 그라데이션 + 노이즈 텍스처) ░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                 │
│                                                                 │
│              이제, 그 방법을 만나보세요                          │
│                                                                 │
│              기술면접, 더 이상 막히지 마세요.                    │
│                                                                 │
│                                                                 │
│            ╭─────────────────────────────────╮                  │
│            │   내 경험으로 준비 시작하기      │                  │
│            ╰─────────────────────────────────╯                  │
│                                                                 │
│                                                                 │
│            ⏱️ 2분이면 첫 분석 결과를 받아볼 수 있어요           │
│                                                                 │
│                                                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────────────────────────┘
```

#### Design Decisions

| 요소            | 선택                     | 근거                       |
| --------------- | ------------------------ | -------------------------- |
| **배경**        | 그라데이션 + 미세 노이즈 | 플라스틱 느낌 제거, 깊이감 |
| **CTA 버튼**    | 크게 + Glow 효과         | 최종 액션 강조             |
| **안심 메시지** | 시계 아이콘 + 작은 폰트  | 부담 해소                  |

#### Code Example: CTASection

```tsx
// src/app/[locale]/(public)/_components/CTASection.tsx
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export function CTASection() {
  return (
    <section className={cn('relative py-24 md:py-32', 'overflow-hidden')}>
      {/* 배경 그라데이션 */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-b from-background via-accent/30 to-background'
        )}
      />

      {/* 노이즈 텍스처 오버레이 */}
      <div
        className={cn(
          'absolute inset-0',
          'opacity-[0.03] dark:opacity-[0.02]',
          'pointer-events-none'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 콘텐츠 */}
      <div className='relative container mx-auto max-w-2xl px-6 text-center'>
        {/* 헤드라인 */}
        <h2
          className={cn(
            'text-[clamp(1.75rem,4vw,2.5rem)]',
            'font-semibold',
            'tracking-[-0.02em]',
            'text-foreground',
            'mb-4'
          )}
        >
          이제, 그 방법을 만나보세요
        </h2>

        {/* 서브헤드 */}
        <p className={cn('text-lg text-muted-foreground', 'mb-8')}>
          기술면접, 더 이상 막히지 마세요.
        </p>

        {/* CTA 버튼 */}
        <Button
          size='lg'
          className={cn(
            'h-14 px-8',
            'text-base font-semibold',
            'shadow-lg shadow-primary/25',
            'hover:shadow-xl hover:shadow-primary/30',
            'transition-all duration-300'
          )}
        >
          내 경험으로 준비 시작하기
        </Button>

        {/* 안심 메시지 */}
        <p
          className={cn(
            'flex items-center justify-center gap-2',
            'mt-6',
            'text-sm text-muted-foreground'
          )}
        >
          <Clock className='h-4 w-4' />
          2분이면 첫 분석 결과를 받아볼 수 있어요
        </p>
      </div>
    </section>
  )
}
```

---

## 4. Animation System

### 4.1 Animation Philosophy

**원칙**: 한 번의 잘 조율된 진입 애니메이션 > 여러 개의 산만한 마이크로인터랙션

### 4.2 CSS-only Animations (tw-animate-css 활용)

```css
/* 추가 커스텀 애니메이션 (globals.css에 추가) */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes clip-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

.animate-fade-up {
  animation: fade-up 0.6s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out forwards;
}

.animate-clip-reveal {
  animation: clip-reveal 0.8s ease-out forwards;
}
```

### 4.3 Scroll-triggered Animations

```typescript
// hooks/useScrollAnimation.ts
import { useEffect, useRef, useState } from 'react'

export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
```

---

## 5. Image Assets

### 5.1 스크린샷 목록

| 파일명                               | 위치                      | 용도   |
| ------------------------------------ | ------------------------- | ------ |
| `2.experience-result.png`            | `/public/images/landing/` | Step 1 |
| `3.key-achievement-result.png`       | `/public/images/landing/` | Step 2 |
| `4-2.question-categories-detail.png` | `/public/images/landing/` | Step 3 |
| `6-2.question-feedback.png`          | `/public/images/landing/` | Step 4 |

### 5.2 이미지 최적화

- **포맷**: WebP (Next.js Image 자동 변환)
- **품질**: 85%
- **Lazy loading**: 기본 적용
- **Blur placeholder**: LQIP 또는 color 사용

---

## 6. Responsive Design

### 6.1 Breakpoints (Tailwind 기본)

```
sm: 640px   → 모바일 → 태블릿
md: 768px   → 태블릿
lg: 1024px  → 데스크탑
xl: 1280px  → 와이드 데스크탑
```

### 6.2 섹션별 반응형 변경

| 섹션               | 모바일 (< 768px)       | 데스크탑 (≥ 1024px) |
| ------------------ | ---------------------- | ------------------- |
| **Hero**           | 세로 스택, 이미지 하단 | 좌우 분할 (7:5)     |
| **Problem Part 1** | 세로 스택              | 가로 배치           |
| **Problem Part 2** | 2x2 그리드             | 1x4 그리드          |
| **Solution Steps** | 세로 스택, 이미지 상단 | 지그재그            |

---

## 7. Implementation Phases

### Phase 1: 기반 구축 (Day 1)

- [ ] 랜딩페이지 전용 CSS 변수 추가 (`globals.css`)
- [ ] 커스텀 애니메이션 keyframes 추가
- [ ] `useScrollAnimation` 훅 생성
- [ ] 공통 컴포넌트 구조 생성

### Phase 2: Hero 섹션 (Day 1-2)

- [ ] `HeroSection` 컨테이너
- [ ] `HeroHeadline` (따옴표 장식)
- [ ] `HeroSubhead` (Why 메시지 강조)
- [ ] `ProcessFlow` (4단계 플로우)
- [ ] `HeroVisual` (스크린샷 + 스타일링)
- [ ] `HeroCTA`
- [ ] 진입 애니메이션 적용

### Phase 3: Problem 섹션 (Day 2-3)

- [ ] `ProblemSection` 컨테이너
- [ ] `InterviewMoments` + `MomentCard`
- [ ] `ExistingMethods` + `MethodCard`
- [ ] `TransitionMessage`
- [ ] 스크롤 기반 애니메이션

### Phase 4: Solution 섹션 (Day 3-4)

- [ ] `SolutionSection` 컨테이너
- [ ] `StepCard` 재사용 컴포넌트
- [ ] `StepVisual` (기울기 + 그림자)
- [ ] 지그재그 레이아웃
- [ ] 스크롤 애니메이션

### Phase 5: CTA 섹션 (Day 4)

- [ ] `CTASection` 컴포넌트
- [ ] 그라데이션 + 노이즈 배경
- [ ] CTA 버튼 스타일링

### Phase 6: 마무리 (Day 5)

- [ ] 반응형 테스트 및 조정
- [ ] 이미지 최적화 확인
- [ ] Lighthouse 성능 테스트
- [ ] 접근성 검토 (a11y)
- [ ] i18n 번역 키 추가

---

## 8. i18n Structure

### 8.1 번역 키 구조

```json
// locales/ko/landing.json
{
  "hero": {
    "label": "DEEP QUEST",
    "headline": "왜 그 기술을 선택했나요?",
    "subhead": {
      "line1": "서류는 붙는데 면접에서 막힌다면,",
      "emphasis": "노력이 부족한 게 아닙니다.",
      "line2": "방법을 만나지 못했을 뿐."
    },
    "process": {
      "step1": "이력서 업로드",
      "step2": "경험 분석",
      "step3": "맞춤 질문",
      "step4": "피드백"
    },
    "cta": "내 경험으로 준비 시작하기"
  },
  "problem": {
    "part1": {
      "header": "기술면접, 이런 순간이 두렵지 않으셨나요?",
      "moments": [
        {
          "question": "프로젝트에서 가장 어려웠던 점이 뭐였나요?",
          "emotion": "머릿속이 하얘지는 순간"
        }
        // ...
      ]
    },
    "part2": {
      "header": "그래서 어떻게 준비하셨나요?",
      "methods": [
        {
          "name": "혼자 연습",
          "thought": "그래서 뭐가 부족했던 거지...?"
        }
        // ...
      ]
    },
    "transition": {
      "line1": "노력이 부족한 게 아닙니다.",
      "line2": "전달하는 '방법'을 만나지 못했을 뿐."
    }
  },
  "solution": {
    "header": "이제, 그 방법을 만나보세요",
    "steps": [
      {
        "title": "이력서를 업로드하세요",
        "description": "AI가 당신의 경험을 회사별, 프로젝트별로 체계적으로 정리합니다."
      }
      // ...
    ]
  },
  "cta": {
    "headline": "이제, 그 방법을 만나보세요",
    "subhead": "기술면접, 더 이상 막히지 마세요.",
    "button": "내 경험으로 준비 시작하기",
    "reassurance": "2분이면 첫 분석 결과를 받아볼 수 있어요"
  }
}
```

---

## 9. Performance Goals

| 지표    | 목표    | 전략                                 |
| ------- | ------- | ------------------------------------ |
| **LCP** | < 2.5s  | Hero 이미지 priority, 폰트 preload   |
| **FID** | < 100ms | 최소한의 JS, CSS-only 애니메이션     |
| **CLS** | < 0.1   | 이미지 크기 명시, 폰트 display: swap |
| **TTI** | < 3.5s  | 코드 스플리팅, lazy loading          |

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                                                                     |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| 2025-12-25 | v0.1 | 초안 작성 - 기획 문서 기반 구현 계획                                                                          |
| 2025-12-25 | v0.2 | **frontend-for-opus-4.5 스킬 적용** - Creative Direction, 기존 디자인 시스템 통합, Editorial Warmth 미학 정의 |
