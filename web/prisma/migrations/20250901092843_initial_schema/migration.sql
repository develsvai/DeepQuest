-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."PreparationStatus" AS ENUM ('PENDING', 'VALIDATING', 'ANALYZING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."QuestionCategory" AS ENUM ('TECHNICAL_CONCEPT', 'IMPLEMENTATION', 'ARCHITECTURE', 'EXPERIENCE', 'BEHAVIORAL', 'PROBLEM_SOLVING');

-- CreateEnum
CREATE TYPE "public"."AnswerStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATED');

-- CreateEnum
CREATE TYPE "public"."Rating" AS ENUM ('SURFACE', 'INTERMEDIATE', 'DEEP');

-- CreateEnum
CREATE TYPE "public"."EmployeeType" AS ENUM ('EMPLOYEE', 'INTERN', 'CONTRACT', 'FREELANCE');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('PERSONAL', 'TEAM', 'OPEN_SOURCE', 'ACADEMIC', 'HACKATHON', 'FREELANCE');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('PDF', 'DOCX', 'DOC');

-- CreateEnum
CREATE TYPE "public"."FileScanStatus" AS ENUM ('PENDING', 'SCANNING', 'CLEAN', 'SUSPICIOUS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'ERROR', 'TIMEOUT', 'INTERRUPTED');

-- CreateEnum
CREATE TYPE "public"."ExperienceType" AS ENUM ('CAREER', 'PROJECT', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."DegreeType" AS ENUM ('BACHELOR', 'MASTER', 'DOCTOR', 'HIGH_SCHOOL', 'ASSOCIATE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "profile_image_url" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interview_preparations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "jobTitle" TEXT,
    "jobDescription" TEXT,
    "jobDescriptionUrl" TEXT,
    "status" "public"."PreparationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "analysisStartedAt" TIMESTAMP(3),
    "analysisCompletedAt" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "completedQuestions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resumes" (
    "id" SERIAL NOT NULL,
    "interviewPreparationId" TEXT NOT NULL,
    "parsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_profiles" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "desiredPosition" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_educations" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "major" TEXT,
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "description" TEXT NOT NULL,
    "degree" "public"."DegreeType",

    CONSTRAINT "candidate_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."career_experiences" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "employeeType" "public"."EmployeeType" NOT NULL,
    "jobLevel" TEXT,
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "techStack" TEXT[],
    "architecture" TEXT,
    "position" TEXT[],
    "situation" TEXT[],
    "task" TEXT[],
    "action" TEXT[],
    "result" TEXT[],

    CONSTRAINT "career_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_experiences" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" "public"."ProjectType" NOT NULL,
    "teamSize" INTEGER,
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "techStack" TEXT[],
    "architecture" TEXT,
    "position" TEXT[],
    "situation" TEXT[],
    "task" TEXT[],
    "action" TEXT[],
    "result" TEXT[],

    CONSTRAINT "project_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."questions" (
    "id" TEXT NOT NULL,
    "interviewPreparationId" TEXT NOT NULL,
    "experienceType" "public"."ExperienceType" DEFAULT 'GENERAL',
    "experienceId" INTEGER,
    "parentQuestionId" TEXT,
    "text" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "public"."QuestionCategory" NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "public"."AnswerStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "lastAutoSaveAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedbacks" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "suggestions" TEXT[],
    "rating" "public"."Rating" NOT NULL,
    "technicalAccuracy" INTEGER,
    "communicationClarity" INTEGER,
    "depthOfKnowledge" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiModel" TEXT,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "public"."FileType" NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL DEFAULT 'resumes',
    "checksum" TEXT,
    "scanStatus" "public"."FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanMessage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewPreparationId" TEXT,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."structured_jds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewPreparationId" TEXT,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "cultureAndValues" TEXT[],
    "teamIntroduction" TEXT[],
    "coreServiceProduct" TEXT[],
    "techStack" TEXT[],
    "responsibilities" TEXT[],
    "qualifications" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "structured_jds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "preparationId" TEXT,
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" JSONB,
    "graphName" TEXT NOT NULL,
    "metadata" JSONB,
    "runId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "interview_preparations_userId_idx" ON "public"."interview_preparations"("userId");

-- CreateIndex
CREATE INDEX "interview_preparations_status_idx" ON "public"."interview_preparations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_interviewPreparationId_key" ON "public"."resumes"("interviewPreparationId");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_resumeId_key" ON "public"."candidate_profiles"("resumeId");

-- CreateIndex
CREATE INDEX "candidate_educations_resumeId_idx" ON "public"."candidate_educations"("resumeId");

-- CreateIndex
CREATE INDEX "career_experiences_resumeId_idx" ON "public"."career_experiences"("resumeId");

-- CreateIndex
CREATE INDEX "project_experiences_resumeId_idx" ON "public"."project_experiences"("resumeId");

-- CreateIndex
CREATE INDEX "questions_interviewPreparationId_idx" ON "public"."questions"("interviewPreparationId");

-- CreateIndex
CREATE INDEX "questions_parentQuestionId_idx" ON "public"."questions"("parentQuestionId");

-- CreateIndex
CREATE INDEX "questions_experienceType_experienceId_idx" ON "public"."questions"("experienceType", "experienceId");

-- CreateIndex
CREATE INDEX "questions_interviewPreparationId_experienceType_experienceI_idx" ON "public"."questions"("interviewPreparationId", "experienceType", "experienceId");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "public"."answers"("questionId");

-- CreateIndex
CREATE INDEX "answers_status_idx" ON "public"."answers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_answerId_key" ON "public"."feedbacks"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "file_uploads_interviewPreparationId_key" ON "public"."file_uploads"("interviewPreparationId");

-- CreateIndex
CREATE INDEX "file_uploads_userId_idx" ON "public"."file_uploads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "structured_jds_interviewPreparationId_key" ON "public"."structured_jds"("interviewPreparationId");

-- CreateIndex
CREATE INDEX "structured_jds_userId_idx" ON "public"."structured_jds"("userId");

-- CreateIndex
CREATE INDEX "webhook_events_preparationId_idx" ON "public"."webhook_events"("preparationId");

-- CreateIndex
CREATE INDEX "webhook_events_runId_idx" ON "public"."webhook_events"("runId");

-- CreateIndex
CREATE INDEX "webhook_events_threadId_idx" ON "public"."webhook_events"("threadId");

-- AddForeignKey
ALTER TABLE "public"."interview_preparations" ADD CONSTRAINT "interview_preparations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes" ADD CONSTRAINT "resumes_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_profiles" ADD CONSTRAINT "candidate_profiles_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_educations" ADD CONSTRAINT "candidate_educations_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."career_experiences" ADD CONSTRAINT "career_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_experiences" ADD CONSTRAINT "project_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedbacks" ADD CONSTRAINT "feedbacks_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "public"."answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_uploads" ADD CONSTRAINT "file_uploads_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_uploads" ADD CONSTRAINT "file_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."structured_jds" ADD CONSTRAINT "structured_jds_interviewPreparationId_fkey" FOREIGN KEY ("interviewPreparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."structured_jds" ADD CONSTRAINT "structured_jds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "public"."interview_preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

