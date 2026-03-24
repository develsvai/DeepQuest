**업데이트 날짜:** 2026-02-19
**작성자:** DeepQuest Team Haru2

---

# Locust 부하 테스트 중 Soft Failure 현상 트러블슈팅

## 목차

1. [현상 요약](#1-현상-요약)
2. [관찰된 데이터](#2-관찰된-데이터)
3. [원인 분석](#3-원인-분석)
4. [타임아웃 설정 확인](#4-타임아웃-설정-확인)
5. [가능한 원인 시나리오](#5-가능한-원인-시나리오)
6. [권장 조치 사항](#6-권장-조치-사항)
7. [참고 자료](#7-참고-자료)

---

## 1. 현상 요약

**테스트 조건:**
- Locust: 50명 사용자, RPS 85-90, 테스트 시간 약 2분
- 테스트 시간대: UTC-8 기준 08:00~08:45 (2026-02-19)

**주요 현상:**
- Locust는 7,680개 요청을 성공으로 보고했으나, 실제 AI 파드에서 처리된 run_id는 5개뿐
- 가짜 성공률: 99.93% (7,675개 요청이 실제 처리가 안 됨)
- 평균 응답 시간: 10-15ms (비정상적으로 빠름, LLM 처리는 최소 2-30초 필요)
- Locust Failures/s: 20-22개 보고, 하지만 AI 파드 로그에는 429/504 오류 없음
- 모니터링 시스템에서는 504 GatewayTimeout 오류 여러 번 발생 확인

**핵심 문제:**
요청이 성공으로 보고되지만 실제로는 처리되지 않는 "Soft Failure" 현상이 발생하고 있음.

---

## 2. 관찰된 데이터

### 2.1 Locust 그래프 데이터

| 항목 | 값 |
|------|-----|
| 총 전송 요청 | 10,200개 (85 RPS × 120초) |
| 총 실패 보고 | 2,520개 (21 failures/s) |
| 총 성공 보고 | 7,680개 |
| 평균 응답 시간 | 10-15ms (안정화 구간) |
| 사용자 수 | 50명 |

### 2.2 실제 AI 파드 로그 (최근 1시간)

| 항목 | 값 |
|------|-----|
| 처리된 run_id (고유) | 5개 |
| 생성된 thread (고유) | 6-8개 |
| PDF 다운로드 성공 | 3개 |
| Gemini API 성공 호출 | 2개 |
| 504 오류 로그 | 거의 없음 (1개, 하지만 실제로는 200 OK) |

### 2.3 모니터링 시스템 데이터 (외부 관점)

| 항목 | 값 |
|------|-----|
| 504 GatewayTimeout 오류 | 여러 번 발생 (08:00~08:31) |
| Gemini 2.5 Flash 요청 수 | 0~15개 변동 |
| 08:28~08:32 구간 | 요청 급감 (504 오류와 일치) |

### 2.4 불일치 분석

| 비교 항목 | Locust 보고 | 실제 처리 | 차이 |
|-----------|-------------|-----------|------|
| 성공 요청 | 7,680개 | 5개 | 7,675개 (99.93% 가짜 성공) |
| 실패 요청 | 2,520개 | 0개 (429/504 없음) | 실패가 웹 서버/네트워크 단계에서 발생 |
| 응답 시간 | 10-15ms | LLM 처리 2-30초 필요 | 실제 처리가 아님 |

---

## 3. 원인 분석

### 3.1 Soft Failure 현상

**정의:**
서버가 HTTP 200 OK를 반환하지만 실제로는 요청이 처리되지 않거나, 중간에 실패한 경우를 의미함.

**현재 상황:**
- Locust는 200 OK 응답을 받아 성공으로 집계
- 하지만 실제 AI 처리는 5개뿐
- 응답 시간이 10-15ms로 비정상적으로 빠름 (LLM 처리는 최소 2-30초 필요)

### 3.2 요청 흐름 분석

```
Locust → Ingress (Nginx) → Web 서버 → AI 서버 (LangGraph)
```

**각 단계별 확인:**
1. **Locust → Ingress**: 요청 전송 확인 (10,200개)
2. **Ingress → Web 서버**: 타임아웃 설정 60초
3. **Web 서버 → AI 서버**: 타임아웃 설정 없음
4. **AI 서버 처리**: 실제 처리 5개뿐

### 3.3 가능한 실패 지점

1. **Ingress 레벨 타임아웃**
   - `proxy-read-timeout: 60초` 설정
   - 하지만 실제 응답은 10-15ms로 즉시 반환됨
   - 타임아웃이 원인은 아닐 가능성 높음

2. **Web 서버 → AI 서버 통신**
   - `fetch()` 호출에 타임아웃 설정 없음
   - 이론적으로는 무한 대기 가능하지만, 실제로는 즉시 응답
   - 요청이 AI 서버에 도달하지 않았을 가능성

3. **AI 서버 즉시 응답**
   - AI 서버가 요청을 받았지만 즉시 응답하고 처리는 안 하는 경우
   - LangGraph API 엔드포인트의 동작 확인 필요

4. **네트워크 레벨 손실**
   - 중간 레이어(Ingress/LoadBalancer)에서 요청 손실
   - 모니터링 시스템에서만 504 오류 감지

---

## 4. 타임아웃 설정 확인

### 4.1 Ingress (Nginx) 타임아웃

**파일:** `infra/k8s/base/web/ingress.yaml`

```yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"  # 연결 타임아웃 60초
  nginx.ingress.kubernetes.io/proxy-read-timeout: "60"     # 읽기 타임아웃 60초
  nginx.ingress.kubernetes.io/proxy-send-timeout: "60"     # 전송 타임아웃 60초
```

**분석:**
- LLM 처리는 최소 2-30초 필요하므로 60초는 충분해 보임
- 하지만 실제 응답은 10-15ms로 즉시 반환됨
- 타임아웃이 직접 원인은 아닐 가능성 높음

### 4.2 Web 서버 → AI 서버 타임아웃

**파일:** `web/src/app/api/langgraph/[...path]/route.ts`

```typescript
// 현재 코드: 타임아웃 설정 없음
const response = await fetch(targetUrl, fetchOptions)
```

**분석:**
- Next.js 기본 `fetch()`는 타임아웃이 없음 (무한 대기 가능)
- 하지만 실제로는 즉시 응답 (10-15ms)
- 요청이 AI 서버에 도달하지 않았을 가능성

### 4.3 AI 서버 내부 타임아웃

**파일:** `ai/src/graphs/resume_parser/nodes.py`

```python
# PDF 다운로드 타임아웃
response = requests.get(url, timeout=30, verify=verify_ssl)

# Gemini API 타임아웃
model = ChatGoogleGenerativeAI(
    timeout=100,  # 100초
)
```

**분석:**
- AI 서버 내부 타임아웃은 충분히 설정되어 있음
- 문제는 요청이 AI 서버에 도달하지 않거나, 즉시 응답하는 단계

### 4.4 Kubernetes Service

**파일:** `infra/k8s/base/ai/service.yaml`

```yaml
spec:
  type: ClusterIP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3시간 (세션 어피니티 타임아웃)
```

**분석:**
- Service 레벨에서는 HTTP 요청 타임아웃 설정 없음 (Kubernetes Service 특성)
- 세션 어피니티 타임아웃만 설정되어 있음

---

## 5. 가능한 원인 시나리오

### 시나리오 1: Web 서버가 요청을 받았지만 AI 서버로 전달하지 않음

**증거:**
- Web 서버 로그에서 LangGraph API 요청이 거의 없음 (Next.js는 기본적으로 요청 로그를 남기지 않음)
- Locust는 성공으로 보고하지만 실제 AI 처리 없음

**가능성:** 중간

**확인 방법:**
- Web 서버 로그에 명시적 로깅 추가
- `route.ts`에 요청 전후 로깅 추가

### 시나리오 2: AI 서버가 즉시 200 OK를 반환했지만 실제 처리는 안 함 (검증 완료)

**증거:**
- 응답 시간 10-15ms (실제 LLM 처리는 불가능한 속도)
- AI 파드 로그에 run_id가 거의 없음 (5개뿐)
- Locust는 200 OK를 받아 성공으로 집계

**LangGraph API 동작 특성 (검증 완료):**

1. **비동기 처리 방식 확인:**
   - LangGraph 공식 문서에 따르면 `/threads/{id}/runs` 엔드포인트는 **즉시 응답** 방식
   - "Create a run in existing thread, return the run ID immediately. Don't wait for the final run output."
   - 요청을 받으면 즉시 run을 생성하고 200 OK를 반환
   - 실제 그래프 실행은 백그라운드 워커가 큐에서 꺼내서 처리

2. **코드 설정 확인:**
   - Dockerfile CMD: `langgraph dev --n-jobs-per-worker ${N_JOBS_PER_WORKER:-10}`
   - 실제 클러스터 환경 변수: `N_JOBS_PER_WORKER=40` (prod overlay에서 증가됨)
   - 런타임: `inmem` (서비스 설정에서 확인)
   - FastAPI/Uvicorn 기반 비동기 처리

3. **워커 병목 문제:**
   - `N_JOBS_PER_WORKER`는 워커당 동시 작업 수를 제어
   - 워커가 부족하면 대부분의 run이 큐에 쌓이고 실제 처리는 안 됨
   - 이는 [AI_동시요청_대기열_원인_정리.md](./AI_동시요청_대기열_원인_정리.md)에서 분석한 워커 병목 문제와 일치

4. **로그 확인:**
   - 클러스터 로그에서 `thread_name=asyncio_X` 형태로 여러 워커가 동시 작업하는 것을 확인
   - 하지만 실제 처리된 run_id는 5개뿐
   - 대부분의 run이 큐에 쌓이고 처리되지 않았음을 시사

**가능성:** 높음 (검증 완료)

**검증 결과:**
- LangGraph API는 비동기 처리 방식으로 동작함을 확인
- `/threads/{id}/runs` 엔드포인트는 즉시 응답 후 백그라운드 처리
- 워커가 부족하면 큐에 쌓이고 실제 처리는 안 됨
- 시나리오 2가 정확함을 확인

### 시나리오 3: 타임아웃 전에 즉시 응답 (10-15ms)

**증거:**
- 응답 시간이 비정상적으로 빠름
- 타임아웃 설정은 60초로 충분함

**가능성:** 중간

**확인 방법:**
- Ingress 로그 확인
- Web 서버 타임아웃 설정 확인

### 시나리오 4: 네트워크 레벨에서 요청 손실

**증거:**
- 모니터링 시스템에서만 504 오류 감지
- AI 파드 로그에는 오류 없음

**가능성:** 낮음

**확인 방법:**
- Ingress/LoadBalancer 로그 확인
- 네트워크 레벨 모니터링 확인

---

## 6. 권장 조치 사항

### 6.1 즉시 조치 (Short-term)

1. **Web 서버 → AI 서버 타임아웃 추가**
   - `route.ts`의 `fetch()` 호출에 `AbortController`를 사용한 명시적 타임아웃 추가
   - 권장 타임아웃: 120초 (LLM 처리 시간 고려)

2. **Ingress 타임아웃 증가**
   - `proxy-read-timeout`을 60초 → 120초로 증가
   - LLM 처리 시간을 고려한 여유 확보

3. **로깅 강화**
   - Web 서버 `route.ts`에 요청 전후 로깅 추가
   - AI 서버 엔드포인트에 요청 수신/처리 로깅 확인

### 6.2 중기 조치 (Medium-term)

1. **LangGraph API 엔드포인트 동작 확인**
   - `/threads/{id}/runs` 엔드포인트가 즉시 응답하는 로직이 있는지 확인
   - 비동기 처리 여부 확인

2. **모니터링 시스템과 실제 로그 간 불일치 원인 조사**
   - 모니터링 시스템의 504 오류가 어디서 발생하는지 확인
   - Ingress/LoadBalancer 레벨 로그 확인

3. **요청 추적 (Request Tracing)**
   - 요청 ID를 추가하여 전체 흐름 추적
   - 각 단계별 요청 도달 여부 확인

### 6.3 장기 조치 (Long-term)

1. **에러 처리 개선**
   - Soft Failure를 명시적으로 감지하고 처리
   - Locust `locustfile.py`의 에러 감지 로직 강화 (이미 적용됨)

2. **타임아웃 설정 표준화**
   - 모든 레이어에서 일관된 타임아웃 정책 수립
   - 환경별(dev/prod) 타임아웃 설정 문서화

3. **모니터링 개선**
   - 실제 처리량과 보고된 성공률 간 불일치 감지 알림
   - 각 레이어별 요청/응답 메트릭 수집

---

## 7. 참고 자료

- [AI 동시요청 대기열 원인 정리](./AI_동시요청_대기열_원인_정리.md) - LangGraph 워커 병목 원인 분석
- [Task2 공통 문서](./Task2_공통_문서.md) - Task 2 전체 작업 계획
- [Locust 실행 가이드](./Locust_실행_가이드.md) - Locust 테스트 실행 방법
- `infra/k8s/base/web/ingress.yaml` - Ingress 타임아웃 설정
- `web/src/app/api/langgraph/[...path]/route.ts` - Web 서버 LangGraph 프록시 코드
- `ai/src/graphs/resume_parser/nodes.py` - AI 서버 내부 타임아웃 설정

---

**다음 액션:**
1. Web 서버 `route.ts`에 타임아웃 및 로깅 추가
2. Ingress 타임아웃 증가 적용
3. LangGraph API 엔드포인트 동작 확인
4. 재테스트 후 결과 비교
