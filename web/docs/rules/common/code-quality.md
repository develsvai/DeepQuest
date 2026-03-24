# Code Quality & Formatting Rules

## Overview

코드 품질과 일관성을 유지하기 위한 필수 규칙들을 정의합니다. 모든 작업 완료 후 반드시 수행해야 하는 코드 검증 과정을 포함합니다.

## 🚨 필수 작업 완료 후 검증

**모든 작업 단위 완료 후 반드시 실행해야 하는 명령어:**

```bash
pnpm run check-all
```

### 언제 실행해야 하는가?

- ✅ 새로운 컴포넌트 개발 완료 후
- ✅ 기존 파일 수정 완료 후
- ✅ API 엔드포인트 구현 완료 후
- ✅ 타입 정의 추가/수정 완료 후
- ✅ 스타일 변경 완료 후
- ✅ 리팩토링 작업 완료 후
- ✅ 버그 수정 완료 후
- ✅ **어떤 코드 변경이든 완료 후**

### 왜 중요한가?

1. **코드 일관성**: 프로젝트 전체의 코딩 스타일 통일
2. **오류 조기 발견**: 타입 에러, 린트 에러를 즉시 감지
3. **코드 품질**: 자동화된 포맷팅으로 가독성 향상
4. **팀 협업**: 일관된 코드 스타일로 리뷰 효율성 증대
5. **배포 안정성**: 프로덕션 빌드 실패 방지

## check-all 명령어 구성

`pnpm run check-all` 명령어는 다음 검사들을 순차적으로 실행합니다:

### 1. 타입 검사 (Type Check)

```bash
pnpm type-check
```

- TypeScript 컴파일 에러 검출
- 타입 안전성 검증
- 런타임 오류 사전 방지

### 2. 린트 검사 (Lint)

```bash
pnpm lint
```

- ESLint 규칙 준수 확인
- 코드 품질 이슈 감지
- 잠재적 버그 패턴 식별

### 3. 포맷 검사 (Format Check)

```bash
pnpm format:check
```

- Prettier 포맷팅 규칙 준수 확인
- 코드 스타일 일관성 검증

## 오류 발생 시 대응 방법

### 타입 에러 해결

```bash
# 타입 에러가 발생한 경우
pnpm type-check
# 오류 메시지를 확인하고 타입 정의 수정
```

### 린트 에러 해결

```bash
# 자동 수정 가능한 린트 에러 해결
pnpm lint --fix

# 수동으로 수정해야 하는 경우
pnpm lint
# 오류 메시지를 확인하고 수동 수정
```

### 포맷 에러 해결

```bash
# 자동 포맷팅 적용
pnpm format

# 포맷팅 후 다시 검사
pnpm format:check
```

## 자동화된 품질 검증 워크플로

### 개발 중 실시간 검사

```bash
# 개발 서버 실행 시 자동 검사
pnpm dev
```

### 커밋 전 검사

- pre-commit hook이 자동으로 `check-all` 실행
- 모든 검사 통과 시에만 커밋 허용

### CI/CD 파이프라인 검사

- GitHub Actions에서 자동 실행
- 배포 전 최종 품질 검증

## 팀 개발 시 주의사항

### 1. 절대 우회하지 마세요

```bash
# ❌ 금지: 검사 우회
git commit --no-verify

# ✅ 권장: 문제 해결 후 커밋
pnpm run check-all
git commit -m "fix: resolve linting issues"
```

### 2. 작업 단위별 검증

- 큰 작업을 작은 단위로 나누어 개발
- 각 단위 완료 후 즉시 `check-all` 실행
- 문제 발생 시 범위를 좁혀 빠른 해결

### 3. 에러 메시지 주의 깊게 읽기

- 자동 수정 가능한 것과 수동 수정 필요한 것 구분
- 근본 원인 파악하여 반복 방지

## 성능 최적화 팁

### IDE 설정

```json
// VSCode settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 빠른 부분 검사

```bash
# 특정 파일만 검사
npx eslint src/components/MyComponent.tsx
npx tsc --noEmit src/components/MyComponent.tsx
```

## 체크리스트

작업 완료 후 반드시 확인:

- [ ] `cd /Users/smartcow/Desktop/dev/deep-quest/web && pnpm run check-all` 실행
- [ ] 모든 타입 에러 해결
- [ ] 모든 린트 에러 해결
- [ ] 모든 포맷 에러 해결
- [ ] 변경된 파일들이 의도대로 작동하는지 확인
- [ ] 관련 문서 업데이트 (필요시)

## 자주 발생하는 실수와 해결책

| 실수                  | 원인           | 해결책                      |
| --------------------- | -------------- | --------------------------- |
| `check-all` 실행 안함 | 습관 부족      | 작업 완료 체크리스트에 포함 |
| 타입 에러 무시        | any 타입 남용  | 명시적 타입 정의            |
| 린트 규칙 무시        | 규칙 이해 부족 | ESLint 문서 참조            |
| 포맷팅 불일치         | IDE 설정 차이  | 프로젝트 설정 통일          |

---

**⚠️ 중요**: 이 규칙은 모든 개발자가 반드시 준수해야 하는 필수 규칙입니다. 코드 품질과 팀 협업의 기본이 되는 규칙이므로 예외 없이 적용해야 합니다.
