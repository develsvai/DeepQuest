# 3000 VU 테스트 (HPA 적용 후)

Task 1-3 HPA 적용 상태에서 3000 VU 부하 테스트. 공통 문서 §4.5.3·§5 산출물 증거용.

## 유의미한 데이터 (현재 보관)

### 스크린샷
| 파일명 | 설명 |
|--------|------|
| **3000vu_K6_35s_3.10퍼_로스_완주_2993VU.png** | K6 총결과. **실패 3.10%** (1,357/43,688), 2993 VU 완주. minReplicas 4·scaleUp 4/45s 적용 후 최종 런. |

### 로그
| 파일명 | 설명 |
|--------|------|
| **stress-test-monitoring-20260214.log** | 테스트 직전(BEFORE)·직후(AFTER) Pods/HPA/Events 스냅샷. |
| **stress-test-3kv-web.log** | 3000 VU 테스트 중 Web 파드 로그 일부. |

## 테스트 설정 (최종 런 기준)

- **K6:** stages 30s 150 → 1m 500 → 1m 1500 → 1m 3000, timeout 35s
- **대상:** `https://deepquest.192.168.0.110.nip.io/api/health`
- **HPA:** Web minReplicas 4, maxReplicas 10, scaleUp 4 pods/45s

## 결과 요약 (2026-02-15)

| 항목 | 값 |
|------|-----|
| **http_req_failed** | **3.10%** (1,357 / 43,688) |
| 총 요청 수 | 43,688 |
| RPS (평균) | 약 185 req/s |
| http_req_duration | avg 4.54s, med 626ms, p95 31.73s, max 34.99s |
| vus_max | 2,993 / 3,000 도달, 테스트 완주 |

**관측:** 중간에 AI 파드 한 대 CPU 100% 구간에서 에러 발생 → 정상화 후 복구. DB 피크 없음.

**Baseline과 비교:** 파드 1개(HPA 미적용) 시 51.88% 실패 → HPA·scaleUp 적용 후 3.10% 실패. [HPA_미적용/](../../HPA_미적용/) 참고.

**상세:** [../../Task1_공통_문서.md](../../Task1_공통_문서.md) §4.5.3, §5
