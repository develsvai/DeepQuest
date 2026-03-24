/**
 * Date-based Seeder Utility
 *
 * Provides deterministic shuffle/pick operations based on (userId + date) seed.
 * Ensures same user sees same questions on the same day,
 * but different questions on different days.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

export interface DateSeeder {
  /**
   * Deterministically shuffle an array.
   * Same seed always produces same order.
   */
  shuffle: <T>(array: T[]) => T[]

  /**
   * Deterministically pick N items from array.
   * Same seed always picks same items in same order.
   */
  pick: <T>(array: T[], count: number) => T[]
}

/**
 * Create a seeder based on userId and date.
 *
 * @param userId - User's unique identifier
 * @param date - Date string in YYYY-MM-DD format (client local time)
 * @returns Seeder with shuffle and pick methods
 *
 * @example
 * const seeder = createDateSeeder('user123', '2025-01-09')
 * const shuffled = seeder.shuffle([1, 2, 3, 4, 5])
 * const picked = seeder.pick([1, 2, 3, 4, 5], 2)
 */
export function createDateSeeder(userId: string, date: string): DateSeeder {
  const seed = hashString(`${userId}:${date}`)

  return {
    shuffle: <T>(array: T[]): T[] => seededShuffle([...array], seed),
    pick: <T>(array: T[], count: number): T[] =>
      seededShuffle([...array], seed).slice(0, count),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Implementation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple string hash function (djb2 algorithm).
 * Produces consistent numeric hash for any string input.
 * Not cryptographically secure, but deterministic and fast.
 */
function hashString(str: string): number {
  let hash = 5381

  for (let i = 0; i < str.length; i++) {
    // hash * 33 + char
    hash = (hash << 5) + hash + str.charCodeAt(i)
    // Keep within 32-bit integer range
    hash = hash >>> 0
  }

  return hash
}

/**
 * Seeded pseudo-random number generator (Linear Congruential Generator).
 * Returns a function that produces deterministic sequence of numbers.
 */
function createPRNG(seed: number): () => number {
  let state = seed

  return () => {
    // LCG parameters (same as glibc)
    state = (state * 1103515245 + 12345) >>> 0
    return state / 0xffffffff
  }
}

/**
 * Fisher-Yates shuffle with seeded random.
 * Mutates array in place and returns it.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const random = createPRNG(seed)

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }

  return array
}
