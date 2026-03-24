# React Patterns & Performance Rules

React 컴포넌트 아키텍처, hooks 최적화, 성능 최적화를 위한 핵심 패턴과 규칙입니다.

## 1. Component Architecture Patterns

### Single Responsibility Components

**규칙:** 각 컴포넌트는 하나의 명확한 책임만 가져야 합니다.

```typescript
// ❌ VIOLATION: 여러 책임을 가진 컴포넌트
const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  // 사용자 정보, 게시글, 댓글 모든 로직이 한 컴포넌트에
};

// ✅ CORRECT: 책임 분리
const UserDashboard = () => {
  return (
    <div>
      <UserInfo />
      <UserPosts />
      <UserComments />
    </div>
  );
};
```

### Custom Hooks for Logic Extraction

**규칙:** 복잡한 상태 로직은 custom hooks으로 추출해야 합니다.

```typescript
// ✅ CORRECT: 로직을 custom hook으로 추출
const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (query.length > 2) {
      setLoading(true)
      searchAPI(query)
        .then(setResults)
        .catch(setError)
        .finally(() => setLoading(false))
    }
  }, [query])

  return { query, setQuery, results, loading, error }
}
```

## 2. Performance Optimization Patterns

### Proper Memoization Strategy

**규칙:** 비싼 계산은 `useMemo`로, 함수는 `useCallback`으로, 컴포넌트는 `memo`로 최적화합니다.

```typescript
// ✅ CORRECT: 적절한 메모이제이션
const ExpensiveList = memo(({ items, filter }) => {
  // 비싼 계산 메모이제이션
  const filtered = useMemo(
    () => items.filter(item => item.includes(filter)),
    [items, filter]
  );

  // 콜백 메모이제이션으로 자식 리렌더링 방지
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id);
  }, []);

  return <div>{/* render */}</div>;
});
```

### Compound Components Pattern

**규칙:** 복합 UI는 compound components 패턴으로 유연성을 제공합니다.

```typescript
// ✅ CORRECT: Compound component 패턴
const Select = ({ children, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onChange, isOpen, setIsOpen }}>
      <div className="select">{children}</div>
    </SelectContext.Provider>
  );
};

Select.Trigger = ({ children }) => {
  const { isOpen, setIsOpen } = useSelectContext();
  return <button onClick={() => setIsOpen(!isOpen)}>{children}</button>;
};

Select.Options = ({ children }) => {
  const { isOpen } = useSelectContext();
  return isOpen ? <div className="options">{children}</div> : null;
};
```

## 3. Hooks Best Practices

### Effect Dependency Management

**규칙:** useEffect의 모든 의존성을 명시하고, cleanup을 적절히 처리합니다.

```typescript
// ✅ CORRECT: 의존성 관리 및 cleanup
const Component = ({ userId }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchUser(userId).then(data => {
      if (!cancelled) {
        setUser(data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId]) // 정확한 의존성
}
```

### Custom Hook Composition

**규칙:** 관련된 상태와 로직을 custom hook으로 그룹화합니다.

```typescript
// ✅ CORRECT: 조합 가능한 custom hooks
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

## 4. State Management Patterns

### State Location Strategy

**규칙:** 상태를 적절한 위치에 배치하여 불필요한 리렌더링을 방지합니다.

```typescript
// 로컬 UI 상태
const [isOpen, setIsOpen] = useState(false)

// Context for cross-cutting concerns
const ThemeContext = createContext<Theme>('light')

// Global state for app data (Zustand)
const useUserStore = create(set => ({
  user: null,
  setUser: user => set({ user }),
}))

// Reducer for complex state logic
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return initialState
    default:
      return state
  }
}
```

### Context vs Zustand 사용 기준

**규칙:** Context와 Zustand는 각각 적합한 사용 사례가 다르므로, 올바른 도구를 선택해야 합니다.

#### Context를 사용해야 하는 경우

**컴포넌트 라이브러리와 재사용 가능한 컴포넌트에서 사용:**

```typescript
// ✅ CORRECT: shadcn/ui Form 컴포넌트처럼 인스턴스별 독립 상태
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// ✅ CORRECT: Sidebar 같은 UI 컴포넌트의 로컬 상태
const SidebarContext = React.createContext<SidebarContextProps | null>(null);

