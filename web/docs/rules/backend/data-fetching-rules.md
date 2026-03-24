# 데이터 페칭 전략 규칙

이 문서는 Next.js App Router 환경에서 tRPC와 TanStack Query를 사용하여 서버와 클라이언트의 데이터를 효율적으로 가져오고 업데이트하기 위한 규칙을 정의합니다. 이 규칙은 페이지 로딩 성능을 최적화하고 일관된 데이터 관리 패턴을 유지하는 것을 목표로 합니다.

## 🚀 핵심 원칙

**데이터 페칭의 주체는 서버 컴포넌트이며, 클라이언트 컴포넌트는 오직 사용자 상호작용에 대한 응답으로만 데이터를 요청합니다.**

- **최초 로드는 서버에서 (Server-First)**: 페이지를 처음 렌더링하는 데 필요한 모든 데이터는 서버 컴포넌트에서 미리 가져옵니다.
- **인터랙션은 클라이언트에서 (Client for Interactivity)**: 사용자의 클릭, 입력 등으로 인해 추가로 필요해진 데이터나 데이터 변경 요청은 클라이언트 컴포넌트에서 처리합니다.

---

## 🛠️ 데이터 페칭 상세 규칙

### 1\. 페이지 초기 데이터는 서버 컴포넌트에서 `await`로 호출

**규칙:** 라우트(페이지)가 로드될 때 필요한 초기 데이터는 **반드시 Server Component 내에서 tRPC 서버 호출기(`api`)를 `await` 키워드로 직접 호출**하여 가져옵니다.

- **이유**: 이 방식은 클라이언트-서버 간의 불필요한 네트워크 왕복을 제거합니다. 서버에서 데이터 페칭이 완료된 후 완전한 HTML을 클라이언트로 보내주므로, 초기 로딩 성능(LCP)이 극대화되고 사용자는 로딩 스피너를 거의 보지 않게 됩니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 페이지 로드에 필요한 핵심 데이터를 서버 컴포넌트에서 미리 가져오기
// app/interview-prep/[id]/page.tsx (Server Component)
import { api } from '@/trpc/server';
import { InterviewHeader } from './_components/InterviewHeader';
import { QuestionList } from './_components/QuestionList';

export default async function InterviewPrepPage({ params }: { params: { id: string } }) {
  // 렌더링에 필요한 데이터를 서버에서 병렬로 미리 가져옵니다.
  const [sessionData, questionsData] = await Promise.all([
    api.interview.getSession({ id: params.id }),
    api.question.listBySession({ sessionId: params.id }),
  ]);

  return (
    <div>
      {/* 가져온 데이터를 props로 내려줍니다. */}
      <InterviewHeader session={sessionData} />
      <QuestionList initialQuestions={questionsData} />
    </div>
  );
}
```

### 2\. 클라이언트 상호작용 데이터는 `useQuery` / `useMutation` 훅 사용

**규칙:** 사용자의 액션(버튼 클릭, 탭 전환, 검색어 입력 등)에 따라 데이터를 가져오거나 변경해야 할 경우, **반드시 Client Component 내에서 tRPC의 React Query 훅(`useQuery`, `useMutation` 등)을 사용**합니다.

- **이유**: TanStack Query가 제공하는 캐싱, 재시도, 로딩/에러 상태 관리, 낙관적 업데이트 등의 강력한 기능을 활용하여 부드러운 사용자 경험과 효율적인 데이터 동기화를 구현할 수 있습니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 사용자 인터랙션으로 인한 데이터 변경을 useMutation으로 처리
// _components/QuestionList.tsx (Client Component)
'use client';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';

export function QuestionList({ initialQuestions }) {
  const utils = api.useContext();
  const [newQuestion, setNewQuestion] = useState('');

  const createQuestionMutation = api.question.create.useMutation({
    onSuccess: () => {
      // 성공 시, 질문 목록 쿼리를 무효화하여 최신 데이터를 다시 불러옵니다.
      utils.question.listBySession.invalidate();
      setNewQuestion('');
    },
    onError: (error) => {
      alert(`질문 추가 실패: ${error.message}`);
    }
  });

  return (
    <div>
      {/* ... 질문 목록 렌더링 ... */}
      <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} />
      <Button
        onClick={() => createQuestionMutation.mutate({ content: newQuestion })}
        disabled={createQuestionMutation.isPending}
      >
        {createQuestionMutation.isPending ? '추가 중...' : '질문 추가'}
      </Button>
    </div>
  );
}
```

---

## ⛔️ 데이터 페칭 안티패턴

### 1\. 초기 데이터 로드를 위해 페이지 전체를 Client Component로 만드는 행위

- **문제점**: App Router의 가장 큰 장점인 서버 컴포넌트 렌더링을 포기하는 것입니다. 사용자는 빈 화면을 본 후 클라이언트에서 데이터 로딩이 시작되길 기다려야 하므로, 사용자 경험이 크게 저하됩니다.

<!-- end list -->

```typescript
// ❌ WRONG: 초기 데이터 로드를 위해 페이지를 Client Component로 전환
'use client'; // <-- 이 선언 하나로 서버 렌더링의 이점이 사라짐

import { api } from '@/trpc/react';

export default function InterviewPrepPage({ params }) {
  // 이 훅은 클라이언트에서만 실행되므로, 서버에서 데이터를 미리 가져올 수 없습니다.
  const { data: sessionData, isLoading } = api.interview.getSession.useQuery({ id: params.id });

  if (isLoading) return <Spinner />;

  return <div>{sessionData.title}</div>;
}
```

### 2\. Server Component에서 가져온 데이터를 Client Component에서 다시 페칭하는 행위

- **문제점**: 동일한 데이터를 서버와 클라이언트에서 중복으로 요청하게 되어 리소스가 낭비됩니다. 서버에서 가져온 초기 데이터(`initialData`)를 React Query 훅에 전달하여 캐시를 채우는 것이 올바른 방법입니다.

<!-- end list -->

```typescript
// ❌ WRONG: 서버에서 내려준 데이터를 무시하고 클라이언트에서 다시 페칭
// _components/QuestionList.tsx (Client Component)
'use client'
export function QuestionList({ initialQuestions, sessionId }) {
  // initialQuestions를 사용하지 않음
  const { data: questions, isLoading } = api.question.listBySession.useQuery({
    sessionId,
  })
  // ...
}

// ✅ CORRECT: initialData를 사용하여 초기 캐시 값을 설정
// _components/QuestionList.tsx (Client Component)
;('use client')
export function QuestionList({ initialQuestions, sessionId }) {
  const { data: questions, isLoading } = api.question.listBySession.useQuery(
    { sessionId },
    {
      initialData: initialQuestions, // 서버에서 받은 데이터로 캐시 초기화
      // staleTime을 설정하여 불필요한 초기 재검증 방지
      staleTime: 60 * 1000,
    }
  )
  // ...
}
```
