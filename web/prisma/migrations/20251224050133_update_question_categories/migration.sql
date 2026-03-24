-- Question Category 분류 체계 업데이트
-- 기존: TECHNICAL_DECISION, IMPLEMENTATION, PERFORMANCE, TECH_COMPARISON, JD_BRIDGE
-- 신규: TECHNICAL_DECISION, TECHNICAL_DEPTH, PROBLEM_SOLVING, SCALABILITY

BEGIN;

-- 1. 기존 데이터 매핑 (삭제될 값들을 유지될 값으로 변환)
UPDATE "questions" SET category = 'TECHNICAL_DECISION' WHERE category = 'TECH_COMPARISON';
UPDATE "questions" SET category = 'TECHNICAL_DECISION' WHERE category = 'JD_BRIDGE';

-- 2. enum 값 이름 변경 (PostgreSQL 10+)
ALTER TYPE "QuestionCategory" RENAME VALUE 'IMPLEMENTATION' TO 'TECHNICAL_DEPTH';
ALTER TYPE "QuestionCategory" RENAME VALUE 'PERFORMANCE' TO 'SCALABILITY';

-- 3. 새 값 추가
ALTER TYPE "QuestionCategory" ADD VALUE IF NOT EXISTS 'PROBLEM_SOLVING';

-- 4. 사용하지 않는 값 정리를 위한 enum 재생성
-- Note: PostgreSQL에서 enum 값 삭제는 복잡하므로, 새 enum으로 교체
CREATE TYPE "QuestionCategory_new" AS ENUM ('TECHNICAL_DECISION', 'TECHNICAL_DEPTH', 'PROBLEM_SOLVING', 'SCALABILITY');
ALTER TABLE "questions" ALTER COLUMN "category" TYPE "QuestionCategory_new" USING ("category"::text::"QuestionCategory_new");
ALTER TYPE "QuestionCategory" RENAME TO "QuestionCategory_old";
ALTER TYPE "QuestionCategory_new" RENAME TO "QuestionCategory";
DROP TYPE "QuestionCategory_old";

COMMIT;
