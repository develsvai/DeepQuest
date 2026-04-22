# Question Category Sync Guide

## 📖 Overview

이 문서는 `/web`과 `/ai` 프로젝트 간 Question Category 동기화를 위한 가이드입니다.

**핵심 원칙:**

- Prisma enum (`web/prisma/schema.prisma`)이 **source of truth**
- UI 매핑(아이콘, 색상)은 **각 컴포넌트에서 직접 정의**
- `/web`과 `/ai` 간 동기화는 **수동으로 관리**

---

## 📁 현재 카테고리 목록

| ID                   | 한국어             | English                          |
| -------------------- | ------------------ | -------------------------------- |
| `TECHNICAL_DECISION` | 기술적 의사결정    | Technical Decision Making        |
| `TECHNICAL_DEPTH`    | 기술적 깊이와 원리 | Technical Depth & Principles     |
| `PROBLEM_SOLVING`    | 문제 해결 및 검증  | Problem Solving & Verification   |
| `SCALABILITY`        | 확장 가능성        | Scalability                      |

---

## 🔄 카테고리 변경 시 수정 필요 파일

### `/web` 프로젝트

| 파일                                        | 수정 내용                     |
| ------------------------------------------- | ----------------------------- |
| `prisma/schema.prisma`                      | `enum QuestionCategory` 수정  |
| `locales/ko/common.json`                    | `questionCategory` 섹션 수정  |
| `locales/en/common.json`                    | `questionCategory` 섹션 수정  |

**UI 매핑 (각 컴포넌트에서 직접 정의):**

| 파일                                                      | 수정 내용          |
| --------------------------------------------------------- | ------------------ |
| `src/app/.../[experienceId]/_components/TopicSelectionDialog.tsx` | `CATEGORY_ICONS`   |
| `src/app/.../questions/_components/QuestionDialog.tsx`    | `CATEGORY_OPTIONS` |
| `src/app/.../[questionId]/_components/QuestionDetail.tsx` | `CATEGORY_ICONS`   |
| `src/components/ui/category-badge.tsx`                    | `CATEGORY_COLORS`  |

### `/ai` 프로젝트

| 파일                                          | 수정 내용                          |
| --------------------------------------------- | ---------------------------------- |
| `src/common/schemas/question_category.py`     | Python enum + metadata + helpers   |

---

## 🚀 변경 절차

### 1. 카테고리 추가

```bash
# 1. Prisma schema 수정
# web/prisma/schema.prisma
enum QuestionCategory {
  TECHNICAL_DECISION
  TECHNICAL_DEPTH
  PROBLEM_SOLVING
  SCALABILITY
  NEW_CATEGORY        # 추가
}

# 2. Prisma Client 재생성
cd web && pnpm prisma generate

# 3. i18n 파일 수정
# locales/ko/common.json, locales/en/common.json

# 4. UI 매핑 파일 수정 (CATEGORY_ICONS, CATEGORY_COLORS 등)

# 5. AI 서버 Python enum 수정
# ai/src/common/schemas/question_category.py

# 6. 타입 체크
cd web && pnpm check-all
cd ai && uv run mypy src
```

### 2. 카테고리 삭제

```bash
# 1. 해당 카테고리를 사용하는 코드 먼저 수정
#    - DB에 해당 카테고리 데이터가 있는지 확인

# 2. Prisma schema에서 제거 후 migration
cd web
pnpm prisma migrate dev --name remove_category

# 3. 나머지 파일들 수정 (위 목록 참조)
```

### 3. 카테고리 이름 변경

```bash
# 1. i18n 파일만 수정
# locales/ko/common.json, locales/en/common.json

# ID(enum 값)는 변경하지 않음 - DB 데이터에 영향
```

---

## ✅ 검증

```bash
# Frontend
cd web
pnpm check-all

# AI Server
cd ai
uv run mypy src
```

---

## 📚 Related Files

- `/web/CLAUDE.md` - Frontend 개발 가이드
- `/ai/CLAUDE.md` - AI 서버 개발 가이드
- `/.specify/memory/constitution.md` - 프로젝트 원칙
