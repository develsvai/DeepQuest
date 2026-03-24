# Next.js Performance Optimization Rules

Next.js 15 App Router에서의 성능 최적화, 번들 크기 관리, 렌더링 최적화를 위한 핵심 규칙입니다.

## 1. Server vs Client Component Optimization

Server Component와 Client Component의 올바른 사용은 Next.js 애플리케이션 성능의 핵심입니다.

> 📖 **상세 가이드**: Server vs Client Component의 완벽한 가이드와 Best Practices는
> [Server vs Client Component 완벽 가이드](./server-client-components.md)를 참조하세요.

### 핵심 원칙

**기본적으로 Server Component를 사용하고, 필요한 경우에만 Client Component를 사용합니다.**

### Quick Reference

#### Server Component 사용 조건

- 데이터베이스 직접 접근
- API 키나 시크릿 사용
- 대용량 종속성 사용
- 정적 콘텐츠 렌더링
- SEO가 중요한 콘텐츠

#### Client Component 사용 조건

- React Hooks 사용 (useState, useEffect 등)
- 이벤트 핸들러 (onClick, onChange 등)
- 브라우저 API 사용
- 실시간 업데이트 UI
- 클라이언트 전용 라이브러리

### 빠른 예제

```typescript
// ✅ CORRECT: 필요한 부분만 Client Component로 분리
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData(); // Server에서 데이터 페칭

  return (
    <div>
      <StaticContent data={data} /> {/* Server Component */}
      <InteractiveButton /> {/* Client Component */}
    </div>
  );
}

// components/InteractiveButton.tsx (Client Component)
'use client';
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## 2. Data Fetching Optimization

### Parallel Data Fetching

**규칙:** 독립적인 데이터는 병렬로 페칭하여 성능을 최적화합니다.

```typescript
// ❌ VIOLATION: 순차적 데이터 페칭
export default async function DashboardPage() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  const analytics = await fetchAnalytics(user.id);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <Analytics data={analytics} />
    </div>
  );
}

// ✅ CORRECT: 병렬 데이터 페칭
export default async function DashboardPage() {
  const [user, posts, analytics] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchAnalytics(),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <Analytics data={analytics} />
    </div>
  );
}
```

### Streaming with Suspense

**규칙:** 느린 데이터는 Suspense로 스트리밍하여 초기 렌더링을 빠르게 합니다.

```typescript
// ✅ CORRECT: Suspense를 사용한 스트리밍
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 빠른 데이터는 즉시 렌더링 */}
      <QuickStats />

      {/* 느린 데이터는 Suspense로 스트리밍 */}
      <Suspense fallback={<LoadingSkeleton className="h-64" />}>
        <SlowChart />
      </Suspense>

      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <SlowDataTable />
      </Suspense>
    </div>
  );
}

// SlowChart.tsx (Server Component)
async function SlowChart() {
  const data = await fetchSlowChartData(); // 느린 API 호출
  return <ChartComponent data={data} />;
}
```

## 3. Image Optimization

### Next.js Image Component Usage

**규칙:** 모든 이미지에 Next.js Image 컴포넌트를 사용하여 최적화를 적용합니다.

```typescript
// ❌ VIOLATION: 일반 img 태그 사용
export function ProductCard({ product }) {
  return (
    <div className="card">
      <img
        src={product.imageUrl}
        alt={product.title}
        style={{ width: '300px', height: '200px' }}
      />
      <h3>{product.title}</h3>
    </div>
  );
}

// ✅ CORRECT: Next.js Image 컴포넌트 사용
import Image from 'next/image';

export function ProductCard({ product }) {
  return (
    <div className="card">
      <Image
        src={product.imageUrl}
        alt={product.title}
        width={300}
        height={200}
        placeholder="blur"
        blurDataURL={product.blurDataUrl}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={product.isFeatured} // Above-the-fold 이미지에만 사용
      />
      <h3>{product.title}</h3>
    </div>
  );
}
```

## 4. Bundle Optimization

### Dynamic Imports for Heavy Components

**규칙:** 무거운 컴포넌트나 라이브러리는 동적 import를 사용합니다.

```typescript
// ✅ CORRECT: 동적 import 사용
import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// 무거운 차트 라이브러리를 동적으로 로드
const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  {
    loading: () => <LoadingSkeleton className="h-64" />,
    ssr: false, // 클라이언트에서만 렌더링이 필요한 경우
  }
);

