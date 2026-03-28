# Jenkins And Build Agents

## 발생 조건

- Jenkins 빌드, helper 프로세스, SSH build agent, Harbor push 경로 점검 시

## 대표 증상

- `spawn helper` 오류
- `Failed to exec spawn helper`
- `Cannot run program nohup`
- 에이전트 환경 부족으로 AI 빌드 실패
- build env credential과 실제 빌드 결과 불일치
- 부분 빌드 시 Harbor의 `${DEPLOY_ENV}` 태그 이미지 pull 또는 재태깅 실패
- Jenkins가 submodule을 받지 못해 infra 경로가 비거나 예상 파일이 없음

## 판단 과정

- Jenkins node가 `docker-build` 에이전트인지 확인
- SSH 에이전트에서 Python / uv / Docker 버전 확인
- helper 관련 프로세스, 메모리, 프로세스 한도 확인
- main / develop 중 어느 브랜치에 submodule 설정이 실제 반영돼 있는지 확인
- Jenkins 파라미터에서 어떤 이미지(`BUILD_AI`, `BUILD_WEB`, `BUILD_LANGGRAPH_METRICS`)만 선택했는지 확인
- 부분 빌드라면 Harbor에 `${image}:${DEPLOY_ENV}` 태그가 실제로 존재하는지 먼저 확인
- `deploy` 브랜치의 `k8s/overlays/prod/kustomization.yaml`에서 세 이미지 항목이 모두 같은 새 `BUILD_TAG`로 바뀌었는지 확인

## 근본 원인

- 빌드 에이전트 환경 누락
- SSH 에이전트 호스트와 Jenkins controller 기대치 불일치
- 빌드 프로세스 한도/메모리 설정 문제
- 부분 빌드 시 Jenkins가 빌드하지 않은 이미지를 `${DEPLOY_ENV}` 태그에서 새 `${BUILD_TAG}`로 복제하므로, 기준 `${DEPLOY_ENV}` 이미지가 없거나 pull 권한/접속에 문제가 있으면 태그 동기화가 실패함
- submodule 설정이 실제 빌드 브랜치에 반영되지 않아 Jenkins checkout 결과가 기대와 달라질 수 있음

## 해결 방법

- `ssh station` 기준 환경을 표준 빌드 에이전트로 본다
- AI 빌드 표준은 `langgraph build`
- helper 오류 시 프로세스/메모리/overcommit 먼저 확인
- `spawn helper` / `nohup` 계열 오류가 보이면 station 호스트의 메모리, 프로세스 한도, 디스크 여유 공간부터 확인한다
- submodule 문제면 Jenkins가 실제 체크아웃하는 브랜치에 `.gitmodules`와 submodule 참조가 반영돼 있는지 먼저 맞춘다
- 부분 빌드 전 Harbor의 `${DEPLOY_ENV}` 태그 이미지 상태를 먼저 확인한다
- `${DEPLOY_ENV}` 태그가 비었거나 오래되었으면 해당 이미지를 다시 빌드하거나 기준 태그를 복구한 뒤 재시도한다

## 확인 방법

```bash
ssh station 'python3 --version; uv --version; docker --version'
ssh station 'free -h; ulimit -a; df -h'
```

추가 확인 파일:
- `infra/Jenkinsfile`
- `infra/k8s/overlays/prod/kustomization.yaml`
- `infra/k8s/argocd/application-prod.yaml`

## 검색 키워드

- spawn helper
- cannot run program nohup
- docker-build agent
- langgraph build jenkins
- ssh station
- mixed image tags
- partial build deploy branch
- build_ai build_web mismatch
- retag deploy_env build_tag
- submodule not found

## 원본 문서

- `docs/docs-infra/legacy/트러블슈팅.md` 9장
- `docs/docs-infra/legacy/DeepQuest_Traffic_Test/LOCUST_TEST_TASK_2/langgraph_build_전환_계획.md`
