---
name: evaluate-implementation
description: 애플리케이션 변경 사항을 최신 status/task, 관련 reference 설계 문서, docs(haru2)/architecture.md의 작업 경계, 그리고 실제 `web/`·`ai/` 코드 상태에 맞춰 검증한다.
---

# 구현 평가

## 목표

애플리케이션 구현이 현재 의도, 관련 설계 문서, 저장소 작업 경계, 실제 코드 상태에 맞는지 평가한다.

## 작업 순서

1. 아래 기준 문서를 읽는다:
   - 최신 `docs(haru2)/status/status-YYYY-MM-DD.md`
   - 최신 `docs(haru2)/tasks/task-YYYY-MM-DD.md`
   - 관련 `docs(haru2)/reference/*.md`
   - `docs(haru2)/architecture.md`
2. 변경이 `web/`를 건드리면 해당 영역의 실제 코드와 관련 `web/docs/`를 함께 비교한다
3. 변경이 `ai/`를 건드리면 해당 영역의 실제 코드와 관련 `ai/docs/`를 함께 비교하고, 필요하면 `ai/README.md`도 확인한다
4. 아래를 점검한다:
   - 정확성
   - 범위 정합성
   - 설계 문서 또는 참고 문서와의 일치 여부
   - `web/`와 `ai/` 경계 침범 여부
   - 문서와 코드 사이의 drift
   - 불필요한 복잡성
   - 필요한 최소 검증 명령 실행 여부
5. 아래 형식으로 반환한다:
   - `OK` 또는 `NOT OK`
   - 이슈 목록
   - 잔여 위험
   - 수정 제안

## 규칙

- 엄격하게 판단한다
- 검증된 관찰을 우선한다
- 경계 밖으로 번지는 변경은 명확히 지적한다
- 의미 있는 구조 변경인데 관련 reference 문서나 작업 근거가 전혀 없으면 문서 근거 부족을 이슈로 지적한다
- `docs(haru2)/architecture.md`는 전체 제품 상세 설계서가 아니라 루트 작업 경계 문서로 본다
- 새로 작성되거나 수정된 문서의 Markdown 링크 대상이 작성 파일 기준 상대경로인지 확인한다
- `/Users/...`, `/home/...`, `file://...` 같은 로컬 절대경로 링크가 남아 있으면 이슈로 지적한다
- `web/` 코드 변경이면 `pnpm check-all` 실행 또는 생략 사유가 남아 있는지 확인한다
- `ai/` 코드 변경이면 `uv run make lint` 실행 또는 생략 사유가 남아 있는지 확인한다
- 문서만 수정한 작업이라면 코드 검증 생략이 자연스러운지 확인한다
