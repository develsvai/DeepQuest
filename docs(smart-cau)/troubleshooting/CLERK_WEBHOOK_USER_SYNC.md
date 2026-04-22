# DB에 유저가 안 들어올 때 (Clerk 웹훅)

## 흐름

1. 사용자가 **Clerk로 가입** (sign-up)
2. **Clerk 서버**가 `user.created` 이벤트를 **당신 앱의 웹훅 URL**로 POST
3. 앱의 `POST /api/webhooks/clerk`가 요청을 검증 후 `userService.createFromClerk` → **DB에 User 생성**

즉, DB에 유저가 들어오는 **유일한 경로**는 Clerk 웹훅입니다.

## 왜 안 들어오나요? (가능 원인)

### 1. Clerk가 웹훅 URL에 도달하지 못함 (가장 흔함)

- 웹훅은 **Clerk 서버(인터넷)** → **당신 앱 URL** 로 호출됩니다.
- 앱이 **localhost** 또는 **사설 IP**(예: `192.168.0.7:3000`)에서만 떠 있으면, Clerk 쪽에서 **접속할 수 없습니다**.
- 그 경우 웹훅 요청이 실패하거나 타임아웃 → **user.created 가 앱에 도달하지 않음** → DB에 유저 생성 안 됨.

### 2. Clerk 대시보드에 웹훅이 없거나 URL/시크릿 불일치

- **Webhook URL**이 등록되지 않았거나, 등록된 URL이 실제 서비스 URL과 다름.
- **Signing Secret**이 Clerk에 등록된 값과 앱의 `CLERK_WEBHOOK_SIGNING_SECRET`이 다르면 검증 실패 → 401 등으로 실패.

### 3. 시크릿/환경 변수

- `CLERK_WEBHOOK_SIGNING_SECRET`이 비어 있으면 500, 잘못되면 검증 실패.

## 확인 방법

1. **Clerk Dashboard**  
   - [Clerk Dashboard](https://dashboard.clerk.com) → 해당 앱 → **Webhooks**  
   - 엔드포인트 URL이 **인터넷에서 접근 가능한 URL**인지 확인 (예: `https://your-domain.com/api/webhooks/clerk`).
2. **배달 로그**  
   - 같은 화면에서 최근 배달 시도/성공/실패 로그 확인. 실패 시 원인(타임아웃, 4xx/5xx) 확인.
3. **앱 로그**  
   - 웹 서버(컨테이너) 로그에서 `/api/webhooks/clerk` 요청이 오는지, 500/400 에러가 나는지 확인.

## 로컬/사설 IP에서 테스트하려면

- Clerk가 **공인에서 접근 가능한 URL**로만 웹훅을 보냅니다.
- **ngrok** 등 터널 사용:
  1. `ngrok http 3000` 등으로 터널 URL 생성 (예: `https://xxxx.ngrok.io`).
  2. Clerk Webhooks에 **Endpoint URL**을 `https://xxxx.ngrok.io/api/webhooks/clerk` 로 등록.
  3. 해당 엔드포인트에 표시된 **Signing Secret**을 앱의 `CLERK_WEBHOOK_SIGNING_SECRET`에 설정.
  4. 가입 시 웹훅이 ngrok → 로컬 앱으로 전달되면 DB에 유저 생성됨.

## 요약

| 원인                     | 대응 |
|--------------------------|------|
| 웹훅 URL이 local/사설 IP | 공인 URL로 노출(배포 또는 ngrok) 후 Clerk에 해당 URL 등록 |
| Clerk에 웹훅 미등록/URL 잘못됨 | Dashboard에서 URL·시크릿 확인 및 수정 |
| Signing Secret 불일치   | Clerk 엔드포인트의 Signing Secret과 `CLERK_WEBHOOK_SIGNING_SECRET` 동일하게 설정 |

위를 맞춘 뒤에도 유저가 안 들어오면, Clerk Webhooks 배달 로그와 앱의 `/api/webhooks/clerk` 로그를 함께 보면 원인 좁히기 쉽습니다.
