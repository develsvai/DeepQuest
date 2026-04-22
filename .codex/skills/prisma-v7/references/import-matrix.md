# Prisma 7 Import Matrix

현재 레포의 기본 기준은 `web/prisma/schema.prisma`의 아래 generator 설정이다.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

## import 기준

- 서버 코드:
  `@/generated/prisma/client`
- 브라우저 타입:
  `@/generated/prisma/browser`
- enum:
  `@/generated/prisma/enums`
- model/type 세부 사용:
  `@/generated/prisma/client` 또는 generated 하위 파일

## 빠른 판단표

| 상황 | 권장 import |
| --- | --- |
| `PrismaClient`가 필요함 | `@/generated/prisma/client` |
| `Prisma` namespace type이 필요함 | `@/generated/prisma/client` |
| enum만 필요함 | `@/generated/prisma/enums` |
| 브라우저에서 타입만 필요함 | `@/generated/prisma/browser` |

## 피할 패턴

- `@prisma/client`를 새 코드에 직접 import
- enum과 client 타입을 루트 한 곳에서 섞어 가져오는 예전 v6 습관
- generated 경로를 확인하지 않고 import 경로를 추정으로 작성

