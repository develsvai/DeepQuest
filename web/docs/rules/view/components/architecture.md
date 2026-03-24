# Component Architecture & shadcn/ui Integration Rules

컴포넌트 설계, shadcn/ui 통합, 유지보수 가능한 컴포넌트 아키텍처를 위한 핵심 규칙입니다.

## 1. Component Architecture Principles

### Component Composition over Inheritance

**규칙:** 상속보다는 컴포지션을 통해 컴포넌트를 구성합니다.

```typescript
// ❌ VIOLATION: 상속 기반 접근
class BaseButton extends Component {
  render() {
    return <button className={this.getClassName()}>{this.props.children}</button>;
  }
}

class PrimaryButton extends BaseButton {
  getClassName() {
    return 'btn btn-primary';
  }
}

// ✅ CORRECT: 컴포지션 기반 접근
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = ({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Single Responsibility Components

**규칙:** 각 컴포넌트는 하나의 명확한 목적과 책임을 가져야 합니다.

```typescript
// ❌ VIOLATION: 여러 책임을 가진 컴포넌트
const UserCard = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);

  // 사용자 정보 표시, 게시글 로딩, 편집 모드 - 너무 많은 책임
  useEffect(() => {
    fetchUserPosts(user.id).then(setPosts);
  }, [user.id]);

  return (
    <div>
      {editing ? <UserEditForm /> : <UserProfile />}
      <PostList posts={posts} />
    </div>
  );
};

// ✅ CORRECT: 책임이 분리된 컴포넌트들
const UserCard = ({ user }) => (
  <Card>
    <UserProfile user={user} />
    <UserActions user={user} />
  </Card>
);

const UserProfile = ({ user }) => (
  <div>
    <Avatar src={user.avatar} />
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
);

