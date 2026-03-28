# docs-infra

이 디렉터리는 과거 인프라 문서의 원본 보관 영역이다.

새 문서를 여기 직접 추가하지 않는다. 새 문서는 `../reference/document-writing-rules.md` 기준으로 적절한 디렉터리에 배치한다.

## 현재 기준 진입점

- 운영 절차: `../runbooks/`
- 인프라 비교/배경: `../reference/`
- 성능/부하 테스트 요약: `../performance/`
- 재사용 가능한 장애 대응: `../troubleshooting/`
- 검증된 현재 상태: `../infra_state/`

## 마이그레이션 원칙

- 기존 원본은 `legacy/` 아래에 보관한다
- 재사용 가치가 있는 내용만 새 구조로 요약/통합한다
- 앱 레벨 문서는 상위 레포 `reference/`로 이동한다
- 새 기준 문서는 `docs/runbooks/`, `docs/reference/`, `docs/performance/`, `docs/troubleshooting/`, `docs/infra_state/` 중 하나에 둔다
