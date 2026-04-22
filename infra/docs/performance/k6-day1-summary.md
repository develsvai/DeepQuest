# K6 Day1 Summary

확인 시점: `2026-04-20 KST`
대상 환경: `deep-quest` Web `/api/health`, K6, HPA

## 목적

Day1 K6 실험은 Web 계층의 기본 처리 한계와 HPA 적용 효과를 확인하기 위한 실험이다.

이 실험은 AI 전체 플로우 용량을 증명하지 않는다. 대상은 `/api/health`이며, 주로 ingress, Web pod, HPA scale timing, 관측 대시보드가 부하 상황에서 어떻게 동작하는지 확인했다.

## 실험 전제

- 대상 경로: `/api/health`
- 기본 스크립트: [tools/k6/load_test.js](tools/k6/load_test.js)
- 기본 stages: `30s 150 -> 1m 500 -> 1m 1500 -> 1m 3000`
- timeout: `35s`
- 비교 원칙: baseline과 HPA 실험은 같은 stages로 비교한다.
- 주요 대시보드: Pod CPU, Pod Memory, Network I/O, ingress RPS/latency

## 사전 점검

2026-02-14 기준으로 Prometheus, Grafana, node exporter, pod CPU/memory, node network metrics 수집은 가능했다.

Ingress metrics는 트래픽이 없을 때 `No data`가 자연스럽게 보일 수 있다. 테스트 신뢰성은 부하 발생 중 ingress request/latency/error 패널이 실제로 채워지는지로 판단해야 한다.

## 실험 순서와 결과

| 순서 | 조건 | 결과 | 해석 |
| --- | --- | --- | --- |
| 1 | HPA 미적용, Web 1 pod, 3000 VU, timeout 35s | 실패율 `51.88%` (`35,042/67,540`), 평균 RPS 약 `281`, `vus_max 2,992/3,000` | 단일 Web pod CPU 100% 포화. 3000 VU는 명확한 breaking point. |
| 2 | HPA 미적용, Web 1 pod, 3000 VU, timeout 20s | 실패율 `39.45%` (`22,994/58,274`), 평균 RPS 약 `266` | timeout만 바꿔도 실패율은 흔들리지만 단일 pod 포화라는 결론은 같다. |
| 3 | HPA 미적용, Web 1 pod, 1000 VU | 실패율 `4.51%` (`1,072/23,733`), 평균 RPS 약 `152.5`, Web CPU 약 80% | 단일 Web pod에서 실패를 낮게 유지할 수 있는 한계 구간. |
| 4 | HPA 적용 초기, 1000 VU 구간 | 실패율 `0.00%`, 총 요청 `32,507`, 평균 RPS 약 `209`, p95 `3.5s`, Web pod `2 -> 4` | HPA 적용 효과 확인. 1000 VU 구간은 안정화 가능. |
| 5 | HPA min 2 / max 5, 3000 VU | 실패율 `24.74%` (`14,416/58,254`), 평균 RPS 약 `338`, p95 `15.37s`, max `1m`, Web pod 4 | HPA는 동작했지만 3000 VU에서는 timeout과 pod restart가 발생. 네트워크보다 앱/연결 처리 한계에 가까웠다. |
| 6 | HPA max 10, 3000 VU 재실험 | 실패율 `44.59%` (`23,190/52,003`), 평균 RPS 약 `298.5`, p95 `19.45s`, Web pod `1 -> 6` | replica 상한만 올리는 것으로는 해결되지 않았다. 부하가 일부 pod에 집중되고 scale timing이 늦었다. |
| 7 | prod minReplicas 4, scaleUp `4 pods / 45s`, 3000 VU | 실패율 `3.10%` (`1,357/43,688`), 평균 RPS 약 `185`, median `626ms`, p95 `31.73s`, `vus_max 2,993/3,000` | 같은 3000 VU 계열 실험 중 가장 안정적이었다. 단, 후반에 AI pod CPU 100% 구간이 관측되어 병목이 AI 쪽으로 이동했다. |

## 핵심 분석

- HPA 미적용 단일 Web pod는 3000 VU에서 버티지 못했다.
- HPA는 효과가 있었지만, max replica만 높이면 안정화되지 않았다.
- minReplicas와 scaleUp 속도가 더 중요했다. 부하가 급상승할 때 이미 떠 있는 pod 수가 부족하면 한 pod가 먼저 포화된다.
- 최종 3000 VU 실험의 `3.10%` 실패율은 Web 계층이 이전보다 크게 개선됐다는 증거지만, AI 전체 플로우의 처리량을 의미하지 않는다.
- p95가 `31.73s`까지 올라간 구간이 있으므로, "완주했다"와 "사용자 경험이 안정적이다"는 별개다.

## 운영 기준

- Web 계층 부하 테스트는 [tools/k6/load_test.js](tools/k6/load_test.js)를 기준으로 재실행한다.
- 비교 실험에서는 stages, timeout, BASE_URL, replica 정책을 같이 기록한다.
- HPA 검증은 `kubectl get hpa -w`와 pod 증가 시점을 함께 본다.
- Grafana에서는 Web CPU만 보지 말고 ingress latency/error와 AI pod CPU도 같이 확인한다.
- K6 결과가 좋아져도 Locust AI 플로우 결과로 별도 검증해야 한다.

## 재실행 체크리스트

1. 현재 deploy tag와 overlay가 의도한 상태인지 확인한다.
2. Prometheus/Grafana/ingress metrics 수집이 되는지 확인한다.
3. Web HPA의 min/max/scaleUp 정책을 기록한다.
4. K6를 실행한다.
5. K6 실패율, RPS, p95, max duration, `vus_max`를 기록한다.
6. 같은 시간대의 Web pod CPU, pod count, ingress 5xx, AI pod CPU를 같이 기록한다.

## 관련 문서

- [load-test-execution.md](load-test-execution.md)
- [locust-day2-summary.md](locust-day2-summary.md)
- [capacity-plan-1000-rpm.md](capacity-plan-1000-rpm.md)
