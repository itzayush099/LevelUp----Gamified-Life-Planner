// ============================================================
// src/constants/priorities.js
//
// Single source of truth for all task priority definitions.
//
// Each priority has:
//   value    — XP awarded on completion (also used as the unique key)
//   label    — human-readable display name
//   color    — semantic color name (for icon tinting, charts, etc.)
//   tailwind — full Tailwind class string for badge/pill components
//              (light + dark mode included)
// ============================================================

/**
 * Ordered from highest to lowest priority.
 * The `value` field doubles as the XP reward for task completion.
 */
export const PRIORITIES = [
  {
    value: 50,
    label: 'Critical',
    color: 'red',
    tailwind:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
  {
    value: 30,
    label: 'High',
    color: 'orange',
    tailwind:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  },
  {
    value: 20,
    label: 'Medium',
    color: 'blue',
    tailwind:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  {
    value: 10,
    label: 'Low',
    color: 'gray',
    tailwind:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
];

// -----------------------------------------------------------
// O(1) Lookup Map  —  keyed by priority value
// Usage: PRIORITY_MAP[task.priority].label
// -----------------------------------------------------------
export const PRIORITY_MAP = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p])
);

// -----------------------------------------------------------
// getPriorityTailwind
//
// Returns the full Tailwind class string for a given XP value.
// Falls back to the Low (gray) style for unknown values.
//
// Usage:
//   <span className={`border ${getPriorityTailwind(task.priority)}`}>
//     {PRIORITY_MAP[task.priority]?.label}
//   </span>
// -----------------------------------------------------------

/**
 * @param {number} pts - Priority XP value (10 | 20 | 30 | 50)
 * @returns {string} Tailwind class string (light + dark)
 */
export const getPriorityTailwind = (pts) =>
  PRIORITY_MAP[pts]?.tailwind ??
  'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

// -----------------------------------------------------------
// Default priority value used when creating a new task
// -----------------------------------------------------------
export const DEFAULT_PRIORITY = 10;
