# Server vs Client Component 완벽 가이드

Next.js 15 App Router에서 Server Component와 Client Component를 올바르게 구분하고 사용하는 핵심 규칙입니다.

## 핵심 원칙

**기본적으로 Server Component를 사용하고, 필요한 경우에만 Client Component를 사용합니다.**

## Server Component vs Client Component 선택 기준

### Server Component를 사용해야 하는 경우 (기본값)

```typescript
// ✅ Server Component가 적합한 경우들
// app/products/page.tsx - 데이터 페칭과 정적 렌더링
import { api } from '@/trpc/server';

export default async function ProductsPage() {
  const products = await api.product.list();

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// components/ProductCard.tsx - 정적 UI 표시
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <PriceDisplay price={product.price} /> {/* Server Component */}
      <AddToCartButton productId={product.id} /> {/* Client Component */}
    </Card>
  );
}
```

**Server Component 사용 조건:**

- 데이터베이스 직접 접근
- API 키나 시크릿 사용
- 대용량 종속성 (markdown parsers, syntax highlighters)
- 정적 콘텐츠 렌더링
- SEO가 중요한 콘텐츠
- 초기 페이지 로드 성능이 중요한 경우

### Client Component를 사용해야 하는 경우

```typescript
// ✅ Client Component가 필요한 경우들
'use client';

// 1. React Hooks 사용
export function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

// 2. 이벤트 핸들러 사용
export function InteractiveButton() {
  return <button onClick={() => alert('Clicked!')}>Click me</button>;
}

// 3. 브라우저 API 사용
export function LocationTracker() {
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(/* ... */);
  }, []);

  return <div>/* ... */</div>;
}

// 4. 서드파티 클라이언트 라이브러리 사용
import { Toaster } from 'react-hot-toast';
export function NotificationProvider({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
```

**Client Component 사용 조건:**

- useState, useEffect 등 React Hooks 사용
- onClick, onChange 등 이벤트 핸들러
- window, document, localStorage 등 브라우저 API
- 실시간 업데이트가 필요한 UI
- 클라이언트 전용 라이브러리 (많은 UI 라이브러리들)

## 컴포넌트 구성 Best Practices

### 1. 컴포넌트 경계 최적화

```typescript
// ❌ WRONG: 전체를 Client Component로 만듦
'use client';
export default function InterviewDetailPage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div>
      <Header />           {/* 정적인데도 클라이언트 번들에 포함 */}
      <InterviewInfo />    {/* 정적인데도 클라이언트 번들에 포함 */}
      <TabSelector />      {/* 실제로 상호작용 필요 */}
      <TabContent />       {/* 선택된 탭에 따라 변경 */}
      <Footer />          {/* 정적인데도 클라이언트 번들에 포함 */}
    </div>
  );
}

// ✅ CORRECT: 필요한 부분만 Client Component로 분리
// app/interview/[id]/page.tsx (Server Component)
export default async function InterviewDetailPage({ params }) {
  const interview = await getInterview(params.id);

  return (
    <div>
      <Header />
      <InterviewInfo data={interview} />
      <InterviewTabs initialData={interview} /> {/* Client Component */}
      <Footer />
    </div>
  );
}

// components/InterviewTabs.tsx (Client Component)
'use client';
export function InterviewTabs({ initialData }) {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div>
      <TabSelector selected={selectedTab} onChange={setSelectedTab} />
      <TabContent tab={selectedTab} data={initialData} />
    </div>
  );
}
```

### 2. Props 전달 패턴

```typescript
// ✅ CORRECT: Server Component를 Client Component의 children으로 전달
// components/Modal.tsx (Client Component)
'use client';
export function Modal({ children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children} {/* Server Component를 그대로 전달 가능 */}
      </div>
    </div>
  );
}

// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchExpensiveData();

  return (
    <Modal>
      <ExpensiveServerComponent data={data} /> {/* Server Component 유지 */}
    </Modal>
  );
}
```

### 3. 데이터 페칭 위치 최적화

#### 3.1 초기 데이터는 서버 컴포넌트에서 직접 호출

- 규칙: 페이지 첫 로드 시 필요한 데이터는 반드시 Server Component에서 await api.procedure()를 통해 직접 호출하여 렌더링합니다.

- 이유: 클라이언트-서버 간 네트워크 왕복을 제거하여 초기 페이지 로딩 속도(LCP)를 극대화합니다.

```typescript
// ❌ WRONG: Client Component의 useEffect에서 초기 데이터 페칭
'use client';
export function UserProfile({ userId }) {
  const { data, isLoading } = api.user.getProfile.useQuery({ id: userId });
  // 이 컴포넌트가 렌더링된 후에야 데이터 페칭이 시작되어 로딩 상태를 더 오래 보게 됨
  // ...
}

// ✅ CORRECT: Server Component에서 데이터를 미리 가져와 props로 전달
// app/user/[id]/page.tsx (Server Component)
import { api } from '@/trpc/server';
import { UserProfileClient } from './_components/UserProfileClient';

export default async function UserPage({ params }) {
  // 서버에서 직접 tRPC 호출
  const user = await api.user.getProfile({ id: params.id });

  // 데이터를 props로 전달
  return <UserProfileClient user={user} />;
}

// app/user/[id]/_components/UserProfileClient.tsx (Client or Server Component)
export function UserProfileClient({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <FollowButton userId={user.id} /> {/* 상호작용이 필요하면 Client Component */}
    </div>
  );
}
```

