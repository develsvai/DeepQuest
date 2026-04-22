# HPA 미적용 (Baseline) 테스트

파드 1개 고정·HPA 제거 후 동일 K6 스크립트로 측정한 결과. Task 1-2 Breaking Point 측정용.

## 설정

- **클러스터:** `kubectl scale deployment web-server -n deep-quest --replicas=1`, `kubectl delete hpa web-server-hpa -n deep-quest`
- **K6:** stages 30s 150 → 1m 500 → 1m 1500 → 1m 3000, 대상 `/api/health`. timeout은 런별로 상이 (35s 또는 20s).

## 스크린샷

| 파일명 | 설명 |
|--------|------|
| **Baseline_K6_51.88퍼_실패_3000VU.png** | K6 총결과 (timeout 35s). http_req_failed **51.88%** (35,042/67,540), 2992 VU 도달, request timeout 다수. **HPA 미적용.** |
| **Baseline_K6_timeout20s_39.45퍼_실패_3000VU.png** | K6 총결과 (timeout **20s**). http_req_failed **39.45%** (22,994/58,274), 2992 VU 도달. **HPA 미적용.** |
| **Baseline_Grafana_Web파드1개_CPU100_09-29.png** | Grafana Stress Test. Web 파드 1개만 CPU 100% 근처로 포화 (replicas=1, HPA 미적용 상태) |
| **Baseline_K6_1000VU_4.51퍼_실패.png** | K6 총결과 (**1000 VU**). http_req_failed **4.51%** (1,072/23,733), RPS 약 152.5. **HPA 미적용 단일 파드 실패율 한계 구간.** |
| **Baseline_Grafana_Web파드1개_CPU80_1000VU.png** | Grafana Stress Test. 1000 VU 부하 시 Web 파드 1개 CPU ~80% (HPA 미적용) |

## 결과 요약 (HPA 미적용, 파드 1개)

### timeout 35s
- **http_req_failed:** 51.88% (35,042 / 67,540)
- **총 요청:** 67,540, **RPS (평균):** 약 281 req/s
- **http_req_duration:** p95 12.29s, max 32.39s
- **관측:** 3000 VU 구간에서 단일 Web 파드 한계 → 타임아웃 다수.

### timeout 20s
- **http_req_failed:** **39.45%** (22,994 / 58,274)
- **총 요청:** 58,274, **RPS (평균):** 약 266 req/s
- **http_req_duration:** avg 2.64s, p95 19.85s, max 19.99s (20s 타임아웃 근접)
- **관측:** 동일 파드 1개·HPA 미적용. 타임아웃을 20s로 줄이면 35s 대비 실패율이 낮게 나오나 여전히 30%대(약 39%) 수준.

### 1000 VU (단일 파드 실패율 한계 구간)
- **http_req_failed:** **4.51%** (1,072 / 23,733)
- **총 요청:** 23,733, **RPS (평균):** 약 **152.5** req/s
- **http_req_duration:** avg 799ms, p95 1.39s, max 25.2s
- **관측:** 1000 VU에서 실패율을 더 줄이기 어려운 구간. Web 파드 CPU ~80%. 이 이상 부하는 파드 1개로 한계 → HPA 필요.

위 모두 **HPA 미적용** 테스트 결과이며, HPA 적용 시(3.10% 실패 등)와 비교용 Baseline으로 사용.

**상세:** `../Task1_공통_문서.md` §3, §5
