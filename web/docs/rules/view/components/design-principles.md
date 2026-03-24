# React Component Design Principles

## Overview

React 컴포넌트 설계의 핵심 원칙들을 정의합니다. 단일 책임, 관심사 분리, 컴포지션 우선 등 유지보수 가능하고 재사용 가능한 컴포넌트를 만들기 위한 기본 철학을 다룹니다.

## 1. 단일 책임 원칙 (Single Responsibility Principle)

**원칙:** 하나의 컴포넌트나 함수는 하나의 명확한 책임만 가져야 합니다.

**이유:**

- 변경 이유가 명확해집니다
- 테스트하기 쉬워집니다
- 재사용 가능성이 높아집니다

### 책임이 혼재된 컴포넌트 (지양)

```typescript
// ❌ BAD: 여러 책임이 한 컴포넌트에 혼재
function UserDashboard() {
  // 1. 사용자 데이터 관리
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // 2. 게시글 데이터 관리
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // 3. 알림 데이터 관리
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // 4. 다양한 API 호출 + 복잡한 비즈니스 로직
  useEffect(() => {
    fetchUser().then(setUser).finally(() => setUserLoading(false));
    fetchPosts().then(setPosts).finally(() => setPostsLoading(false));
    fetchNotifications().then(setNotifications).finally(() => setNotificationsLoading(false));
  }, []);

  const handlePostLike = (postId) => {
    likePost(postId).then(() => {
      setPosts(posts.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    });
  };

  // 5. 복잡한 조건부 렌더링
  return (
    <div>
      {userLoading ? <UserSkeleton /> : <UserProfile user={user} />}
      {postsLoading ? <PostsSkeleton /> : (
        <div>
          {posts.map(post => (
            <div key={post.id}>
              <h3>{post.title}</h3>
              <button onClick={() => handlePostLike(post.id)}>
                Like ({post.likes})
              </button>
            </div>
          ))}
        </div>
      )}
      {/* 알림 렌더링 로직... */}
    </div>
  );
}
```

### 책임이 분리된 컴포넌트 구조 (권장)

```typescript
// ✅ GOOD: 각각의 명확한 책임을 가진 컴포넌트들

// 1. 사용자 정보만 담당
function UserSection() {
  const { user, loading, error } = useUser();

  if (loading) return <UserSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <UserProfile user={user} />;
}

// 2. 게시글만 담당
function PostsSection() {
  const { posts, loading, error, likePost } = usePosts();

  if (loading) return <PostsSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <PostList posts={posts} onLike={likePost} />;
}

// 3. 알림만 담당
function NotificationsSection() {
  const { notifications, loading, error, markAsRead } = useNotifications();

  if (loading) return <NotificationsSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />;
}

// 4. 레이아웃만 담당
function UserDashboard() {
  return (
    <DashboardLayout>
      <UserSection />
      <PostsSection />
      <NotificationsSection />
    </DashboardLayout>
  );
}
```

## 2. 관심사 분리 (Separation of Concerns)

**원칙:** 데이터 처리, UI 렌더링, 비즈니스 로직 등 서로 다른 관심사를 분리합니다.

### 데이터 로직과 UI 로직 분리

```typescript
// ✅ GOOD: Custom Hooks로 데이터 로직 분리
function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser()
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await updateUserAPI(userData);
      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, updateUser };
}

// UI 컴포넌트는 순수하게 렌더링에만 집중
function UserProfile() {
  const { user, loading, error, updateUser } = useUser();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return (
    <Card>
      <UserAvatar src={user.avatar} />
      <UserDetails user={user} />
      <EditButton onEdit={updateUser} />
    </Card>
  );
}
```

### 비즈니스 로직과 표현 로직 분리

```typescript
// ✅ GOOD: 비즈니스 로직을 별도 유틸리티로 분리
// utils/pricing.ts
export function calculateDiscountedPrice(price: number, user: User): number {
  let discount = 0;

  // 비즈니스 규칙들
  if (user.isPremium) discount += 0.2;
  if (user.isNewCustomer) discount += 0.1;

  discount = Math.min(discount, 0.3); // 최대 30%
  return price * (1 - discount);
}

export function canAccessPremiumFeature(user: User): boolean {
  return user.isPremium && user.subscription.isActive;
}

// components/ProductCard.tsx - 표현에만 집중
function ProductCard({ product }: { product: Product }) {
  const { user } = useUser();

  // 비즈니스 로직은 유틸리티 함수에 위임
  const finalPrice = calculateDiscountedPrice(product.price, user);
  const canAccessPremium = canAccessPremiumFeature(user);

  return (
    <Card>
      <ProductImage src={product.image} />
      <ProductInfo product={product} />
      <PriceDisplay
        originalPrice={product.price}
        finalPrice={finalPrice}
        showDiscount={finalPrice !== product.price}
      />
      {canAccessPremium && <PremiumBadge />}
    </Card>
  );
}
```