#### 3.2 클라이언트 상호작용 데이터는 useQuery/useMutation 사용

- 규칙: 사용자의 클릭, 입력 등 상호작용으로 인해 발생하는 데이터 요청은 반드시 Client Component 내에서 tRPC의 React Query 훅(useQuery, useMutation 등)을 사용합니다.

- 이유: TanStack Query의 강력한 캐싱, 재시도, 상태 관리 기능을 활용하여 최적의 사용자 경험과 데이터 동기화를 구현할 수 있습니다.

## 실제 프로젝트 적용 예시

```typescript
// app/interview-preparation/[id]/page.tsx (Server Component)
import { Suspense } from 'react';

export default async function InterviewPreparationPage({ params }) {
  // 병렬 데이터 페칭 (Server Component의 장점)
  const [session, questions] = await Promise.all([
    getInterviewSession(params.id),
    getInterviewQuestions(params.id)
  ]);

  return (
    <PageContainer>
      {/* 정적 헤더 - Server Component */}
      <InterviewHeader session={session} />

      {/* 진행 상태 - Server Component */}
      <ProgressIndicator progress={session.progress} />

      {/* 질문 목록 - 일부만 Client Component */}
      <div className="space-y-4">
        {questions.map(question => (
          <QuestionCard key={question.id} question={question}>
            {/* 답변 입력은 Client Component */}
            <AnswerInput questionId={question.id} />
          </QuestionCard>
        ))}
      </div>

      {/* AI 피드백 - Suspense로 스트리밍 */}
      <Suspense fallback={<FeedbackSkeleton />}>
        <AIFeedback sessionId={params.id} />
      </Suspense>
    </PageContainer>
  );
}

// components/AnswerInput.tsx (Client Component)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AnswerInput({ questionId }) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitAnswer(questionId, answer);
    router.refresh(); // Server Component 데이터 새로고침
    setIsSubmitting(false);
  };

  return (
    <div>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={handleSubmit} disabled={isSubmitting}>
        제출
      </button>
    </div>
  );
}
```

## 일반적인 안티패턴과 해결책

### 안티패턴 1: 불필요한 'use client' 선언

```typescript
// ❌ WRONG: 상호작용이 없는데 client component로 선언
'use client';
export function StaticHeader({ title }) {
  return <h1>{title}</h1>; // 상호작용 없음
}

// ✅ CORRECT: Server Component로 유지
export function StaticHeader({ title }) {
  return <h1>{title}</h1>;
}
```

### 안티패턴 2: Client Component에서 환경변수 직접 사용

```typescript
// ❌ WRONG: 보안 환경변수가 노출됨
'use client';
export function ApiCaller() {
  const apiKey = process.env.SECRET_API_KEY; // undefined!
  // Client에서는 NEXT_PUBLIC_ 접두사만 사용 가능
}

// ✅ CORRECT: Server Component에서 처리
export async function ApiCaller() {
  const apiKey = process.env.SECRET_API_KEY; // Server에서만 접근
  const data = await fetchWithKey(apiKey);
  return <DataDisplay data={data} />;
}
```

### 안티패턴 3: 큰 라이브러리를 Client Component에서 import

```typescript
// ❌ WRONG: 큰 라이브러리가 클라이언트 번들에 포함
'use client';
import { marked } from 'marked'; // 큰 번들 크기!
export function MarkdownViewer({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: marked(content) }} />;
}

// ✅ CORRECT: Server Component에서 처리
export async function MarkdownViewer({ content }) {
  const { marked } = await import('marked'); // Server에서만 로드
  const html = marked(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### 안티패턴 4: 모든 페이지를 Client Component로 작성

```typescript
// ❌ WRONG: 페이지 전체가 클라이언트 번들에 포함
'use client';
export default function ProductPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products').then(/* ... */);
  }, []);

  return <ProductList products={products} />;
}

// ✅ CORRECT: Server Component로 페이지 작성
export default async function ProductPage() {
  const products = await getProducts(); // 서버에서 직접 데이터 가져오기

  return (
    <>
      <ProductList products={products} /> {/* Server Component */}
      <AddProductButton /> {/* Client Component (필요한 경우만) */}
    </>
  );
}
```

## 성능 최적화 체크리스트

- [ ] **Server Component 우선**: 기본적으로 모든 컴포넌트는 Server Component
- [ ] **Client Component 최소화**: 상호작용이 필요한 부분만 Client Component
- [ ] **컴포넌트 경계 최적화**: Client Component 범위를 최소한으로 제한
- [ ] **데이터 페칭 위치**: Server Component에서 데이터 페칭
- [ ] **번들 크기 관리**: 큰 라이브러리는 Server Component에서 사용
- [ ] **환경변수 보안**: 민감한 정보는 Server Component에서만 접근
- [ ] **Children 패턴 활용**: Server Component를 Client Component에 전달 시 children 사용

## 마이그레이션 가이드

기존 Client Component를 Server Component로 전환할 때:

1. **'use client' 제거 시도**
2. **Hooks 사용 부분 확인** → 별도 Client Component로 추출
3. **이벤트 핸들러 확인** → 별도 Client Component로 추출
4. **브라우저 API 사용 확인** → 조건부 렌더링 또는 dynamic import
5. **테스트 및 검증**

## 참고 자료

- [Next.js 공식 문서 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React 공식 문서 - Server Components](https://react.dev/reference/rsc/server-components)
- [프로젝트 성능 최적화 가이드](./performance.md)
