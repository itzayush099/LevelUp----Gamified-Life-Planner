// src/hooks/useTasks.js

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  subscribeToTasks,
  createTask,
  updateTask,
  deleteTask as removeTask,
  addTaskException,
} from '../services/taskService';
import { doesTaskOccurOnDate, getTaskStatus } from '../utils/recurrenceUtils';
import { calculateEndTime } from '../utils/timerUtils';
import { computeTaskTimer, canMarkCompleted } from './useTimer';
import { getLevelData } from '../utils/levelUtils';

/**
 * Comprehensive task management hook.
 * Moves all task logic from Version 1.9 App component.
 *
 * @param {Object|null} user
 * @param {Object}      params
 * @param {string}      params.selectedDate
 * @param {string}      params.todayStr
 * @param {string}      params.nowTimeStr
 * @param {number}      params.currentTimeMs
 * @param {boolean}     params.isPastDate
 * @param {boolean}     params.isFutureDate
 * @param {Object}      params.profile
 * @param {Function}    params.updateProfileData
 * @param {Function}    params.showSuccess
 * @param {Function}    params.showError
 */
export const useTasks = (user, {
  selectedDate,
  todayStr,
  nowTimeStr,
  currentTimeMs,
  isPastDate,
  isFutureDate,
  profile,
  updateProfileData,
  showSuccess,
  showError,
}) => {
  // =========================================================
  // RAW TASK SUBSCRIPTION
  // =========================================================
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, setTasks);
    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // TIMER EXPIRY NOTIFICATIONS
  // =========================================================
  const notifiedTimers = useRef(new Set());

  // =========================================================
  // TASK ENRICHMENT — filter by date + compute timer fields
  // Exact v1.9 tasksForSelectedDate useMemo
  // =========================================================
  const tasksForSelectedDate = useMemo(() => {
    return tasks
      .filter((t) => doesTaskOccurOnDate(t, selectedDate))
      .map((t) => {
        const currentStatus = getTaskStatus(t, selectedDate);

        const timerFields = computeTaskTimer(
          t, selectedDate, currentStatus, currentTimeMs, isPastDate, isFutureDate
        );

        // One-time expiry notification
        if (timerFields.timerExpired) {
          const key = `${t.id}-${selectedDate}`;
          if (!notifiedTimers.current.has(key)) {
            showError(`Time expired for task: ${t.name}`);
            notifiedTimers.current.add(key);
          }
        }

        // Overdue detection — exact v1.9 logic
        const isOverdue =
          (selectedDate < todayStr && currentStatus !== 'Completed' && currentStatus !== 'Skipped') ||
          (selectedDate === todayStr && t.endTime < nowTimeStr && currentStatus !== 'Completed' && currentStatus !== 'Skipped') ||
          timerFields.timerExpired;

        return { ...t, currentStatus, isOverdue, ...timerFields };
      });
  }, [tasks, selectedDate, todayStr, nowTimeStr, currentTimeMs, isPastDate, isFutureDate]);

  // =========================================================
  // FILTERING & SORTING
  // =========================================================
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus]     = useState('All');

  const sortedTasks = useMemo(() => {
    let filtered = tasksForSelectedDate.filter((t) => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== 'All' && t.category !== filterCategory) return false;
      if (filterPriority !== 'All' && t.priority !== Number(filterPriority)) return false;
      if (filterStatus !== 'All' && t.currentStatus !== filterStatus) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return b.priority - a.priority;
    });
  }, [tasksForSelectedDate, searchQuery, filterCategory, filterPriority, filterStatus]);

  const unfilteredSortedTasks = useMemo(() => {
    return [...tasksForSelectedDate].sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return b.priority - a.priority;
    });
  }, [tasksForSelectedDate]);

  // =========================================================
  // DERIVED STATS
  // =========================================================
  const overdueTasksCount   = tasksForSelectedDate.filter((t) => t.isOverdue).length;
  const scheduledHoursToday = tasksForSelectedDate.reduce((sum, t) => sum + (Number(t.time) || 0), 0);

  // =========================================================
  // TASK CREATION
  // =========================================================
  const addTask = async (fields) => {
    if (!user) return;
    await createTask(user.uid, fields);
    showSuccess('Task added successfully!');
  };

  const addQuickTask = async (template) => {
    if (!user) return;
    const endTime = calculateEndTime(nowTimeStr, template.duration);
    await createTask(user.uid, {
      name:      template.name,
      date:      selectedDate,
      startTime: nowTimeStr,
      endTime,
      time:      template.duration,
      priority:  template.priority,
      category:  template.category,
      status:    'Not Started',
      notes:     '',
      recurrence:'One Time',
    });
    showSuccess(`${template.name} added to schedule!`);
  };

  const addStudyTask = async (option) => {
    if (!user) return;
    const endTime = calculateEndTime(nowTimeStr, option.duration);
    await createTask(user.uid, {
      name:      `Study: ${option.name}`,
      date:      selectedDate,
      startTime: nowTimeStr,
      endTime,
      time:      option.duration,
      priority:  30,
      category:  'Study',
      status:    'Not Started',
      notes:     '',
      recurrence:'One Time',
    });
    showSuccess(`Created: ${option.name} (${option.duration}h)`);
  };

  // =========================================================
  // STATUS UPDATE + XP VALIDATION
  // Exact v1.9 handleUpdateStatus logic
  // =========================================================
  const handleUpdateStatus = async (taskId, currentTask, newStatus) => {
    if (!user || isPastDate || isFutureDate) return;

    // B5: XP Award Validation — 80% duration check
    if (newStatus === 'Completed' && currentTask.currentStatus !== 'Completed') {
      if (!canMarkCompleted(currentTask, selectedDate, todayStr)) {
        showError("Cannot complete: Must be 'In Progress' for today and reach 80% duration.");
        return;
      }
    }

    // Build Firestore updates
    const updates = {};
    const timerDateKey = currentTask.recurrence === '3 Days' ? currentTask.date : selectedDate;

    if (currentTask.recurrence === '3 Days') {
      updates.status = newStatus;
    } else {
      updates[`statusOverrides.${selectedDate}`] = newStatus;
    }

    // Start timer on first 'In Progress' transition
    if (newStatus === 'In Progress' && !currentTask.timers?.[timerDateKey]) {
      updates[`timers.${timerDateKey}`] = {
        expiresAt: Date.now() + (currentTask.time * 3_600_000),
      };
    }

    await updateTask(user.uid, taskId, updates);

    // --- XP & Level & Streak Logic ---
    const oldStatus      = currentTask.currentStatus;
    const isNowCompleted = newStatus === 'Completed';
    const wasCompleted   = oldStatus === 'Completed';

    let newXp     = profile.xp;
    let xpChanged = false;
    const xpAmount = currentTask.xpReward || currentTask.priority;

    if (isNowCompleted && !wasCompleted) {
      newXp += xpAmount;
      xpChanged = true;
    } else if (!isNowCompleted && wasCompleted) {
      newXp = Math.max(0, newXp - xpAmount);
      xpChanged = true;
    }

    if (xpChanged) {
      const { level: newLevel } = getLevelData(newXp);

      // Streak calculation
      let newCurrentStreak = profile.currentStreak;
      let newBestStreak    = profile.bestStreak;
      let lastCompleted    = profile.lastCompletedDate;
      let newStreakDates   = Array.isArray(profile.streakDates) ? [...profile.streakDates] : [];

      // Always mark today as a flame date when ANY task is completed for today
      if (isNowCompleted && selectedDate === todayStr && !newStreakDates.includes(todayStr)) {
        newStreakDates.push(todayStr);
      }

      // Consecutive-streak counter — only update once per day
      if (isNowCompleted && profile.lastCompletedDate !== todayStr && selectedDate === todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        newCurrentStreak = profile.lastCompletedDate === yesterdayStr
          ? profile.currentStreak + 1
          : 1;

        if (newCurrentStreak > newBestStreak) newBestStreak = newCurrentStreak;
        lastCompleted = todayStr;
      }

      await updateProfileData({
        xp:                newXp,
        level:             newLevel,
        currentStreak:     newCurrentStreak,
        bestStreak:        newBestStreak,
        lastCompletedDate: lastCompleted,
        streakDates:       newStreakDates,
      });

      // Notifications
      if (newLevel > profile.level) {
        showSuccess(`🎉 Level Up! You are now Level ${newLevel}!`);
      } else if (newLevel < profile.level) {
        showError(`Level decreased to ${newLevel}.`);
      } else if (isNowCompleted) {
        showSuccess(`+${xpAmount} XP earned!`);
      } else if (!isNowCompleted && wasCompleted) {
        showError(`-${xpAmount} XP removed.`);
      }
    }
  };

  // =========================================================
  // TASK DELETION — Q5 occurrence-aware
  // =========================================================
  const handleDeleteTask = async (task) => {
    if (!user || isPastDate) return;

    if (task.recurrence !== 'One Time' && task.recurrence !== '3 Days') {
      await addTaskException(user.uid, task.id, selectedDate);
      showSuccess(`Occurrence on ${selectedDate} removed.`);
    } else {
      await removeTask(user.uid, task.id);
      showSuccess('Task deleted.');
    }
  };

  // =========================================================
  // RETURN
  // =========================================================
  return {
    // Data
    tasks,
    tasksForSelectedDate,
    sortedTasks,
    unfilteredSortedTasks,
    overdueTasksCount,
    scheduledHoursToday,

    // Filters
    searchQuery,       setSearchQuery,
    filterCategory,    setFilterCategory,
    filterPriority,    setFilterPriority,
    filterStatus,      setFilterStatus,

    // Actions
    addTask,
    addQuickTask,
    addStudyTask,
    handleUpdateStatus,
    handleDeleteTask,
  };
};
