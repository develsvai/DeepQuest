/**
 * Locale Schema
 * One Source of Truth: i18n.config.ts
 *
 * This schema automatically reflects locale changes from i18n.config.ts.
 * When adding a new language, update i18n.config.ts and all types will be updated automatically.
 */

import { z } from 'zod'
import { routing } from '@/i18n/routing'

/**
 * Zod schema for locale validation
 * Automatically synced with i18n.config.ts locales
 */
export const LocaleSchema = z.enum(routing.locales)

/**
 * TypeScript type for locale (re-exported from i18n.config for convenience)
 */
