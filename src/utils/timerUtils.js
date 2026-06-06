// src/utils/timerUtils.js

// ============================================================
// All timer-related pure helper functions from Version 1.9.
// No React. No Firebase. Safe to import anywhere.
// ============================================================

/**
 * Formats a millisecond duration into "HH:MM:SS" string.
 * Returns "00:00:00" for zero or negative values.
 * Exact v1.9 formatTimer() logic (unchanged).
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} e.g. "01:30:00"
 */
export const formatTimer = (ms) => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Calculates an end time string given a start time and duration in hours.
 * Wraps past midnight (mod 24).
 * Exact v1.9 calculateEndTime() logic (unchanged).
 *
 * @param {string} startStr    - "HH:MM"
 * @param {number} durationHrs - duration in hours (decimals allowed)
 * @returns {string} "HH:MM"
 */
export const calculateEndTime = (startStr, durationHrs) => {
  const [h, m]    = startStr.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(durationHrs * 60);
  const eH        = Math.floor(totalMins / 60) % 24;
  const eM        = totalMins % 60;
  return `${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`;
};

/**
 * Derives the duration in hours between two "HH:MM" time strings.
 * Handles overnight tasks (if end < start, adds 24h).
 * Extracted from v1.9 derivedDuration useMemo as a pure function.
 *
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime   - "HH:MM"
 * @returns {number} hours as a float, rounded to 2 decimal places
 */
export const deriveDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  let diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff < 0) diff += 24 * 60;
  return parseFloat((diff / 60).toFixed(2));
};

// -----------------------------------------------------------
// Countdown helpers
// Extracted from the v1.9 tasksForSelectedDate useMemo block.
// These are pure computations — pass in current time as a param
// so they remain testable and side-effect free.
// -----------------------------------------------------------

/**
 * Returns how many milliseconds remain on an active timer.
 * Returns 0 if the timer has expired.
 *
 * @param {number} expiresAt   - timer.expiresAt timestamp (ms)
 * @param {number} currentTimeMs - Date.now() value
 * @returns {number} remaining ms (min 0)
 */
export const getRemainingMs = (expiresAt, currentTimeMs) =>
  Math.max(0, expiresAt - currentTimeMs);

/**
 * Returns elapsed ms since a timer was started.
 * expiresAt - totalDurationMs = startedAt.
 *
 * @param {number} expiresAt      - timer.expiresAt timestamp (ms)
 * @param {number} totalDurationMs - task.time * 3_600_000
 * @param {number} currentTimeMs  - Date.now() value
 * @returns {number} elapsed ms (min 0)
 */
export const getElapsedMs = (expiresAt, totalDurationMs, currentTimeMs) => {
  const startedAt = expiresAt - totalDurationMs;
  return Math.max(0, currentTimeMs - startedAt);
};

/**
 * Returns the task progress as a percentage (0–100).
 * If totalDurationMs is 0 the task is considered instantly complete (100%).
 *
 * @param {number} elapsedMs      - ms elapsed since task started
 * @param {number} totalDurationMs - task.time * 3_600_000
 * @returns {number} 0–100
 */
export const getProgressPercentage = (elapsedMs, totalDurationMs) => {
  if (totalDurationMs <= 0) return 100;
  return Math.min(100, (elapsedMs / totalDurationMs) * 100);
};

/**
 * Returns how many ms remain until the 80% unlock threshold is reached.
 * Returns 0 once the threshold is passed.
 *
 * @param {number} elapsedMs       - ms elapsed since task started
 * @param {number} totalDurationMs  - task.time * 3_600_000
 * @returns {number} ms until unlock (min 0)
 */
export const getRemainingUnlockMs = (elapsedMs, totalDurationMs) => {
  const unlockThresholdMs = totalDurationMs * 0.8;
  return Math.max(0, unlockThresholdMs - elapsedMs);
};

/**
 * Returns true if the task has reached the 80% duration threshold
 * required to mark it as Completed.
 *
 * @param {number} elapsedMs      - ms elapsed since task started
 * @param {number} totalDurationMs - task.time * 3_600_000
 * @returns {boolean}
 */
export const isEligibleForCompletion = (elapsedMs, totalDurationMs) => {
  if (totalDurationMs <= 0) return true;
  return elapsedMs >= totalDurationMs * 0.8;
};
