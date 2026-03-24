---
paths: src/app/**/*.tsx, src/components/**/*.tsx
---
# UI Design Guideline

> Ember 페르소나 기반 UI/UX 디자인 가이드라인
>
> 참조: @docs/core-values/ai-persona-ember.md

## Ember 페르소나 핵심 개념

**Ember** = 작은 불씨, 잔불

- 캄캄한 취업 준비 여정에서 **한 발 앞을 비춰주는 빛**
- 타오르는 화염이 아닌, **조용히 곁에서 온기를 전하는 존재**
- 친절한 멘토, 믿음직한 시니어, 따뜻한 서포터

> **Note:** Ember는 페르소나(성격, 말투, UX 원칙)로만 존재합니다.

---

## 색상 전략: 60-30-10 법칙

### 핵심 원칙

```
60% - Neutral (background, card, muted)
30% - Structure (foreground, border, 검정 버튼)
10% - Accent (primary 테라코타) ← 강조는 여기만!
```

**"모든 게 강조되면, 아무것도 강조되지 않는다"**

### 디자인 토큰

| CSS 변수         | Tailwind 클래스                         | 역할          | 비율 |
| ---------------- | --------------------------------------- | ------------- | ---- |
| `--background` | `bg-background`                       | 기본 배경     | 60%  |
| `--card`       | `bg-card`                             | 카드 배경     | 60%  |
| `--muted`      | `bg-muted`, `text-muted-foreground` | 비활성, 보조  | 60%  |
| `--foreground` | `text-foreground`                     | 본문 텍스트   | 30%  |
| `--border`     | `border-border`                       | 경계선        | 30%  |
| `--stone`      | `bg-stone`, `text-stone-foreground` | 검정/진회색   | 30%  |
| `--primary`    | `bg-primary`, `text-primary`        | 테라코타 강조 | 10%  |

---

## 버튼 색상 전략

### 용도 기반 색상 구분

> **테라코타 = "살아있는 것" (AI, 데이터, 변화)**
> **검정 = "단단한 것" (구조, 확정, 일반 액션)**

| 색상                           | 용도                             | 예시                                        |
| ------------------------------ | -------------------------------- | ------------------------------------------- |
| 🟠**Primary (테라코타)** | AI/Ember 기능, 데이터 시각화     | "질문 생성", "AI 분석", 차트, 프로그레스 바 |
| ⬛**Stone (검정)**       | 일반 CTA, 확정 액션, 구조적 버튼 | "저장", "다음", "목록 보기", "결제"         |
| ⬜**Outline**            | 보조 액션, 취소, 덜 중요한 옵션  | "취소", "더보기", "질문 보기"               |
| 🔴**Destructive**        | 삭제, 위험한 액션                | "삭제", "초기화"                            |

> **TODO:** 상태 뱃지, 할인/혜택 텍스트용 색상은 별도 정의 필요 (semantic colors)

### 버튼 색상 결정 플로우차트

```
이 버튼이 AI/Ember 기능과 관련있는가?
├─ Yes → 🟠 Primary (테라코타)
└─ No
    ├─ 데이터 시각화/동적 상태를 트리거하는가?
    │   └─ Yes → 🟠 Primary (테라코타)
    ├─ 일반적인 액션/확정/구매인가?
    │   └─ Yes → ⬛ Stone (검정)
    ├─ 보조/취소/덜 중요한 액션인가?
    │   └─ Yes → ⬜ Outline
    └─ 삭제/위험한 액션인가?
        └─ Yes → 🔴 Destructive
```

### 코드 예시

```tsx
// 🟠 AI/Ember 기능 - 테라코타
<Button variant="default">질문 생성</Button>
<Button variant="default">AI 분석 시작</Button>

// ⬛ 일반 액션 - 검정 (solid)
<Button variant="solid">저장</Button>
<Button variant="solid">핵심 성과 목록</Button>
<Button variant="solid">다음</Button>

// ⬜ 보조 액션
<Button variant="outline">질문 보기</Button>
<Button variant="outline">취소</Button>

// 🔴 위험한 액션
<Button variant="destructive">삭제</Button>
```

---

## 텍스트 강조 전략

### 테라코타 텍스트 사용 기준

| 용도                             | 사용 여부 | 이유                                      |
| -------------------------------- | :-------: | ----------------------------------------- |
| 데이터 시각화 (차트, 프로그레스) |    ✅    | 동적 데이터 표현                          |
| AI 관련 강조 텍스트              |    ✅    | Ember 기능 연관                           |
| 할인율, 혜택 강조                |    ❓    | 별도 색상 검토 필요                       |
| 상태 뱃지 (경력, NEW)            |    ❓    | 별도 색상 검토 필요                       |
| 섹션 헤더 텍스트                 |    ❌    | 과도한 강조 → 진한 회색 사용             |
| 일반 정보성 텍스트               |    ❌    | 정보 전달 → 기본 foreground              |
| 링크/직무명                      |    ❌    | 반복적 → muted-foreground 또는 underline |

