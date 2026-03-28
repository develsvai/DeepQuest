# Clerk 웹훅으로 유저가 DB에 생성되지 않을 때

## 발생 조건

- 사용자는 Clerk 가입을 완료했는데 애플리케이션 DB에 해당 유저 레코드가 생성되지 않는다
- `/api/webhooks/clerk`를 통한 동기화가 기대되지만 실제 반영이 없다
- 로그인은 되지만 프로젝트 생성 또는 대시보드 진입 단계에서 후속 오류가 발생한다
- Compose와 Cluster가 같은 Clerk tenant를 공유하면서 웹훅 연결 상태가 다르면 한쪽 DB만 user가 남거나 비는 비대칭 상태가 생길 수 있다

## 증상

- 가입은 성공했지만 애플리케이션 내부 사용자 데이터가 비어 있다
- Clerk 대시보드의 웹훅 배달이 실패하거나 타임아웃될 수 있다
- 앱 로그에서 `/api/webhooks/clerk` 요청이 아예 보이지 않거나 검증 실패가 발생한다
- webhook route는 200을 주는 것처럼 보이지만 실제 DB user 생성은 실패할 수 있다
- tRPC 에러나 일반 런타임 에러로만 보여 근본 원인이 webhook/DB인지 헷갈릴 수 있다

## 판단 과정

1. 이 흐름에서 DB 유저 생성은 Clerk 웹훅이 정상 도달하고 검증될 때만 발생하는지 확인한다
2. 웹훅 URL이 외부에서 접근 가능한 주소인지 확인한다
3. Clerk Dashboard의 Webhook URL과 Signing Secret이 실제 앱 설정과 일치하는지 확인한다
4. 앱 로그와 Clerk 배달 로그를 함께 비교해 요청 미도달인지, 검증 실패인지, 서버 에러인지 구분한다
5. webhook 요청이 실제로 들어오고 있다면 DB password, DB 연결, 런타임 secret 정합성을 다시 확인한다
6. `APP_URL`, LangSmith key 같은 후속 처리 값이 비어 있어 user 생성 이후 단계가 실패하는 것은 아닌지 분리한다
7. 같은 계정을 Compose와 Cluster에서 번갈아 테스트했다면 두 환경의 Clerk webhook 연결 상태와 DB user 존재 여부를 함께 비교한다

## 근본 원인

- 가장 흔한 원인은 웹훅 URL이 `localhost` 또는 사설 IP라서 Clerk 서버가 접근하지 못하는 경우다
- 다음으로 흔한 원인은 Clerk에 등록된 Webhook URL 또는 Signing Secret이 앱 환경 변수와 불일치하는 경우다
- `CLERK_WEBHOOK_SIGNING_SECRET` 누락이나 오설정도 직접 원인이 된다
- Compose와 Cluster가 같은 Clerk 사용자 풀을 공유하는데 한쪽만 webhook이 연결되어 있거나 중간에 끊기면 user.create 또는 user.deleted가 한쪽 DB에만 반영되는 정합성 붕괴가 생길 수 있다
- 이 상태에서는 로그인은 성공해도 Clerk가 이미 존재하는 사용자로 판단해 create 이벤트를 다시 만들지 않아 DB user가 비어 있는 채로 남을 수 있다
- 이번 계열 장애에서는 Clerk 자체보다 DB password secret 값이 잘못 들어가 webhook 내부 DB 쓰기가 실패한 사례가 있었다
  - Secret 값이 이미 literal/escape 변환된 상태로 저장돼 있었고
  - Pod 주입 시 다시 문자열 변환되며 실제 DB password가 어긋났다
  - 그 결과 webhook route는 호출돼도 DB user 생성은 실패했다

## 해결 방법

1. Clerk Webhooks에 인터넷에서 접근 가능한 엔드포인트를 등록한다
2. 엔드포인트 URL을 실제 앱의 `/api/webhooks/clerk`로 맞춘다
3. Clerk가 제공한 Signing Secret을 앱의 `CLERK_WEBHOOK_SIGNING_SECRET`과 동일하게 맞춘다
4. 로컬 환경에서는 `ngrok` 같은 터널을 사용해 공개 URL을 만든다
5. webhook이 들어오는데도 유저가 생성되지 않으면 DB password, DB URL, 실제 Pod env를 다시 확인한다
6. Secret에는 DB password를 최종 문자열 값 그대로 넣고, 이미 escape/literal 처리된 값을 다시 넣지 않는다
7. 수정 후 Clerk Dashboard 배달 로그, 앱 로그, DB user 생성 여부를 다시 함께 확인한다
8. Compose와 Cluster를 병행 운영한다면 Clerk tenant, webhook endpoint, 테스트 계정을 환경별로 분리하거나 최소한 교차 테스트 전에 기존 user와 DB 상태를 정리한다

## 확인 방법

- Clerk Dashboard에서 최근 `user.created` 배달이 성공으로 표시되는지 확인한다
- 앱 로그에 `/api/webhooks/clerk` 요청 수신과 검증 성공 흐름이 보이는지 확인한다
- 가입 직후 애플리케이션 DB에 유저 레코드가 실제 생성되는지 확인한다
- webhook route가 200을 주더라도 DB write 실패 로그가 없는지 따로 확인한다
- 동일 계정을 Compose와 Cluster에서 번갈아 테스트했다면 두 환경의 DB / Clerk 사용자 상태를 정리한 뒤 다시 검증한다
- 한쪽 환경에서 user 삭제가 반영됐는데 다른 쪽 DB에만 남아 있는지까지 확인한다

## 검색 키워드

- Clerk webhook user.created
- CLERK_WEBHOOK_SIGNING_SECRET
- `/api/webhooks/clerk`
- ngrok clerk webhook
- user sync failed
- DB password literal secret
- webhook 200 but user not created
