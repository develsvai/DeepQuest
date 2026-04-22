# 인프라 상태

검증된 인프라 상태 스냅샷을 이곳에 기록한다.

문서 구조는 `../reference/document-writing-rules.md`와 `../../.codex/skills/update-infra-state/SKILL.md`를 함께 따른다.

## 파일 규칙

- 스냅샷 파일명은 `YYYY-MM-DD-live.md` 형식을 사용한다
- 한 파일은 한 시점의 검증된 상태만 담는다
- 스냅샷은 매니페스트, 스크립트, 관측 증거로 확인된 사실만 기록한다
- 추정, 설계 의도, 희망 상태는 넣지 않는다
- 원인 해석, 우선순위 판단, 다음 후보는 `../tasks/` 또는 `../troubleshooting/`에 둔다
- 필요한 경우 마지막에 관련 `status`, `task`, `troubleshooting` 링크만 남긴다

## 기본 헤더

```md
# INFRA STATE

- Captured at: YYYY-MM-DD KST
- Kubernetes context: `...`
- Primary namespace: `...`
```

## 권장 섹션

- 노드
- 스토리지
- 네트워크
- 서비스

## 권장 세부 구조

```md
## 노드
### Kubernetes nodes
### 기타 운영 호스트

## 스토리지
### PVC / PV / 백업 저장소
### 디스크 정리 또는 trim 증거

## 네트워크
### ingress
### 서비스
### 외부 노출 서비스

## 서비스
### 워크로드
### 실행 중 파드
### Autoscaling
### Scheduled jobs
### 호스트 시스템 cron / timer
```

## 작성 규칙

- 표와 불릿을 섞어도 되지만 사실을 빠르게 스캔할 수 있게 쓴다
- 현재 실제로 존재하는 리소스 이름, 이미지 태그, IP, 스케줄을 그대로 적는다
- 호스트 작업이 클러스터 운영에 직접 영향을 주면 같은 스냅샷에 함께 적는다
- 로그를 인용할 때는 관측된 사실만 짧게 적고 해석은 넣지 않는다
