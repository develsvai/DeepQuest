**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Compose로 실행 가이드

전체 Deep Quest 애플리케이션을 Docker Compose로 실행하기 위한 가이드입니다.  
Compose 파일 위치: **infra/docker/docker-compose.yml**.  
PostgreSQL은 포함되지 않으며, 서버 DB를 사용하거나 별도로 구성해야 합니다.

## 목차

- [1. 시스템 구성](#1-시스템-구성)
- [2. 빠른 시작](#2-빠른-시작)
  - [2.1 전제 조건](#21-전제-조건)
  - [2.2 전체 스택 실행](#22-전체-스택-실행)
  - [2.3 환경변수 설정](#23-환경변수-설정)
  - [2.4 서비스 재시작](#24-서비스-재시작)
  - [2.5 확인](#25-확인)
- [3. 개별 서비스 관리](#3-개별-서비스-관리)
  - [3.1 PostgreSQL](#31-postgresql)
  - [3.2 AI Server](#32-ai-server)
  - [3.3 Web Server](#33-web-server)
- [4. 개발 워크플로우](#4-개발-워크플로우)
- [5. 문제 해결](#5-문제-해결)
- [6. 모니터링](#6-모니터링)

---

## 1. 시스템 구성

Compose로 올라가는 서비스는 Web(Next.js)과 AI(LangGraph) 두 개입니다. Web이 AI 서버를 호출하는 구조이며, DB는 이 스택에 포함되지 않습니다.

```
┌─────────────────────────────────────────────────────┐
│                   Deep Quest                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐    ┌──────────┐                     │
│  │   Web    │───→│    AI    │                     │
│  │  Server  │    │  Server  │                     │
│  │(Next.js) │    │(LangGraph)                     │
│  └──────────┘    └──────────┘                     │
│   Port 3000       Port 8123                        │
│                                                     │
│  PostgreSQL은 별도 구성 필요 (서버 DB 사용)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. 빠른 시작

### 2.1 전제 조건

- Docker Desktop 설치 (최신 버전 권장)
- 8GB 이상의 RAM
- 10GB 이상의 디스크 공간

### 2.2 전체 스택 실행

```bash
# 프로젝트 루트의 infra/로 이동
cd infra
# 환경변수 확인·이미지 준비 후 Web·AI 서비스 기동
./docker/start-all.sh
```

환경 모드를 지정하려면:

```bash
# 개발 모드로 기동 (기본값)
ENVIRONMENT=development ./docker/start-all.sh

# 프로덕션 모드로 기동
ENVIRONMENT=production ./docker/start-all.sh
```

스크립트 동작 요약:
1. 환경변수 파일 확인/생성 (`.env`, `.env.dev`, `.env.prod`)
2. 필요한 이미지 확인/빌드 (`dev` 또는 `prod` 태그). 이미지가 없을 때만 빌드하며, 이미 있으면 재빌드하지 않습니다. 강제 재빌드가 필요하면 `cd docker/ai && ./compose-build.sh` 및 `cd docker/web && ./compose-build.sh`를 각각 실행합니다.
3. 모든 서비스 시작 (AI Server, Web Server)

### 2.3 환경변수 설정

처음 실행 시 환경변수 파일이 자동 생성됩니다. 아래 파일들을 필요에 맞게 수정합니다.

#### Compose 레벨 (`infra/docker/.env`)

레지스트리, 이미지 이름, 포트, 리소스 등 Compose 동작을 바꿀 때 사용합니다. `infra/docker/env.template`을 복사해 `infra/docker/.env`로 두고 필요 시 수정합니다.

환경별 파일:
- `infra/docker/.env.dev` — 개발 모드용
- `infra/docker/.env.prod` — 프로덕션 모드용

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DOCKER_REGISTRY` | harbor.192.168.0.110.nip.io | 이미지 레지스트리 |
| `AI_IMAGE` / `WEB_IMAGE` | deepquest-ai:dev, deepquest-web:dev | 서비스 이미지 (기본값) |
| `AI_PORT` / `WEB_PORT` | 8123, 3000 | 호스트 포트 |
| `NODE_ENV` / `APP_URL` | development, http://deepquest-web:3000 | Web 서비스에 전달 |

#### `infra/docker/ai/.env`

AI 서버(LangGraph)용 환경변수입니다. Gemini 등 외부 API 키를 여기서 설정합니다.

환경별 파일:
- `infra/docker/ai/.env.dev` — 개발 모드용
- `infra/docker/ai/.env.prod` — 프로덕션 모드용

필수 변수:
```bash
# Gemini API 키 (AI 서버에서 사용)
GOOGLE_API_KEY=your-gemini-api-key-here
```

선택 변수:
```bash
# Langsmith 트레이싱 (선택)
LANGSMITH_API_KEY=optional-langsmith-key
# PostgreSQL 연결 정보 (Compose에 DB 포함 시 사용)
POSTGRES_HOST=deepquest-postgres
POSTGRES_PORT=5432
POSTGRES_DB=deepquest
POSTGRES_USER=deepquest
POSTGRES_PASSWORD=change-me
```

#### `infra/docker/web/.env`

Web(Next.js) 서비스용 환경변수입니다. DB 연결, AI 서버 URL, Clerk, Supabase 등 앱 동작에 필요한 값을 설정합니다.

환경별 파일:
- `infra/docker/web/.env.dev` — 개발 모드용
- `infra/docker/web/.env.prod` — 프로덕션 모드용

필수 변수:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname

# AI Server
LANGGRAPH_API_URL=http://deepquest-ai:8123

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
CLERK_WEBHOOK_SIGNING_SECRET=your-clerk-webhook-secret

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

선택 변수:
```bash
# Sentry (Optional)
NEXT_PUBLIC_SENTRY_ENV=development
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ALLOW_EMPTY_DSN=true
```

### 2.4 서비스 재시작

환경변수 수정 후:

```bash
# infra/ 디렉토리에서 실행: 기동 중인 서비스만 재시작
docker-compose -f docker/docker-compose.yml restart

# 모든 서비스 중지 후 다시 기동
./docker/stop-all.sh
./docker/start-all.sh
```

### 2.5 확인

```bash
# 브라우저에서 Web UI 열기
open http://localhost:3000

# AI 서버 OpenAPI 문서 열기
open http://localhost:8123/docs

# 컨테이너 목록 및 상태(Up/Exit) 확인
docker-compose -f docker/docker-compose.yml ps

# 모든 서비스 로그 실시간 출력
docker-compose -f docker/docker-compose.yml logs -f
```

---

## 3. 개별 서비스 관리

### 3.1 PostgreSQL

통합 Compose에는 PostgreSQL이 포함되지 않습니다. 서버 DB를 사용하거나 별도로 구성해야 합니다.

PostgreSQL 이미지 빌드 및 관리:

```bash
# postgres 디렉토리로 이동
cd infra/docker/postgres
# PostgreSQL 이미지 빌드
./compose-build.sh
# 현재 DB 덤프 백업 (컨테이너 실행 중일 때)
./backup.sh
# PostgreSQL 클라이언트로 DB 접속 (컨테이너 실행 중일 때)
./psql.sh
# 백업 파일로 DB 복원
./restore.sh
```

자세한 내용: [postgres/README.md](postgres/README.md)

### 3.2 AI Server

```bash
# AI 서버 디렉토리로 이동
cd infra/docker/ai
# 개발용 이미지 빌드 (기본값)
./compose-build.sh

# 프로덕션용 이미지 빌드
ENVIRONMENT=production ./compose-build.sh

# 통합 스택 실행 시: repo 루트의 infra/에서 아래 실행
./docker/start-all.sh
```

자세한 내용: [ai/README.md](ai/README.md)

### 3.3 Web Server

```bash
# Web 서버 디렉토리로 이동
cd infra/docker/web
# 개발용 이미지 빌드 (기본값)
./compose-build.sh

# 프로덕션용 이미지 빌드
ENVIRONMENT=production ./compose-build.sh

# 통합 스택 실행 시: repo 루트의 infra/에서 아래 실행
./docker/start-all.sh
```

자세한 내용: [web/README.md](web/README.md)

---

## 4. 개발 워크플로우

### 코드 변경 후 재빌드

```bash
# infra/ 디렉토리에서: Compose로 띄운 서비스 전부 중지
./docker/stop-all.sh

# AI 이미지 재빌드 후 infra/로 복귀
cd docker/ai && ./compose-build.sh && cd ../..
# Web 이미지 재빌드 후 infra/로 복귀
cd docker/web && ./compose-build.sh && cd ../..

# 전체 스택 다시 기동
./docker/start-all.sh
```

### 로그 확인

```bash
# Compose에 정의된 모든 서비스 로그를 실시간 출력
docker-compose -f docker/docker-compose.yml logs -f

# 컨테이너 이름으로 Web / AI 로그만 스트리밍
docker logs -f deepquest-web
docker logs -f deepquest-ai

# Compose 서비스 이름(web, ai)으로 해당 서비스 로그만 출력
docker-compose -f docker/docker-compose.yml logs -f web
docker-compose -f docker/docker-compose.yml logs -f ai
```

### 데이터베이스 마이그레이션

Prisma 마이그레이션은 Web 컨테이너에서 실행합니다. 로컬에서 스키마를 보려면 Prisma Studio를 사용합니다.

```bash
# web 컨테이너에서 Prisma 마이그레이션 적용 (컨테이너 종료 후 삭제)
docker-compose -f docker/docker-compose.yml run --rm web pnpm db:migrate:deploy

# 로컬에서 Prisma Studio 실행 (DB 스키마/데이터 확인)
cd web
pnpm db:studio
```

---

## 5. 문제 해결

### 포트 충돌

다른 프로세스가 3000/8123/5432를 쓰고 있으면 Compose 서비스가 기동하지 않을 수 있습니다. 사용 중인 포트와 프로세스를 확인한 뒤 필요 시 종료합니다.

```bash
# 해당 포트를 사용 중인 프로세스 확인 (Web / AI / PostgreSQL)
lsof -i :3000
lsof -i :8123
lsof -i :5432

# 확인된 PID로 프로세스 강제 종료
kill -9 <PID>
```

### 컨테이너 초기화

서비스와 볼륨을 모두 내리고 이미지를 지운 뒤 다시 올리려면 아래 순서를 따릅니다.

```bash
# infra/ 디렉토리에서: 컨테이너 중지 및 Compose 볼륨 삭제
docker-compose -f docker/docker-compose.yml down -v

# 로컬 이미지 삭제 (다음 start-all 시 재빌드됨)
docker rmi deepquest-web:dev deepquest-web:prod
docker rmi deepquest-ai:dev deepquest-ai:prod

# 스택 다시 기동
./docker/start-all.sh
```

### 디스크 공간 정리

미사용 이미지·컨테이너를 지워 디스크를 비우려면:

```bash
# 사용하지 않는 이미지·컨테이너·네트워크 등 전부 삭제 (디스크 확보)
docker system prune -a
```

---

## 6. 모니터링

### 리소스 사용량

실시간 CPU/메모리 사용량을 보려면:

```bash
# 모든 컨테이너 CPU·메모리 사용량 실시간 출력
docker stats

# deepquest-web 컨테이너만 모니터링
docker stats deepquest-web
```

### 헬스체크

서비스가 정상 응답하는지 확인할 때 사용합니다.

```bash
# Compose 서비스별 컨테이너 상태 조회
docker-compose -f docker/docker-compose.yml ps

# Web / AI 서버 헬스 엔드포인트 호출
curl http://localhost:3000/api/health
curl http://localhost:8123/ok

# Docker 헬스체크 결과 문자열만 출력 (healthy / unhealthy 등)
docker inspect deepquest-web --format='{{.State.Health.Status}}'
docker inspect deepquest-ai --format='{{.State.Health.Status}}'
```
