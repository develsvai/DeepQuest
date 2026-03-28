# Performance Docs

과거 `DeepQuest_Traffic_Test` 산출물을 현재 운영 문맥에 맞게 요약한 디렉터리다.

문서 형식은 `../reference/document-writing-rules.md`를 따른다.

## 문서 목록

- `k6-day1-summary.md`
  - 관측, Grafana, HPA 검증
- `locust-day2-summary.md`
  - 격리, 튜닝, LangGraph/Redis/동시성 관찰
- `capacity-plan-1000-rpm.md`
  - 1000 RPM 목표 대비 구성 옵션

## 시나리오 파일

- `tools/k6/load_test.js`
- `tools/locust/locustfile.py`
- `tools/locust/requirements.txt`

## 원칙

- 테스트 산출물은 “지금 운영에 유효한 결론” 위주로 요약한다
- 일회성 메모와 체크포인트는 요약 문서에 흡수하고 원본은 `../docs-infra/legacy/`에 둔다
- 장애 대응 가치가 생기면 `../troubleshooting/`에 별도 문서로 분리한다
- 현재 상태 수치는 장기 기준이 아니라면 `../infra_state/` 대신 여기 요약으로만 남긴다
