**업데이트 날짜:** 2026-02-15  
**작성자:** DeepQuest Team Haru2

---

# Locust 실행 가이드 (Task 2)

Task 2 부하 테스트용 Locust 설치·실행 방법.

## 설치

```bash
cd infra/docs-infra/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2
pip install -r requirements.txt
# 또는
uv pip install -r requirements.txt
```

## 이력서 PDF (기본: 홍용재_이력서.docx.pdf)

**기본 동작:** Locust는 `--host` 기준으로 **`/samples/홍용재_이력서.docx.pdf`** URL을 사용합니다.  
이 파일은 `web/public/samples/` 에 두었으므로, Next(웹) 서버가 서빙하고 AI 파드가 같은 호스트로 다운로드할 수 있습니다.

- **배포 후** `https://<Deep Quest 도메인>/samples/홍용재_이력서.docx.pdf` 가 200으로 열리면 별도 설정 없이 Locust만 돌리면 됩니다.
- 다른 PDF를 쓰려면: `export DEEPQUEST_RESUME_PDF_URL=https://...` 로 URL 지정.

## 실행

**웹 UI (권장)**

```bash
locust -f locustfile.py --host=https://deepquest.192.168.0.110.nip.io
```

브라우저에서 `http://localhost:8089` 접속 후 사용자 수·Ramp-up 설정 후 Start.

**헤드리스**

```bash
locust -f locustfile.py --host=https://deepquest.192.168.0.110.nip.io \
  --headless -u 50 -r 5 -t 3m
```

- `-u 50`: 50 사용자
- `-r 5`: 초당 5명 spawn
- `-t 3m`: 3분 유지

## User 클래스 설명

| 클래스 | 역할 |
|--------|------|
| **AiUser** | `POST /api/langgraph/threads` 로 스레드 생성 후 `POST .../threads/{id}/runs` (assistant_id=resume_parser) 호출. AI 서버 부하 발생. |
| **WebUser** | `GET /api/health` 반복. 웹 서버 지연/Timeout 관측용. |

`--host` 는 실제 Deep Quest 접속 URL로 변경 (예: `https://deepquest.192.168.0.110.nip.io`). nip.io 사용 시 자동으로 TLS 검증 스킵.

## 트러블슈팅

### InsecureRequestWarning이 계속 나올 때

`locustfile.py` 상단에 `urllib3.disable_warnings(InsecureRequestWarning)` 가 들어가 있는지 확인. 없으면 최신 버전으로 업데이트하거나, 실행 시 `PYTHONWARNINGS=ignore::urllib3.exceptions.InsecureRequestWarning locust ...` 로 실행.

### AI 파드 로그로 원인 확인 (클러스터에서 직접 확인)

**실제 로그 확인 예 (클러스터 접속 후):**

```bash
kubectl logs -l app.kubernetes.io/component=ai -n deep-quest -c ai --tail=400 | grep -E "resume_parsing 입력|Queue stats|Worker stats|run_queue_ms|allow-blocking"
```

**로그로 보이는 대기 원인 요약 (실제 클러스터 로그 기준):**

1. **파드당 워커 1개**  
   `Worker stats ... max=1` → 한 번에 **run 1개만** 처리. 그동안 들어온 run은 큐에서 대기 (`run_queue_ms` 500~900ms 등).

2. **블로킹 I/O 경고**  
   `--allow-blocking` 사용 시 한 run의 동기 I/O(PDF 다운로드, LLM 호출 등)가 **공용 이벤트 루프를 잡아** 다른 run을 지연시킬 수 있음.  
   → **조치:** AI ConfigMap에 `BG_JOB_ISOLATED_LOOPS=true` 설정 후 배포하면 run별 이벤트 루프 격리로 완화됨 (`infra/k8s/base/configmap.yaml` 반영됨).

3. **경험 목록 전달 여부**  
   배포된 이미지에 `resume_parsing 입력` 로그가 포함되어 있으면, 해당 로그에서 `experience_names_to_analyze 개수`로 전달 여부 확인 가능.

```bash
kubectl logs -l app.kubernetes.io/component=ai -n deep-quest -c ai --tail=200 | grep "resume_parsing 입력"
```

- **experience_names_to_analyze 개수=0** 이면 웹에서 경험 목록이 전달되지 않은 것입니다. (폼 제출 시 experienceNames가 비어 있거나, tRPC/LangGraph 전달 경로 확인 필요.)
- **개수≥1, preview=[...]** 이면 경험 목록은 정상 전달된 것이므로, 대기 원인은 다른 쪽(파드 부하, PDF 다운로드, LLM 지연 등)을 봐야 합니다.

