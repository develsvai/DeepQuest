# N_JOBS_PER_WORKER=40인데 3개만 동작한 원인 분석

**작성일:** 2026-02-18  
**상태:** 원인 확인 완료

---

## 문제 상황

- **설정값:** `N_JOBS_PER_WORKER=40` (환경 변수 확인됨)
- **Dockerfile CMD:** `langgraph dev --n-jobs-per-worker ${N_JOBS_PER_WORKER:-10}`
- **실제 동작:** 3개의 워커만 동시 처리 (`thread_name=asyncio_3` 기준)

---

## 핵심 원인

### 1. `N_JOBS_PER_WORKER`의 의미

**문서 확인 결과:**
- `AI_동시요청_대기열_원인_정리.md`에 명시:
  > "LangGraph/런타임 버전에 따라 `N_JOBS_PER_WORKER`가 **워커당 동시 작업 수**일 수 있고, **워커 개수 자체는 1로 남을 수 있음**"

**즉:**
- `N_JOBS_PER_WORKER=40`은 **워커 수가 아니라 워커당 동시 작업 수**를 의미할 수 있음
- 실제 워커는 **1개**이고, 그 워커가 동시에 처리할 수 있는 작업 수가 40개
- 하지만 실제로는 **3개만 동시 처리**되고 있음

---

### 2. 실제 동작 확인

**로그 분석:**
- 모든 로그에서 `thread_name=asyncio_3` 형태로 나타남
- 이것은 실제로 **3개의 워커**가 동작하고 있음을 의미할 수 있음
- 또는 asyncio 이벤트 루프의 스레드 이름일 수도 있음

**환경 변수 확인:**
```bash
kubectl get pod ai-server-69867fbdcf-xvp4x -n deep-quest -o jsonpath='{.spec.containers[0].env[?(@.name=="N_JOBS_PER_WORKER")]}'
# 결과: {"name":"N_JOBS_PER_WORKER","value":"40"}
```

**Dockerfile 확인:**
```dockerfile
CMD ["sh", "-c", "exec langgraph dev --host 0.0.0.0 --port 8123 --allow-blocking --n-jobs-per-worker ${N_JOBS_PER_WORKER:-10}"]
```

---

### 3. 가능한 원인

#### 원인 1: LangGraph 버전별 동작 차이 (가능성 높음)

- LangGraph `inmem` 런타임은 기본적으로 **워커 1개**로 동작
- `N_JOBS_PER_WORKER`는 워커당 동시 작업 수를 의미
- 하지만 실제로는 **내부 제약**으로 인해 3개만 동시 처리 가능

**확인 필요:**
- LangGraph 공식 문서에서 `N_JOBS_PER_WORKER`의 정확한 의미 확인
- `langgraph-runtime-inmem` 버전별 동작 차이 확인

#### 원인 2: 리소스 제약

- CPU/메모리 제약으로 인해 실제로는 3개만 동시 처리 가능
- `N_JOBS_PER_WORKER=40`이지만 시스템이 3개만 허용

**확인 필요:**
- 파드 리소스 제한 확인
- 실제 CPU/메모리 사용량 확인

#### 원인 3: 다른 설정이 우선

- LangGraph 내부 설정이 `N_JOBS_PER_WORKER`를 덮어씀
- 또는 다른 환경 변수가 우선 적용됨

**확인 필요:**
- LangGraph 시작 로그에서 실제 설정값 확인
- 다른 환경 변수 확인

---

## 해결 방안

### 1. LangGraph 공식 문서 확인

- `N_JOBS_PER_WORKER`의 정확한 의미 확인
- 워커 수를 늘리는 방법 확인 (`LANGGRAPH_WORKERS` 등)

### 2. 실제 워커 수 확인

- LangGraph 시작 로그에서 `Starting N background workers` 확인
- 실제 동시 처리되는 워커 수 확인

### 3. 설정 조정

**옵션 A: 워커 수 증가 (가능한 경우)**
- `LANGGRAPH_WORKERS` 환경 변수 추가
- 또는 다른 설정으로 워커 수 증가

**옵션 B: 파드 수 증가**
- HPA 설정 조정
- 파드 수를 늘려 전체 동시 처리량 증가

**옵션 C: `N_JOBS_PER_WORKER` 의미 재확인**
- 실제로 워커당 동시 작업 수라면, 현재 동작이 정상일 수 있음
- 하지만 3개만 동작하는 것은 이상함

---

## 다음 단계

1. **LangGraph 시작 로그 확인**
   ```bash
   kubectl logs ai-server-69867fbdcf-xvp4x -n deep-quest -c ai | grep -E "Starting.*workers|n-jobs-per-worker|concurrency"
   ```

2. **LangGraph 공식 문서 확인**
   - `N_JOBS_PER_WORKER`의 정확한 의미
   - 워커 수를 늘리는 방법

3. **실제 동시 처리량 테스트**
   - 부하 테스트로 실제 동시 처리량 확인
   - `thread_name` 패턴 분석

---

## 참고 문서

- [AI_동시요청_대기열_원인_정리.md](./AI_동시요청_대기열_원인_정리.md)
- [Soft_Failure_트러블슈팅.md](./Soft_Failure_트러블슈팅.md)
- [1000_RPM_인프라_구성_제안.md](./1000_RPM_인프라_구성_제안.md)

---

**결론:** `N_JOBS_PER_WORKER=40`은 워커 수가 아니라 워커당 동시 작업 수를 의미할 수 있으며, 실제 워커는 1개이고 그 워커가 3개만 동시 처리하고 있는 것으로 보입니다. LangGraph 공식 문서를 확인하여 정확한 의미와 워커 수를 늘리는 방법을 확인해야 합니다.
