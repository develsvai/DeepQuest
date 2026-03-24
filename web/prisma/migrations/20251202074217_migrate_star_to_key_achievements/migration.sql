-- AlterTable
ALTER TABLE "career_experiences" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_experiences" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- =============================================
-- Phase 4: STAR 배열 → KeyAchievement 데이터 마이그레이션
-- =============================================

-- 1. CareerExperience STAR → KeyAchievement 변환
-- 배열 중 가장 긴 것 기준으로 레코드 생성
INSERT INTO "key_achievements" (
  "careerExperienceId",
  "title",
  "problem",
  "action",
  "result",
  "reflection",
  "orderIndex"
)
SELECT
  ce.id,
  'Achievement ' || idx AS title,
  -- situation과 task를 줄바꿈으로 결합
  NULLIF(
    COALESCE(ce.situation[idx], '') ||
    CASE WHEN ce.situation[idx] IS NOT NULL AND ce.task[idx] IS NOT NULL
         THEN E'\n\n' ELSE '' END ||
    COALESCE(ce.task[idx], ''),
    ''
  ) AS problem,
  ce.action[idx] AS action,
  ce.result[idx] AS result,
  NULL AS reflection,
  idx - 1 AS "orderIndex"
FROM career_experiences ce
CROSS JOIN LATERAL generate_series(
  1,
  GREATEST(
    COALESCE(array_length(ce.situation, 1), 0),
    COALESCE(array_length(ce.task, 1), 0),
    COALESCE(array_length(ce.action, 1), 0),
    COALESCE(array_length(ce.result, 1), 0)
  )
) AS idx
WHERE GREATEST(
  COALESCE(array_length(ce.situation, 1), 0),
  COALESCE(array_length(ce.task, 1), 0),
  COALESCE(array_length(ce.action, 1), 0),
  COALESCE(array_length(ce.result, 1), 0)
) > 0;

-- 2. ProjectExperience STAR → KeyAchievement 변환
INSERT INTO "key_achievements" (
  "projectExperienceId",
  "title",
  "problem",
  "action",
  "result",
  "reflection",
  "orderIndex"
)
SELECT
  pe.id,
  'Achievement ' || idx AS title,
  NULLIF(
    COALESCE(pe.situation[idx], '') ||
    CASE WHEN pe.situation[idx] IS NOT NULL AND pe.task[idx] IS NOT NULL
         THEN E'\n\n' ELSE '' END ||
    COALESCE(pe.task[idx], ''),
    ''
  ) AS problem,
  pe.action[idx] AS action,
  pe.result[idx] AS result,
  NULL AS reflection,
  idx - 1 AS "orderIndex"
FROM project_experiences pe
CROSS JOIN LATERAL generate_series(
  1,
  GREATEST(
    COALESCE(array_length(pe.situation, 1), 0),
    COALESCE(array_length(pe.task, 1), 0),
    COALESCE(array_length(pe.action, 1), 0),
    COALESCE(array_length(pe.result, 1), 0)
  )
) AS idx
WHERE GREATEST(
  COALESCE(array_length(pe.situation, 1), 0),
  COALESCE(array_length(pe.task, 1), 0),
  COALESCE(array_length(pe.action, 1), 0),
  COALESCE(array_length(pe.result, 1), 0)
) > 0;

-- 3. EmployeeType.EMPLOYEE → FULL_TIME 변환
UPDATE career_experiences
SET "employeeType" = 'FULL_TIME'
WHERE "employeeType" = 'EMPLOYEE';
