# router.push 사용 패턴 리팩토링

## 상태: ✅ 완료 (2025-12-18)

## 개요

**목적:** `router.push` 사용처를 분석하여, 적절한 경우에만 사용하고 단순 URL 이동은 `Link` 또는 `LinkButton` 컴포넌트로 대체

**리팩토링 전:** 10개의 `router.push` 사용처 중 6개가 단순 URL 이동에 사용됨

**리팩토링 후:** 4개의 적절한 `router.push` 사용만 유지 (동적 경로 생성 2개, 로직 처리 후 이동 1개, dropdown action 1개)

---

## 1. 사용 패턴 기준

### router.push가 적절한 경우

- **로직 처리 후 이동:** 폼 제출, API 호출, 파일 업로드 완료 후 페이지 이동
- **동적 경로 생성:** 런타임에 현재 URL을 기반으로 경로 계산 (예: 언어 변경 시 pathname 유지)
- **조건부 이동:** 특정 조건에 따라 다른 페이지로 이동

### Link/LinkButton이 적절한 경우

- **단순 URL 이동:** 클릭 시 특정 URL로 이동만 하는 경우
- **정적 경로:** 빌드 타임에 결정되는 고정 URL
- **버튼 스타일 링크:** 버튼처럼 보이지만 실제로는 링크인 경우

### Link/LinkButton 사용의 장점

| 장점        | 설명                                |
| ----------- | ----------------------------------- |
| SEO 향상    | 크롤러가 `<a>` 태그 인식            |
| 접근성 개선 | 스크린 리더 호환, 키보드 네비게이션 |
| 프리패칭    | Next.js Link의 자동 프리패치 기능   |
| 사용자 경험 | 우클릭 → 새 탭 열기 지원            |

---

## 2. 현재 사용처 분석

### ✅ 적절한 사용 (유지) - 3개

| 파일                                                                           | 라인 | 함수                   | 이유                                               |
| ------------------------------------------------------------------------------ | ---- | ---------------------- | -------------------------------------------------- |
| `components/layout/AppSidebar.tsx`                                             | 62   | `handleLanguageChange` | 런타임에 현재 pathname 기반으로 locale만 동적 교체 |
| `components/common/LanguageToggle.tsx`                                         | 35   | toggle handler         | 동일 - 현재 URL 유지하며 locale 변경               |
| `app/[locale]/(protected)/interview-prep/new/_components/NewInterviewPrep.tsx` | 224  | form submit            | 파일 업로드 + mutation 처리 후 이동                |

### ❌ 단순 URL 이동 - Link/LinkButton 대체 권장 - 4개

| 파일                                                                  | 라인 | 함수             | 현재 코드                                 | 권장 변경                            |
| --------------------------------------------------------------------- | ---- | ---------------- | ----------------------------------------- | ------------------------------------ |
| `app/[locale]/(public)/_components/LandingHeader.tsx`                 | 84   | `handleLogin`    | `Button onClick → router.push`            | `LinkButton href={...}`              |
| `app/[locale]/(public)/_components/LandingHeader.tsx`                 | 88   | `handleOpenApp`  | `Button onClick → router.push`            | `LinkButton href={...}`              |
| `app/[locale]/(public)/_components/HeroContent.tsx`                   | 33   | `handleOpenApp`  | `Button onClick → router.push`            | `LinkButton href={...}`              |
| `app/[locale]/(protected)/dashboard/_components/DashboardContent.tsx` | 51   | `handlePractice` | `Button onClick → callback → router.push` | `LinkButton disabled={!canPractice}` |

### ⚠️ 경계 케이스 - 검토 필요 - 3개

| 파일                                                                                                               | 라인     | 함수          | 상황                                             | 판단                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------------------------------------------------ | ---------------------------------------- |
| `app/[locale]/(protected)/dashboard/_components/DashboardContent.tsx`                                              | 39       | `handleEdit`  | Dropdown menu action으로 전달                    | **유지** - DropdownMenuItem 내부 호출    |
| `app/[locale]/(protected)/interview-prep/[id]/_components/InterviewPrepDetail.tsx`                                 | 200, 216 | onClick prop  | ExperienceCardV2의 "Check Key Achievements" 버튼 | **대체 권장** - LinkButton으로 변경 가능 |
| `app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/questions/_components/Questions.tsx` | 93       | `handleSolve` | QuestionCard의 Solve 버튼                        | **대체 권장** - LinkButton으로 변경 가능 |

---

## 3. 리팩토링 계획

### Phase 1: 명확한 대체 케이스 (우선순위 높음)

#### 3.1 LandingHeader.tsx

**현재 코드:**

