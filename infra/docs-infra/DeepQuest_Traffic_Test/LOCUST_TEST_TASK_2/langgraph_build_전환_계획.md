# LangGraph 프로덕션 이미지 전환 계획 (langgraph build)

**목표:** 현재 커스텀 Dockerfile(`langgraph dev`) 대신 **`langgraph build`** 로 빌드한 이미지를 배포해, Redis·Postgres를 사용하는 공식 프로덕션 서버로 전환한다.

**적용 완료 (2026-02):** Jenkinsfile 전환 완료, K8s 포트 8000 적용, prod 배포 완료.

---

## 1. 현재 빌드 흐름 (전환 후)

| 구분 | 경로 | 내용 |
|------|------|------|
| **Jenkins** | `infra/Jenkinsfile` | `cd ai && uv run langgraph build -t harbor.../ai:${BUILD_TAG}` → Harbor 푸시 |
| **로컬** | `infra/docker/ai/compose-build.sh` | (선택) prod 시 `langgraph build` 또는 기존 Dockerfile |
| **이미지** | Harbor / langgraph build 산출물 | 공식 base + 그래프, **포트 8000**, REDIS_URI/DATABASE_URI 사용 |

---

## 2. 전환 후 흐름 (목표)

| 구분 | 변경 내용 |
|------|------------|
| **빌드 명령** | `langgraph build -t <이미지>:<태그>` (실행 위치: **ai/**) |
| **이미지** | 공식 base(`langchain/langgraph-api`) + 우리 그래프/의존성 주입된 이미지 |
| **CMD** | base 이미지 기본 진입점 (Redis·Postgres 사용하는 프로덕션 서버) |
| **배포** | K8s 배포는 그대로. 이미지만 Harbor에 `langgraph build` 결과물로 교체 |

---

## 3. 전제 조건

- **실행 위치:** `langgraph.json`이 있는 디렉터리에서 실행 → **ai/** 에서 실행.
- **의존성:** `ai/pyproject.toml`에 `langgraph-cli` 포함 여부 확인. (이미 있음)
- **Docker:** `langgraph build`는 내부적으로 Docker로 이미지를 빌드하므로, **빌드 실행 환경에 Docker 사용 가능**해야 함 (Jenkins 에이전트에 Docker 있음).

### 3.1 빌드 에이전트 (SSH 스테이션)

Jenkins는 **라벨 `docker-build`** 인 에이전트에서 빌드를 실행하며, 해당 에이전트는 **SSH로 Jenkins에 연결된 별도 호스트(스테이션)** 이다. 파이프라인에서 실행되는 모든 `sh`/`docker` 명령은 이 SSH 에이전트 호스트에서 수행된다. (로컬에서 에이전트 접속: `ssh station`)

- **확인:** Jenkins → Manage Jenkins → Nodes → `docker-build` 라벨 노드 → "Launch method"가 SSH 인지 확인.
- **langgraph build 전환 시:** 이 SSH 스테이션 호스트에 **Python 3.11+** 와 **uv**(또는 pip + langgraph-cli)가 필요하므로, 전환 전에 아래 "에이전트 사전 점검"을 실행해 두는 것이 좋다.

---

## 4. 변경 계획

### 4.1 Jenkins (`infra/Jenkinsfile`)

**현재 (AI 빌드):**
```groovy
def img = docker.build(
    "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/ai:${env.BUILD_TAG}",
    "-f infra/docker/ai/Dockerfile ."
)
img.push()
img.push("${params.DEPLOY_ENV}")
```

**변경안:**

1. **AI 빌드 단계를 `langgraph build`로 교체**
   - 워크스페이스 루트가 앱 레포이므로 `ai/` 존재.
   - Jenkins 에이전트에 **Python 3.11+** 와 **uv**(또는 pip) 필요.
   - 예시:
     ```groovy
     if (params.BUILD_AI) {
         echo ">> Building AI Server (langgraph build)..."
         sh """
             cd ai && \
             uv run langgraph build -t ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/ai:${env.BUILD_TAG}
         """
         docker.withRegistry("https://${HARBOR_REGISTRY}", HARBOR_CRED) {
             docker.image("${HARBOR_REGISTRY}/${HARBOR_PROJECT}/ai:${env.BUILD_TAG}").push()
             docker.image("${HARBOR_REGISTRY}/${HARBOR_PROJECT}/ai:${env.BUILD_TAG}").push("${params.DEPLOY_ENV}")
         }
     }
     ```
   - 또는 에이전트에 uv가 없으면: **에이전트에 uv 설치** 또는 **pip install langgraph-cli** 후 `langgraph build` 실행.

2. **에이전트 요구사항**
   - Docker (기존과 동일)
   - Python 3.11+ (또는 3.12)
   - uv 또는 pip + langgraph-cli  
   - 없을 경우: “AI 빌드 전용” Docker 이미지(예: `python:3.11` + uv + langgraph-cli)로 `langgraph build`만 실행하는 방식 검토 (이때 Docker 소켓 마운트 필요).

### 4.2 로컬 / compose (`infra/docker/ai/compose-build.sh`)

**옵션 A (권장):** 프로덕션 이미지는 `langgraph build`로만 생성
- 스크립트에서 `ENVIRONMENT=production` 일 때는 `ai/`로 이동 후 `uv run langgraph build -t deepquest-ai:prod` 실행.
- 개발용은 기존처럼 Dockerfile 빌드 유지 (`langgraph dev` 로컬 테스트용).

**옵션 B:** 모두 `langgraph build`로 통일
- dev/prod 모두 `langgraph build`로 빌드 (이미지 하나로 통일).

### 4.3 `ai/langgraph.json` 점검

- **이미 있음:** `dependencies`, `graphs`, `env`, `image_distro`.
- **선택:** 공식 base 이미지 버전 고정이 필요하면 `base_image` 추가 (예: `langchain/langgraph-api:0.2`).
- **선택:** 시스템 패키지 등 추가 시 `dockerfile_lines` 사용 (현재는 불필요해도 됨).

### 4.4 K8s 배포

- **변경 없음.**  
- 이미지만 Harbor의 `ai:${BUILD_TAG}` 로 바뀌고, **REDIS_URI, DATABASE_URI** 는 이미 deployment에 있으므로 그대로 적용됨.
- **N_JOBS_PER_WORKER:** 공식 프로덕션 서버가 환경 변수로 지원하는지 문서/버전 확인 후, 필요하면 deployment env 유지.

### 4.5 포트

- 공식 이미지는 내부 포트 **8000** 일 수 있음.  
- 현재 deployment는 **8123** 기준.  
- **확인:** `langgraph build` 결과 이미지의 EXPOSE/기본 포트가 8000이면, deployment의 `containerPort`와 서비스 포트를 **8123 → 8000** 으로 맞추거나, base 이미지/문서에서 포트 설정 방법 확인.

---

## 5. 작업 순서 제안

### 5.1 SSH 에이전트 사전 점검 (필수)

빌드 에이전트가 **SSH 스테이션**으로 연결되어 있으므로, `langgraph build` 전에 해당 호스트에서 아래를 확인한다.

**방법 1: 에이전트 호스트에 SSH 접속 후 실행**

```bash
python3 --version
which uv && uv --version
docker --version
```

**방법 2: Jenkins에서 1회성 파이프라인** — Agent `docker-build` 선택 후 단일 step:  
`sh 'python3 --version; which uv || true; uv --version 2>/dev/null || true; docker --version'`

**체크리스트:** Python 3.11+ · uv(또는 pip) · Docker. 없으면 에이전트 호스트에 설치하거나 "builder" 이미지 검토.

**확인 완료 (ssh station):** Python 3.12.3, uv 0.9.28, Docker 29.2.0 — 전환에 필요한 환경 갖춤.

---

| 순서 | 작업 | 비고 |
|------|------|------|
| 1 | SSH 에이전트 사전 점검 (위 5.1) | Python, uv, Docker 확인 |
| 2 | 로컬에서 `cd ai && uv run langgraph build -t deepquest-ai:test` 로 빌드 성공 확인 | Docker 설치된 환경에서 실행 |
| 3 | 빌드된 이미지로 `docker run` 후 REDIS_URI, DATABASE_URI 넣어 기동·헬스체크(/ok) 확인 | 포트 8000 vs 8123 확인 |
| 4 | Jenkinsfile에서 AI 빌드만 `langgraph build` + push 로 교체 | 기존 Web 빌드는 유지 |
| 5 | (선택) compose-build.sh에서 prod 시 `langgraph build` 호출하도록 변경 | 로컬 프로덕션 빌드 일치 |
| 6 | K8s deployment에서 포트/헬스체크 경로 필요 시 수정 | 공식 이미지 스펙에 맞춤 |
| 7 | 한 번 배포 후 Redis·Postgres 연결 및 동작 검증 | 로그·메트릭 확인 |

---

## 6. 롤백

- AI 이미지 빌드를 다시 **기존 Dockerfile** 로 되돌리면 현재 동작(`langgraph dev --no-reload`)으로 복귀.
- Jenkinsfile에서 `langgraph build` 블록 제거 후 `docker build -f infra/docker/ai/Dockerfile .` 복원.

---

## 7. 적용 완료 요약 (2026-02)

- **Jenkinsfile:** AI 빌드 → `cd ai && uv run langgraph build -t ...` + Harbor push.
- **K8s base:** AI containerPort/Service/Probes → **8000**, ConfigMap·Secrets `LANGGRAPH_API_URL` → `ai-service:8000`, Web wait-for-ai → 8000.
- **배포:** prod overlay 그대로 사용, 이미지 태그는 Jenkins가 BUILD_TAG로 갱신.

---

## 8. 참고

- LangGraph CLI: `langgraph build`는 `langgraph.json`이 있는 디렉터리에서 실행.
- 공식 문서: [LangGraph CLI - Build](https://docs.langchain.com/langgraph-platform/langgraph-cli), [Custom Dockerfile](https://docs.langchain.com/langgraph-platform/custom-docker).
- Redis·Postgres는 2단계에서 배포·시크릿 반영 완료. `langgraph build` 이미지가 REDIS_URI/DATABASE_URI를 사용해 프로덕션 동작 중.
