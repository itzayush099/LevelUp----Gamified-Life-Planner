// src/services/taskService.js

import { onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { getTasksRef, getTaskDocRef, db } from './firebase';

// -----------------------------------------------------------
// LocalStorage helpers for offline support
// -----------------------------------------------------------
const getLocalTasks = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`tasks_${userId}`) || '[]');
  } catch (e) {
    return [];
  }
};

const saveLocalTasks = (userId, tasks) => {
  localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks));
};

const notifyLocalUpdate = () => {
  window.dispatchEvent(new Event('local-tasks-updated'));
};

/**
 * Subscribes to real-time updates of a user's tasks collection.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {Function} callback - receives task list
 * @returns {Function} unsubscribe
 */
export const subscribeToTasks = (userId, callback) => {
  if (!db) {
    // Trigger initial callback with cached local storage tasks
    callback(getLocalTasks(userId));
    
    // Listen for custom events to trigger updates
    const handleLocalUpdate = () => {
      callback(getLocalTasks(userId));
    };
    window.addEventListener('local-tasks-updated', handleLocalUpdate);
    return () => window.removeEventListener('local-tasks-updated', handleLocalUpdate);
  }

  return onSnapshot(getTasksRef(userId), (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
};

const calculateRandomXp = (priority) => {
  const p = Number(priority);
  if (p === 50) return Math.floor(Math.random() * (75 - 48 + 1)) + 48; // Critical (48-75)
  if (p === 30) return Math.floor(Math.random() * (42 - 28 + 1)) + 28; // High (28-42)
  if (p === 20) return Math.floor(Math.random() * (26 - 16 + 1)) + 16; // Medium (16-26)
  return Math.floor(Math.random() * (14 - 8 + 1)) + 8; // Low (8-14)
};

/**
 * Creates a new task document.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {Object} taskData
 * @returns {Promise<any>}
 */
export const createTask = async (userId, taskData) => {
  const xpReward = taskData.xpReward !== undefined ? taskData.xpReward : calculateRandomXp(taskData.priority);
  if (!db) {
    const tasks = getLocalTasks(userId);
    const newTask = {
      id:              Math.random().toString(36).substring(2, 9),
      name:            taskData.name,
      date:            taskData.date,
      startTime:       taskData.startTime,
      endTime:         taskData.endTime,
      time:            taskData.time,
      priority:        Number(taskData.priority),
      xpReward,
      category:        taskData.category,
      status:          taskData.status || 'Not Started',
      notes:           taskData.notes || '',
      recurrence:      taskData.recurrence || 'One Time',
      statusOverrides: {},
      timers:          {},
      exceptions:      [],
      createdAt:       new Date().toISOString(),
    };
    tasks.push(newTask);
    saveLocalTasks(userId, tasks);
    notifyLocalUpdate();
    return { id: newTask.id };
  }

  return addDoc(getTasksRef(userId), {
    name:            taskData.name,
    date:            taskData.date,
    startTime:       taskData.startTime,
    endTime:         taskData.endTime,
    time:            taskData.time,
    priority:        Number(taskData.priority),
    xpReward,
    category:        taskData.category,
    status:          taskData.status || 'Not Started',
    notes:           taskData.notes || '',
    recurrence:      taskData.recurrence || 'One Time',
    statusOverrides: {},
    timers:          {},
    exceptions:      [],
    createdAt:       new Date().toISOString(),
  });
};

/**
 * Updates one or more fields on an existing task document.
 * Falls back to LocalStorage if Firebase is offline.
 * Supports dot-notation updates.
 * @param {string} userId
 * @param {string} taskId
 * @param {Object} updates
 * @returns {Promise<void>}
 */
export const updateTask = async (userId, taskId, updates) => {
  if (!db) {
    const tasks = getLocalTasks(userId);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const task = tasks[idx];
      Object.keys(updates).forEach(key => {
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = task;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = updates[key];
        } else {
          task[key] = updates[key];
        }
      });
      saveLocalTasks(userId, tasks);
      notifyLocalUpdate();
    }
    return;
  }

  return updateDoc(getTaskDocRef(userId, taskId), updates);
};

/**
 * Permanently deletes a task document.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {string} taskId
 * @returns {Promise<void>}
 */
export const deleteTask = async (userId, taskId) => {
  if (!db) {
    let tasks = getLocalTasks(userId);
    tasks = tasks.filter(t => t.id !== taskId);
    saveLocalTasks(userId, tasks);
    notifyLocalUpdate();
    return;
  }

  return deleteDoc(getTaskDocRef(userId, taskId));
};

/**
 * Adds a date to the task's exceptions array.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {string} taskId
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Promise<void>}
 */
export const addTaskException = async (userId, taskId, dateStr) => {
  if (!db) {
    const tasks = getLocalTasks(userId);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.exceptions) task.exceptions = [];
      if (!task.exceptions.includes(dateStr)) {
        task.exceptions.push(dateStr);
      }
      saveLocalTasks(userId, tasks);
      notifyLocalUpdate();
    }
    return;
  }

  return updateDoc(getTaskDocRef(userId, taskId), {
    exceptions: arrayUnion(dateStr),
  });
};
