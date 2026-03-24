# 가독성 (Readability)

## Overview

코드의 명확성과 이해 용이성을 향상시키는 설계 원칙입니다. 코드는 작성하는 시간보다 읽히는 시간이 훨씬 많기 때문에, 가독성은 유지보수성의 핵심입니다.

## 핵심 원칙

### 1. 의도를 명확히 표현하기

**원칙:** 코드 자체가 무엇을 하는지, 왜 하는지를 명확히 드러내야 합니다.

**적용 방법:**

- 매직 넘버를 명명된 상수로 대체
- 의미 있는 변수명과 함수명 사용
- 복잡한 조건문을 설명적인 함수로 추출

### 실천 가이드

#### 매직 넘버에 이름 붙이기

```typescript
// ❌ BAD: 매직 넘버로 의도가 불분명
function LikeButton({ postId }: { postId: string }) {
  const handleLikeClick = async () => {
    await postLike(postId);
    await delay(300); // 300이 무엇을 의미하는지 불분명
    await refetchPostLike();
  };

  return <button onClick={handleLikeClick}>Like</button>;
}

// ✅ GOOD: 명명된 상수로 의도 명확화
const ANIMATION_DELAY_MS = 300;
const DEBOUNCE_DELAY_MS = 500;

function LikeButton({ postId }: { postId: string }) {
  const handleLikeClick = async () => {
    await postLike(postId);
    await delay(ANIMATION_DELAY_MS); // 애니메이션을 기다리는 것이 명확
    await refetchPostLike();
  };

  return <button onClick={handleLikeClick}>Like</button>;
}
```

#### 복잡한 조건문을 함수로 추출

```typescript
// ❌ BAD: 복잡한 조건문으로 의도 파악 어려움
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      {user.isActive &&
       user.subscription.plan !== 'free' &&
       user.subscription.expiresAt > new Date() && (
        <PremiumFeatures />
      )}
    </div>
  );
}

// ✅ GOOD: 의도를 드러내는 함수로 추출
function canAccessPremiumFeatures(user: User): boolean {
  return user.isActive &&
         user.subscription.plan !== 'free' &&
         user.subscription.expiresAt > new Date();
}

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      {canAccessPremiumFeatures(user) && <PremiumFeatures />}
    </div>
  );
}
```

### 2. 관심사 분리를 통한 단순화

**원칙:** 하나의 컴포넌트나 함수는 하나의 책임만 가져야 합니다.

#### 구현 세부사항 추상화

```typescript
// ❌ BAD: 인증 로직이 컴포넌트에 직접 노출
function Dashboard() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'unauthenticated') return null;

  return (
    <div>
      <h1>Dashboard</h1>
      {/* 대시보드 내용 */}
    </div>
  );
}

// ✅ GOOD: 인증 로직을 별도 컴포넌트로 추상화
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'unauthenticated') return null;

  return <>{children}</>;
}

function Dashboard() {
  return (
    <AuthGuard>
      <div>
        <h1>Dashboard</h1>
        {/* 대시보드 내용에만 집중 */}
      </div>
    </AuthGuard>
  );
}
```

### 3. 조건부 렌더링 명확화

**원칙:** 복잡한 조건부 로직은 별도 컴포넌트로 분리하여 각각의 역할을 명확히 합니다.

#### 역할별 컴포넌트 분리

```typescript
// ❌ BAD: 하나의 컴포넌트에서 모든 상태 처리
function SubmitButton({ userRole, isLoading, canSubmit }: Props) {
  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (userRole === 'viewer') {
    return <Button disabled>View Only</Button>;
  }

  if (userRole === 'admin') {
    return (
      <Button
        onClick={handleAdminSubmit}
        className="animate-pulse bg-red-500"
      >
        Admin Submit
      </Button>
    );
  }

  return (
    <Button
      disabled={!canSubmit}
      onClick={handleRegularSubmit}
    >
      Submit
    </Button>
  );
}

// ✅ GOOD: 역할별로 컴포넌트 분리
function SubmitButton({ userRole, isLoading, canSubmit }: Props) {
  if (isLoading) {
    return <LoadingButton />;
  }

  switch (userRole) {
    case 'viewer':
      return <ViewerSubmitButton />;
    case 'admin':
      return <AdminSubmitButton />;
    default:
      return <RegularSubmitButton canSubmit={canSubmit} />;
  }
}

function LoadingButton() {
  return <Button disabled>Loading...</Button>;
}

function ViewerSubmitButton() {
  return <Button disabled>View Only</Button>;
}

function AdminSubmitButton() {
  return (
    <Button
      onClick={handleAdminSubmit}
      className="animate-pulse bg-red-500"
    >
      Admin Submit
    </Button>
  );
}

function RegularSubmitButton({ canSubmit }: { canSubmit: boolean }) {
  return (
    <Button
      disabled={!canSubmit}
      onClick={handleRegularSubmit}
    >
      Submit
    </Button>
  );
}
```

