# Claude Command: Create Pull Request

현재 브랜치의 커밋을 origin에 push하고, main 브랜치와 비교하여 Pull Request를 생성합니다.

## Usage

```
/create-pr
```

Or with custom target branch:

```
/create-pr develop
```

## Context

- Current branch: !`git branch --show-current`
- Remote tracking: !`git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null`
- Commits ahead of origin: !`git rev-list --count HEAD ^origin/main 2>/dev/null`
- Recent commits on this branch: !`git log --oneline -10 --no-merges`
- Changed files vs main: !`git diff --stat origin/main...HEAD 2>/dev/null`

## Your Task

Pull Request를 생성하기 위해 다음 단계를 수행하세요:

### Step 1: Pre-flight Checks

1. 현재 브랜치가 `main` 또는 `master`가 아닌지 확인
2. 커밋되지 않은 변경사항이 있으면 경고만 표시하고 진행 (추가 커밋하지 않음)
3. push할 커밋이 있는지 확인

### Step 2: Push to Origin

1. 현재 브랜치를 origin에 push
   ```bash
   git push -u origin <current-branch>
   ```
2. push 실패 시 원인 분석 및 해결 방안 제시

### Step 3: Analyze Changes

1. Target 브랜치 결정 (기본값: `main`, 인자로 지정 가능: `$1`)
2. Target 브랜치와의 diff 분석:
   ```bash
   git diff origin/<target>...HEAD
   git log --oneline origin/<target>..HEAD
   ```
3. 변경 사항 요약:
   - 수정된 파일 목록
   - 추가/삭제된 라인 수
   - 주요 변경 내용

### Step 4: Generate PR Content

다음 형식으로 PR을 작성하세요:

#### PR Title (Conventional Commits 형식)

**형식:** `<type>(<scope>): <description>`

- **type**: 변경 유형 (필수)
  - `feat`: 새로운 기능
  - `fix`: 버그 수정
  - `refactor`: 리팩토링 (기능 변경 없음)
  - `docs`: 문서 변경
  - `style`: 코드 스타일 변경 (포맷팅, 세미콜론 등)
  - `test`: 테스트 추가/수정
  - `chore`: 빌드, 설정 파일 변경
  - `perf`: 성능 개선
- **scope**: 영향받는 영역 (선택, 괄호로 표시)
  - 예: `auth`, `api`, `ui`, `db`
- **description**: 변경 내용 요약 (한국어, 50자 이내)
  - 명령형 어조 사용: "추가", "수정", "개선" (O) / "추가함", "수정됨" (X)
  - 구체적이고 스캔 가능하게: "버그 수정" (X) → "로그인 실패 시 에러 메시지 표시" (O)

**예시:**

- `feat(auth): 소셜 로그인 기능 추가`
- `fix(api): 사용자 조회 시 null 포인터 예외 수정`
- `refactor(ui): 대시보드 컴포넌트 분리`

#### PR Body (Best Practices 적용)

```markdown
## 📋 Summary
<!-- 이 PR이 해결하는 문제와 변경 사항을 2-3문장으로 요약 -->

## 🎯 Why (동기)
<!-- 왜 이 변경이 필요한지 설명 -->
- 관련 이슈: #<issue-number>

## 🔧 What Changed (변경 내용)
<!-- 주요 변경 사항을 bullet points로 나열 -->
-
-

## 🧪 Test Plan
<!-- 테스트 방법과 검증 항목 -->
- [ ] 유닛 테스트 통과
- [ ] 수동 테스트 완료
- [ ] 엣지 케이스 확인

## 📸 Screenshots (UI 변경 시)
<!-- Before/After 스크린샷 첨부 -->
| Before | After |
|--------|-------|
|        |       |

## ⚠️ Breaking Changes
<!-- 기존 기능에 영향을 주는 변경 사항 (없으면 "None" 기재) -->
None

## 📝 Additional Notes
<!-- 리뷰어가 알아야 할 추가 정보 -->

```

#### PR Quality Guidelines

- **250 LOC 이하 권장**: 연구에 따르면 200-400 LOC가 최적의 리뷰 범위
- **단일 목적**: 하나의 PR은 하나의 목적만 달성
- **리뷰어 안내**: 복잡한 변경은 관련 파일을 그룹화하여 설명

### Step 5: Create PR

`gh` CLI를 사용하여 PR 생성:

```bash
gh pr create --title "<title>" --body "<body>" --base <target-branch>
```

PR 생성 후 URL을 사용자에게 공유하세요.

## Options

- `$1` (optional): Target branch (default: `main`)

## Important Notes

- PR 생성 전 항상 최신 코드를 push
- Target 브랜치와의 충돌 여부 확인
- Draft PR로 생성할지 사용자에게 질문
- PR Title과 Body는 한국어로 작성
- `--no-verify` 옵션 없이 정상적인 push만 허용
- 커밋되지 않은 변경사항은 추가 커밋하지 않고 현재 커밋된 상태로 PR 생성

## Examples

### Good PR Titles (with scope)

- `feat(auth): 소셜 로그인 기능 추가`
- `fix(ui): 모바일에서 버튼 클릭 영역 확대`
- `refactor(api): 에러 핸들링 미들웨어 통합`
- `docs(readme): 설치 가이드 업데이트`
- `perf(db): 사용자 조회 쿼리 최적화`

### Bad PR Titles (avoid)

- ❌ `버그 수정` → 어떤 버그인지 불명확
- ❌ `업데이트` → 무엇을 업데이트했는지 모름
- ❌ `기능 추가함` → 명령형이 아닌 과거형 사용
- ❌ `fix: 수정` → 중복되고 구체적이지 않음

## Error Handling

1. **No commits to push**: 현재 브랜치에 push할 커밋이 없으면 알림
2. **Push rejected**: force push 여부 확인 (권장하지 않음)
3. **PR already exists**: 기존 PR 링크 제공
4. **No gh CLI**: gh CLI 설치 안내
