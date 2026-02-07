/**
 * Rate Limiter Utility
 * Prevents duplicate clock in/out events with max 1 per 30 seconds per employee
 */

interface RateLimitEntry {
  timestamp: number;
  allowed: boolean;
}

// In-memory cache for rate limit checks (in production, use Redis)
const rateLimitCache = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 30000; // 30 seconds in milliseconds
const CACHE_CLEANUP_INTERVAL = 60000; // Clean up every 60 seconds

/**
 * Check if an action is allowed based on rate limit
 * @param employeeId - UUID of the employee
 * @param actionType - Type of action: 'clock_in' or 'clock_out'
 * @returns Object with allowed boolean and time remaining
 */
export async function checkRateLimit(
  employeeId: string,
  actionType: 'clock_in' | 'clock_out'
): Promise<{
  allowed: boolean;
  timeRemaining: number;
  message: string;
}> {
  const key = `${employeeId}:${actionType}`;
  const now = Date.now();

  // Get the last attempt
  const lastAttempt = rateLimitCache.get(key);

  if (lastAttempt) {
    const timeSinceLastAttempt = now - lastAttempt.timestamp;

    if (timeSinceLastAttempt < RATE_LIMIT_WINDOW) {
      const timeRemaining = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastAttempt) / 1000);
      return {
        allowed: false,
        timeRemaining,
        message: `Please wait ${timeRemaining} seconds before ${actionType === 'clock_in' ? 'clocking in' : 'clocking out'} again.`,
      };
    }
  }

  // Update the cache with this attempt
  rateLimitCache.set(key, {
    timestamp: now,
    allowed: true,
  });

  return {
    allowed: true,
    timeRemaining: 0,
    message: `${actionType === 'clock_in' ? 'Clock in' : 'Clock out'} successful.`,
  };
}

/**
 * Get rate limit status for an employee's action
 * @param employeeId - UUID of the employee
 * @param actionType - Type of action: 'clock_in' or 'clock_out'
 * @returns Time remaining before next action is allowed (0 if allowed)
 */
export function getRateLimitStatus(
  employeeId: string,
  actionType: 'clock_in' | 'clock_out'
): number {
  const key = `${employeeId}:${actionType}`;
  const lastAttempt = rateLimitCache.get(key);

  if (!lastAttempt) {
    return 0; // No limit
  }

  const timeSinceLastAttempt = Date.now() - lastAttempt.timestamp;
  if (timeSinceLastAttempt >= RATE_LIMIT_WINDOW) {
    return 0; // Rate limit expired
  }

  return Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastAttempt) / 1000);
}

/**
 * Clear rate limit for an employee
 * Useful for testing or admin overrides
 */
export function clearRateLimit(employeeId: string, actionType?: 'clock_in' | 'clock_out'): void {
  if (actionType) {
    const key = `${employeeId}:${actionType}`;
    rateLimitCache.delete(key);
  } else {
    // Clear all actions for this employee
    const keysToDelete: string[] = [];
    for (const key of rateLimitCache.keys()) {
      if (key.startsWith(`${employeeId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => rateLimitCache.delete(key));
  }
}

/**
 * Clean up expired rate limit entries
 * Called periodically to prevent memory buildup
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitCache.entries()) {
    if (now - entry.timestamp > CACHE_CLEANUP_INTERVAL * 2) {
      rateLimitCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Initialize automatic cleanup of rate limit cache
 * Call this once when the app starts
 */
export function initializeRateLimitCleanup(): void {
  setInterval(() => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }, CACHE_CLEANUP_INTERVAL);
}

/**
 * Get cache statistics (for debugging)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  employees: number;
  memory: string;
} {
  const totalEntries = rateLimitCache.size;
  const employees = new Set(
    Array.from(rateLimitCache.keys()).map(key => key.split(':')[0])
  ).size;

  // Rough estimate of memory usage
  const memoryBytes = totalEntries * 50; // Rough estimate per entry
  const memoryKb = memoryBytes / 1024;
  const memory = memoryKb < 1 ? `${memoryBytes}B` : `${memoryKb.toFixed(2)}KB`;

  return {
    totalEntries,
    employees,
    memory,
  };
}

export default {
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  cleanupExpiredEntries,
  initializeRateLimitCleanup,
  getRateLimitStats,
};