## 네이밍 원칙

### 1. 설명적 이름 사용

```typescript
// ❌ BAD: 축약되고 불명확한 이름
const usr = getCurrentUser()
const isAuth = checkAuth(usr)
const handleClick = () => {
  /* ... */
}

// ✅ GOOD: 명확하고 설명적인 이름
const currentUser = getCurrentUser()
const isAuthenticated = checkUserAuthentication(currentUser)
const handleProfileUpdate = () => {
  /* ... */
}
```

### 2. 일관된 네이밍 패턴

```typescript
// ✅ GOOD: 일관된 패턴
// 상태 변수
const [isLoading, setIsLoading] = useState(false)
const [isVisible, setIsVisible] = useState(true)
const [hasError, setHasError] = useState(false)

// 이벤트 핸들러
const handleSubmit = () => {
  /* ... */
}
const handleCancel = () => {
  /* ... */
}
const handleUserDelete = () => {
  /* ... */
}

// 유틸리티 함수
const formatCurrency = (amount: number) => {
  /* ... */
}
const validateEmail = (email: string) => {
  /* ... */
}
const calculateTax = (price: number) => {
  /* ... */
}
```

## 코드 구조 원칙

### 1. 논리적 흐름 순서

```typescript
// ✅ GOOD: 논리적 순서로 코드 구성
function UserProfile({ userId }: { userId: string }) {
  // 1. 상태 정의
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. 부수 효과
  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  // 3. 이벤트 핸들러
  const handleEdit = () => {
    // 편집 로직
  };

  // 4. 조건부 렌더링
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  // 5. 메인 렌더링
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <Button onClick={handleEdit}>Edit Profile</Button>
    </div>
  );
}
```

### 2. 관련 코드 그룹핑

```typescript
// ✅ GOOD: 관련 코드를 함께 배치
function ProductForm() {
  // 폼 관련 상태들을 함께 그룹핑
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 검증 관련 로직들을 함께 그룹핑
  const validateForm = (data: typeof formData) => { /* ... */ };
  const handleFieldChange = (field: string, value: any) => { /* ... */ };
  const handleSubmit = async () => { /* ... */ };

  // 렌더링
  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 요소들 */}
    </form>
  );
}
```

## 문서화와 주석

### 1. 자기 설명적 코드 우선

```typescript
// ❌ BAD: 주석으로 불명확한 코드 설명
// 사용자가 프리미엄이고 활성화되었는지 확인
if (user.plan === 'premium' && user.status === 'active') {
  // 프리미엄 기능 표시
}

// ✅ GOOD: 코드 자체가 설명적
function isPremiumActiveUser(user: User): boolean {
  return user.plan === 'premium' && user.status === 'active'
}

if (isPremiumActiveUser(user)) {
  // 프리미엄 기능만 렌더링
}
```

### 2. 필요한 경우에만 주석 사용

```typescript
// ✅ GOOD: 비즈니스 로직의 배경 설명
function calculateDiscount(user: User, order: Order): number {
  // 비즈니스 규칙: 신규 고객은 첫 주문에서 10% 할인
  // 단, 주문 금액이 $100 이상인 경우에만 적용
  if (user.isNewCustomer && order.total >= 100) {
    return 0.1
  }

  return user.loyaltyLevel * 0.05 // 충성도 레벨당 5% 할인
}
```

## 측정 가능한 가독성 지표

### 1. 함수 복잡도

- **목표**: 함수당 15줄 이내
- **최대**: 30줄을 넘지 않도록

### 2. 중첩 깊이

- **목표**: 3단계 이내
- **최대**: 4단계를 넘지 않도록

### 3. 매개변수 수

- **목표**: 3개 이내
- **최대**: 5개를 넘지 않도록 (객체로 그룹핑 고려)

이러한 원칙들을 통해 코드는 더 읽기 쉽고, 이해하기 쉬우며, 유지보수하기 용이해집니다.
