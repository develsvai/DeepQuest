# Git Hooks for Deep Quest

이 디렉토리는 Deep Quest 프로젝트의 커스텀 Git hooks를 포함합니다.

## 개요

Git hooks는 Git 이벤트 발생 시 자동으로 실행되는 스크립트입니다. 이 프로젝트에서는 새로운 워크트리(worktree) 생성 시 환경변수 파일을 자동으로 복사하는 기능을 제공합니다.

## 사용 가능한 Hooks

### `post-checkout`

새로운 worktree 생성 시 환경변수 파일을 자동으로 복사합니다.

**복사되는 파일:**

- `/web/.env` → 새 워크트리의 `/web/.env`
- `/web/.env.local` → 새 워크트리의 `/web/.env.local`
- `/ai/.env` → 새 워크트리의 `/ai/.env`
- `/.vscode/` → 새 워크트리의 `/.vscode/` (디렉토리 전체)
- `/web/.claude/settings.local.json` → 새 워크트리의 `/web/.claude/settings.local.json`
- `/ai/.claude/settings.local.json` → 새 워크트리의 `/ai/.claude/settings.local.json`

**동작 조건:**

- 새 워크트리 생성 시에만 실행 (일반 branch checkout 시에는 실행되지 않음)
- 원본 파일이 존재할 때만 복사
- 대상 디렉토리(`/web`, `/ai`)가 새 워크트리에 존재할 때만 복사

**에러 처리:**

- 대상 디렉토리가 없으면 에러 로그 출력
- 복사 실패 시 에러 메시지 표시
- 전체 프로세스 성공/실패 상태 리포트

## 설치 방법

### 자동 설치 (권장)

프로젝트 루트에서 다음 명령어를 실행하세요:

```bash
./.github/hooks/install.sh
```

이 스크립트는:

- 필요한 권한 확인
- 기존 hooks 백업 및 교체 확인
- 심볼릭 링크로 hooks 설치
- 설치 결과 요약 제공

### 수동 설치

직접 심볼릭 링크를 생성할 수도 있습니다:

```bash
# post-checkout hook 설치
ln -s "$(pwd)/.github/hooks/post-checkout" "$(git rev-parse --git-dir)/hooks/post-checkout"
```

## 사용 예시

### 새 워크트리 생성

```bash
# 새로운 브랜치로 워크트리 생성
git worktree add ../feature-branch feature/new-feature

# 기존 브랜치로 워크트리 생성
git worktree add ../hotfix-branch hotfix/urgent-fix
```

### 예상 출력

```
[post-checkout] Worktree checkout detected
[post-checkout] Main worktree: /Users/user/deep-quest
[post-checkout] New worktree: /Users/user/feature-branch
[post-checkout] Starting environment file copy process...
[post-checkout] Copied web/.env to new worktree
[post-checkout] Copied web/.env.local to new worktree
[post-checkout] Copied ai/.env to new worktree
[post-checkout] Copied directory '.vscode' to new worktree
[post-checkout] Copied file 'web/.claude/settings.local.json' to new worktree
[post-checkout] Copied file 'ai/.claude/settings.local.json' to new worktree
[post-checkout] Environment file copy completed successfully
```

## 문제 해결

### Hook이 실행되지 않는 경우

1. **실행 권한 확인:**

   ```bash
   ls -la .git/hooks/post-checkout
   ```

   파일이 실행 가능해야 합니다 (`-rwxr-xr-x` 권한).

2. **심볼릭 링크 확인:**

   ```bash
   readlink .git/hooks/post-checkout
   ```

   올바른 소스 파일을 가리켜야 합니다.

3. **Hook 재설치:**
   ```bash
   ./.github/hooks/install.sh
   ```

### 환경변수 파일이 복사되지 않는 경우

1. **원본 파일 존재 확인:**

   ```bash
   ls -la web/.env*
   ls -la ai/.env*
   ```

2. **대상 디렉토리 존재 확인:**
   새 워크트리에 `web/`와 `ai/` 디렉토리가 있는지 확인하세요.

3. **Hook 로그 확인:**
   워크트리 생성 시 출력되는 로그 메시지를 확인하세요.

### 권한 오류

- macOS에서 파일 시스템 권한 문제가 발생할 수 있습니다
- 터미널에 Full Disk Access 권한이 있는지 확인하세요

## Hook 제거

Hook을 제거하려면:

```bash
# Hook 파일 삭제
rm .git/hooks/post-checkout

# 또는 무효화
chmod -x .git/hooks/post-checkout
```

## 개발자 정보

### Hook 수정

Hook을 수정한 후에는:

1. 변경사항을 `.github/hooks/` 디렉토리의 원본 파일에 적용
2. 다른 개발자들이 `install.sh`를 다시 실행하도록 안내
3. 변경사항을 문서화

### 새 Hook 추가

새로운 hook을 추가하려면:

1. `.github/hooks/` 디렉토리에 hook 스크립트 생성
2. `install.sh`의 `HOOKS_TO_INSTALL` 배열에 추가
3. 이 README 파일 업데이트
4. 테스트 수행

## 관련 문서

- [Git Hooks 공식 문서](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Git Worktree 문서](https://git-scm.com/docs/git-worktree)
- [Deep Quest 개발 가이드](../../CLAUDE.md)
