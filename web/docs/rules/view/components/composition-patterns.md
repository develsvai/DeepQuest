# React Component Composition Patterns

## Overview

React 컴포넌트 설계에서 결합도를 최소화하고 재사용성을 높이는 컴포지션 패턴들을 정의합니다. Props 드릴링 문제 해결과 서버/클라이언트 컴포넌트의 적절한 분리에 중점을 둡니다.

## 컴포지션으로 Props 드릴링 제거

**규칙:** Props 드릴링 대신 컴포넌트 컴포지션을 사용하세요.

**이유:**

- 불필요한 중간 종속성을 제거하여 결합도를 크게 줄입니다.
- 더 평평한 컴포넌트 트리에서 리팩토링을 쉽게 하고 데이터 흐름을 명확히 합니다.

### Props 드릴링 문제 (지양)

```tsx
// ❌ BAD: Props 드릴링으로 인한 높은 결합도
interface UserDashboardProps {
  user: User
  notifications: Notification[]
  onNotificationClick: (id: string) => void
}

function UserDashboard({
  user,
  notifications,
  onNotificationClick,
}: UserDashboardProps) {
  return (
    <div>
      <UserHeader
        user={user}
        notifications={notifications}
        onNotificationClick={onNotificationClick}
      />
      <UserContent user={user} />
    </div>
  )
}

// 중간 컴포넌트들이 불필요한 props를 전달해야 함
function UserHeader({
  user,
  notifications,
  onNotificationClick,
}: {
  user: User
  notifications: Notification[]
  onNotificationClick: (id: string) => void
}) {
  return (
    <header>
      <UserInfo user={user} />
      <NotificationBell
        notifications={notifications}
        onNotificationClick={onNotificationClick}
      />
    </header>
  )
}

function UserInfo({ user }: { user: User }) {
  return <div>{user.name}</div>
}

function NotificationBell({
  notifications,
  onNotificationClick,
}: {
  notifications: Notification[]
  onNotificationClick: (id: string) => void
}) {
  return (
    <div>
      {notifications.map(notification => (
        <button
          key={notification.id}
          onClick={() => onNotificationClick(notification.id)}
        >
          {notification.message}
        </button>
      ))}
    </div>
  )
}
```

### 컴포지션 패턴 (권장)

```tsx
// ✅ GOOD: 컴포지션으로 직접 렌더링
function UserDashboard({
  user,
  notifications,
  onNotificationClick,
}: UserDashboardProps) {
  return (
    <div>
      <header>
        {/* 필요한 곳에서 직접 컴포넌트 사용 */}
        <UserInfo user={user} />
        <NotificationBell
          notifications={notifications}
          onNotificationClick={onNotificationClick}
        />
      </header>
      <UserContent user={user} />
    </div>
  )
}

// 또는 Compound Component 패턴 사용
function UserDashboard({ user }: { user: User }) {
  const { notifications, handleNotificationClick } = useNotifications(user.id)

  return (
    <Dashboard>
      <Dashboard.Header>
        <UserInfo user={user} />
        <NotificationBell
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
        />
      </Dashboard.Header>
      <Dashboard.Content>
        <UserContent user={user} />
      </Dashboard.Content>
    </Dashboard>
  )
}
```

### Modal 컴포지션 예시

```tsx
// ✅ GOOD: Modal 내에서 직접 컴포지션
interface ItemEditModalProps {
  open: boolean
  items: Item[]
  recommendedItems: Item[]
  onConfirm: (items: Item[]) => void
  onClose: () => void
}

export function ItemEditModal({
  open,
  items,
  recommendedItems,
  onConfirm,
  onClose,
}: ItemEditModalProps) {
  const [keyword, setKeyword] = useState('')

  return (
    <Modal open={open} onClose={onClose}>
      {/* 검색 UI를 Modal 내에서 직접 렌더링 */}
      <div className='mb-4 flex justify-between'>
        <Input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder='검색...'
        />
        <Button onClick={onClose}>닫기</Button>
      </div>

      {/* 필요한 props만 직접 전달 */}
      <ItemEditList
        keyword={keyword}
        items={items}
        recommendedItems={recommendedItems}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}
```

## 서버/클라이언트 컴포넌트 분리

**규칙:** 서버 컴포넌트와 클라이언트 컴포넌트의 책임을 명확히 분리하세요.

**이유:**

- 서버 컴포넌트는 데이터 페칭과 준비에 집중하고, 클라이언트 컴포넌트는 상호작용에 집중
- 번들 크기를 최소화하고 성능 최적화

### 적절한 서버/클라이언트 분리

