**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# Deep Quest AI Server - Docker Setup

LangGraph 기반 AI 서버를 Docker 컨테이너로 실행하기 위한 설정 파일과 사용 방법입니다.  
`docker/ai/.env`는 리포지토리에 포함되지 않으므로, `env.template`을 복사하거나 사내 공유본을 두고 실제 값으로 채워 사용합니다.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. 빠른 시작](#2-빠른-시작)
  - [2.1 환경변수 준비](#21-환경변수-준비)
  - [2.2 이미지 빌드](#22-이미지-빌드)
  - [2.3 통합 스택 시작 (AI + Web)](#23-통합-스택-시작-ai--web)
  - [2.4 확인](#24-확인)
- [3. 개발 환경](#3-개발-환경)
  - [3.1 Hot Reload](#31-hot-reload)
  - [3.2 디버깅](#32-디버깅)
- [4. 프로덕션 배포](#4-프로덕션-배포)
  - [4.1 프로덕션 이미지 빌드](#41-프로덕션-이미지-빌드)
  - [4.2 Redis 추가](#42-redis-추가)
  - [4.3 환경변수 설정](#43-환경변수-설정)
  - [4.4 통합 스택 프로덕션 실행](#44-통합-스택-프로덕션-실행)
- [5. API 엔드포인트](#5-api-엔드포인트)
- [6. 문제 해결](#6-문제-해결)
- [7. 로그](#7-로그)
- [8. 보안](#8-보안)
- [9. 참고 자료](#9-참고-자료)

---

## 1. 파일 구조

AI 서버 이미지 빌드와 Compose 연동에 쓰는 파일들입니다. `ENVIRONMENT` 빌드 인자로 dev/prod를 구분합니다.

```
docker/ai/
├── Dockerfile          # 단일 이미지 (ENVIRONMENT 빌드 인자로 dev/prod 구분)
├── compose-build.sh    # Compose용 이미지 빌드 스크립트
├── env.template        # 환경변수 템플릿
└── README.md           # 이 파일
```

---

## 2. 빠른 시작

### 2.1 환경변수 준비

AI 서버 전용 환경변수는 `docker/ai/.env`에 둡니다. API 키 등은 이 파일에만 두고 Git에는 넣지 않습니다.

```bash
# 템플릿을 복사한 뒤 실제 값으로 수정
cp docker/ai/env.template docker/ai/.env
# .env에 GOOGLE_API_KEY 등 필수 값 설정
```

### 2.2 이미지 빌드

Compose에서 사용할 이미지를 빌드합니다. `compose-build.sh`는 **모노레포 루트를 빌드 컨텍스트**로 사용하므로, `infra/docker/ai`에서 실행하면 스크립트가 자동으로 루트로 이동해 빌드합니다. 기본값은 개발 모드(ENVIRONMENT=development, 태그 dev)입니다.

```bash
# infra/docker/ai에서 실행 (스크립트가 모노레포 루트로 이동해 빌드)
cd infra/docker/ai
# 개발용 이미지 빌드 (기본): .env.dev 사용, deepquest-ai:dev 태그
./compose-build.sh
```

### 2.3 통합 스택 시작 (AI + Web)

AI만이 아니라 Web과 함께 띄울 때는 `infra` 또는 `infra/docker`에서 통합 Compose를 사용합니다.

```bash
# 통합 Compose가 있는 디렉토리로 이동 (infra 또는 infra/docker)
cd infra
# 또는 cd infra/docker
# 환경변수·이미지 확인 후 AI·Web 서비스 기동
./docker/start-all.sh
```

### 2.4 확인

서비스 기동 후 헬스·API 문서·로그로 동작을 확인합니다.

```bash
# AI 서버 헬스 엔드포인트 호출
curl http://localhost:8123/ok

# OpenAPI 문서 브라우저에서 열기
open http://localhost:8123/docs

# AI 컨테이너 로그 실시간 출력
docker logs -f deepquest-ai
```

---

## 3. 개발 환경

### 3.1 Hot Reload

개발 모드에서는 소스가 컨테이너에 마운트되어 코드 변경 시 자동 반영됩니다. 별도 이미지 재빌드 없이 빠르게 확인할 수 있습니다.

- `ai/src` 디렉토리가 컨테이너에 마운트됨
- 코드 변경 시 서버가 자동으로 재시작됨

### 3.2 디버깅

컨테이너 안으로 들어가거나 로그·패키지 목록을 볼 때 사용합니다.

```bash
# AI 컨테이너 셸 접속 (대화형)
docker exec -it deepquest-ai bash

# AI 컨테이너 로그 실시간 확인
docker logs -f deepquest-ai

# 컨테이너 내부에 설치된 Python 패키지 목록 조회
docker exec deepquest-ai pip list
```

---

## 4. 프로덕션 배포

### 4.1 프로덕션 이미지 빌드

프로덕션용 이미지도 **같은 Dockerfile**로 빌드합니다. `ENVIRONMENT=production`으로 스크립트를 실행하면 `.env.prod`를 `.env`로 복사하고, 빌드 시 `--build-arg ENVIRONMENT=production`이 전달되며 `deepquest-ai:prod` 태그가 붙습니다.

```bash
# infra/docker/ai에서 실행: 프로덕션 이미지 빌드 (.env.prod 사용, --no-cache)
ENVIRONMENT=production ./compose-build.sh
```

### 4.2 Redis 추가 

프로덕션에서 캐시·세션 등으로 Redis를 쓸 경우 Compose에 Redis 서비스를 추가합니다.

```yaml
# docker-compose에 추가할 Redis 서비스 예시
services:
  redis:
    image: redis:7-alpine
    container_name: deepquest-redis
    ports:
      - "6379:6379"
```

### 4.3 환경변수 설정

프로덕션에서는 아래 변수를 모두 설정합니다. DB·Redis 주소와 API 키를 실제 값으로 바꿉니다.

```bash
# 실행 모드
NODE_ENV=production

# AI 서버 필수·선택 키
GOOGLE_API_KEY=your-google-api-key
LANGSMITH_API_KEY=optional-langsmith-key

# PostgreSQL 연결 정보
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=deepquest
POSTGRES_USER=deepquest
POSTGRES_PASSWORD=strong-password

# Redis 연결 정보 (프로덕션에서 Redis 사용 시)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=
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

## 5. API 엔드포인트

### LangGraph Graphs

1. **JD to Text**: 채용공고 URL에서 텍스트 추출
2. **JD Structuring**: 채용공고 구조화
3. **Resume Parser**: 이력서 파싱
4. **Question Gen**: 면접 질문 생성
5. **Question Feedback Gen**: 답변 피드백 생성

### Health Check

```bash
# 서버 정상 여부 확인
GET http://localhost:8123/ok
```

---

## 6. 문제 해결

### 포트 충돌

8123 포트를 다른 프로세스가 쓰고 있으면 AI 서버가 기동하지 않습니다. 사용 중인 프로세스를 확인한 뒤 필요 시 종료합니다.

```bash
# 8123 포트를 사용 중인 PID 조회 후 해당 프로세스 강제 종료
lsof -ti:8123 | xargs kill -9
```

### 컨테이너 재시작

설정 변경 후 컨테이너만 다시 띄울 때 사용합니다.

```bash
# AI 컨테이너만 재시작
docker restart deepquest-ai
```

### 완전히 재설정

이미지·볼륨을 지우고 처음부터 다시 빌드·기동할 때 사용합니다.

```bash
# infra 또는 infra/docker로 이동
cd infra
# Compose로 띄운 서비스 중지
docker-compose -f docker/docker-compose.yml down
# AI 관련 볼륨 삭제 (없으면 무시)
docker volume rm docker_ai_data docker_ai_logs 2>/dev/null || true
# 로컬 AI 이미지 삭제
docker rmi deepquest-ai:dev
# AI 이미지 재빌드 후 통합 스택 기동
./docker/ai/compose-build.sh
./docker/start-all.sh
```

---

## 7. 로그

로그는 컨테이너 내부 경로와 Docker 볼륨에 쌓입니다. 디버깅·이슈 분석 시 아래 경로와 명령을 사용합니다.

- **컨테이너 내부**: `/app/logs`
- **Docker 볼륨**: `ai_logs`

```bash
# 컨테이너 내부 로그 디렉토리 목록 확인
docker exec deepquest-ai ls -la /app/logs

# 컨테이너 로그를 호스트 현재 디렉토리로 복사
docker cp deepquest-ai:/app/logs ./logs
```

---

## 8. 보안

프로덕션 배포 전 점검할 항목입니다. API 키와 DB 비밀번호는 환경변수나 Secrets Manager로 관리하고, Git에는 넣지 않습니다.

- [ ] `.env` 파일을 Git에 커밋하지 않기
- [ ] API 키를 환경변수나 Secrets Manager에서 관리
- [ ] Non-root 사용자로 실행 (Dockerfile에서 appuser 생성)
- [ ] 네트워크 격리 (Docker network)
- [ ] 리소스 제한 설정 (CPU, Memory)

---

## 9. 참고 자료

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph Server](https://langchain-ai.github.io/langgraph/cloud/)
- [Google Gemini API](https://ai.google.dev/)