// 각 Form/Sidebar 인스턴스가 독립적인 상태를 가짐
<FormProvider>
  <Form1 /> {/* 독립적인 폼 상태 */}
</FormProvider>
<FormProvider>
  <Form2 /> {/* 다른 독립적인 폼 상태 */}
</FormProvider>
```

**Context가 적합한 경우:**

- 컴포넌트 트리에 국한된 상태 (Form 필드, Modal 상태 등)
- 재사용 가능한 컴포넌트 라이브러리
- 여러 인스턴스가 독립적으로 작동해야 할 때
- Provider 패턴이 자연스러운 경우
- 컴포넌트와 상태가 1:1 관계일 때

#### Zustand를 사용해야 하는 경우

**전역 앱 상태와 비즈니스 로직에서 사용:**

```typescript
// ✅ CORRECT: 전역 사용자 상태
const useUserStore = create<UserStore>()(
  immer(set => ({
    user: null,
    isAuthenticated: false,
    login: user =>
      set(state => {
        state.user = user
        state.isAuthenticated = true
      }),
    logout: () =>
      set(state => {
        state.user = null
        state.isAuthenticated = false
      }),
  }))
)

// ✅ CORRECT: 인터뷰 준비 세션 상태
const useInterviewStore = create<InterviewStore>()(
  immer(set => ({
    currentSession: null,
    questions: [],
    feedback: [],
    // 복잡한 비즈니스 로직
    generateQuestions: async (resume, jobDescription) => {
      // AI 서버 호출 로직
    },
  }))
)

// Provider 없이 어디서든 사용 가능
function DeepComponent() {
  const user = useUserStore(state => state.user)
  // Props drilling 없이 직접 접근
}
```

**Zustand가 적합한 경우:**

- 전역 앱 상태 (사용자 인증, 장바구니, 설정 등)
- 여러 컴포넌트 트리에서 공유되는 상태
- Props drilling을 피하고 싶을 때
- 복잡한 비즈니스 로직과 비동기 작업
- DevTools 지원이 필요할 때
- 상태 persistence가 필요할 때

#### 실제 적용 예시

```typescript
// ❌ WRONG: UI 컴포넌트에 Zustand 사용
// 모든 Dialog가 같은 상태를 공유하게 됨
const useDialogStore = create((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

// ✅ CORRECT: UI 컴포넌트는 Context 사용
const DialogContext = createContext<{ isOpen: boolean; toggle: () => void }>();

// ❌ WRONG: 전역 상태에 Context 사용
// Props drilling과 Provider hell 발생
<AuthProvider>
  <UserProvider>
    <CartProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </CartProvider>
  </UserProvider>
</AuthProvider>

// ✅ CORRECT: 전역 상태는 Zustand 사용
// Provider 없이 깔끔한 구조
function App() {
  // 필요한 store만 직접 사용
  const user = useAuthStore((state) => state.user);
  const cart = useCartStore((state) => state.items);
  return <MainLayout />;
}
```

## 5. Error Handling Patterns

### Error Boundaries

**규칙:** 예상치 못한 에러를 처리하기 위해 Error Boundary를 구현합니다.

```typescript
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logErrorToService(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 6. Context Optimization

### Context Splitting

**규칙:** 불필요한 리렌더링을 방지하기 위해 context를 분리합니다.

```typescript
// 값과 설정 함수를 분리
const UserContext = createContext();
const UserDispatchContext = createContext();

const UserProvider = ({ children }) => {
  const [user, dispatch] = useReducer(userReducer, null);

  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  );
};
```

## 7. 안티패턴 금지사항

1. **useEffect with missing dependencies** - 의존성 배열 누락 금지
2. **Inline function props** - 불필요한 리렌더링 유발
3. **Large component files** - 컴포넌트를 작게 분리
4. **Direct state mutations** - 항상 새로운 객체/배열 생성
5. **Missing keys in lists** - 안정적이고 유니크한 key 사용
6. **Over-fetching in components** - 데이터 페칭을 상위로 이동
7. **Premature optimization** - 성능 측정 후 최적화