// 조건부 로딩
const AdminPanel = dynamic(
  () => import('@/components/AdminPanel'),
  {
    loading: () => <div>Loading admin panel...</div>,
  }
);

export default function DashboardPage({ user }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />

      {user.isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Code Splitting by Routes

**규칙:** 라우트별로 코드를 적절히 분할하여 초기 로딩을 최적화합니다.

```typescript
// app/dashboard/layout.tsx
// 대시보드 관련 공통 코드만 로드
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// app/dashboard/analytics/page.tsx
// 분석 페이지 전용 코드
import dynamic from 'next/dynamic';

const AnalyticsCharts = dynamic(() => import('./components/AnalyticsCharts'));

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <AnalyticsCharts />
    </div>
  );
}
```

## 5. Caching Strategies

### Static Generation with Revalidation

**규칙:** 적절한 캐싱 전략을 사용하여 성능을 최적화합니다.

```typescript
// ✅ CORRECT: ISR (Incremental Static Regeneration) 사용
export const revalidate = 3600; // 1시간마다 재생성

export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);

  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <p>Last updated: {new Date().toLocaleString()}</p>
    </div>
  );
}

// 동적 라우트에서 정적 생성
export async function generateStaticParams() {
  const products = await fetchPopularProducts();

  return products.map((product) => ({
    id: product.id,
  }));
}
```

### Request-level Caching

**규칙:** fetch 요청에 적절한 캐싱 옵션을 설정합니다.

```typescript
// ✅ CORRECT: 요청별 캐싱 전략
async function fetchProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    // 5분간 캐싱
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch product')
  }

  return res.json()
}

async function fetchUserData(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}`, {
    // 태그 기반 캐싱 - 필요시 무효화 가능
    next: { tags: ['user', `user-${userId}`] },
  })

  return res.json()
}
```

## 6. Font Optimization

### Next.js Font Optimization

**규칙:** Google Fonts는 Next.js의 폰트 최적화 기능을 사용합니다.

```typescript
// ✅ CORRECT: Next.js 폰트 최적화
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

## 7. Metadata Optimization

### Dynamic Metadata Generation

**규칙:** SEO와 성능을 위해 적절한 메타데이터를 생성합니다.

```typescript
// ✅ CORRECT: 동적 메타데이터 생성
export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.id)

  return {
    title: `${product.title} - Our Store`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description,
      images: [product.imageUrl],
    },
  }
}
```

## 8. Runtime Configuration

### Edge Runtime Usage

**규칙:** 적절한 runtime을 선택하여 성능을 최적화합니다.

```typescript
// ✅ CORRECT: Edge runtime 사용 (빠른 응답이 필요한 API)
export const runtime = 'edge'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  // 간단한 검색 API
  const results = await simpleSearch(query)

  return Response.json(results)
}

// ✅ CORRECT: Node.js runtime 사용 (복잡한 처리가 필요한 API)
export const runtime = 'nodejs' // 기본값

export async function POST(request: Request) {
  const data = await request.json()

  // 복잡한 데이터 처리
  const result = await complexDataProcessing(data)

  return Response.json(result)
}
```

## 9. Monitoring and Optimization

### Web Vitals Monitoring

**규칙:** Core Web Vitals을 모니터링하고 최적화합니다.

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && (
          <Analytics />
        )}
      </body>
    </html>
  );
}

// components/Analytics.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function Analytics() {
  useReportWebVitals((metric) => {
    // Core Web Vitals 메트릭 전송
    switch (metric.name) {
      case 'FCP':
        // First Contentful Paint
        break;
      case 'LCP':
        // Largest Contentful Paint
        break;
      case 'CLS':
        // Cumulative Layout Shift
        break;
      case 'FID':
        // First Input Delay
        break;
      case 'TTFB':
        // Time to First Byte
        break;
    }

    // 분석 서비스로 전송
    analytics.track('Web Vital', metric);
  });

  return null;
}
```

## 10. 안티패턴 금지사항

1. **Overuse of 'use client'** - 서버 컴포넌트를 우선 사용
2. **Synchronous data fetching** - 병렬 데이터 페칭 활용
3. **Large client bundles** - 동적 import로 코드 분할
4. **Missing image optimization** - Next.js Image 컴포넌트 사용
5. **No caching strategy** - 적절한 캐싱 및 revalidation 설정
6. **Blocking waterfall requests** - Suspense와 스트리밍 활용
7. **Missing font optimization** - Next.js 폰트 최적화 기능 사용