```tsx
// app/products/[id]/page.tsx (서버 컴포넌트)
import { ProductDetails } from './components/product-details'
import { getProductById, getRelatedProducts } from '@/lib/products'
import { AddToCartButton } from './components/add-to-cart-button'

export default async function ProductPage({
  params,
}: {
  params: { id: string }
}) {
  // 서버에서 데이터 페칭
  const [product, relatedProducts] = await Promise.all([
    getProductById(params.id),
    getRelatedProducts(params.id),
  ])

  return (
    <div className='product-page'>
      {/* 서버 렌더링 컴포넌트 - 정적 컨텐츠 */}
      <ProductDetails product={product} />
      <ProductSpecifications specs={product.specifications} />

      {/* 클라이언트 상호작용 컴포넌트만 분리 */}
      <div className='product-actions'>
        <AddToCartButton productId={product.id} />
        <WishlistButton productId={product.id} />
      </div>

      {/* 관련 상품도 서버에서 렌더링 */}
      <RelatedProducts products={relatedProducts} />
    </div>
  )
}

// app/products/[id]/components/add-to-cart-button.tsx (클라이언트 컴포넌트)
;('use client')

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/cart-actions'

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      await addToCart(productId, quantity)
      // 성공 피드백
    } catch (error) {
      // 에러 처리
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className='add-to-cart'>
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <Button onClick={handleAddToCart} disabled={isAdding} className='w-full'>
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  )
}
```

### Zustand를 활용한 Props 드릴링 해결

```tsx
// ✅ GOOD: Zustand로 깊은 컴포넌트 트리에서 상태 공유
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface CartItem {
  productId: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const useCartStore = create<CartStore>()(
  immer(set => ({
    items: [],

    addItem: (productId, quantity) =>
      set(state => {
        const existingItem = state.items.find(
          item => item.productId === productId
        )
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          state.items.push({ productId, quantity })
        }
      }),

    removeItem: productId =>
      set(state => {
        state.items = state.items.filter(item => item.productId !== productId)
      }),

    updateQuantity: (productId, quantity) =>
      set(state => {
        const item = state.items.find(item => item.productId === productId)
        if (item) {
          item.quantity = quantity
        }
      }),

    clearCart: () =>
      set(state => {
        state.items = []
      }),
  }))
)

// 깊이 중첩된 컴포넌트에서 직접 사용 - Provider 없이!
function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore(state => state.addItem) // Props 드릴링 없이 직접 접근

  return (
    <Card>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <Button onClick={() => addItem(product.id, 1)}>Add to Cart</Button>
    </Card>
  )
}

// 장바구니 아이템 수를 표시하는 헤더 컴포넌트
function CartIndicator() {
  const itemCount = useCartStore(state => state.items.length)

  return <Badge variant='secondary'>{itemCount} items</Badge>
}
```

> **💡 Note:** Zustand는 전역 앱 상태와 비즈니스 로직에 적합합니다.
> UI 컴포넌트 라이브러리의 로컬 상태는 Context를 사용하세요.
> 자세한 사용 기준은 [React Patterns - Context vs Zustand 사용 기준](../patterns/react.md#context-vs-zustand-사용-기준)을 참고하세요.

## Render Props 패턴으로 로직 재사용

```tsx
// ✅ GOOD: Render Props로 UI와 로직 분리
interface DataFetcherProps<T> {
  url: string
  children: (state: {
    data: T | null
    loading: boolean
    error: string | null
    refetch: () => void
  }) => React.ReactNode
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return <>{children({ data, loading, error, refetch: fetchData })}</>
}

// 다양한 UI에서 재사용 가능
function UserList() {
  return (
    <DataFetcher<User[]> url='/api/users'>
      {({ data: users, loading, error, refetch }) => {
        if (loading) return <LoadingSkeleton />
        if (error) return <ErrorMessage error={error} onRetry={refetch} />
        if (!users?.length) return <EmptyState />

        return (
          <div>
            {users.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )
      }}
    </DataFetcher>
  )
}
```

## 컴포지션 패턴의 장점

### 1. 낮은 결합도

- 컴포넌트 간 의존성 최소화
- 중간 컴포넌트의 불필요한 props 전달 제거

### 2. 높은 재사용성

- 로직과 UI가 분리되어 각각 재사용 가능
- 다양한 조합으로 새로운 기능 구성

### 3. 명확한 데이터 흐름

- 데이터가 필요한 곳에서 직접 사용
- Props의 목적과 흐름이 명확함

### 4. 성능 최적화

- 서버/클라이언트 컴포넌트 적절한 분리
- 필요한 부분만 클라이언트 번들에 포함
