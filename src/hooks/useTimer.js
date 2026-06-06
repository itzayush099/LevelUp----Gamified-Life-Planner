// src/hooks/useTimer.js

import { useState, useEffect, useRef, useMemo } from 'react';
import { formatTimer } from '../utils/timerUtils';

/**
 * Global 1-second clock tick.
 * Drives all timer displays across the app.
 *
 * @returns {{ currentTimeMs: number, nowTimeStr: string }}
 */
export const useTimer = () => {
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  const [nowTimeStr, setNowTimeStr]       = useState(
    new Date().toTimeString().substring(0, 5)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMs(Date.now());
      setNowTimeStr(new Date().toTimeString().substring(0, 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { currentTimeMs, nowTimeStr };
};

// ============================================================
// Task Timer Enrichment
//
// Exact v1.9 countdown logic from the tasksForSelectedDate
// useMemo block, extracted as a reusable function.
//
// Computes per-task timer state:
//   - remainingMs         (total countdown remaining)
//   - timerActive         (is the timer currently running)
//   - timerExpired        (has the full duration elapsed)
//   - progressPercentage  (0–100 based on elapsed vs total)
//   - remainingUnlockMs   (ms until the 80% unlock threshold)
//   - isEligibleForCompletion (has 80% threshold been reached)
// ============================================================

/**
 * Enriches a single task with all timer/countdown fields.
 * Pure function — no side effects, no React state.
 *
 * @param {Object}  task
 * @param {string}  selectedDate   - 'YYYY-MM-DD'
 * @param {string}  currentStatus  - effective status for selectedDate
 * @param {number}  currentTimeMs  - Date.now() value
 * @param {boolean} isPastDate
 * @param {boolean} isFutureDate
 * @returns {Object} timer fields to spread onto the task
 */
export const computeTaskTimer = (task, selectedDate, currentStatus, currentTimeMs, isPastDate, isFutureDate) => {
  const totalDurationMs    = (task.time || 0) * 3_600_000;
  const unlockThresholdMs  = totalDurationMs * 0.8;

  let remainingMs          = 0;
  let timerActive          = false;
  let timerExpired         = false;
  let progressPercentage   = 0;
  let remainingUnlockMs    = 0;
  let isEligibleForCompletion = false;

  // --- Timer exists for this date ---
  const timerDateKey = task.recurrence === '3 Days' ? task.date : selectedDate;
  if (task.timers?.[timerDateKey]) {
    const { expiresAt } = task.timers[timerDateKey];
    const startedAt     = expiresAt - totalDurationMs;
    const elapsedMs     = Math.max(0, currentTimeMs - startedAt);

    progressPercentage      = totalDurationMs > 0
      ? Math.min(100, (elapsedMs / totalDurationMs) * 100)
      : 100;
    remainingUnlockMs       = Math.max(0, unlockThresholdMs - elapsedMs);
    isEligibleForCompletion = elapsedMs >= unlockThresholdMs;

    // Only run live countdown for today's In Progress tasks
    if (currentStatus === 'In Progress' && !isPastDate && !isFutureDate) {
      remainingMs  = Math.max(0, expiresAt - currentTimeMs);
      timerActive  = true;
      timerExpired = remainingMs === 0 && currentTimeMs >= expiresAt;
    }

  // --- Zero-duration task (instant complete) ---
  } else if (totalDurationMs === 0) {
    isEligibleForCompletion = true;
    progressPercentage      = 100;
  }

  // --- Already completed — force eligible ---
  if (currentStatus === 'Completed') {
    isEligibleForCompletion = true;
    progressPercentage      = 100;
    remainingUnlockMs       = 0;
  }

  return {
    remainingMs,
    timerActive,
    timerExpired,
    progressPercentage,
    remainingUnlockMs,
    isEligibleForCompletion,
  };
};

/**
 * Hook that manages timer expiry notifications.
 * Returns a check function that fires showError once per task+date
 * when a timer expires, then never again for that combination.
 *
 * @param {Function} showError - toast notification callback
 * @returns {Function} checkTimerExpiry(taskId, taskName, selectedDate, timerExpired)
 */
export const useTimerNotifications = (showError) => {
  const notifiedTimers = useRef(new Set());

  const checkTimerExpiry = (taskId, taskName, selectedDate, timerExpired) => {
    if (!timerExpired) return;
    const key = `${taskId}-${selectedDate}`;
    if (notifiedTimers.current.has(key)) return;
    showError(`Time expired for task: ${taskName}`);
    notifiedTimers.current.add(key);
  };

  return checkTimerExpiry;
};

/**
 * Validates whether a task can be marked as Completed.
 * Exact v1.9 B5 XP Award Validation logic.
 *
 * Rules:
 *   - Zero-duration tasks are always eligible
 *   - Timed tasks must have an active timer AND 80% elapsed
 *   - Must be today's date (not past, not future)
 *
 * @param {Object}  task
 * @param {string}  selectedDate - 'YYYY-MM-DD'
 * @param {string}  todayStr     - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const canMarkCompleted = (task, selectedDate, todayStr) => {
  if (selectedDate !== todayStr) return false;

  const totalDurationMs = (task.time || 0) * 3_600_000;

  if (totalDurationMs === 0) return true;

  const timerDateKey = task.recurrence === '3 Days' ? task.date : selectedDate;
  if (task.timers?.[timerDateKey]) {
    const startedAt = task.timers[timerDateKey].expiresAt - totalDurationMs;
    const elapsedMs = Date.now() - startedAt;
    return elapsedMs >= totalDurationMs * 0.8;
  }

  return false;
};
