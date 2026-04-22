# Application Dev Vs Prod

## 목적

웹(`web/`)과 AI(`ai/`) 코드가 dev/prod에서 어떻게 다르게 동작하는지, 그리고 어떤 환경변수가 빌드 타임/런타임으로 나뉘는지 정리한다.

## 주요 차이

- Web
  - `NEXT_PUBLIC_*` 계열 변수는 빌드 시 번들에 포함되는 값으로 본다
  - Sentry 활성 여부와 DSN 필수성
  - Clerk webhook / 인증 관련 설정
  - `APP_URL` 계열 내부 호출 기준값
  - tRPC 에러가 런타임 secret 오류를 감출 수 있음
- AI
  - 런타임 secret 주입 기준
  - LangSmith 키 유무에 따른 동작 차이
  - `ENVIRONMENT`에 따른 실행 경로 차이

## ENV 주입 원칙

### Web

- 빌드 타임 주입
  - `NEXT_PUBLIC_*`
  - Sentry public/runtime에 직접 노출되는 값
  - 번들 생성 시 필요한 값
- 런타임 주입
  - 서버 전용 secret
  - DB 접속 정보
  - Clerk webhook signing secret
  - `APP_URL` 같은 서버 내부 호출 기준값

### AI

- AI는 기본적으로 런타임 주입 기준으로 본다
- LangSmith, DB, 외부 API 키는 secret에서 직접 주입되는 값으로 관리한다

## 환경 분리 원칙

- Compose와 Cluster는 이미지, 빌드 파이프라인, env 주입 경로를 분리해 운영한다
- Supabase, Clerk 같은 외부 서비스를 공유하더라도 사용자 데이터와 webhook 실험은 환경 간에 섞지 않는 것을 기본 원칙으로 둔다
- 같은 Clerk tenant를 공유한 채 한쪽 webhook만 비활성화하면 로그인은 성공해도 다른 쪽 DB user가 비어 있거나 stale 상태로 남을 수 있다

## Compose vs Cluster 차이

### Compose

- web 번들용 env는 build 스크립트가 선택한 `.env`를 기준으로 포함한다
- ai는 compose 환경변수로 직접 런타임 주입한다
- `ENVIRONMENT=development | production` 기준으로 dev/prod를 나눠 본다

### Cluster

- web 번들용 env는 Jenkins가 빌드 시 주입한다
- web / ai의 나머지 런타임 값은 Kubernetes Secret 기준으로 주입한다
- prod 배포에서는 빌드 타임 값과 런타임 값이 서로 다른 경로로 들어오므로 둘을 분리해서 확인해야 한다

## 운영 중 자주 틀리는 포인트

- `NEXT_PUBLIC_*` 값이 런타임에만 들어가면 브라우저 번들에는 반영되지 않는다
- `SENTRY_DSN`이 비면 prod UI 초기화가 비정상적으로 보일 수 있다
- `APP_URL`이 비거나 잘못되면 AI 완료 후에도 web 쪽 후속 호출이 실패할 수 있다
- LangSmith key가 비면 프로젝트 생성이나 후속 처리 경로가 런타임에서 실패할 수 있다
- Secret 값이 문자열 그대로 들어가야 하는데 이미 escape/literal 변환된 값을 넣으면 DB password 같은 값이 이중 변환될 수 있다

## 추천 확인 순서

1. 빌드 타임 값인지 런타임 값인지 먼저 구분한다
2. Compose와 Cluster 중 어느 환경에서 재현되는지 분리한다
3. Jenkins 주입값, Kubernetes Secret, 실제 Pod env를 교차 검증한다
4. 그 다음에 Clerk, Supabase, LangSmith, Sentry 같은 외부 연동을 의심한다
5. Compose와 Cluster를 같은 계정으로 교차 테스트했다면 webhook 비대칭 때문에 DB 정합성이 깨진 것은 아닌지 함께 본다

## 읽는 방법

- 인프라 차이는 [`../../infra/docs/reference/infra-dev-vs-prod.md`](../../infra/docs/reference/infra-dev-vs-prod.md)
- 인프라 Secret / webhook / 배포 경로 이슈는 `../../infra/docs/troubleshooting/` 문서들
- Clerk webhook 자체 증상은 [`../troubleshooting/CLERK_WEBHOOK_USER_SYNC.md`](../troubleshooting/CLERK_WEBHOOK_USER_SYNC.md)
