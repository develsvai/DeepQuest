# 상태 관리 규칙: TanStack Query vs. Zustand

이 문서는 프로젝트의 상태 관리 라이브러리인 \*\*TanStack Query (tRPC)\*\*와 **Zustand**의 역할을 명확히 분리하여, 예측 가능하고 유지보수가 용이한 상태 관리 아키텍처를 구축하기 위한 규칙을 정의합니다.

## 🚀 핵심 원칙

**모든 상태는 서버 상태와 클라이언트 상태로 구분하며, 두 상태는 절대로 혼용하지 않습니다.**

- **서버 상태 (Server State)**: 데이터베이스와 같이 서버에 저장되고 API를 통해 비동기적으로 가져오는 데이터입니다. **오직 tRPC와 통합된 TanStack Query로만 관리합니다.**
- **클라이언트 상태 (Client State)**: 브라우저에만 존재하며, UI의 상태를 제어하기 위한 데이터입니다. **전역적으로 공유해야 할 때만 Zustand를 사용합니다.**

---

## 🤔 서버 상태 vs. 클라이언트 상태: 어떻게 구분하는가?

| 구분            | **서버 상태 (Server State)**                                    | **클라이언트 상태 (Client State)**                                           |
| :-------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **관리 도구**   | ✅ **TanStack Query (tRPC)**                                    | ✅ **Zustand** (전역) \<br\> ✅ **useState** (컴포넌트 지역)                 |
| **데이터 소유** | 서버, 데이터베이스                                              | 브라우저, 사용자 인터랙션                                                    |
| **특징**        | 비동기적, 캐싱/동기화/무효화 필요, 여러 사용자와 공유될 수 있음 | 동기적, 일시적, 다른 사용자와 공유되지 않음                                  |
| **예시**        | 사용자 프로필, 게시물 목록, 인터뷰 세션 데이터, 댓글            | 사이드바 열림/닫힘 상태, 다크 모드 설정, 모달의 노출 여부, 입력 폼의 현재 값 |

---

## 🛠️ 역할 분담 상세 규칙

### 1\. TanStack Query (tRPC)의 역할: 서버 데이터의 모든 것

**규칙:** API를 통해 가져오거나 서버로 보내야 하는 모든 데이터는 `api.[router].[procedure].useQuery/useMutation` 훅을 통해 처리합니다.

- **이유**: TanStack Query는 서버 상태 관리에 필요한 모든 것(캐싱, 로딩/에러 상태, 백그라운드 재검증, 캐시 무효화 등)을 자동으로 처리해 줍니다. 이를 통해 개발자는 복잡한 비동기 데이터 관리 로직을 직접 작성할 필요가 없습니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 사용자 프로필(서버 상태)을 TanStack Query로 관리
'use client';
import { api } from '@/trpc/react';

function UserProfile({ userId }) {
  // 데이터 페칭, 캐싱, 로딩/에러 상태 관리가 모두 자동
  const { data: user, isLoading, error } = api.user.getProfile.useQuery({ id: userId });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return <div>{user.name}</div>;
}
```

### 2\. Zustand의 역할: 순수한 전역 UI 상태

**규칙:** 여러 컴포넌트에서 공유해야 하지만 서버에는 저장되지 않는 **UI 상태**에만 Zustand를 사용합니다.

- **이유**: Zustand는 간단하고 가벼워 전역 UI 상태를 관리하기에 적합합니다. `props`를 여러 계층으로 내리는 'Prop Drilling'을 피할 수 있습니다.

<!-- end list -->

```typescript
// ✅ CORRECT: 사이드바의 열림/닫힘(클라이언트 상태)을 Zustand로 관리
// /stores/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

// /components/layout/Sidebar.tsx
function Sidebar() {
  const { isSidebarOpen } = useUIStore();
  // ...
}

// /components/layout/Header.tsx
function Header() {
  const { toggleSidebar } = useUIStore();
  return <Button onClick={toggleSidebar}>Toggle</Button>;
}
```

---

## ⛔️ 가장 중요한 안티패턴: 서버 상태를 Zustand에 넣지 마세요

**규칙:** **API를 통해 가져온 데이터(서버 상태)를 Zustand 스토어에 절대로 저장해서는 안 됩니다.** 이는 TanStack Query의 모든 장점을 포기하고 수많은 버그를 유발하는 최악의 안티패턴입니다.

#### 시나리오: 게시물 목록을 잘못된 방식으로 관리하는 경우

```typescript
// ❌ WRONG: 서버 데이터인 'articles'를 Zustand 스토어에 저장하는 방식
// /stores/useArticleStore.ts
import { create } from 'zustand';

interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  // 데이터를 가져오는 액션을 스토어에 직접 만들어야 함
  fetchArticles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/articles'); // 수동 API 호출
      const articles = await response.json();
      set({ articles, isLoading: false });
    } catch (e) {
      set({ error: 'Failed to fetch', isLoading: false });
    }
  };
}
// 😭 문제점:
// 1. 데이터 캐싱이 전혀 되지 않아 매번 API를 호출해야 함.
// 2. 다른 사용자가 글을 추가해도 자동으로 동기화되지 않음 (데이터가 금방 낡아버림).
// 3. 로딩, 에러 상태를 모두 수동으로 관리해야 함.
// 4. 다른 곳에서 게시물을 생성/수정했을 때 이 목록을 어떻게 갱신할지 복잡한 로직이 추가로 필요함.
```

#### 올바른 방식: 서버 상태는 TanStack Query에게 맡기기

```typescript
// ✅ CORRECT: 서버 데이터인 'articles'는 useQuery로 관리
// components/ArticleList.tsx
'use client';
import { api } from '@/trpc/react';

export function ArticleList() {
  // TanStack Query가 캐싱, 동기화, 로딩/에러 상태를 모두 자동으로 관리
  const { data: articles, isLoading, error } = api.article.list.useQuery();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;

  // 다른 곳에서 api.article.create.useMutation이 성공하고
  // utils.article.invalidate()를 호출하면, 이 컴포넌트는 자동으로 최신 데이터를 반영하여 리렌더링됨.
  return (
    <ul>
      {articles.map(article => <li key={article.id}>{article.title}</li>)}
    </ul>
  );
}
```

## ✅ 규칙 준수 시의 이점

이 규칙을 지킴으로써 우리는 다음과 같은 이점을 얻을 수 있습니다.

- **예측 가능한 데이터 흐름**: 데이터의 출처(서버/클라이언트)가 명확해져 디버깅이 쉬워집니다.
- **코드 단순화**: `isLoading`, `error`, `refetching` 등 복잡한 비동기 로직을 직접 작성할 필요가 없습니다.
- **최고의 성능**: TanStack Query의 정교한 캐싱 전략 덕분에 불필요한 API 호출을 최소화하고 UI 반응성을 높일 수 있습니다.
- **버그 감소**: 서버와 클라이언트 간의 데이터가 낡거나(stale) 일치하지 않는 문제로부터 자유로워집니다.
- **명확한 관심사의 분리**: 각 라이브러리가 가장 잘하는 역할에만 집중하게 하여 프로젝트 구조를 깨끗하게 유지합니다.

<!-- end list -->
