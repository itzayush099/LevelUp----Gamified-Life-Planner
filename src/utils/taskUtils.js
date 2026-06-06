// src/utils/taskUtils.js

// ============================================================
// Generic task helper utilities extracted from Version 1.9.
// Covers: priority, sorting, filtering, and date helpers.
// No React. No Firebase.
// ============================================================

import { PRIORITY_MAP, getPriorityTailwind } from '../constants/priorities';
import { doesTaskOccurOnDate, getTaskStatus } from './recurrenceUtils';

// Re-export for single-import convenience
export { doesTaskOccurOnDate, getTaskStatus, getPriorityTailwind, PRIORITY_MAP };

// ============================================================
// PRIORITY HELPERS
// ============================================================

/**
 * Returns the label string for a given priority XP value.
 * e.g. getPriorityLabel(30) → 'High'
 *
 * @param {number} pts - 10 | 20 | 30 | 50
 * @returns {string}
 */
export const getPriorityLabel = (pts) =>
  PRIORITY_MAP[pts]?.label ?? 'Low';

/**
 * Returns the semantic color name for a given priority XP value.
 * e.g. getPriorityColor(50) → 'red'
 *
 * @param {number} pts - 10 | 20 | 30 | 50
 * @returns {string}
 */
export const getPriorityColor = (pts) =>
  PRIORITY_MAP[pts]?.color ?? 'gray';

// ============================================================
// SORTING HELPERS
// ============================================================

/**
 * Sorts tasks by startTime ascending, then priority descending.
 * Exact v1.9 sortedTasks logic.
 *
 * @param {Object[]} tasks
 * @returns {Object[]} new sorted array (original not mutated)
 */
export const sortByTimeAndPriority = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.startTime !== b.startTime)
      return a.startTime.localeCompare(b.startTime);
    return b.priority - a.priority;
  });

// ============================================================
// FILTERING HELPERS
// ============================================================

/**
 * Applies search + category + priority + status filters
 * to an array of enriched tasks.
 * Exact v1.9 filter logic from sortedTasks useMemo.
 *
 * @param {Object[]} tasks
 * @param {Object}   filters
 * @param {string}   filters.searchQuery
 * @param {string}   filters.filterCategory  - category name or 'All'
 * @param {string}   filters.filterPriority  - priority value string or 'All'
 * @param {string}   filters.filterStatus    - status string or 'All'
 * @returns {Object[]}
 */
export const applyTaskFilters = (tasks, {
  searchQuery    = '',
  filterCategory = 'All',
  filterPriority = 'All',
  filterStatus   = 'All',
} = {}) =>
  tasks.filter((t) => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    if (filterCategory !== 'All' && t.category !== filterCategory)
      return false;
    if (filterPriority !== 'All' && t.priority !== Number(filterPriority))
      return false;
    if (filterStatus !== 'All' && t.currentStatus !== filterStatus)
      return false;
    return true;
  });

/**
 * Filters tasks for a selected date (uses doesTaskOccurOnDate).
 *
 * @param {Object[]} tasks      - raw Firestore task array
 * @param {string}   dateStr    - 'YYYY-MM-DD'
 * @returns {Object[]}
 */
export const filterTasksForDate = (tasks, dateStr) =>
  tasks.filter((t) => doesTaskOccurOnDate(t, dateStr));

// ============================================================
// DATE HELPERS
// ============================================================

/**
 * Returns today's date as a 'YYYY-MM-DD' string.
 *
 * @returns {string}
 */
export const getTodayStr = () =>
  new Date().toISOString().split('T')[0];

/**
 * Returns yesterday's date as a 'YYYY-MM-DD' string.
 *
 * @returns {string}
 */
export const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

/**
 * Returns the current wall-clock time as 'HH:MM'.
 *
 * @returns {string}
 */
export const getNowTimeStr = () =>
  new Date().toTimeString().substring(0, 5);

/**
 * Returns true if dateStr is before todayStr.
 *
 * @param {string} dateStr  - 'YYYY-MM-DD'
 * @param {string} todayStr - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const isPast = (dateStr, todayStr) => dateStr < todayStr;

/**
 * Returns true if dateStr is after todayStr.
 *
 * @param {string} dateStr  - 'YYYY-MM-DD'
 * @param {string} todayStr - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const isFuture = (dateStr, todayStr) => dateStr > todayStr;

/**
 * Returns true if dateStr is today.
 *
 * @param {string} dateStr  - 'YYYY-MM-DD'
 * @param {string} todayStr - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const isToday = (dateStr, todayStr) => dateStr === todayStr;

// ============================================================
// BUILD HELPERS
// ============================================================

/**
 * Builds a clean Firestore-ready task payload.
 * Includes exceptions: [] for Q5 occurrence-only deletion support.
 *
 * @param {Object} fields
 * @returns {Object}
 */
export const buildNewTask = ({
  name,
  date,
  startTime,
  endTime,
  time,
  priority,
  category,
  status     = 'Not Started',
  notes      = '',
  recurrence = 'One Time',
}) => ({
  name,
  date,
  startTime,
  endTime,
  time,
  priority:        Number(priority),
  category,
  status,
  notes,
  recurrence,
  statusOverrides: {},
  timers:          {},
  exceptions:      [],
  createdAt:       new Date().toISOString(),
});
