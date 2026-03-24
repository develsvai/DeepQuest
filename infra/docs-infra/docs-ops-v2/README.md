# Deep Quest Infra Ops Docs (v2)

이 디렉토리는 `deep-quest` 운영 문서의 **실행 중심 단일 진입점**입니다.

## 문서 원칙
- 문서 목적: 운영자가 바로 실행 가능한 정보만 유지
- 최신 기준: 클러스터 실측(`kubectl`)이 우선, 코드/문서는 그 다음
- 중복 금지: 같은 주제는 한 문서에서만 관리
- 업데이트 트리거: 배포/스케일링/시크릿/런북 변경 시 즉시 갱신

## 읽기 순서
1. `00-start-here/current-state.md`
2. `00-start-here/cluster-overview.md`
3. `20-runbooks/deploy-and-verify.md`
4. `20-runbooks/incident-response.md`
5. `30-performance/baseline-and-next.md`

## 디렉토리
- `00-start-here`: 지금 상태와 핵심 리스크
  - `cluster-overview.md`: 지금 클러스터에 무엇이 어떻게 떠 있는지 한눈에 보는 실측 스냅샷
- `10-platform`: 현재 플랫폼 토폴로지와 설정 요약
- `20-runbooks`: 배포/점검/장애 대응 절차
- `30-performance`: 성능 기준선과 다음 액션
- `99-appendix`: 조회 명령/원시 스냅샷
