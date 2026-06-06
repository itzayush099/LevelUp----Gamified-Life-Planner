// src/hooks/useAnalytics.js

import { useMemo } from 'react';
import { CATEGORIES } from '../constants/categories';

/**
 * Computes daily analytics from enriched tasks for the selected date.
 * Exact v1.9 dailyAnalytics useMemo logic.
 *
 * @param {Object[]} tasksForSelectedDate - enriched tasks with currentStatus
 * @returns {{
 *   total:          number,
 *   completed:      number,
 *   pending:        number,
 *   skipped:        number,
 *   completionRate: number,
 *   xpEarnedToday:  number,
 *   catStats:       Object
 * }}
 */
export const useAnalytics = (tasksForSelectedDate) => {
  return useMemo(() => {
    const total     = tasksForSelectedDate.length;
    const completed = tasksForSelectedDate.filter(t => t.currentStatus === 'Completed').length;
    const pending   = tasksForSelectedDate.filter(t => t.currentStatus === 'Not Started' || t.currentStatus === 'In Progress').length;
    const skipped   = tasksForSelectedDate.filter(t => t.currentStatus === 'Skipped').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const xpEarnedToday = tasksForSelectedDate
      .filter(t => t.currentStatus === 'Completed')
      .reduce((sum, t) => sum + t.priority, 0);

    const catStats = {};
    CATEGORIES.forEach((c) => {
      const cTasks     = tasksForSelectedDate.filter(t => t.category === c);
      const cCompleted = cTasks.filter(t => t.currentStatus === 'Completed').length;
      catStats[c] = cTasks.length > 0 ? Math.round((cCompleted / cTasks.length) * 100) : 0;
    });

    return { total, completed, pending, skipped, completionRate, xpEarnedToday, catStats };
  }, [tasksForSelectedDate]);
};