```typescript
const handleLogin = () => {
  router.push(`/${locale}/sign-in`)
}

const handleOpenApp = () => {
  router.push(`/${locale}/dashboard`)
}

// 사용처
<Button onClick={handleLogin}>...</Button>
<Button onClick={handleOpenApp}>...</Button>
```

**변경 후:**

```typescript
import { LinkButton } from '@/components/ui/custom/link-button'

// handleLogin, handleOpenApp 함수 제거
// router, useRouter 제거 가능

<LinkButton href={`/${locale}/sign-in`}>...</LinkButton>
<LinkButton href={`/${locale}/dashboard`}>...</LinkButton>
```

#### 3.2 HeroContent.tsx

**현재 코드:**

```typescript
const handleOpenApp = () => {
  router.push(`/${locale}/dashboard`)
}

<Button onClick={handleOpenApp}>...</Button>
```

**변경 후:**

```typescript
import { LinkButton } from '@/components/ui/custom/link-button'

// handleOpenApp 함수 제거
// router, useRouter 제거 가능

<LinkButton href={`/${locale}/dashboard`} size="lg">...</LinkButton>
```

#### 3.3 DashboardContent.tsx (handlePractice)

**현재 코드:**

```typescript
const handlePractice = useCallback(
  (id: string) => {
    router.push(`/${locale}/interview-prep/${id}`)
  },
  [router, locale]
)

// PreparationItem에서
<Button onClick={handlePractice} disabled={!canPractice}>
  Practice
</Button>
```

**변경 후:**
PreparationItem 컴포넌트 내부에서 직접 LinkButton 사용:

```typescript
<LinkButton
  href={`/${locale}/interview-prep/${preparation.id}`}
  disabled={!canPractice}
>
  Practice
</LinkButton>
```

### Phase 2: 경계 케이스 검토

#### 3.4 InterviewPrepDetail.tsx

ExperienceCardV2의 onClick prop을 href prop으로 변경하고, 내부에서 LinkButton 사용 검토

#### 3.5 Questions.tsx

QuestionCard에 href prop을 추가하여 내부에서 LinkButton 사용 검토

---

## 4. 영향받는 파일 목록

### 수정 필요 파일

| 파일                                                                                                               | 변경 내용                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `app/[locale]/(public)/_components/LandingHeader.tsx`                                                              | Button → LinkButton, router 제거                 |
| `app/[locale]/(public)/_components/HeroContent.tsx`                                                                | Button → LinkButton, router 제거                 |
| `app/[locale]/(protected)/dashboard/_components/DashboardContent.tsx`                                              | handlePractice 제거, PreparationItem에 href 전달 |
| `app/[locale]/(protected)/dashboard/_components/PreparationItem.tsx`                                               | onPractice → href, Button → LinkButton           |
| `app/[locale]/(protected)/interview-prep/[id]/_components/InterviewPrepDetail.tsx`                                 | onClick → href 패턴 변경                         |
| `app/[locale]/(protected)/interview-prep/[id]/_components/ExperienceCard/ExperienceCardV2.tsx`                     | onClick → href, Button → LinkButton              |
| `app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/questions/_components/Questions.tsx` | handleSolve → href 패턴 변경                     |

### 변경 없음 파일

| 파일                                                                           | 이유                            |
| ------------------------------------------------------------------------------ | ------------------------------- |
| `components/layout/AppSidebar.tsx`                                             | 동적 경로 생성 - 적절한 사용    |
| `components/common/LanguageToggle.tsx`                                         | 동적 경로 생성 - 적절한 사용    |
| `app/[locale]/(protected)/interview-prep/new/_components/NewInterviewPrep.tsx` | 로직 처리 후 이동 - 적절한 사용 |

---

## 5. 요약 통계

```
총 사용처:        10개 (100%)
├─ 적절한 사용:    3개 (30%)  → 유지
├─ 대체 권장:      6개 (60%)  → Link/LinkButton 변경
└─ 경계 (유지):    1개 (10%)  → Dropdown action, 현재 유지
```

---

## 6. 주의사항

### LinkButton 사용 시 고려사항

1. **disabled 상태:** `LinkButton`은 disabled prop 지원 (비활성화 시 `<button disabled>` 렌더링)
2. **스타일링:** 기존 Button과 동일한 variant/size props 사용 가능
3. **아이콘:** children으로 아이콘 포함 가능

### 추가 고려사항

- 일부 버튼에 클릭 전 analytics 트래킹이 필요한 경우 별도 처리 필요
- loading state가 필요한 경우 router.push 유지 또는 다른 패턴 검토

---

## 7. 관련 문서

- [LinkButton 컴포넌트](/src/components/ui/custom/link-button.tsx)
- [URL Routing Refactoring](/docs/refactoring/url-routing-refactoring.md)
