# Next.js 15+ (16.x 포함) Dynamic APIs & Async Patterns

## params and searchParams as Promises

최신 Next.js에서 params, searchParams props는 promise로 취급됩니다.

### TypeScript 타입 정의

```typescript
// Page 컴포넌트의 Props 타입 정의
interface PageProps {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Layout 컴포넌트의 Props 타입 정의
interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}
```

### Server Component에서 사용

Server Component에서는 async/await를 사용하세요.

```typescript
// app/[locale]/posts/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id, locale } = await params;
  return <p>ID: {id}, Locale: {locale}</p>;
}
```

### Layout에서 사용

```typescript
// app/[locale]/layout.tsx
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;  // string 타입 사용 (union 타입 아님)
}

export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // 런타임에서 locale 유효성 검사
  if (!['ko', 'en'].includes(locale)) {
    notFound();
  }

  return <div>{children}</div>;
}
```

> **주의**: Next.js 16에서는 동적 라우트 params 타입이 자동 생성됩니다. 커스텀 union 타입(`"en" | "ko"`)을 사용하면 TS2344 에러가 발생할 수 있으므로, `string` 타입을 사용하고 런타임에서 검증하세요.

### Client Component에서 사용

synchronous component (e.g. a Client component)에서는 `React.use()`를 사용하세요

```typescript
'use client'
import * as React from 'react'

interface PageProps {
  params: Promise<{ id: string }>;
}

function Page({ params }: PageProps) {
  const { id } = React.use(params);
  return <p>ID: {id}</p>;
}
```

## next/headers의 동적 API 사용

Next.js 15부터 `next/headers`에서 제공하는 `cookies()`, `headers()`와 같은 동적 API는 **비동기(asynchronous)**로 변경되었습니다. 따라서 이러한 API를 호출할 때는 반드시 `await`를 사용해야 하며, 해당 API를 사용하는 함수는 `async`로 선언되어야 합니다.

### cookies() 사용 예시 (Route Handler 또는 Server Component)

```typescript
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies() // 'await' 사용 필수
  const myCookieValue = cookieStore.get('myCookieName')?.value

  // 쿠키 설정 (Route Handler 또는 Middleware에서 NextResponse 객체를 통해)
  const response = NextResponse.json({ message: 'Success' })
  response.cookies.set('newCookie', 'newValue', { path: '/' })

  // 쿠키 삭제
  // response.cookies.delete('myCookieName')

  return response
}
```