## 3. 컴포지션 우선 원칙 (Composition over Inheritance)

**원칙:** 상속보다는 컴포지션을 통해 컴포넌트와 로직을 구성합니다.

### 상속 패턴 (지양)

```typescript
// ❌ BAD: 클래스 상속을 통한 컴포넌트 확장
class BaseButton extends Component {
  render() {
    return (
      <button
        className={this.getClassName()}
        onClick={this.handleClick}
      >
        {this.props.children}
      </button>
    );
  }

  getClassName() { return 'btn'; }
  handleClick() { /* 기본 로직 */ }
}

class PrimaryButton extends BaseButton {
  getClassName() { return 'btn btn-primary'; }
}

class DangerButton extends BaseButton {
  getClassName() { return 'btn btn-danger'; }
  handleClick() {
    if (confirm('Are you sure?')) {
      super.handleClick();
    }
  }
}
```

### 컴포지션 패턴 (권장)

```typescript
// ✅ GOOD: 컴포지션을 통한 컴포넌트 구성
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        disabled && 'btn-disabled'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// 특수한 버튼들은 Button을 조합하여 생성
function ConfirmButton({
  children,
  onConfirm,
  confirmMessage = 'Are you sure?'
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  confirmMessage?: string;
}) {
  const handleClick = () => {
    if (confirm(confirmMessage)) {
      onConfirm();
    }
  };

  return (
    <Button variant="danger" onClick={handleClick}>
      {children}
    </Button>
  );
}
```

## 4. 서버/클라이언트 컴포넌트 분리

**원칙:** Next.js에서 서버 컴포넌트와 클라이언트 컴포넌트의 책임을 명확히 분리합니다.

### 적절한 서버/클라이언트 분리

```typescript
// app/products/[id]/page.tsx (서버 컴포넌트)
async function ProductPage({ params }: { params: { id: string } }) {
  // 서버에서 데이터 페칭
  const [product, reviews, relatedProducts] = await Promise.all([
    getProductById(params.id),
    getProductReviews(params.id),
    getRelatedProducts(params.id)
  ]);

  return (
    <div className="product-page">
      {/* 서버 렌더링 - 정적 컨텐츠 */}
      <ProductDetails product={product} />
      <ProductSpecifications specs={product.specifications} />
      <ProductReviews reviews={reviews} />

      {/* 클라이언트 상호작용만 분리 */}
      <ProductActions productId={product.id} />

      {/* 서버 렌더링 - 정적 컨텐츠 */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}

// components/ProductActions.tsx (클라이언트 컴포넌트)
'use client';

function ProductActions({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  return (
    <div className="product-actions">
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton productId={productId} quantity={quantity} />
      <WishlistButton
        productId={productId}
        isInWishlist={isInWishlist}
        onToggle={setIsInWishlist}
      />
    </div>
  );
}
```

## 5. 상태 관리 책임 분리

**원칙:** 로컬 상태, 전역 상태, 서버 상태를 구분하여 적절히 관리합니다.

```typescript
// ✅ GOOD: 상태 유형별 적절한 관리

// 1. 로컬 상태 - 컴포넌트 내부에서만 사용
function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState(''); // 로컬 상태
  const [isFocused, setIsFocused] = useState(false); // 로컬 상태

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={isFocused ? 'focused' : ''}
    />
  );
}

// 2. 전역 상태 - Zustand store로 관리
interface AppStore {
  user: User | null;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const useAppStore = create<AppStore>((set) => ({
  user: null,
  theme: 'light',
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
}));

// 3. 서버 상태 - tRPC로 관리
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = api.user.getById.useQuery(
    { id: userId },
    { staleTime: 5 * 60 * 1000 } // 5분간 캐시
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error.message} />;

  return <UserDetails user={user} />;
}
```

## 설계 원칙 체크리스트

### 컴포넌트 설계 시

- [ ] 이 컴포넌트가 담당하는 책임이 하나인가?
- [ ] 데이터 로직과 UI 로직이 분리되어 있는가?
- [ ] 비즈니스 로직이 별도 함수로 추출되어 있는가?
- [ ] 상속 대신 컴포지션을 사용하고 있는가?

### 상태 관리 시

- [ ] 로컬/전역/서버 상태가 적절히 구분되어 있는가?
- [ ] 각 상태의 변경 이유가 명확한가?
- [ ] 상태 업데이트 로직이 한 곳에 집중되어 있는가?

### 파일 구조 시

- [ ] 관련된 코드들이 가까이 배치되어 있는가?
- [ ] 각 파일의 역할이 명확한가?
- [ ] 의존성 방향이 일관성 있게 설계되어 있는가?

이러한 원칙들을 통해 유지보수 가능하고 확장 가능한 React 컴포넌트를 설계할 수 있습니다.