const UserActions = ({ user }) => {
  const [editing, setEditing] = useState(false);

  return editing ? (
    <UserEditForm user={user} onSave={() => setEditing(false)} />
  ) : (
    <Button onClick={() => setEditing(true)}>Edit</Button>
  );
};
```

## 2. shadcn/ui Integration Standards

### Prefer shadcn/ui Components

**규칙:** 커스텀 구현보다는 shadcn/ui 컴포넌트를 우선 사용합니다.

```typescript
// ❌ VIOLATION: 커스텀 Button 구현
const CustomButton = ({ children, onClick, disabled }) => {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ✅ CORRECT: shadcn/ui Button 사용
import { Button } from '@/components/ui/button';

const MyComponent = () => {
  return (
    <Button variant="default" size="md" onClick={handleClick}>
      Click me
    </Button>
  );
};
```

### Proper shadcn/ui Customization

**규칙:** shadcn/ui 컴포넌트는 제공된 variant와 prop을 통해 커스터마이징합니다.

```typescript
// ✅ CORRECT: shadcn/ui 컴포넌트 활용
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LoginForm = () => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
        <Button className="w-full">
          Sign In
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Creating Custom shadcn-style Components

**규칙:** 새로운 컴포넌트가 필요한 경우 shadcn/ui 패턴을 따릅니다.

```typescript
// ✅ CORRECT: shadcn 스타일의 커스텀 컴포넌트
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

## 3. Prop Design Patterns

### Discriminated Union Props

**규칙:** 상호 배타적인 prop들은 discriminated union으로 타입을 정의합니다.

```typescript
// ✅ CORRECT: Discriminated union props
type LoadingState = {
  loading: true;
};

type LoadedState = {
  loading: false;
  data: User[];
  error?: string;
};

type UserListProps = LoadingState | LoadedState;

const UserList = (props: UserListProps) => {
  if (props.loading) {
    return <LoadingSkeleton />;
  }

  if (props.error) {
    return <ErrorMessage error={props.error} />;
  }

  return (
    <div>
      {props.data.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### Flexible Children Patterns

**규칙:** children prop을 유연하게 활용하여 재사용 가능한 컴포넌트를 만듭니다.

```typescript
// ✅ CORRECT: 유연한 children 패턴
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Card>
          <Button
            className="absolute right-2 top-2"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ×
          </Button>
          {children}
        </Card>
      </div>
    </div>
  );
};

// 사용법
const App = () => (
  <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
    <CardHeader>
      <CardTitle>Confirm Action</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Are you sure you want to proceed?</p>
    </CardContent>
    <CardFooter>
      <Button variant="outline" onClick={() => setShowModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </CardFooter>
  </Modal>
);
```

## 4. Component Organization

### Feature-based File Structure

**규칙:** 컴포넌트는 기능별로 구조화하고 관련 파일들을 함께 배치합니다.

```typescript
// ✅ CORRECT: 기능 기반 구조
/*
app/
├── (dashboard)/
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── AnalyticsChart.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── DateRangePicker.tsx
│   │   ├── hooks/
│   │   │   └── useAnalytics.ts
│   │   └── page.tsx
│   └── profile/
│       ├── components/
│       │   ├── ProfileForm.tsx
│       │   └── AvatarUpload.tsx
│       └── page.tsx
└── components/
    └── ui/ (shadcn/ui components)
*/
```

### Component Export Patterns

**규칙:** 명확한 export 패턴을 사용하여 컴포넌트를 노출합니다.

```typescript
// components/UserCard/UserCard.tsx
export const UserCard = ({ user }: { user: User }) => {
  return (
    <Card>
      <UserProfile user={user} />
      <UserActions user={user} />
    </Card>
  );
};

// components/UserCard/index.ts
export { UserCard } from './UserCard';
export type { UserCardProps } from './UserCard';

// 사용하는 곳에서
import { UserCard } from '@/components/UserCard';
```

## 5. Performance Considerations

### Lazy Loading Components

**규칙:** 무거운 컴포넌트는 lazy loading을 적용합니다.

```typescript
// ✅ CORRECT: 지연 로딩 패턴
import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const HeavyChart = lazy(() => import('./HeavyChart'));
const DataTable = lazy(() => import('./DataTable'));

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      <Suspense fallback={<LoadingSkeleton className="h-64" />}>
        <HeavyChart />
      </Suspense>

      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <DataTable />
      </Suspense>
    </div>
  );
};
```

### Memoization for Complex Components

**규칙:** 복잡한 계산이나 props 비교가 필요한 컴포넌트는 메모이제이션을 적용합니다.

```typescript
// ✅ CORRECT: 적절한 메모이제이션
interface DataVisualizationProps {
  data: ChartData[];
  config: ChartConfig;
  onDataPointClick: (point: DataPoint) => void;
}

const DataVisualization = memo(({ data, config, onDataPointClick }: DataVisualizationProps) => {
  const processedData = useMemo(() => {
    return processChartData(data, config);
  }, [data, config]);

  const handleDataPointClick = useCallback((point: DataPoint) => {
    onDataPointClick(point);
  }, [onDataPointClick]);

  return (
    <Chart
      data={processedData}
      onClick={handleDataPointClick}
    />
  );
});

DataVisualization.displayName = 'DataVisualization';
```

## 6. Error Handling in Components

### Error Boundary Implementation

**규칙:** 컴포넌트 경계에서 에러를 적절히 처리합니다.

```typescript
// ✅ CORRECT: 컴포넌트별 에러 바운더리
const DataSection = () => {
  return (
    <ErrorBoundary
      fallback={<ErrorMessage message="Failed to load data" />}
      onError={(error) => logError('DataSection', error)}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <AsyncDataComponent />
      </Suspense>
    </ErrorBoundary>
  );
};
```

## 7. Accessibility Standards

### Semantic HTML and ARIA

**규칙:** 의미 있는 HTML과 적절한 ARIA 속성을 사용합니다.

```typescript
// ✅ CORRECT: 접근성을 고려한 컴포넌트
const SearchCombobox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <div className="relative">
      <Label htmlFor="search-input" className="sr-only">
        Search options
      </Label>
      <Input
        id="search-input"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (
        <ul
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 bg-white border rounded shadow-lg"
        >
          {/* options */}
        </ul>
      )}
    </div>
  );
};
```

## 8. 안티패턴 금지사항

1. **Raw HTML elements over shadcn/ui** - div, button 대신 Card, Button 사용
2. **Hardcoded styles over design tokens** - className 대신 design system 활용
3. **Prop drilling over composition** - 깊은 prop 전달보다 컴포지션 사용
4. **Large component files** - 단일 파일에 여러 컴포넌트 배치 금지
5. **Missing loading states** - 비동기 작업에 로딩 상태 필수
6. **Inaccessible components** - ARIA 속성과 semantic HTML 누락 금지
7. **Direct DOM manipulation** - ref를 통한 직접 DOM 조작 최소화
