# tRPC 활용 패턴 및 레시피

이 문서는 `trpc-rules.md`에서 정의된 규칙을 바탕으로, 실제 기능을 구현할 때 참고할 수 있는 다양한 클라이언트 및 서버 사이드 활용 예제와 고급 패턴을 제공합니다.

## 1\. 클라이언트 기본 패턴: React Query 활용

tRPC는 TanStack Query와 함께 사용할 때 가장 강력한 시너지를 냅니다. 데이터 캐싱, 서버 상태 동기화, UI 업데이트를 매우 효율적으로 처리할 수 있습니다.

### 1.1. 데이터 조회 (`useQuery`)

- **역할**: 서버로부터 데이터를 조회하고, 캐싱하며, 로딩/에러 상태를 자동으로 관리합니다.
- **주요 옵션**:
  - `staleTime`: 지정된 시간 동안 데이터를 "신선한(fresh)" 상태로 간주하여, 이 시간 내에는 네트워크 요청을 다시 보내지 않습니다.
  - `refetchOnWindowFocus`: 사용자가 브라우저 탭을 다시 활성화했을 때 데이터를 자동으로 새로고침할지 여부를 결정합니다.

<!-- end list -->

```typescript
// components/user-profile.tsx
'use client';

import { api } from '@/trpc/react';

export function UserProfile({ userId }: { userId: string }) {
  // tRPC query 훅 - 자동으로 타입이 추론됩니다.
  const { data: user, isLoading, error } = api.user.getProfile.useQuery(
    { id: userId },
    {
      // React Query 옵션
      staleTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) return <div>프로필을 불러오는 중...</div>;

  // `throw new TRPCError` 방식과 자연스럽게 연동됩니다.
  if (error) return <div>에러: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### 1.2. 데이터 변경 (`useMutation`)

- **역할**: 서버의 데이터를 생성, 수정, 삭제하는 작업을 수행합니다.
- **주요 옵션**:
  - `onSuccess`: `mutation`이 성공했을 때 실행되는 콜백입니다. 주로 데이터 재검증(refetching)을 위해 사용됩니다.
  - `onError`: `mutation`이 실패했을 때 실행됩니다.
  - `onSettled`: 성공/실패 여부와 관계없이 `mutation`이 완료되면 항상 실행됩니다.

<!-- end list -->

```typescript
// components/update-user-button.tsx
'use client';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';

export function UpdateUserButton({ userId }: { userId: string }) {
  // ✅ tRPC v11: useUtils() 사용 (useContext는 deprecated)
  const utils = api.useUtils();

  const updateUserMutation = api.user.updateProfile.useMutation({
    onSuccess: (updatedUser) => {
      // 성공 시, 관련된 모든 사용자 쿼리를 무효화하여 최신 데이터를 다시 불러옵니다.
      utils.user.invalidate();
      console.log('프로필 업데이트 성공:', updatedUser.name);
    },
    onError: (error) => {
      // 서버에서 던진 TRPCError를 여기서 처리할 수 있습니다.
      console.error('업데이트 실패:', error.message);
    }
  });

  return (
    <Button
      onClick={() => updateUserMutation.mutate({
        id: userId,
        name: 'Updated Name'
      })}
      disabled={updateUserMutation.isPending}
    >
      {updateUserMutation.isPending ? '업데이트 중...' : '이름 변경'}
    </Button>
  );
}
```

---

## 2\. 클라이언트 고급 패턴: UX 향상

### 2.1. 낙관적 업데이트 (Optimistic Updates)

- **목적**: 서버의 응답을 기다리지 않고 UI를 먼저 업데이트하여 사용자에게 즉각적인 피드백을 제공합니다. 네트워크 지연 시간을 숨겨 사용자 경험을 크게 향상시킬 수 있습니다.

<!-- end list -->

```typescript
// components/update-post-title.tsx
'use client'

import { api } from '@/trpc/react'

export function UpdatePostTitle({ postId }: { postId: string }) {
  // ✅ tRPC v11: useUtils() 사용
  const utils = api.useUtils()

  const updatePostTitle = api.post.update.useMutation({
    // 1. Mutation이 시작되기 직전에 호출됩니다.
    onMutate: async newData => {
      // 진행 중인 refetch를 취소하여 덮어쓰기 방지
      await utils.post.getById.cancel({ id: newData.id })

      // 이전 데이터 스냅샷 생성
      const previousPost = utils.post.getById.getData({ id: newData.id })

      // UI를 새로운 데이터로 즉시 업데이트 (낙관적 업데이트)
      utils.post.getById.setData({ id: newData.id }, old =>
        old ? { ...old, ...newData } : undefined
      )

      // 에러 발생 시 롤백을 위해 이전 데이터 반환
      return { previousPost }
    },
    // 2. Mutation 실패 시
    onError: (err, newData, context) => {
      // onMutate에서 반환된 이전 데이터로 롤백
      if (context?.previousPost) {
        utils.post.getById.setData({ id: newData.id }, context.previousPost)
      }
    },
    // 3. 성공/실패와 관계없이 항상 실행
    onSettled: (data, error, variables) => {
      // 서버의 최신 데이터와 UI를 동기화하기 위해 쿼리 무효화
      utils.post.getById.invalidate({ id: variables.id })
    },
  })

  // 컴포넌트 렌더링 로직...
}
```

### 2.2. 무한 스크롤 (`useInfiniteQuery`)

> **참고**: 현재 Deep Quest 프로젝트에서는 `useInfiniteQuery`를 사용하지 않습니다. 아래는 필요 시 참고용 패턴입니다.

- **목적**: 대량의 데이터를 페이지 단위로 나누어 로드하여 초기 로딩 성능을 개선합니다. '더보기' 버튼이나 스크롤 트리거와 함께 사용됩니다.

<!-- end list -->

```typescript
// components/infinite-post-list.tsx
'use client';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';

