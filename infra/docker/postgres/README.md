**업데이트 날짜:** 2026-02-08  
**작성자:** DeepQuest Team Haru2

---

# PostgreSQL Docker Setup

Deep Quest 프로젝트용 PostgreSQL 이미지 빌드 및 유틸 스크립트입니다.  
**통합 Compose(`docker-compose.yml`)에는 PostgreSQL이 포함되어 있지 않습니다.** 서버(외부) DB를 쓰는 구성이면 이 이미지는 Harbor/K8s용으로만 빌드합니다.

## 목차

- [1. 빠른 시작](#1-빠른-시작)
- [2. 파일 구조](#2-파일-구조)
- [3. 스크립트 사용법](#3-스크립트-사용법)
  - [3.1 빌드](#31-빌드)
  - [3.2 psql 접속](#32-psql-접속)
  - [3.3 백업](#33-백업)
  - [3.4 복원](#34-복원)
- [4. 연결 정보](#4-연결-정보)
- [5. 유용한 명령어](#5-유용한-명령어)
  - [5.1 psql 콘솔](#51-psql-콘솔)
  - [5.2 Docker 명령어](#52-docker-명령어)
- [6. 문제 해결](#6-문제-해결)
- [7. 설정 파일](#7-설정-파일)

---

## 1. 빠른 시작

환경변수 설정 후 이미지를 빌드하고, 필요 시 단독 컨테이너로 실행해 접속을 확인합니다. 실행 위치는 `docker/postgres`(또는 `infra/docker/postgres`)입니다.

```bash
# env.template을 복사한 뒤 비밀번호 등 실제 값으로 수정
cp env.template .env

# PostgreSQL 이미지 빌드 (Compose/Harbor/K8s용)
./compose-build.sh

# 단독 실행 시: 백그라운드로 컨테이너 기동 (필요 시에만)
docker run -d --name deepquest-postgres -p 5432:5432 --env-file .env deepquest-postgres:latest

# 컨테이너 실행 중일 때 psql로 접속 테스트
./psql.sh
```

---

## 2. 파일 구조

이미지 정의, 설정, 초기화 SQL, 백업·복원·접속 스크립트가 한 디렉터리에 있습니다.

```
docker/postgres/
├── Dockerfile              # PostgreSQL 이미지 정의
├── postgresql.conf         # PostgreSQL 설정
├── healthcheck.sh          # 헬스체크 스크립트
├── env.template            # 환경변수 템플릿
├── init/                   # 초기화 스크립트 (최초 1회 적용)
│   ├── 01-create-extensions.sql
│   └── 02-init-schema.sql
├── compose-build.sh        # Compose용 이미지 빌드 스크립트
├── backup.sh               # 백업 스크립트
├── restore.sh              # 복원 스크립트
└── psql.sh                 # psql 접속 스크립트
```

---

## 3. 스크립트 사용법

### 3.1 빌드

Compose·Harbor·K8s에서 쓸 PostgreSQL 이미지를 만듭니다.

```bash
# deepquest-postgres 이미지 빌드
./compose-build.sh
```

### 3.2 psql 접속

컨테이너가 떠 있는 상태에서 `.env`의 연결 정보로 psql에 접속할 때 사용합니다.

```bash
# .env 기반으로 컨테이너 내 psql 실행 (대화형)
./psql.sh
```

### 3.3 백업

현재 DB를 덤프해 `backups/` 아래에 SQL 파일로 저장합니다. 컨테이너 실행 중일 때만 실행합니다.

```bash
# 전체 DB 덤프 → backups/deepquest_YYYYMMDD_HHMMSS.sql 생성
./backup.sh
```

### 3.4 복원

이전에 백업한 SQL 파일로 DB를 덮어씁니다. 데이터가 초기화되므로 필요 시에만 사용합니다.

```bash
# 지정한 백업 파일로 DB 복원 (파일 경로는 실제 백업 파일로 변경)
./restore.sh backups/deepquest_20250119_120000.sql
```

---

## 4. 연결 정보

단독 실행 시 호스트에서 접속할 때 쓰는 값입니다. 비밀번호는 `.env`에 설정한 값을 사용합니다.

- **Host**: localhost
- **Port**: 5432
- **Database**: deepquest
- **User**: deepquest
- **Password**: (.env 파일 참조)

연결 문자열 (Prisma·앱 설정 시):

```
postgresql://deepquest:your-password@localhost:5432/deepquest
```

---

## 5. 유용한 명령어

### 5.1 psql 콘솔

psql 접속 후 메타 명령과 쿼리로 DB·테이블·확장·연결 정보를 확인할 때 사용합니다.

```sql
-- 데이터베이스 목록 조회
\l

-- 현재 스키마의 테이블 목록
\dt

-- 설치된 확장 목록
\dx

-- 현재 연결 DB·유저·호스트 등 출력
\conninfo

-- db_size 뷰가 있으면 DB 크기 조회
SELECT * FROM db_size;
```

### 5.2 Docker 명령어

컨테이너 로그·상태·헬스체크를 확인할 때 사용합니다.

```bash
# PostgreSQL 컨테이너 로그 전체 출력
docker logs deepquest-postgres

# 로그 실시간 스트리밍
docker logs -f deepquest-postgres

# deepquest-postgres 컨테이너만 필터해 상태 확인
docker ps | grep deepquest-postgres

# 헬스체크 결과 블록만 출력
docker inspect deepquest-postgres | grep -A 10 Health
```

---

## 6. 문제 해결

### 포트 충돌

5432 포트를 다른 프로세스가 쓰고 있으면 PostgreSQL이 기동하지 않습니다. 사용 중인 프로세스를 확인한 뒤 필요 시 종료합니다.

```bash
# 5432 포트를 사용 중인 프로세스 확인
lsof -i :5432

# 확인된 PID로 프로세스 강제 종료
kill -9 <PID>
```

### 데이터 초기화

볼륨과 컨테이너를 지우고 처음부터 다시 띄울 때 사용합니다. **모든 데이터가 삭제됩니다.**

```bash
# 컨테이너 중지
docker stop deepquest-postgres
# 컨테이너 삭제
docker rm deepquest-postgres
# PostgreSQL 데이터 볼륨 삭제 (실제 볼륨 이름으로 변경)
docker volume rm <postgres_volume_name>
# 이미지로 컨테이너 다시 실행 (docker run -d ... 등)
```

### 권한 오류

스크립트 실행 시 `Permission denied`가 나오면 실행 권한을 부여합니다.

```bash
# 현재 디렉터리의 .sh 파일에 실행 권한 부여
chmod +x *.sh
```

---

## 7. 설정 파일

### postgresql.conf

PostgreSQL 서버 설정을 바꾸려면 `postgresql.conf`를 수정한 뒤 **이미지 재빌드**와 **컨테이너 재시작**이 필요합니다. 설정 파일은 이미지에 포함됩니다.

### 초기화 스크립트

`init/` 디렉터리의 SQL 파일은 **컨테이너 최초 기동 시에만** 순서대로 적용됩니다.  
이후 SQL을 수정해 반영하려면 데이터를 초기화(볼륨 삭제 후 재기동)해야 합니다.
