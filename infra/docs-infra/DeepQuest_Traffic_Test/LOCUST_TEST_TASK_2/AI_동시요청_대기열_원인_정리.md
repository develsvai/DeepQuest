# AI 파드: 100 동시 요청 시 대기열·저리소스 현상 원인 정리

**현재 단계: iter1**

## 현상 요약

- **100개 요청 동시 전송** 시 AI 파드가 정상적으로 처리하지 못함
- 요청이 **계속 대기열에 걸림**
- **리소스(CPU/메모리) 소모가 매우 적음**

---

## 원인 추론 (대화·클러스터 로그·구성 기반)

### 1. **LangGraph inmem 런타임: 파드당 워커 1개 (주요 원인)**

클러스터 AI 파드 로그에 다음 메시지가 있음:

```text
Starting 1 background workers [langgraph_runtime_inmem.queue]
```

- **LangGraph Server(inmem)** 는 **백그라운드 워커를 기본 1개**만 둠.
- 모든 “실행(run)” 요청은 **in-memory 큐**에 들어가고, **이 워커 1개가 순차적으로** 처리함.
- 따라서 **파드당 동시에 실제로 실행되는 그래프는 1개**에 가깝고, 나머지는 전부 큐에서 대기.

**결과:**

- AI 파드 3개 × 워커 1개 = **동시 처리 가능한 run 수 ≈ 3개**
- 100개 요청 → 약 97개는 큐 대기, 3개만 처리 중
- **CPU/메모리 사용량이 낮게 보이는 이유**: 동시에 일하는 run이 3개뿐이라 리소스를 많이 쓰지 않음.

---

### 2. **HPA가 “리소스 부족”으로 판단하지 못함**

- HPA는 **CPU/메모리 사용률**로 스케일 아웃함 (예: CPU 70%, 메모리 80%).
- 실제 병목은 **워커 수(동시 실행 run 수)**이지, CPU가 100% 나가는 상황이 아님.
- 따라서 CPU 사용률이 낮게 유지되고, HPA는 **스케일을 늘릴 이유를 못 느낌**.
- 파드 수를 늘려도 **파드당 워커가 여전히 1개**이면, 동시 처리량은 “파드 수”에 비례해서만 늘어남 (예: 5파드 → 동시 5 run).

---

### 3. **요청이 한 파드에 몰릴 때**

- 부하가 **한 AI 파드에 몰리면**, 그 파드는 **워커 1개**로만 처리.
- 해당 파드의 큐만 길어지고, 다른 파드는 한가할 수 있음.
- 이 경우에도 “대기열에 걸림 + 전체 리소스는 낮음” 현상이 그대로 나타남.

---

### 4. **RateLimitError가 없는 이유: Self-Throttling**

- 대화 중·클러스터 로그·저장된 로그를 검색한 결과 **RateLimitError는 0건**, 429/rate limit 관련 로그도 없음.
- **해석:** 워커가 1개라 **강제 순차 처리**가 되었기 때문에, Gemini API에는 요청이 천천히(하나씩) 들어가는 것처럼 보임.  
  → RPM을 넘기지 않아 429가 발생하지 않은 것. **겉보기 “운”이 아니라, 구조적 한계(단일 워커) 덕분에 API 할당량 병목이 표면에 드러나지 않은 상태.**
- 따라서 **동시 요청 대기·저리소스 현상의 직접 원인은 “API 할당량/429”가 아니라, 위의 큐·워커 구조**로 보는 것이 타당함.

---

### 5. **API 키(Google Gemini) 할당량: 동시·다수 요청 제한 가능성**

**가능성: 있음.** API 키(실제로는 **프로젝트 단위 할당량**)가 “동시에 여러 요청”을 제한할 수 있음.

- Gemini API 제한은 **요청 수/분(RPM)**, **토큰/분(TPM)**, **요청 수/일(RPD)** 등으로 걸려 있음.
- 할당량은 **API 키가 아닌 Google Cloud 프로젝트 단위**로 적용되며, 같은 프로젝트의 여러 키는 **같은 풀을 공유**함.
- **무료 티어** 예시(모델·시점에 따라 상이): 예: Gemini 2.5 Flash **10 RPM** 등. 100개 요청을 1분 안에 보내면 RPM 초과 → **HTTP 429** 등으로 거절됨.