전체 로그(에러·재시도 포함):

```bash
kubectl logs -l app.kubernetes.io/component=ai -n deep-quest -c ai --tail=500 -f
```

### AI 파드 먹통 / 대기열 비우기

기존 작업이 쌓여 AI가 응답하지 않을 때, **AI 디플로이먼트만 재시작**하면 파드가 새로 뜨면서 메모리·캐시가 비워집니다 (emptyDir 사용이라 대기열 미유지).

```bash
kubectl rollout restart deployment/ai-server -n deep-quest
kubectl rollout status deployment/ai-server -n deep-quest
```

- HPA가 있으면 재시작 후에도 minReplicas 수만큼 파드가 유지됩니다.
- 더 강하게 비우려면: `kubectl scale deployment/ai-server -n deep-quest --replicas=0` 후 잠시 대기했다가 `kubectl scale deployment/ai-server -n deep-quest --replicas=2` (또는 HPA에 맡기려면 scale 하지 말고 그냥 rollout restart만 사용).

### PDFDownloadError 404 (이력서가 없어서 에러)

- **원인:** 기본 URL은 Supabase 샘플 PDF. 해당 파일이 없거나 권한이 없으면 404.
- **조치:** `DEEPQUEST_RESUME_PDF_URL`에 접근 가능한 PDF URL 지정 (예: 다른 Supabase 공개 URL 또는 내부에서 접근 가능한 URL).

### 50명인데 CPU가 거의 안 올라가고 평온할 때

1. **실패율(11% 등)** — 실패한 요청은 파싱 전에 끝나서 CPU를 거의 안 씀. 이력서 URL이 200인지, Locust FAILURES 탭에서 원인 확인.
2. **부하 강화** — 사용자 수를 100명으로 올리거나, `export DEEPQUEST_LOCUST_FASTER=1` 후 재실행하면 대기 시간이 짧아져 RPS·CPU가 더 올라감.
3. **Grafana** — "Pod CPU (cores) — AI/Web 모두" 패널에서 **ai-server** 곡선만 보면 됨. 웹만 보면 부하가 적어 보일 수 있음.

### N_JOBS_PER_WORKER=4 동시 처리 여부 확인

ConfigMap에 `N_JOBS_PER_WORKER: "4"` 를 넣었어도, **실제 로그에는 `max=1`, "Starting 1 background workers" 만 보일 수 있음.**

- **확인한 내용 (클러스터 기준):**
  - 파드 env: `kubectl exec <ai-pod> -n deep-quest -c ai -- printenv N_JOBS_PER_WORKER` → **4** 로 설정됨.
  - 로그: `Worker stats ... max=1`, `n_running=0|1` 만 존재. `n_running=2` 이상인 구간 없음.
  - 이미지: `langgraph-api 0.7.22`, `langgraph-runtime-inmem 0.23.2` (로컬보다 높은 버전).
- **정리:** 현재 이미지의 inmem 런타임(0.23.x)은 **스케줄러 태스크 1개**만 띄우고, 로그상으로도 동시 run 수가 1로만 보임. `N_JOBS_PER_WORKER` 는 LangSmith/Redis 배포용 문서에 나오는 옵션이며, inmem 큐에서는 동작이 다르거나 미적용일 수 있음.
- **동시 처리 늘리기:** 파드당 동시 run 을 늘리기보다는 **HPA로 AI 파드 수를 늘려** (minReplicas·CPU 목표 등) 여러 파드에서 병렬 처리하는 방식이 유효함. 리소스 사용률은 파드 수 × (파드당 1 run) 으로 올라감.

### 리소스는 쓰는데 CPU 로드률이 반응이 없을 때

1. **어디 CPU를 보는지** — 반드시 **AI 파드(ai-server)** CPU를 봐야 함. Grafana "Pod CPU (cores) — AI/Web 모두" 패널 확인.
2. **이력서 URL** — 404면 파싱까지 안 가서 CPU가 안 올라감. `DEEPQUEST_RESUME_PDF_URL` 설정 여부 확인.
3. **메트릭 지연** — Prometheus 스크래프 주기(15~30초)만큼 지연될 수 있음. 1~2분 부하 후 다시 확인.
