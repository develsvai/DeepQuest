**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Deep Quest Web Server - Docker Setup

Next.js 기반 웹 서버를 Docker 컨테이너로 실행하기 위한 설정 파일과 사용 방법입니다.  
환경변수는 `env.template`을 복사해 `.env`로 두고, DB·Clerk·Supabase·AI 서버 URL 등을 실제 값으로 채워 사용합니다.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. 빠른 시작](#2-빠른-시작)
  - [2.1 환경변수 설정](#21-환경변수-설정)
  - [2.2 웹 서버 이미지 빌드](#22-웹-서버-이미지-빌드)
  - [2.3 통합 스택 시작 (AI + Web)](#23-통합-스택-시작-ai--web)
  - [2.4 확인](#24-확인)
- [3. 개발 환경](#3-개발-환경)
  - [3.1 Multi-stage Build](#31-multi-stage-build)
  - [3.2 Standalone Output](#32-standalone-output)
  - [3.3 디버깅](#33-디버깅)
- [4. 프로덕션 배포](#4-프로덕션-배포)
  - [4.1 프로덕션 이미지 빌드](#41-프로덕션-이미지-빌드)
  - [4.2 데이터베이스 마이그레이션](#42-데이터베이스-마이그레이션)
  - [4.3 환경변수 설정](#43-환경변수-설정)
  - [4.4 통합 스택 프로덕션 실행](#44-통합-스택-프로덕션-실행)
- [5. 서비스 구성](#5-서비스-구성)
- [6. 문제 해결](#6-문제-해결)
- [7. 로그](#7-로그)
- [8. 보안](#8-보안)
- [9. 참고 자료](#9-참고-자료)

---

## 1. 파일 구조

웹 서버 이미지 빌드와 Compose 연동에 쓰는 파일들입니다. **단일 Dockerfile**만 사용하며, `ENVIRONMENT` 빌드 인자로 dev/prod를 구분합니다. Next.js standalone 빌드로 항상 프로덕션형 런타임 이미지를 만듭니다.

```
docker/web/
├── Dockerfile          # 단일 이미지 (ENVIRONMENT 빌드 인자로 dev/prod 구분, standalone)
├── env.template        # 환경변수 템플릿
├── compose-build.sh    # Compose용 이미지 빌드 스크립트 (모노레포 루트 컨텍스트)
└── README.md           # 이 파일
```

---

## 2. 빠른 시작

### 2.1 환경변수 설정

Web 서비스 전용 환경변수는 `docker/web/.env`에 두거나, `compose-build.sh`가 사용하는 `.env.dev`·`.env.prod`를 채워 둡니다. Git에는 넣지 않고, `env.template`을 복사한 뒤 실제 값으로 수정합니다.

```bash
# infra/docker/web 디렉토리로 이동
cd infra/docker/web
# 템플릿을 .env로 복사한 뒤 필수 값 채우기 (또는 .env.dev / .env.prod 준비)
cp env.template .env
```

`compose-build.sh` 실행 시: `ENVIRONMENT=development`이면 `.env.dev`를, `ENVIRONMENT=production`이면 `.env.prod`를 빌드·런타임용으로 복사합니다. 없으면 기존 `.env`를 사용합니다.

필수 환경변수 요약(자세한 값은 `env.template` 참고):
- `DATABASE_URL`, `DIRECT_URL`: Prisma가 사용할 PostgreSQL 접속 정보
- `LANGGRAPH_API_URL`: AI 서버 베이스 URL
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`: AI 서버가 웹훅 호출 시 사용하는 URL (Compose 내부면 `http://web:3000`)
- `NEXT_PUBLIC_APP_URL`: 브라우저에서 접근하는 프런트엔드 URL

### 2.2 웹 서버 이미지 빌드

Compose에서 사용할 Web 이미지를 빌드합니다. `compose-build.sh`는 **모노레포 루트를 빌드 컨텍스트**로 사용하므로, `infra/docker/web`에서 실행하면 스크립트가 자동으로 루트로 이동해 빌드합니다. 기본값은 개발 모드(ENVIRONMENT=development, `.env.dev` 사용, 태그 dev)입니다.

```bash
# infra/docker/web에서 실행 (스크립트가 모노레포 루트로 이동해 빌드)
cd infra/docker/web
# 셸 스크립트 실행 권한 부여
chmod +x *.sh
# 개발용 이미지 빌드 (기본): .env.dev 사용, deepquest-web:dev 태그
./compose-build.sh
```

프로덕션 이미지: 같은 Dockerfile로 `ENVIRONMENT=production ./compose-build.sh`를 실행하면 `.env.prod`가 사용되고 `deepquest-web:prod` 태그가 붙습니다.

### 2.3 통합 스택 시작 (AI + Web)

AI와 Web을 함께 띄울 때는 `infra/docker`에서 통합 Compose를 사용합니다. DB는 외부 서버를 쓰는 구성이면 Compose에 포함하지 않습니다.

```bash
# 통합 Compose 디렉토리로 이동
cd infra/docker
# 환경변수·이미지 확인 후 AI·Web 서비스 기동
./start-all.sh
```

- `docker-compose.yml`에 따라 AI 서버와 Web 서버가 함께 실행됩니다.
- DB는 서버(외부)를 사용하는 구성이면 별도로 올리지 않습니다.

### 2.4 확인

서비스 기동 후 브라우저·웹훅·로그로 동작을 확인합니다.

```bash
# 브라우저에서 웹 UI 열기
open http://localhost:3000

# AI 워크플로우 웹훅 엔드포인트 호출 (헬스 확인)
curl http://localhost:3000/api/webhooks/ai-workflow

# Web 컨테이너 로그 실시간 출력
docker logs -f deepquest-web
```

---

## 3. 개발 환경

### 3.1 Multi-stage Build

Dockerfile은 base 위에 deps → builder → runner 3단계로 구성됩니다. 의존성 설치·Next.js 빌드·실행을 나누어 이미지 크기와 보안을 관리합니다.

1. **deps**: pnpm 의존성 설치
2. **builder**: ENVIRONMENT 빌드 인자 반영, Prisma generate·pnpm build (standalone)
3. **runner**: standalone 결과만 복사해 `node server.js`로 실행 (NODE_ENV=production)

### 3.2 Standalone Output

Next.js `output: 'standalone'` 모드로 실행 파일만 포함해 이미지 크기를 줄이고 기동 시간을 단축합니다.

- 필요한 파일만 포함
- 이미지 크기 최소화
- 빠른 시작 시간

### 3.3 디버깅

컨테이너 안으로 들어가거나 로그·환경변수를 확인할 때 사용합니다.

```bash
# Web 컨테이너 셸 접속 (Alpine 계열은 sh)
docker exec -it deepquest-web sh

# Web 컨테이너 로그 실시간 확인
docker logs -f deepquest-web

# 컨테이너에 주입된 환경변수 목록 조회
docker exec deepquest-web env
```

---

## 4. 프로덕션 배포

### 4.1 프로덕션 이미지 빌드

프로덕션용 이미지도 **같은 Dockerfile**로 빌드합니다. `docker/web/.env.prod`를 채워 둔 뒤 `ENVIRONMENT=production`으로 스크립트를 실행하면 `deepquest-web:prod` 태그가 붙습니다.

```bash
# infra/docker/web에서 실행: 프로덕션 이미지 빌드 (.env.prod 사용)
ENVIRONMENT=production ./compose-build.sh
```

### 4.2 데이터베이스 마이그레이션

스키마 변경을 DB에 반영할 때 Web 컨테이너에서 Prisma 마이그레이션을 실행합니다. 실행 위치는 통합 Compose가 있는 `infra/docker`입니다.

```bash
# infra/docker 디렉토리에서 실행: 마이그레이션 적용
docker-compose -f docker-compose.yml run --rm web pnpm db:migrate:deploy
# Prisma Client 재생성 (스키마 반영)
docker-compose -f docker-compose.yml run --rm web pnpm db:generate
```

### 4.3 환경변수 설정

프로덕션 런타임에는 `NODE_ENV=production`과 live용 Clerk 키를 쓰고, DB·AI 서버 주소는 배포 환경에 맞게 설정합니다. `docker/web/.env.prod`에 아래와 같이 채워 둡니다.

```bash
# .env.prod 또는 프로덕션용 .env 예시 (실제 호스트/비밀번호로 변경)
NODE_ENV=production
# Prisma DB 연결
DATABASE_URL=postgresql://user:pass@host:5432/db
# AI 서버 주소 (Compose 내부면 서비스 이름 사용)
LANGGRAPH_API_URL=http://deepquest-ai:8123
# Clerk live 키 (프로덕션 인증용)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
# Supabase 프로젝트 URL·키
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# AI 웹훅 호출용 (Compose 내부면 서비스 이름)
APP_URL=http://web:3000
```

### 4.4 통합 스택 프로덕션 실행

AI와 Web을 프로덕션 모드로 함께 띄울 때는 `infra` 또는 `infra/docker`에서 통합 Compose를 사용합니다.

```bash
# 통합 Compose가 있는 디렉토리로 이동 (infra 또는 infra/docker)
cd infra
# 또는 cd infra/docker
# 환경변수·이미지 확인 후 AI·Web 서비스 프로덕션 모드 기동
ENVIRONMENT=production ./docker/start-all.sh
```

---

## 5. 서비스 구성

### Web Server (Next.js)

- **포트**: 3000
- **의존성**: PostgreSQL, AI Server
- **기능**:
  - 사용자 인증 (Clerk)
  - tRPC API
  - 파일 업로드 (Supabase)
  - AI 워크플로우 관리

### API 엔드포인트

- `/api/trpc/*` — tRPC API
- `/api/webhooks/*` — Webhooks (Clerk, Stripe 등)
- `/api/health` — Health check

---

## 6. 문제 해결

### 포트 충돌

3000 포트를 다른 프로세스가 쓰고 있으면 Web 서버가 기동하지 않습니다. 사용 중인 프로세스를 확인한 뒤 필요 시 종료합니다.

```bash
# 3000 포트를 사용 중인 PID 조회 후 해당 프로세스 강제 종료
lsof -ti:3000 | xargs kill -9
```

### 컨테이너 재시작

설정 변경 후 Web 컨테이너만 다시 띄울 때 사용합니다.

```bash
# Web 컨테이너만 재시작
docker restart deepquest-web
```

### 데이터베이스 연결 실패

Web이 DB에 연결되지 않을 때 Compose 네트워크와 컨테이너 연결을 확인합니다.

```bash
# Compose가 만든 네트워크와 연결된 컨테이너 확인
docker network inspect deepquest-network
```

### AI 분석 완료 후에도 웹에서 "대기 중"인 경우 (웹훅 미수신)

AI 서버가 웹훅을 호출했는데 Web이 받지 못하거나, 시그니처 불일치로 실패할 수 있습니다. 아래 순서로 확인합니다.

1. **웹 로그에서 웹훅 수신 여부 확인**

   ```bash
   # Web 컨테이너 로그로 웹훅 도달·검증 실패 여부 확인
   docker logs -f deepquest-web
   ```

   - `[webhook] Received` 가 보이면: 웹훅은 도달함. 핸들러/DB 오류 가능성 → 500 로그 확인.
   - `[webhook] Signature validation failed` 가 보이면: `.env`의 `AI_WEBHOOK_SECRET`과 AI 서버가 웹훅 호출 시 넘기는 `signature` 쿼리 파라미터가 일치하는지 확인.
   - 위 로그가 전혀 없으면: AI 서버에서 웹훅이 호출되지 않았거나, 웹 서버까지 도달하지 못한 것일 수 있음.

2. **Docker 내부에서 웹훅 URL 사용**

   - `APP_URL`은 **AI 컨테이너가 웹을 호출할 때 쓰는 URL**이어야 합니다.
   - 같은 Compose 네트워크에서는 **서비스 이름(hostname)** 을 사용합니다: `APP_URL=http://web:3000`
   - `docker/web/.env.prod`에 `APP_URL=http://web:3000`이 설정되어 있어야 웹훅 URL이 올바르게 생성됩니다.
   - 웹 컨테이너가 실제로 쓰는 값 확인:

     ```bash
     # Web 컨테이너에 주입된 APP_URL 출력
     docker exec deepquest-web node -e "console.log(process.env.APP_URL)"
     ```

3. **AI 서버에서 웹 접근 가능 여부 확인**

   ```bash
   # AI 컨테이너에서 Web 웹훅 URL로 요청해 HTTP 상태 코드만 출력 (200이면 정상)
   docker exec deepquest-ai curl -s -o /dev/null -w "%{http_code}" http://web:3000/api/webhooks/ai-workflow
   ```

   - `200`이 나오면 AI → Web 네트워크는 정상입니다.

### 완전히 재설정

이미지를 지우고 다시 빌드한 뒤 통합 스택을 기동할 때 사용합니다. 상위 `infra`에서 실행할 경우 `docker-compose -f docker/docker-compose.yml down`으로 중지합니다.

```bash
# 통합 Compose 디렉토리로 이동 (infra/docker)
cd infra/docker
# Compose로 띄운 서비스 전부 중지
docker-compose -f docker-compose.yml down
# 로컬 Web 이미지 삭제
docker rmi deepquest-web:dev
# Web 이미지 재빌드 (compose-build.sh가 모노레포 루트로 이동해 빌드)
./web/compose-build.sh
# 통합 스택 기동
./start-all.sh
```

---

## 7. 로그

로그는 Docker 로그로만 관리됩니다. 디버깅 시 아래 명령으로 확인합니다.

```bash
# Web 컨테이너 전체 로그 출력
docker logs deepquest-web

# 로그 실시간 스트리밍
docker logs -f deepquest-web

# 최근 100줄만 출력
docker logs --tail 100 deepquest-web
```

---

## 8. 보안

프로덕션 배포 전 점검할 항목입니다. API 키와 DB 비밀번호는 환경변수나 Secrets Manager로 관리하고, Git에는 넣지 않습니다.

- [ ] `.env` 파일을 Git에 커밋하지 않기
- [ ] API 키를 환경변수나 Secrets Manager에서 관리
- [ ] HTTPS 사용 (프로덕션)
- [ ] CORS 설정 확인
- [ ] Rate limiting 설정
- [ ] CSP 헤더 설정

---

## 9. 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Clerk Documentation](https://clerk.com/docs)

