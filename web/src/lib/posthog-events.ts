/**
 * PostHog Event Constants
 * Centralized event names for consistent analytics tracking
 *
 * Naming convention: [category]:[object]_[action]
 * @see https://posthog.com/docs/product-analytics/best-practices#2-implement-a-naming-convention
 *
 * @module lib/posthog-events
 */

export const POSTHOG_EVENTS = {
  // ==========================================
  // Landing Page Events
  // ==========================================
  LANDING: {
    /** Hero section CTA button clicked */
    HERO_CTA_CLICKED: 'landing:hero_cta_clicked',
    /** CTA section main button clicked */
    CTA_MAIN_CLICKED: 'landing:cta_main_clicked',
    /** Discord join button clicked */
    DISCORD_JOIN_CLICKED: 'landing:discord_join_clicked',
  },

  // ==========================================
  // Dashboard Events
  // ==========================================
  DASHBOARD: {
    /** Dashboard page viewed */
    VIEWED: 'dashboard:viewed',
  },

  // ==========================================
  // Interview Preparation Events
  // ==========================================
  PREPARATION: {
    /** Interview preparation created */
    CREATED: 'preparation:created',
    /** Interview preparation detail page viewed */
    DETAIL_VIEWED: 'preparation:detail_viewed',
    /** Interview preparation deleted */
    DELETED: 'preparation:deleted',
  },

  // ==========================================
  // Resume Events
  // ==========================================
  RESUME: {
    /** Resume file uploaded */
    UPLOADED: 'resume:uploaded',
  },

  // ==========================================
  // Experience Events
  // ==========================================
  EXPERIENCE: {
    /** Work experience added */
    ADDED: 'experience:added',
    /** Work experience deleted */
    DELETED: 'experience:deleted',
  },

  // ==========================================
  // Education Events
  // ==========================================
  EDUCATION: {
    /** Education entry added */
    ADDED: 'education:added',
  },

  // ==========================================
  // Key Achievement Events
  // ==========================================
  ACHIEVEMENT: {
    /** Key achievement created */
    CREATED: 'achievement:created',
  },

  // ==========================================
  // Question Events
  // ==========================================
  QUESTION: {
    /** Question generation started */
    GENERATION_STARTED: 'question:generation_started',
    /** Answer submitted for a question */
    ANSWER_SUBMITTED: 'question:answer_submitted',
    /** Feedback received for an answer */
    FEEDBACK_RECEIVED: 'question:feedback_received',
  },

  // ==========================================
  // Survey Trigger Events
  // ==========================================
  SURVEY: {
    /** First interview preparation completed (status → READY) */
    FIRST_PREP_COMPLETED: 'survey:first_prep_completed',
    /** First feedback received */
    FIRST_FEEDBACK_RECEIVED: 'survey:first_feedback_received',
    /** User became eligible for NPS survey (3+ feedbacks) */
    NPS_ELIGIBLE: 'survey:nps_eligible',
  },
} as const

// ===========================================
// System Events (PostHog built-in event names)
// ===========================================

/**
 * PostHog system event names
 *
 * These are PostHog's built-in event names that have special meaning.
 * Use these constants instead of hardcoding '$pageview', '$pageleave', etc.
 *
 * Note: With `defaults: '2025-05-24'`, pageview and pageleave are tracked
 * automatically. These constants are provided for manual capture scenarios
 * or custom analytics requirements.
 *
 * @see https://posthog.com/docs/data/events#default-events
 */
export const POSTHOG_SYSTEM_EVENTS = {
  /** Page view event - tracked automatically via history API */
  PAGEVIEW: '$pageview',
  /** Page leave event - tracked automatically when user leaves a page */
  PAGELEAVE: '$pageleave',
  /** Autocapture event - element interactions */
  AUTOCAPTURE: '$autocapture',
  /** Screen event - for mobile apps */
  SCREEN: '$screen',
} as const

// Type helper for system event names
export type PostHogSystemEventName =
  (typeof POSTHOG_SYSTEM_EVENTS)[keyof typeof POSTHOG_SYSTEM_EVENTS]

// Type helper for event names
export type PostHogEventName =
  | (typeof POSTHOG_EVENTS.LANDING)[keyof typeof POSTHOG_EVENTS.LANDING]
  | (typeof POSTHOG_EVENTS.DASHBOARD)[keyof typeof POSTHOG_EVENTS.DASHBOARD]
  | (typeof POSTHOG_EVENTS.PREPARATION)[keyof typeof POSTHOG_EVENTS.PREPARATION]
  | (typeof POSTHOG_EVENTS.RESUME)[keyof typeof POSTHOG_EVENTS.RESUME]
  | (typeof POSTHOG_EVENTS.EXPERIENCE)[keyof typeof POSTHOG_EVENTS.EXPERIENCE]
  | (typeof POSTHOG_EVENTS.EDUCATION)[keyof typeof POSTHOG_EVENTS.EDUCATION]
  | (typeof POSTHOG_EVENTS.ACHIEVEMENT)[keyof typeof POSTHOG_EVENTS.ACHIEVEMENT]
  | (typeof POSTHOG_EVENTS.QUESTION)[keyof typeof POSTHOG_EVENTS.QUESTION]
  | (typeof POSTHOG_EVENTS.SURVEY)[keyof typeof POSTHOG_EVENTS.SURVEY]

/**
 * PostHog Person Property Keys
 * Survey 타겟팅에 사용되는 Person property 키 상수
 *
 * @see docs/plans/posthog-survey-implementation.md - Section 3.3
 */
export const POSTHOG_PERSON_PROPERTIES = {
  /** 첫 분석 완료 여부 (boolean) - Survey 2 트리거 */
  FIRST_PREP_COMPLETED: 'first_prep_completed',
  /** 첫 분석 완료 시각 (ISO datetime) */
  FIRST_PREP_COMPLETED_AT: 'first_prep_completed_at',
  /** 첫 피드백 수신 여부 (boolean) - Survey 3 트리거 */
  FIRST_FEEDBACK_RECEIVED: 'first_feedback_received',
  /** 총 피드백 수 (number) */
  FEEDBACK_COUNT: 'feedback_count',
  /** NPS Survey 대상 여부 (boolean) - Survey 4 트리거 */
  NPS_ELIGIBLE: 'nps_eligible',
} as const

export type PostHogPersonPropertyKey =
  (typeof POSTHOG_PERSON_PROPERTIES)[keyof typeof POSTHOG_PERSON_PROPERTIES]