**정리:** 워커를 늘리면 동시 Gemini 호출이 늘어나 **429가 새 병목**으로 나타날 수 있음. 할당량 확인: [Google AI Studio → Usage / Rate limit](https://aistudio.google.com/usage?timeRange=last-28-days&tab=rate-limit).

---

## 분석 검증: 왜 이 추론이 타당한가?

**1. "Starting 1 background workers" (스모킹 건)**

- 이 로그가 구조를 그대로 보여준다. LangGraph 서버(inmem 모드)는 기본적으로 **단일 컨슈머(Single Consumer)** 패턴으로 동작한다.
- **흐름:** 들어오는 HTTP 요청은 Uvicorn/FastAPI가 async로 받아 **메모리 큐**에 쌓아둔다. 하지만 큐에서 꺼내서 실제로 LLM을 호출하는 **워커는 1명**뿐이다.
- **결과:** 1번 요청이 끝날 때까지 2~100번 요청은 큐에서 대기한다. CPU는 일을 하지 않으므로 사용률이 낮게 나온다.

**2. 겉보기 지표(CPU 낮음)에 속지 않고, 애플리케이션 내부 구조(Worker)를 파고들어 진짜 병목을 찾은 점**

- SRE 관점에서 “CPU 낮음 = 부하 없음”이 아니라, **“처리할 일이 워커 한 명에게만 몰려 있어서 리소스는 놀고 있다”**는 해석이 맞다.

---

## 정리: 왜 “대기열 + 리소스 적게 씀”인가

| 구분 | 내용 |
|------|------|
| **구조** | 파드당 **백그라운드 워커 1개** → 파드당 동시 run ≈ 1개 |
| **동시 처리** | 파드 3개 기준 **동시 처리 ≈ 3 run**, 나머지 97개는 큐 대기 |
| **리소스** | 동시에 일하는 run이 적어서 CPU/메모리 사용률이 낮게 측정됨 |
| **HPA** | CPU/메모리 기반이라 “부족”으로 인식하지 못해 스케일이 잘 안 일어남 |

---

## 해결 솔루션 (Action Plan)

### 워커가 1개만 동작하는 원인 (근본 원인)

**원인:** `langgraph dev` CLI가 서버 기동 시 **환경변수 `N_JOBS_PER_WORKER`를 덮어씀**. `langgraph_api/cli.py` 의 `run_server()` 에서 `--n-jobs-per-worker` 인자를 넘기지 않으면 `n_jobs_per_worker`가 `None` 이고, 이때 `N_JOBS_PER_WORKER=str(1)` 로 고정됨. 컨테이너에 `N_JOBS_PER_WORKER=10` 을 넣어도 진입점이 `langgraph dev` 이므로 CLI가 인자 없이 run_server를 호출하면서 env를 1로 덮어써서 서버는 항상 1만 보게 됨. `langgraph_runtime_inmem/queue.py` 에서는 `concurrency = config.N_JOBS_PER_WORKER` 로 동시 run 수(세마포어)를 쓰고, 로그에 `Starting {concurrency} background workers` 를 남김. **결론:** `langgraph dev` 실행 시 `--n-jobs-per-worker` 인자를 넘겨야 CLI가 1로 덮어쓰지 않음.

### 옵션 1. 환경변수 + CMD 인자 (권장)

1. deployment.yaml 에 `N_JOBS_PER_WORKER=10` env 유지. 2. Dockerfile CMD를 `langgraph dev ... --n-jobs-per-worker ${N_JOBS_PER_WORKER:-10}` 처럼 바꿔 CLI가 해당 값을 인자로 받아 서버에 전달하도록 함. 배포 후 로그에 `Starting 10 background workers` 가 찍히는지 확인.

 **`infra/k8s/base/ai/deployment.yaml`** 의 `env` 섹션에 다음을 추가했다.

```yaml
- name: N_JOBS_PER_WORKER
  value: "10"
```

- **확인:** 배포 후 로그에 `Starting N background workers` 또는 동시 처리 증가가 반영되는지 확인.
- **효과:** 파드당 동시 처리량이 1에 가까운 수준에서 10 수준으로 늘어나, CPU 사용률이 오르고 HPA가 반응할 여지가 생김.
- **주의:** LangGraph/런타임 버전에 따라 `N_JOBS_PER_WORKER`가 “워커당 동시 작업 수”일 수 있고, 워커 개수 자체는 1로 남을 수 있음. 동작이 다르면 `LANGGRAPH_WORKERS` 등 버전별 env 문서 확인.

### 옵션 2. Uvicorn 워커 늘리기 (진입점 확장)

웹 서버 프로세스 자체가 병목이라면, 이미지/엔트리포인트에서 `uvicorn ... --workers 1` → `--workers 4` 등으로 프로세스 수를 늘린다. 프로세스당 백그라운드 워커가 있으면 자연스럽게 처리 경로가 늘어난다.

### 옵션 3. HPA 기준 변경 (SRE적 접근)

CPU가 낮은데 대기열이 길어지는 구조에서는 **CPU 기반 HPA만으로는 한계**가 있다.  
- **이상적:** KEDA 등으로 **HTTP 요청 수** 또는 **큐 길이** 메트릭 기반 스케일링.
- **현실적:** **옵션 1(워커/동시 처리 증가)**를 적용해 **CPU를 실제로 쓰게 만들면**, 기존 CPU 기반 HPA가 의미 있게 동작하기 시작한다.

### Session affinity 적용 (스레드·run 동일 파드 라우팅)

**문제:** Locust에서 thread 생성 후 run 요청 시 **POST /threads/{id}/runs → 404** 다수 발생.  
- LangGraph inmem는 **파드별로** 스레드/상태를 보관. 스레드는 파드 A에서 생성되었는데 run 요청이 파드 B로 가면 해당 파드에 스레드가 없어 404.

**적용:**
- **Web Ingress:** 쿠키 기반 affinity (`affinity: cookie`, `INGRESSCOOKIE`) → 동일 클라이언트가 동일 Web 파드로.
- **AI Service:** `sessionAffinity: ClientIP`, `timeoutSeconds: 10800` → 동일 Web 파드(클라이언트)가 동일 AI 파드로.

**결과:** 동일 클라이언트의 thread 생성과 run 요청이 같은 AI 파드로 가서 404 해소.

---

## 검증 결과 (iter1 — Session affinity 적용 후)

**모니터링 일시:** 2026-02-15 (Session affinity 적용 직후)

| 항목 | affinity 적용 전 | affinity 적용 후 |
|------|------------------|------------------|
| POST .../runs | 404 다수 | **Created run** 정상 처리 |
| 실제 run 실행 | 미실행(404) | **PDF 다운로드 성공**, **Gemini 200 OK**, resume_parser 동작 |
| AI 파드 CPU | 전 파드 2~4m | 한 파드 **63m → 9~15m** (부하 담당), 나머지 2m (트래픽 없음) |

- **Worker stats:** 여전히 `max=1` (파드당 워커 1개). `N_JOBS_PER_WORKER`는 워커 수를 바꾸지 않음.
- **다음 단계:** 부하를 조금씩 올려 **한 파드 로드율 100%**까지 상승시키며 테스트 예정. 스케일링 시 동일 클라이언트가 기존 파드로 유지되는지 여부는 추가 관찰.

---

## 포트폴리오용 요약 (Troubleshooting Log)

> **문제:** 100 VU 부하 테스트 시 요청이 Pending 상태에 머물며 처리가 지연됨. 특이하게도 Pod CPU 사용률은 5% 미만으로 매우 낮았으며, HPA가 동작하지 않음.
>
> **원인 분석:**
> 1. 로그 분석 결과 `Starting 1 background workers` 확인.
> 2. LangGraph `inmem` 런타임이 기본적으로 **단일 워커(Single Thread Queue Consumer)**로 동작함을 파악.
> 3. 요청이 들어와도 내부 큐에 쌓이기만 할 뿐, 실제 처리는 직렬(Serial)로 수행되어 리소스를 점유하지 못함. (Self-Throttling)
> 4. 겉보기 지표(CPU 낮음)에 속지 않고, 애플리케이션 내부 구조(Worker)를 파고들어 진짜 병목을 특정함.
>
> **해결:**
> - AI 파드의 환경변수 튜닝 (`N_JOBS_PER_WORKER` 상향)을 통해 파드당 동시 처리량 확보.
> - (선택) Uvicorn 워커 증설 또는 HPA 메트릭 재검토.
> - 적용 후 CPU 사용률이 정상적으로 상승하며 HPA가 트리거되는지 확인.

---

*작성: 대화 내용·클러스터 로그·infra/k8s 구성·LangGraph 공식 env 문서 기반.*
