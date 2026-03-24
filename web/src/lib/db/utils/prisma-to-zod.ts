/**
 * Prisma enum을 Zod enum으로 변환하는 유틸리티
 *
 * z.nativeEnum()을 사용하여 실제 Prisma enum 타입으로 추론
 * - z.enum(['A', 'B']) → string으로 추론 (타입 캐스팅 필요)
 * - z.nativeEnum(PrismaEnum) → PrismaEnum으로 추론 (타입 안전)
 *
 * 이 방식을 통해 `as EmployeeType` 같은 타입 캐스팅을 제거할 수 있습니다.
 */

import { z } from 'zod'
// Import from browser-safe enums file (no Node.js dependencies)
// This allows client components to import these Zod schemas
import {
  DegreeType,
  ProjectType,
  EmployeeType,
  PreparationStatus,
  QuestionCategory,
  AnswerStatus,
  Rating,
  FileType,
  FileScanStatus,
  WebhookStatus,
  ExperienceType,
} from '@/generated/prisma/enums'

/** 학위 타입 - Prisma DegreeType enum */
export const DegreeTypeZod = z.enum(DegreeType)

/** 프로젝트 타입 - Prisma ProjectType enum */
export const ProjectTypeZod = z.enum(ProjectType)

/** 고용 형태 - Prisma EmployeeType enum */
export const EmployeeTypeZod = z.enum(EmployeeType)

/** 준비 상태 - Prisma PreparationStatus enum */
export const PreparationStatusZod = z.enum(PreparationStatus)

/** 질문 카테고리 - Prisma QuestionCategory enum */
export const QuestionCategoryZod = z.enum(QuestionCategory)

/** 답변 상태 - Prisma AnswerStatus enum */
export const AnswerStatusZod = z.enum(AnswerStatus)

/** 평점 - Prisma Rating enum */
export const RatingZod = z.enum(Rating)

/** 파일 타입 - Prisma FileType enum */
export const FileTypeZod = z.enum(FileType)

/** 파일 스캔 상태 - Prisma FileScanStatus enum */
export const FileScanStatusZod = z.enum(FileScanStatus)

/** 웹훅 상태 - Prisma WebhookStatus enum */
export const WebhookStatusZod = z.enum(WebhookStatus)

/** 경험 타입 - Prisma ExperienceType enum */
export const ExperienceTypeZod = z.enum(ExperienceType)
