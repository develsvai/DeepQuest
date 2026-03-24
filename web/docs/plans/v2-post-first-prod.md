# 첫 배포 이후 수정 필요 사항 정리

해결해야 하는 미션

문제

- AI의 발전으로, 허수가 많아짐
- 기업은 인재밀도를 높이고 싶음. 소수정예
- 하지만 허수들이 너무 많아, 소수정예를 가리기가 어려움

B2C

B2B

'진짜'가 되기 위해선 답변을 외우면 안된다. 아래 기술 키워드와 동작 원리에 대해 충분히 알고 있냐. 너만의 언어로 표현해야 한다

지금의 기능들은 '학습' 서비스에 가깝다. 실제 면접 '시뮬레이션'과는 다르다. 시뮬레이션을 위해선 지금 Ui/ux와는 다른, 별도의 기능이 필요하다.

띠리사 지금은 '학습' 서비스이기 때문에, '힌트' 기능이 필요하다.

우선순위 index

- ⬆️: highest
- ➡️: medium
- ⬇️: lowest

## Global

- [x] ⬆️ server component들에 preftch + hydrate pattern + suspense boundary pattern 적용
- [ ] ⬆️ 사이드바 활성화되면 드롭다운 내려가게
- [x] ➡️ 요소 '삭제' 기능에 approve ui/ux 추가
- [x] ➡️ Deprecated 코드 전부 정리
- [x] ➡️ Claude.md 새로운 방식으로 관리
- [ ] ➡️ API Rate Limit 설정

- ➡️ 약관
  - [ ] 이용약관
  - [ ] 개인정보 처리방침

- [ ] ➡️ 서비스 유료화
- [ ] ⬇️ link url 중앙 집중 관리
  - [ ] ⬇️ 단순한 페이지 이동은 router.push가 아닌, Link component 사용하도록 대체(router.push는 로직에서 이동처리 해야할 때만 사용)
- [x] vercel insight 설치
- [ ] 학습모드와 실전모드를 분리. 지금은 학습모드. 힌트 기능이 꼬리질문보다 먼저.

## Page 기준

## Landing Page

- [ ] ⬆️ Landing page 전면 개편

### 새 면접 준비(/interview-prep/new)

- [ ] ⬆️ 프로젝트 이름 입력 가이드 보다 상세하게. 내가 봐도 이름을 뭐라고 할지 모르겠음

- ⬆️ PDF 첨부
  - [x] 대용량 파일 압축 -> 압축은 리소스가 많이 듦 + latency도 엄청 느림. 따라서 우선은 압축안내 문구를 표시하는 걸로 정리
  - [x] '포트폴리오'를 반드시 추가하라는 가이드 문구 추가

- [x] ⬆️ 경험 목록에 기술한 경험만 파싱하도록 수정
  - [ ] ⬆️ 파싱 대상 경험 목록 우선 걍 제거해버리기! 없어도 충분히 빨라짐. → 프롬프트로 지원 직무 관련 경험만 파싱하도록 할 것.
- [x] ⬇️ 작업이 다 완료된 다음 input value가 사라지도록 수정
- [ ] ➡️ Toast > 준비 생성 완료 후, Toast message 클릭하면 해당 세션으로 이동하도록 Link

### 대시보드(/dashboard)

- [x] ➡️ 삭제 기능
- [ ] ➡️ 인터뷰 생성 시, progress 등 걸리는 시간 표시

### 인터뷰 준비 상세(/dashboard/[id])

- [x] ⬆️ summary 부분 ui/ux, prompt, data type(`string[]`) 변경
- [x] ➡️ 수정 및 삭제 기능
- [x] ➡️ 경험 추가 기능
- [ ] ➡️ 채용공고 등록 기능 with 면접일자 입력
- [ ] ⬇️ 근무 형태, 프로젝트 팀 단위 뱃지 ui 변경

### 경험 상세 == 성취 목록(/dashboard/[id]/[experienceType]/[experienceId])

- [x] ⬆️ 문제 생성 시 supabase realtime 잘 되는지 다시 확인 필요. 특히 페이지 새로고침한 뒤에!
- [ ] ⬆️ 문제 카테고리 범위, 설명에 대한 수정 고민
- [ ] ⬆️ ai > 문제 생성 프롬프트 변경 필요. 한 번에 하나의 질문만 하도록
- [ ] ⬆️ Star 기법 설명
- [ ] ➡️ Toast > 준비 생성 완료 후, Toast message 클릭하면 해당 문제 목록으로 이동하도록 Link
- [ ] ⬇️ 새로고침할 때, 문제 생성 중임에도 'generate' 버튼이 잠시 활성화 되는 문제

### 성취 상세 == 문제 목록(/dashboard/[id]/[experienceType]/[experienceId]/[keyAchievementId])

- [x] ⬆️ 생성된 문제가 없는 경우 문제 생성 ui 제공
- [x] ⬆️ 필터 위에 불필요한 문제 풀이 스탯 표시 삭제
- [x] ⬆️ 버튼 필터 끝에 'Regenerate' Button 추가
- [ ] ⬆️ Generate 버튼 직관적이지 않음. 문제 생성 안될 때는 해당 버튼이 오른쪽에.
- [ ] ⬇️ 가장 최근 문제 평가를 보여줘야할듯?

### 문제 풀이(/dashboard/[id]/[experienceType]/[experienceId]/[keyAchievementId]/[questionId])

- [x] ⬆️ 문제 풀이 streaming시 발생하는 trim is not function 문제 해결(`TypeError: e?.trim is not a function`)
- [x] ⬆️ 프로덕션에서만 스트리밍이 안되는 문제
- [x] ⬆️ 문제를 풀고 난 다음, 문제 목록에 풀이완료 표시가 안되는 문제

## AI python

### Resume Parsing

- [x] ⬆️ 'Position' description prompt 수정
  - AS-IS: position 외의 다양한 역할 -> [이커머스 서비스 시스템 최적화 및 안정적 트래픽 처리, 백엔드 개발자]
  - TO-BE: 구체적인 Position 위주 -> [백엔드 개발자]

### Question Gen

### Feedback Gen

- [x] ⬆️ 피드백이 영어로 출력되는 때가 있음