export function InfinitePostList() {
  // TanStack Query v5 형식: initialPageParam 필수
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.post.infiniteList.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined, // v5 필수 옵션
      }
    );

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}
      <Button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? '로딩 중...' : '더 보기'}
      </Button>
    </div>
  );
}
```

---

## 3\. 서버 활용 패턴: Next.js App Router 통합

### 3.1. 서버 액션(Server Actions) 연동

- **목적**: JavaScript 비활성화 환경을 지원하고, 점진적 향상(Progressive Enhancement)을 구현하기 위해 서버 액션을 사용합니다. 실제 비즈니스 로직은 기존 tRPC 프로시저를 재사용하여 일관성을 유지합니다.

<!-- end list -->

```typescript
// app/actions/user-actions.ts
'use server'

import { api } from '@/trpc/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateUserSchema = z.object({
  /* ... */
})

export async function updateUserAction(formData: FormData) {
  try {
    const validatedData = updateUserSchema.parse(/* ... */)

    // ✨ 핵심: 서버 액션 내부에서 tRPC 서버 호출기를 사용
    await api.user.updateProfile(validatedData)

    // 경로 재검증으로 관련 페이지 캐시 무효화
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    // ... ZodError 및 기타 에러 처리
  }
}
```

### 3.2. 서버 컴포넌트(RSC)에서의 데이터 호출

- **목적**: 클라이언트에 불필요한 API 요청 없이, 서버에서 데이터를 미리 가져와 컴포넌트를 렌더링합니다. 페이지 초기 로딩 성능을 극대화합니다.

<!-- end list -->

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { trpc, HydrateClient } from '@/trpc/server';
import { LatestPostList } from './_components/LatestPostList';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardPage() {
  // ✨ 방법 1: 직접 호출 - 서버에서 값을 직접 사용해야 할 때
  const userProfile = await trpc.user.getProfile();

  // ✨ 방법 2: Prefetch - 클라이언트 컴포넌트에서 useQuery로 이어받을 때
  // void를 사용하여 Promise를 무시하고 prefetch만 수행 (non-blocking)
  void trpc.post.listLatest.prefetch({ limit: 5 });

  // HydrateClient는 prefetch된 데이터를 클라이언트 React Query 캐시에 주입합니다.
  // state prop 없이 children만 전달합니다. (createHydrationHelpers가 내부 처리)
  return (
    <>
      <h1>{userProfile.name}님의 대시보드</h1>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <HydrateClient>
          <LatestPostList />
        </HydrateClient>
      </Suspense>
    </>
  );
}
```

```typescript
// _components/LatestPostList.tsx (클라이언트 컴포넌트)
'use client';

import { api } from '@/trpc/react';

export function LatestPostList() {
  // prefetch된 데이터를 자동으로 사용 (캐시 히트)
  // 이후 refetch, invalidation 등 상호작용 가능
  const { data: posts } = api.post.listLatest.useQuery({ limit: 5 });

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

---

## 4\. 백엔드 고급 패턴: 성능 및 안정성

### 4.1. 배치 처리 (Batch Operations)

- **목적**: 여러 개의 데이터 변경 작업을 하나의 트랜잭션으로 묶어 데이터 정합성을 보장하고, 네트워크 왕복 횟수를 줄입니다.

<!-- end list -->

```typescript
// server/api/routers/post.ts
export const postRouter = router({
  batchDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      // Prisma의 트랜잭션 기능을 사용하여 일관성 보장
      return await ctx.db.$transaction(async tx => {
        // 본인 소유의 포스트만 삭제하도록 보안 강화
        const deleteCount = await tx.post.deleteMany({
          where: {
            id: { in: input.ids },
            authorId: ctx.user.id,
          },
        })
        return { deleted: deleteCount.count }
      })
    }),
})
```

### 4.2. 요청 제한 (Rate Limiting)

- **목적**: API 남용이나 DoS 공격으로부터 서버를 보호하기 위해 특정 기간 동안의 요청 횟수를 제한합니다.

<!-- end list -->

```typescript
// server/api/trpc.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash Redis를 사용한 Rate Limiter 초기화 (예시)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10초에 10번 요청
})

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const identifier = ctx.user?.id || ctx.ip // 사용자 ID 또는 IP 기반

  const { success } = await ratelimit.limit(identifier)

  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' })
  }

  return next()
})

// 특정 프로시저나 라우터 전체에 적용 가능
export const limitedProcedure = t.procedure.use(rateLimitMiddleware)
```
