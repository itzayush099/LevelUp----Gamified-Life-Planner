// src/utils/recurrenceUtils.js

// ============================================================
// Recurrence helpers extracted from Version 1.9.
//
// Supported recurrence values (exact v1.9 Firestore strings):
//   'One Time' | 'Daily' | 'Weekly' | 'Monthly'
//
// Q5 design decision applied:
//   doesTaskOccurOnDate() checks task.exceptions[] first so that
//   occurrence-only deletions are respected transparently across
//   the entire app without any other code changes.
// ============================================================

/**
 * Returns true if the given task should appear on targetDate.
 *
 * Evaluation order (exact v1.9 logic + Q5 exceptions):
 *  1. targetDate in task.exceptions[]  → false  (occurrence deleted)
 *  2. targetDate < task.date           → false  (not started yet)
 *  3. targetDate === task.date         → true   (always show on origin date)
 *  4. One Time                         → false  (only on origin date)
 *  5. Daily                            → true
 *  6. Weekly  → same day-of-week as task.date
 *  7. Monthly → same day-of-month as task.date
 *
 * @param {Object}   task
 * @param {string}   task.date          - 'YYYY-MM-DD' task creation date
 * @param {string}   task.recurrence    - 'One Time' | 'Daily' | 'Weekly' | 'Monthly'
 * @param {string[]} [task.exceptions]  - 'YYYY-MM-DD' dates to hide (occurrence-only deletions)
 * @param {string}   targetDate         - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const doesTaskOccurOnDate = (task, targetDate) => {
  // Q5: skip dates that have been occurrence-deleted
  if (task.exceptions?.includes(targetDate)) return false;

  // Never show before the task's start date
  if (targetDate < task.date) return false;

  // Always show on the creation date itself
  if (task.date === targetDate) return true;

  // One Time tasks only live on their creation date
  if (task.recurrence === 'One Time') return false;

  const tDate = new Date(task.date);
  const sDate = new Date(targetDate);

  if (task.recurrence === 'Daily')   return true;

  if (task.recurrence === '3 Days') {
    const diffTime = new Date(targetDate) - new Date(task.date);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // equivalent to 86400000 ms
    return diffDays >= 0 && diffDays < 3;
  }

  if (task.recurrence === 'Weekly')  return tDate.getDay()  === sDate.getDay();
  if (task.recurrence === 'Monthly') return tDate.getDate() === sDate.getDate();

  return false;
};

/**
 * Returns the effective status of a task for a specific date.
 * Checks statusOverrides first; falls back to task.status on
 * the task's own creation date, otherwise defaults to 'Not Started'.
 *
 * Exact v1.9 getTaskStatus() logic (unchanged).
 *
 * @param {Object} task
 * @param {string} task.status             - base status
 * @param {Object} [task.statusOverrides]  - { 'YYYY-MM-DD': status }
 * @param {string} task.date               - 'YYYY-MM-DD' creation date
 * @param {string} dateStr                 - 'YYYY-MM-DD' target date
 * @returns {string}
 */
export const getTaskStatus = (task, dateStr) => {
  if (task.recurrence === '3 Days') {
    return task.status || 'Not Started';
  }
  return task.statusOverrides?.[dateStr] ??
    (task.date === dateStr ? task.status : 'Not Started');
};
