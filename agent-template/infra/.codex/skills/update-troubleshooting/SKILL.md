---
name: update-troubleshooting
description: 단순하지 않거나 재발 가능성이 있거나 초기에 원인이 불명확했던 인프라 이슈를 기존 트러블슈팅 문서에 먼저 흡수하고, 기존 범주로 설명되지 않을 때만 새 문서를 만든다.
---

# 트러블슈팅 갱신

## 목표

`infra/docs/troubleshooting/` 아래의 기존 문서를 먼저 구체화하고, 기존 범주로 설명되지 않을 때만 새 문서를 만든다.
이 skill이 사실상 `new-troubleshooting` 역할까지 포함하며, 기본값은 항상 "기존 문서에 먼저 흡수"다.

## 작업 순서

1. 먼저 `infra/docs/reference/document-writing-rules.md`를 읽는다
2. `infra/docs/troubleshooting/README.md`를 읽고 현재 카테고리와 권장 섹션을 확인한다
3. 기존 `infra/docs/troubleshooting/` 문서에 흡수할 수 있는지 판단한다
4. 가능하면 기존 문서를 더 구체화하고, 정말 맞는 범주가 없을 때만 새 파일을 만든다

## 출력 형식

# Issue Title

확인 시점: `YYYY-MM-DD` 또는 `YYYY-MM-DD ~ YYYY-MM-DD`
대상 환경: `...`

## 발생 조건
## 증상
## 판단 과정
## 근본 원인
## 해결 방법
## 확인 방법
## 검색 키워드

## 규칙

- 먼저 기존 `infra/docs/troubleshooting/` 문서에 합칠 수 있는지 판단한다
- 기존 문서의 발생 조건, 증상, 판단 과정, 해결 방법을 더 구체화하는 편이 맞으면 새 파일을 만들지 않고 기존 문서를 갱신한다
- 기존 문서 어느 곳에도 자연스럽게 들어가지 않을 때만 새 문서를 만든다
- 별도 `new-troubleshooting` skill을 기대하지 말고, 새 문서가 필요할 때도 이 skill 안에서 처리한다
- 새 문서를 만들 때는 상단에 `확인 시점`, `대상 환경`을 현재 인프라 문서 톤에 맞게 넣는다
- 압축적으로 작성한다
- 원시 로그 덤프를 피한다
- 실제 원인과 검증 결과를 기록한다