### 코드 예시

```tsx
// ✅ GOOD: AI/데이터 관련만 테라코타
<ProgressBar className="bg-primary" />  // 데이터 시각화
<Button variant="default">질문 생성</Button>  // AI 기능

// ❓ TBD: 별도 semantic color 필요
<Badge>경력</Badge>  // 상태 뱃지 - 색상 미정
<span>17% 절약</span>  // 할인/혜택 - 색상 미정

// ❌ BAD: 과도한 강조
<h3 className="text-primary">상황 & 과제</h3>  // 헤더에 테라코타 남용
<span className="text-primary">Server Developer</span>  // 정보성 텍스트에 테라코타

// ✅ GOOD: 대안
<h3 className="text-foreground font-semibold">상황 & 과제</h3>
<span className="text-muted-foreground">Server Developer</span>
```

---

## AI 응답 UI (Ember 스타일)

> Ember의 따뜻한 느낌은 **레이아웃과 기존 토큰 조합**으로 표현합니다.

### AI 메시지 스타일

```tsx
<div className="flex gap-3">
  {/* AI 아바타: Primary + glow 효과 */}
  <div className="size-8 rounded-full bg-primary shadow-lg shadow-primary/30" />

  {/* 메시지 버블: muted 배경으로 구분 */}
  <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
    <p className="text-foreground">
      {/* AI 응답 내용 */}
    </p>
  </div>
</div>
```

### 사용자 vs AI 메시지 구분

| 요소   | 사용자 메시지           | AI (Ember) 메시지     |
| ------ | ----------------------- | --------------------- |
| 정렬   | 오른쪽                  | 왼쪽                  |
| 배경   | `bg-primary/10`       | `bg-muted`          |
| 아바타 | 없음 또는 사용자 이미지 | `bg-primary` + glow |
| 모서리 | `rounded-tr-sm`       | `rounded-tl-sm`     |

### Ember 말투 가이드 (UI 텍스트)

| 상황      | 피할 표현           | 권장 표현                   |
| --------- | ------------------- | --------------------------- |
| 오류 발생 | "잘못된 입력입니다" | "다시 한 번 확인해볼까요?"  |
| 로딩      | "처리 중..."        | "준비하고 있어요"           |
| 완료      | "완료되었습니다"    | "잘 했어요!"                |
| 격려      | (없음)              | "할 수 있어요, 같이 해봐요" |

---

## 비주얼 스타일

### 추구해야 할 것

- **부드러운 곡선**: `rounded-xl`, `rounded-2xl` 선호
- **은은한 그림자**: `shadow-sm`, `shadow-md` 사용
- **여유있는 여백**: 충분한 padding과 gap

---

## 애니메이션 가이드

### 권장

```tsx
className="transition-all duration-300 ease-out"
className="hover:shadow-lg transition-shadow"
```

---

## 스타일 적용 원칙

### CSS 변수 우선 사용

```tsx
// ✅ GOOD: 디자인 토큰 활용
className="bg-primary text-primary-foreground"
className="bg-card border-border"
className="text-muted-foreground"

// ❌ AVOID: 하드코딩된 Tailwind 색상
className="bg-orange-500"
className="text-amber-700"
className="bg-[#d97757]"
```

---

## 체크리스트

UI 컴포넌트 작성 시 확인:

### 색상 전략

- [ ] 테라코타(Primary)는 AI 기능/데이터 시각화에만 사용했는가?
- [ ] 일반 CTA/확정 액션은 Stone(검정)을 사용했는가?
- [ ] 텍스트 강조가 10% 이하로 제한되었는가?
- [ ] 하드코딩된 색상 없이 CSS 변수만 사용했는가?

### 비주얼 스타일

- [ ] 부드러운 모서리 적용 (`rounded-xl` 이상)
- [ ] 충분한 여백 확보

### Ember 톤앤매너

- [ ] 친근한 톤의 텍스트 사용
- [ ] 명령형 대신 권유형 표현
- [ ] 긍정적이고 격려하는 메시지

---

## Quick Reference: 색상 역할 요약

```
🟠 Primary (테라코타) = "살아있는 것"
   └─ AI/Ember 기능 버튼, 데이터 시각화 (차트, 프로그레스 바)

⬛ Stone (검정) = "단단한 것"
   └─ 일반 CTA, 확정 액션, 본문 텍스트, 구조적 요소

⬜ Outline
   └─ 보조 액션, 취소, 덜 중요한 옵션

🔴 Destructive
   └─ 삭제, 위험한 액션

❓ TBD (별도 정의 필요)
   └─ 상태 뱃지, 할인/혜택 텍스트, 태그 등
```

---

*Based on: Ember AI Persona (docs/core-values/ai-persona-ember.md)*
*Color Strategy: Claude.ai / Anthropic Design Patterns*
