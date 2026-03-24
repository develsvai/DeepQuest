# KeyAchievement STAR-L 필드 배열화 리팩토링

## 개요

**목적:** KeyAchievement의 STAR-L 필드를 단일 문자열에서 문자열 배열로 변경하여 AI 서버가 생성하는 다중 항목 데이터를 정확히 저장/표시

**변경 범위:**

- AI Server 스키마 변경 (`/ai`)
- DB Schema 변경 및 마이그레이션 (`/web`)
- Contract Schema 변경 (Zod)
- Service Layer 변경
- UI 컴포넌트 변경

---

## 1. 변경 사항 요약

### 필드 변경

| 기존 필드    | 신규 필드     | 타입 변경              |
| ------------ | ------------- | ---------------------- |
| `problem`    | `problems`    | `String?` → `String[]` |
| `action`     | `actions`     | `String?` → `String[]` |
| `result`     | `results`     | `String?` → `String[]` |
| `reflection` | `reflections` | `String?` → `String[]` |

### 레이어별 변경

| 레이어       | 기존 타입               | 신규 타입                         |
| ------------ | ----------------------- | --------------------------------- |
| AI Server    | `str \| None`           | `list[str] \| None`               |
| Prisma       | `String? @db.Text`      | `String[] @default([])`           |
| Zod Contract | `z.string().nullable()` | `z.array(z.string()).default([])` |
| UI Display   | 단일 텍스트             | Bullet list                       |

### 마이그레이션 전략

기존 단일 문자열 데이터를 단일 요소 배열로 변환 (데이터 손실 없음)

---

## 2. 수정 대상 파일

### AI Server (`/ai`)

| 파일                                 | 변경 내용                       |
| ------------------------------------ | ------------------------------- |
| `src/common/schemas/project.py`      | Pydantic 모델 필드명/타입 변경  |
| `src/graphs/question_gen/convert.py` | 프롬프트 생성 시 배열 순회 처리 |

### Frontend (`/web`)

| 파일                                                          | 변경 내용                            |
| ------------------------------------------------------------- | ------------------------------------ |
| `prisma/schema.prisma`                                        | KeyAchievement 모델 필드 변경        |
| `src/server/services/ai/contracts/schemas/resumeParsingV2.ts` | Zod 스키마 필드명/타입 변경          |
| `src/server/services/interview-prep/resume-data.service.ts`   | 데이터 저장 로직 필드명 변경         |
| `.../[experienceId]/_components/ExperienceDetail.tsx`         | 배열 → Bullet list 렌더링            |
| `.../[experienceId]/_components/KeyAchievementDialog.tsx`     | 폼 입력/출력 배열 처리 (줄바꿈 파싱) |

### 변경 불필요 (Prisma 타입 자동 추론)

- `src/server/services/experience-detail/experience-detail.service.ts`
- `src/server/services/experience-detail/types.ts`
- `src/app/.../InterviewPrepDetail.types.ts`

---

## 3. 리팩토링 체크리스트

### Phase 1: AI Server 스키마 변경

- [x] `project.py`: KeyAchievement 필드명 변경 (problem → problems 등)
- [x] `project.py`: 타입 변경 (`str | None` → `list[str] | None`)
- [x] `convert.py`: 프롬프트 생성 로직에서 배열 순회 처리
- [x] `uv run make lint` 통과 확인

### Phase 2: DB Schema 변경 및 마이그레이션

- [x] `schema.prisma`: KeyAchievement 필드명/타입 변경
- [x] Migration 파일 생성 (새 배열 컬럼 추가)
- [x] Migration: 기존 데이터를 단일 요소 배열로 변환
- [x] Migration: 기존 컬럼 삭제
- [x] `pnpm db:generate` 실행
- [x] `pnpm type-check` 통과 확인

### Phase 3: Contract 및 Service Layer 변경

- [x] `resumeParsingV2.ts`: Zod 스키마 필드명/타입 변경
- [x] `resume-data.service.ts`: 저장 로직 필드명 변경
- [x] `pnpm type-check` 통과 확인

### Phase 4: UI 컴포넌트 변경

- [x] `ExperienceDetail.tsx`: 배열 데이터 Bullet list 렌더링
- [x] `ExperienceDetail.tsx`: handleSave 함수 배열 필드 처리
- [x] `KeyAchievementDialog.tsx`: 폼 스키마 변경 (텍스트 → 배열 변환)
- [x] `KeyAchievementDialog.tsx`: 초기값 로딩 시 배열 로딩 처리 (useFieldArray)
- [x] `pnpm check-all` 통과 확인

### Phase 5: 통합 테스트

- [x] 기존 데이터 마이그레이션 후 정상 표시 확인
- [x] AI 서버 → Webhook → DB 저장 플로우 확인
- [x] 새 KeyAchievement 생성 시 배열 저장 확인
- [x] 편집 시 배열 데이터 유지 확인
- [x] 빈 배열 graceful 처리 확인

---

## 4. 롤백 계획

문제 발생 시 역방향 마이그레이션:

1. 기존 단일 문자열 컬럼 복원
2. 배열의 첫 번째 요소를 단일 문자열로 추출
3. 배열 컬럼 삭제

---

## 5. 향후 고려사항 (Out of Scope)

- UI에서 개별 항목 드래그앤드롭 정렬 기능
- ~~항목별 삭제/추가 UI~~ → Phase 4에서 useFieldArray 기반 UI 구현 완료

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                      |
| ---------- | ---- | ---------------------------------------------- |
| 2025-12-03 | v1.0 | 초안 작성                                      |
| 2025-12-03 | v1.1 | Phase 4 완료 - UI 컴포넌트 배열 처리 구현 완료 |
