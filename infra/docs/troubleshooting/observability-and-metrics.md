# Observability And Metrics Issues

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` metrics exporter, Prometheus, Grafana

## 발생 조건

- `langgraph.run` 기반 메트릭 exporter를 처음 붙이거나 수정할 때
- Grafana 패널이 `No data` 또는 비정상 값으로 보일 때
- backlog, worker busy, completed/sec 같은 운영 지표를 새로 해석해야 할 때

## 대표 증상

- exporter 파드가 기동 직후 바로 죽음
- exporter는 떠 있지만 `ai_*` 메트릭이 채워지지 않음
- Grafana에서 `Jobs Failed/sec`, `Worker Success Rate`가 `No data`로 표시됨

## 판단 과정

- exporter 로그에서 Python 예외와 SQL syntax error를 먼저 확인한다
- duration histogram 대상 데이터가 0건일 때도 메트릭 생성 코드가 안전한지 본다
- `oldest_pending_seconds` 같은 파생 지표 쿼리에서 Postgres 집계 문법이 맞는지 확인한다
- Prometheus에서 대상 시계열이 실제로 생성됐는지와, Grafana 쿼리가 빈 결과를 0으로 보정하는지 함께 본다

## 근본 원인

- 완료 job이 0건일 때 빈 `HistogramMetricFamily`를 생성하며 exporter가 예외로 죽을 수 있다
- Postgres `FILTER`가 집계 함수 바깥에 있으면 syntax error로 메트릭 수집이 실패한다
- 실패 메트릭처럼 아직 한 번도 생성되지 않은 시계열은 Grafana에서 그대로 `No data`로 보일 수 있다

## 해결 방법

- 0건 상태에서도 기본 bucket이 들어간 empty histogram helper를 사용한다
- `MIN(created_at) FILTER (WHERE ...)`처럼 `FILTER`를 올바른 집계 함수 안쪽 위치로 수정한다
- Grafana 쿼리에서 `or vector(0)`, `clamp_min(...)`를 사용해 빈 결과를 0으로 보정한다
- 운영 대시보드는 `Worker Busy`, `Queue Backlog`, `Jobs Completed/sec`, `Jobs Failed/sec`, `Worker Success Rate`를 기준으로 해석한다

## 확인 방법

```bash
kubectl logs -n deep-quest deploy/langgraph-run-metrics-exporter --tail=200
kubectl exec -n monitoring deploy/prometheus-server -- \
  wget -qO- 'http://localhost:9090/api/v1/query?query=ai_jobs_failed_total'
kubectl get pods -n deep-quest | rg 'metrics|exporter'
```

## 검색 키워드

- empty histogram exporter crash
- histogrammetricfamily buckets empty
- postgres filter syntax error exporter
- grafana no data vector 0
- ai metrics exporter no data

## 원본 판단 로그

- 큐 메트릭 exporter 기동 실패
- exporter SQL 문법 오류
- Grafana 패널 No data
