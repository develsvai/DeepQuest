**업데이트 날짜:** 2026-02-15
**작성자:** DeepQuest Team Haru2

---

# Task 2 공통 문서 (Day 2: 격리 & 튜닝) — 작업 계획

SRE 포트폴리오 3일 스프린트 중 **Day 2** 작업의 공통 기준 문서다.
**목표:** "AI가 폭주해도(Noisy Neighbor) 웹 서버는 쾌적하게 유지된다"를 데이터로 증명한다.

Task 2-1, 2-2, 2-3 진행에 따라 아래 각 섹션의 상태·결과를 갱신한다.

## 목차

1. [Day 2 목표 및 산출물](#1-day-2-목표-및-산출물)
2. [현재 인프라 상태 (사전 점검)](#2-현재-인프라-상태-사전-점검)
3. [Task 2-1: [Before] 리소스 격리 실패 재현](#3-task-2-1-before-리소스-격리-실패-재현)
4. [Task 2-2: [After] QoS 및 스케줄링 튜닝](#4-task-2-2-after-qos-및-스케줄링-튜닝)
5. [Task 2-3: 커널 파라미터 튜닝](#5-task-2-3-커널-파라미터-튜닝)
6. [산출물 체크리스트 및 증거](#6-산출물-체크리스트-및-증거)
7. [참고 자료](#7-참고-자료)
8. [커밋 189a4b78 이후 변경 이력 (부모 레포·서브모듈)](#8-커밋-189a4b78-이후-변경-이력-부모-레포서브모듈)

---

## 1. Day 2 목표 및 산출물

**목표:** Noisy Neighbor 시나리오를 재현하고, QoS·리소스 한계·우선순위로 웹 서버 안정성을 확보함을 증명한다.

**산출물:**

- [Before] AI 파드 CPU 100% + 웹 응답 지연(Timeout) 그래프
- [After] AI CPU 상한 그래프 + 웹 Latency 평온(Flat) 그래프
- 트러블슈팅 문서: "Locust/부하 테스트 중 TCP Connection Drop → 커널 백로그 튜닝으로 해결" 한 줄 추가
- 최종: **"Isolation" 비교 그래프** (포트폴리오 Deliverables 2번)

---

## 2. 현재 인프라 상태 (사전 점검)

작업 전 기준. Task 2 진행 후 이 표를 갱신한다.

| 리소스 | 현재 설정 | 비고 |
|--------|-----------|------|
| **AI (ai-server)** | `requests`: cpu 1, memory 2Gi / `limits`: cpu 2, memory 4Gi | `infra/k8s/base/ai/deployment.yaml` |
| **Web (web-server)** | `requests`: 250m, 256Mi / `limits`: 1, 512Mi | `infra/k8s/base/web/deployment.yaml` |
| **PriorityClass** | 없음 | Task 2-2에서 `high-priority` 생성·Web에 적용 예정 |
| **Grafana Stress Test 대시보드** | 적용 완료 (Task 1-1) | Pod CPU·Memory·Ingress RPS/Latency 확인용 |
| **Locust** | 미사용 이력 | AI 분석 API 부하 주입용으로 사용 예정 |

**참고:** 설정 변경은 overlay 우선. 실험용(limits 제거 등)은 임시 patch 또는 `kubectl edit`로 수행 후, After 단계에서 overlay에 반영.

---

## 3. Task 2-1: [Before] 리소스 격리 실패 재현

**목표:** AI 파드에 CPU 상한을 두지 않아, AI가 CPU 100%를 점유할 때 웹 서버가 지연되는 Noisy Neighbor 상황을 재현하고 캡처한다.

### 3.1 사전 준비

| # | 작업 | 상세 |
|---|------|------|
| 1 | Grafana 대시보드 확인 | "Deep Quest - Stress Test" 열고, Pod CPU·Ingress Latency 패널 확인 가능한지 점검 |
| 2 | AI 파드 리소스 limits 제거 | AI Deployment에서 `resources.limits` 제거 (또는 limits만 제거한 overlay/patch 적용). *실험 후 복구 필요* |
| 3 | Locust 스크립트 준비 | [locustfile.py](./locustfile.py) 사용. AiUser가 `/api/langgraph/threads`·`/threads/{id}/runs` 호출로 AI 부하. 설치·실행: [Locust_실행_가이드.md](./Locust_실행_가이드.md) |

### 3.2 실행 순서

1. **AI limits 제거 반영**
   - `kubectl edit deployment ai-server -n deep-quest` 또는 overlay로 limits 제거된 버전 apply
   - `kubectl get pods -n deep-quest -l app.kubernetes.io/component=ai` 로 재시작 확인

2. **Locust 부하 시작**
   - AI 분석 요청만 발생시키는 시나리오 실행 (예: 50~100 사용자, 지속 2~3분)

3. **동시에 웹 접속**
   - 브라우저 또는 `curl`로 웹 페이지/`/api/health` 반복 접속
   - 목표: **접속 지연·Timeout 발생** 확인

4. **모니터링 캡처**
   - Grafana: **AI 파드 CPU 100% 근처** + **웹/Ingress Latency 급상승(Spike)** 구간 스크린샷
   - (선택) Locust 결과 화면 캡처

### 3.3 증거 확보

- **파일명 예:** `Before_AI_CPU_100_Web_Latency_Spike.png`
- **저장 위치:** `LOCUST_TEST_TASK_2/Before_격리_실패/`
- **멘트:** "AI 파드 CPU limit 미설정 시, AI 부하로 웹 응답 지연(Timeout) 발생"

### 3.4 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| AI limits 제거 (실험용) | 대기 | |
| Locust 시나리오 작성·실행 | 대기 | |
| 웹 접속 지연 재현 | 대기 | |
| Grafana 캡처 (AI CPU 100% + Web Latency Spike) | 대기 | |

---

## 4. Task 2-2: [After] QoS 및 스케줄링 튜닝

**목표:** AI에 CPU 상한을 두고, Web에 Guaranteed QoS·높은 우선순위를 부여해, 동일 부하에서도 웹은 즉시 응답(200 OK)하도록 한다.

### 4.1 설정 변경 요약

| 대상 | 변경 내용 | 목적 |
|------|-----------|------|
| **AI 파드** | `resources.limits.cpu: "2"` 유지(또는 재적용) | CPU 족쇄 — Noisy Neighbor 완화 |
| **Web 파드** | `requests: 500m`, `limits: 500m` (동일 값) | **Guaranteed QoS** — 메모리도 requests=limits 권장(예: 512Mi) |
| **Web 파드** | `priorityClassName: high-priority` | 스케줄링 시 웹 우선 |

### 4.2 사전 작업: PriorityClass 생성

클러스터에 `high-priority` PriorityClass가 없으면 생성한다.

```yaml
# infra/k8s/base/web/priority-class.yaml (예시)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
globalDefault: false
description: "High priority for web pods (user-facing)"
```

- 적용: `kubectl apply -f infra/k8s/base/web/priority-class.yaml`
- Web Deployment의 `spec.template.spec.priorityClassName: high-priority` 는 **overlay patch**로 추가 권장 (base는 공통, prod/dev만 우선순위 적용 시).

### 4.3 실행 순서

1. **AI limits 복구**
   - AI Deployment에 `limits.cpu: "2"`, `limits.memory: 4Gi` 다시 적용

2. **Web Guaranteed + PriorityClass 적용**
   - Web: `requests/limits` 500m/500m (CPU), 512Mi/512Mi (Memory)
   - Web: `priorityClassName: high-priority`
   - overlay로 적용 시: `infra/k8s/overlays/prod/kustomization.yaml` (또는 dev)에 patch 추가

3. **동일 Locust 부하 재실행**
   - Task 2-1과 같은 AI 분석 시나리오로 부하 주입

4. **검증**
   - 웹 페이지/`/api/health` 접속 → **즉시 200 OK**
   - Grafana: **AI CPU는 상한(2 core) 이하** + **웹 Latency 평온(Flat)**

### 4.4 증거 확보

- **파일명 예:** `After_AI_CPU_Capped_Web_Latency_Flat.png`
- **저장 위치:** `LOCUST_TEST_TASK_2/After_QoS_튜닝/`
- **멘트:** "AI 파드 CPU limit 2 + Web Guaranteed QoS·high-priority 적용 후, 동일 부하에서 웹 응답 안정화"

### 4.5 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| PriorityClass 생성·적용 | 대기 | |
| AI limits 복구(2 CPU) | 대기 | |
| Web requests/limits 500m·512Mi + priorityClassName | 대기 | |
| 동일 Locust 재실행·웹 즉시 응답 확인 | 대기 | |
| Grafana 캡처 (AI 상한 + Web Latency Flat) | 대기 | |

---

## 5. Task 2-3: 커널 파라미터 튜닝

**목표:** 대량 연결 처리 시 TCP Connection Drop 등을 줄이기 위해 노드 커널 파라미터를 튜닝하고, 트러블슈팅 문서에 한 줄로 기록한다.

### 5.1 작업 내용

**대상:** 워커 노드(들). SSH 또는 노드 접근 권한 필요.

```bash
# 실행 (노드에서)
sudo sysctl -w net.core.somaxconn=1024
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=2048
```

- **영구 반영:** `/etc/sysctl.d/99-deepquest.conf` 등에 동일 키=값 추가 후 `sysctl -p` 또는 재부팅.

### 5.2 검증

- Locust 재실행 시, 이전에 TCP 관련 오류/연결 끊김 있던 구간에서 개선 여부 확인 (선택).

### 5.3 문서 반영

- **파일:** `infra/docs-infra/트러블슈팅.md`
- **추가할 문장 (예시):**
  - "Locust 부하 테스트 중 TCP Connection Drop 현상 발생 → 노드에서 `net.core.somaxconn=1024`, `net.ipv4.tcp_max_syn_backlog=2048` 커널 파라미터 튜닝으로 해결."

### 5.4 진행 상황 및 적용 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 노드 커널 파라미터 적용 | 대기 | |
| 트러블슈팅.md 한 줄 추가 | 대기 | |

---

## 6. 산출물 체크리스트 및 증거

Day 2 최종 제출용. 완료 시 O 표시 및 경로 기입.

| # | 산출물 | 완료 | 경로 또는 설명 |
|---|--------|------|----------------|
| 1 | [그래프] Before: AI CPU 100% + 웹 Latency Spike | 대기 | `LOCUST_TEST_TASK_2/Before_격리_실패/` |
| 2 | [그래프] After: AI CPU 상한 + 웹 Latency Flat | 대기 | `LOCUST_TEST_TASK_2/After_QoS_튜닝/` |
| 3 | [문서] 트러블슈팅 — 커널 백로그 튜닝 한 줄 | 대기 | `infra/docs-infra/트러블슈팅.md` |
| 4 | Isolation 비교 멘트 | 대기 | "AI 폭주 시 웹 지연(Before) vs 안정화(After)" |

---

## 7. 참고 자료

- **Task 1 공통 문서:** [../../K6_RPS_TEST_TASK_1/Task1_공통_문서.md](../../K6_RPS_TEST_TASK_1/Task1_공통_문서.md) — Grafana 대시보드·부하 테스트 절차
- **모니터링:** [infra/k8s/monitoring/README.md](../../../k8s/monitoring/README.md)
- **Overlay 규칙:** base 수정 대신 overlay patch 사용 — `infra/k8s/overlays/prod`, `overlays/dev`
- **K8s QoS:** [Guaranteed Pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/) — requests와 limits가 동일한 컨테이너
- **PriorityClass:** [Pod Priority and Preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)

---

## 8. 커밋 189a4b78 이후 변경 이력 (부모 레포·서브모듈)

**기준 커밋:** `189a4b78` (infra 서브모듈) — "docs: K6_RPS_TEST → K6_RPS_TEST_TASK_1 정리, HPA 미적용 1000 VU 한계 구간 반영"

부모 레포에서는 해당 시점에 infra가 189a4b78을 가리키던 커밋(65b58b3) 이후의 변경만 정리한다.

### 8.1 부모 레포 (deep-quest)에서 건드린 파일·부분·이유

| 커밋 | 파일 | 변경 내용 | 이유 |
|------|------|-----------|------|
| **f95af03** | `ai/src/graphs/resume_parser/configuration.py` | `parsing_model` 기본값을 런타임에 `RESUME_PARSER_PARSING_MODEL` 환경변수로 읽도록 수정, 기본값은 코드에 유지 | 배포 시 ConfigMap만 바꿔도 이력서 파싱 모델 변경 가능하도록 (이미지 재빌드 없이) |
| **bab4869** | `ai/src/graphs/resume_parser/configuration.py` | 기본 파싱 모델을 `gemini-2.5-flash`로 변경 (기존 gemini-3-* 대체) | 할당량·비용·속도 고려, infra ConfigMap과 동일 모델로 통일 |
| **700a7a1** | `.cursor/rules/infra-k8s-overlay.mdc` | 신규 추가 | infra k8s overlay 규칙( base 수정 대신 overlay patch 사용 등)을 Cursor 규칙으로 고정 |
| **8798e3a** | `.specify/memory/constitution.md` | Git safety 규칙 추가 (reset/revert/force push 금지) | 협업·히스토리 보호를 위한 컨벤션 명시 |
| **8798e3a** | `ai/src/graphs/resume_parser/nodes.py` | (동일 커밋 내) 로깅/에러 메시지 등 소소한 수정 | constitution 반영 또는 코드 정리 |

*부모 레포에서 `infra`는 서브모듈 포인터만 여러 커밋에서 갱신되었으며, 위 표는 infra를 제외한 **애플리케이션/설정 코드** 변경만 적었다.*

### 8.2 서브모듈 (infra)에서 건드린 파일·부분·이유

| 커밋 | 파일 | 변경 내용 | 이유 |
|------|------|-----------|------|
| **9f5fa67** | `k8s/overlays/prod/kustomization.yaml` | AI deployment patch로 `limits` 제거 | Task 2-1: Noisy Neighbor 재현용으로 AI가 CPU 100%까지 쓸 수 있게 함 (base는 유지) |
| **9a83363** | `docs-infra/` 구조, `k8s/monitoring/` | K6·Locust 문서를 `DeepQuest_Traffic_Test/` 아래로 이동, 스트레스 대시보드·모니터링 스크립트 정리 | 모니터링·부하 테스트 문서 일원화 및 재구성 |
| **70b5572** | `LOCUST_TEST_TASK_2/` 가이드·locustfile, `k8s/overlays/prod`, `k8s/base/ai/deployment.yaml`, `k8s/monitoring/dashboards/stress-test.json` | Locust 실행 가이드·locustfile 정리, prod overlay·AI deployment·스트레스 대시보드 AI CPU 패널 수정 | Task 2용 Locust 시나리오·가이드 정리 및 대시보드에 AI CPU 반영 |
| **72eebe9** | `k8s/overlays/prod/kustomization.yaml` | Task 2-1용 AI limits 제거 overlay 유지/정리 | Noisy Neighbor 재현 설정 확정 |
| **399a6b8** | `LOCUST_TEST_TASK_2/Locust_실행_가이드.md`, `locustfile.py` | 가이드 보강, 이력서 URL을 Supabase 기본값으로 설정 | Locust 실행 방법·기본 이력서 URL 통일 |
| **19ae4a4** | `k8s/base/configmap.yaml` (ai-config) | `LANGSMITH_TRACING`, `LANGCHAIN_TRACING_V2` 를 `"false"` 로 설정 | 프로덕션에서 LangSmith 트레이싱 비활성화 |
| **a09d6fa** | `k8s/base/ai/deployment.yaml`, `docs-infra/.../AI_동시요청_대기열_원인_정리.md` | AI deployment에 `N_JOBS_PER_WORKER`(또는 동일 목적) env 추가, 원인/해결 문서 신규 | LangGraph 대기열 병목 완화(워커당 동시 job 수 조절) |
| **128383b** | `docker/ai/Dockerfile`, `k8s/base/ai/service.yaml`, `k8s/base/web/ingress.yaml`, `AI_동시요청_대기열_원인_정리.md` | Dockerfile에서 워커 수/설정 수정, AI Service·Web Ingress에 session affinity 적용 | 워커 1개로 묶이던 원인 제거 + 동일 클라이언트가 같은 AI/Web 파드로 가도록 고정 |
| **f6fb171** | `locustfile.py`, `verify-session-affinity.sh`, `k8s/base/ai/service.yaml`, `k8s/base/web/ingress.yaml`, `k8s/overlays/prod/kustomization.yaml`, `patch-ai-service-session-affinity.yaml`, `patch-web-ingress-session-affinity.yaml` | Session affinity overlay 추가·적용, Locust 경험 목록(`DEFAULT_EXPERIENCE_NAMES`) 설정, 검증 스크립트 추가 | prod에서 AI/Web session affinity 명시적 적용 및 Locust 시나리오와 UI 경험 목록 일치 |
| **8df3720** | `k8s/base/configmap.yaml` (ai-config) | `RESUME_PARSER_PARSING_MODEL=gemini-2.5-flash` 추가 | 이력서 파싱 모델을 ConfigMap으로 지정(부모 레포 ai 기본값과 동일) |

요약: **189a4b78 이후** infra에서는 Task 2 Locust·Noisy Neighbor 재현, AI 대기열/워커/세션 어피니티, 이력서 파싱 모델·ConfigMap·LangSmith 비활성화까지 반영되었다. 부모 레포에서는 AI resume_parser 설정·Cursor/Constitution 규칙만 추가·수정되었다.

---

**다음 액션:** Task 2-1부터 진행 시, §3.1 사전 준비 → §3.2 실행 순서대로 수행 후, §3.4·§6 테이블을 갱신한다.
