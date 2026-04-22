# Database And Prisma Issues

확인 시점: `2026-04-20 KST`  
대상 환경: `deep-quest` Postgres, Prisma, LangGraph DB

## 발생 조건

- Docker Compose 또는 K8s에서 Postgres를 처음 띄우거나 재구성할 때
- Prisma 마이그레이션, DB 연결, 인증 정보가 어긋날 때

## 대표 증상

- `initdb ... directory exists but is not empty`
- Postgres Pod `CrashLoopBackOff`
- `database does not exist`
- `P1000`
- `P2021`
- `DIRECT_URL` 누락
- 부하 실험 중 `too many clients already`
- baseline 복귀가 비정상적으로 느림

## 판단 과정

- Docker 볼륨 잔존 여부 확인
- StatefulSet securityContext / volumeMount 확인
- `postgres-service` 연결 정보와 Secret 값 확인
- Prisma env와 포트포워드 마이그레이션 경로 확인
- runtime, worker, exporter가 Postgres에 각각 얼마나 연결하는지 확인
- `max_connections`, 현재 active connection 수, 에러 시점의 workload를 같이 본다

## 근본 원인

- 초기화 디렉터리와 볼륨 상태 불일치
- K8s 권한/마운트 구성 충돌
- DB 생성 누락
- URL 인코딩/비밀번호 불일치
- Prisma용 `DIRECT_URL` 또는 migrate 절차 누락
- 기본 `max_connections=100`이 LangGraph runtime, worker, exporter가 동시에 붙는 현재 구조에 비해 낮을 수 있다

## 해결 방법

- Docker Postgres는 필요 시 `down -v`로 초기화
- K8s Postgres는 `fsGroup`, mount, config 사용 방식을 점검
- DB가 없으면 Postgres Pod에서 직접 생성
- 비밀번호에 `@`가 있으면 `%40` 인코딩
- Prisma migrate는 port-forward 후 로컬 또는 pod 내부에서 실행
- runtime 병목이면 `max_connections`를 단계적으로 올리며 active connection 수와 메모리 영향까지 함께 재검증한다

## 확인 방법

```bash
kubectl get pods -n deep-quest
kubectl logs -n deep-quest postgres-0
kubectl exec -n deep-quest postgres-0 -- psql -U deepquest -d postgres -c '\l'
kubectl exec -n deep-quest postgres-0 -- psql -U deepquest -d postgres -c 'show max_connections;'
```

## 검색 키워드

- postgres crashloop
- prisma p1000
- prisma p2021
- direct_url missing
- deepquest database does not exist
- too many clients already
- postgres connection ceiling

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 1-2장

## 원본 판단 로그

- Postgres connection 병목
