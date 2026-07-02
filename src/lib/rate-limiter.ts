/**
 * In-memory rate limiter for brute force protection.
 * Tracks failed login attempts per email and blocks after threshold.
 */

type AttemptRecord = {
    count: number;
    firstAttempt: number;
    lockedUntil: number | null;
};

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Check if a given key (email) is currently rate-limited.
 * Returns { blocked: true, retryAfterMs } if blocked.
 */
export function checkRateLimit(key: string): { blocked: boolean; retryAfterMs?: number } {
    const record = attempts.get(key);
    if (!record) return { blocked: false };

    // Check if locked
    if (record.lockedUntil) {
        const now = Date.now();
        if (now < record.lockedUntil) {
            return { blocked: true, retryAfterMs: record.lockedUntil - now };
        }
        // Lockout expired, clear the record
        attempts.delete(key);
        return { blocked: false };
    }

    // Check if window expired
    if (Date.now() - record.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
        return { blocked: false };
    }

    return { blocked: false };
}

/**
 * Record a failed login attempt. Returns true if the account is now locked.
 */
export function recordFailedAttempt(key: string): boolean {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || (now - record.firstAttempt > WINDOW_MS)) {
        attempts.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
        return false;
    }

    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_MS;
        return true;
    }

    return false;
}

/**
 * Clear attempts for a key (e.g., after successful login).
 */
export function clearAttempts(key: string): void {
    attempts.delete(key);
}

/**
 * Get remaining attempts for a key.
 */
export function getRemainingAttempts(key: string): number {
    const record = attempts.get(key);
    if (!record) return MAX_ATTEMPTS;
    if (Date.now() - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;
    return Math.max(0, MAX_ATTEMPTS - record.count);
}
