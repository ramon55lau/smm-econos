/**
 * Simple in-memory rate limiter to restrict file uploads per user/IP.
 * Mitigates DoS and storage flooding by limiting upload frequency.
 */

type UploadRecord = {
    timestamps: number[];
};

const uploadRegistry = new Map<string, UploadRecord>();

const MAX_UPLOADS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window

/**
 * Check if the user is allowed to upload and registers the upload timestamp.
 * If blocked, returns { allowed: false, resetTimeMs }.
 * If allowed, records the upload and returns { allowed: true }
 */
export function checkAndRecordUpload(key: string): { allowed: boolean; resetTimeMs?: number } {
    const now = Date.now();
    const record = uploadRegistry.get(key);

    if (!record) {
        uploadRegistry.set(key, { timestamps: [now] });
        return { allowed: true };
    }

    // Filter timestamps within the current sliding window
    record.timestamps = record.timestamps.filter(ts => now - ts < WINDOW_MS);

    if (record.timestamps.length >= MAX_UPLOADS) {
        // Determine target reset time based on the oldest timestamp in the current window
        const oldestTs = record.timestamps[0];
        const resetTimeMs = oldestTs + WINDOW_MS;
        return { allowed: false, resetTimeMs };
    }

    record.timestamps.push(now);
    return { allowed: true };
}
