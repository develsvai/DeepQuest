# Web Runtime Auth And Webhooks

## 발생 조건

- Web 빌드/런타임 변경, Clerk 설정 변경, Webhook 연동 변경 시

## 대표 증상

- pnpm lockfile / Prisma COPY 오류
- 로그인 후 404
- Clerk publishable key 오류
- `An unexpected error occurred`
- Clerk webhook 키 이름 불일치
- 외부 연동은 성공처럼 보이는데 내부 처리가 이상함

## 판단 과정

- Web build env와 Next.js 설정 확인
- Clerk key, webhook secret, APP_URL 계열 값 확인
- tRPC / webhook route 로그와 Secret 키 이름 대조

## 근본 원인

- 빌드 입력 env 불일치
- local/prod 인증 설정 혼선
- Webhook URL / secret name mismatch
- Web 쪽 에러가 DB/AI 연결 오류를 감춘 경우

## 해결 방법

- Jenkins `web-build-env`와 K8s `web-secret`를 분리해서 점검
- Clerk 관련 키는 이름과 환경을 엄격히 맞춘다
- webhook debugging 시 Web과 AI 양쪽 로그를 같이 본다

## 확인 방법

```bash
kubectl logs -n deep-quest deploy/web-server --tail=200
kubectl exec -n deep-quest deploy/web-server -- env | rg 'CLERK|APP_URL|SENTRY'
```

## 검색 키워드

- clerk 404
- webhook secret mismatch
- trpc unexpected error
- publishable key error

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 4-5장, 8장
