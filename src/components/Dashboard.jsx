// src/App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Target, AlertTriangle, CheckCircle, Calendar, Lock, Unlock } from 'lucide-react';

// Firebase
import { auth, db, appId } from '../services/firebase';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

// Hooks
import { useTimer } from '../hooks/useTimer';
import { useProfile } from '../hooks/useProfile';
import { useTasks } from '../hooks/useTasks';
import { useAnalytics } from '../hooks/useAnalytics';

// Utils
import { getLevelData } from '../utils/levelUtils';
import { deriveDuration } from '../utils/timerUtils';

// Layout
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

// Dashboard
import XPCard from './dashboard/XPCard';
import StreakCard from './dashboard/StreakCard';
import CompletionCard from './dashboard/CompletionCard';
import OverdueCard from './dashboard/OverdueCard';
import FocusCard from './dashboard/FocusCard';

// Tasks
import Timeline from './tasks/Timeline';
import TaskList from './tasks/TaskList';
import TaskForm from './tasks/TaskForm';
import QuickTemplates from './tasks/QuickTemplates';
import Filters from './tasks/Filters';

import CapacityTracker from './capacity/CapacityTracker';
import AnalyticsPanel from './analytics/AnalyticsPanel';
import ChallengeBoard from './challenges/ChallengeBoard';
// Gym Planner & Meal Planner
import GymPlanner from './gym/GymPlanner';
import MealPlanner from './meals/MealPlanner';

export default function Dashboard({ user }) {
  // =========================================================
  // GLOBAL UI STATE
  // =========================================================
  const [darkMode, setDarkMode]           = useState(true);
  const [activeTab, setActiveTab]         = useState('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toast notifications — exact v1.9 setState + setTimeout
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''), 4000); };

  // =========================================================
  // RESET HANDLER
  // =========================================================
  const handleResetData = async () => {
    if (!window.confirm("This will permanently clear all development/test data. Are you sure you want to proceed?")) {
      return;
    }
    
    try {
      showSuccess("Resetting application data...");
      
      // 1. Clear Local Storage
      localStorage.clear();

      // 2. Clear Firebase Collections for the current user
      if (db && user && user.uid) {
        const collectionsToClear = [
          'tasks', 'profile', 'quests', 
          'gym_templates', 'gym_schedules', 'gym_sessions', 
          'gym_measurements', 'gym_recovery', 'gym_settings', 'exercises',
          
          // Gym/Recovery New format
          'gym_logs', 'recovery_logs', 'body_progress',
          
          // Meal Planner Collections
          'foods', 'meal_logs', 'supplements', 'grocery_list', 'meal_settings',
          
          // Meal Planner Nested Collections
          'meal_settings/water_logs/daily',
          'meal_settings/supplement_logs/daily',
          'meal_settings/profiles'
        ];

        for (const colName of collectionsToClear) {
          try {
            const colRef = collection(db, 'artifacts', appId, 'users', user.uid, colName);
            const snapshot = await getDocs(colRef);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
          } catch (err) {
            console.warn(`Failed to clear collection ${colName}:`, err);
          }
        }
      }

      // 3. Reload the application to force a clean slate
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset data:", e);
      showError("Failed to reset data. See console.");
    }
  };

  // =========================================================
  // DATE WORKSPACE — exact v1.9 logic
  // =========================================================
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isPastDate   = selectedDate < todayStr;
  const isFutureDate = selectedDate > todayStr;

  // 1-second clock tick
  const { currentTimeMs, nowTimeStr } = useTimer();

  // =========================================================
  // DATA HOOKS — using new modular architecture
  // =========================================================
  const { profile, updateMaxHours, updateProfileData } = useProfile(user);

  const {
    tasksForSelectedDate,
    sortedTasks,
    unfilteredSortedTasks,
    overdueTasksCount,
    scheduledHoursToday,
    // Filter state
    searchQuery,     setSearchQuery,
    filterCategory,  setFilterCategory,
    filterPriority,  setFilterPriority,
    filterStatus,    setFilterStatus,
    // Actions
    addTask,
    addQuickTask,
    addStudyTask,
    handleUpdateStatus,
    handleDeleteTask,
  } = useTasks(user, {
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
  });

  // =========================================================
  // ANALYTICS — computed from enriched tasks
  // =========================================================
  const dailyAnalytics = useAnalytics(tasksForSelectedDate);

  // XP / Level — exact v1.9 getLevelData logic
  const { level: currentLevel, nextLevelXp, currentBaseXp } = getLevelData(profile.xp);
  const xpProgressPercentage = nextLevelXp > currentBaseXp
    ? Math.min(100, Math.max(0, ((profile.xp - currentBaseXp) / (nextLevelXp - currentBaseXp)) * 100))
    : 0;

  // =========================================================
  // TASK FORM STATE — exact v1.9 form fields
  // =========================================================
  const [taskName, setTaskName]             = useState('');
  const [taskDate, setTaskDate]             = useState(todayStr);
  const [taskStartTime, setTaskStartTime]   = useState('09:00');
  const [taskEndTime, setTaskEndTime]       = useState('10:00');
  const [taskPriority, setTaskPriority]     = useState('10');
  const [taskCategory, setTaskCategory]     = useState('Work');
  const [taskNotes, setTaskNotes]           = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('One Time');
  const [showStudyMenu, setShowStudyMenu]   = useState(false);

  // Sync task date with selected date
  useEffect(() => { setTaskDate(selectedDate); }, [selectedDate]);

  // Derived duration — exact v1.9 derivedDuration useMemo
  const taskDuration = useMemo(
    () => deriveDuration(taskStartTime, taskEndTime),
    [taskStartTime, taskEndTime]
  );

  // =========================================================
  // FORM HANDLERS
  // =========================================================
  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!taskName || !taskDate || !taskStartTime || !taskEndTime) {
      showError('Please fill required fields (Name, Date, Start & End Time).');
      return;
    }
    if (taskDuration <= 0) {
      showError('End time must be after start time.');
      return;
    }
    await addTask({
      name:       taskName,
      date:       taskDate,
      startTime:  taskStartTime,
      endTime:    taskEndTime,
      time:       taskDuration,
      priority:   taskPriority,
      category:   taskCategory,
      notes:      taskNotes,
      recurrence: taskRecurrence,
    });
    // Reset form
    setTaskName('');
    setTaskNotes('');
  };

  const handleQuickAdd = async (template) => {
    await addQuickTask(template);
  };

  const handleStudyAdd = async (option) => {
    setShowStudyMenu(false);
    await addStudyTask(option);
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
        {/* Mobile Header */}
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Sidebar */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onResetData={handleResetData}
        />

        {/* Sidebar Overlay (mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0 pb-20 lg:pb-0 scroll-smooth">
          {/* Toast Notifications — exact v1.9 layout */}
          {errorMsg && (
            <div className="fixed top-20 lg:top-4 right-4 z-50 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="fixed top-20 lg:top-4 right-4 z-50 bg-green-100 dark:bg-green-900/80 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium text-sm">{successMsg}</p>
            </div>
          )}

          <div className="p-4 lg:p-8 min-h-full">
            {!user ? (
              /* Auth Loading Spinner */
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* ============================== */}
                {/* TASKS TAB — exact v1.9 layout  */}
                {/* ============================== */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6 max-w-6xl mx-auto pb-10">

                    {/* Date Workspace Header */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workspace</h2>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        {isPastDate ? (
                          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked (Past Date)
                          </span>
                        ) : isFutureDate ? (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Future (Scheduled)
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Editable (Today)
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-3 border-l border-gray-300 dark:border-gray-600 pl-3">Date:</span>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {selectedDate !== todayStr && (
                          <button
                            onClick={() => setSelectedDate(todayStr)}
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors"
                          >
                            Today
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dashboard Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <XPCard
                        level={currentLevel}
                        xp={profile.xp}
                        nextLevelXp={nextLevelXp}
                        xpProgressPercentage={xpProgressPercentage}
                      />
                      <StreakCard
                        currentStreak={profile.currentStreak}
                        bestStreak={profile.bestStreak}
                        streakDates={profile.streakDates || []}
                      />
                      <CompletionCard
                        completionRate={dailyAnalytics.completionRate}
                        selectedDate={selectedDate}
                      />
                      <OverdueCard
                        overdueCount={overdueTasksCount}
                        selectedDate={selectedDate}
                      />
                    </div>

                    {/* Timeline + Capacity & Quick Templates column */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Timeline
                        tasks={unfilteredSortedTasks}
                        selectedDate={selectedDate}
                        todayStr={todayStr}
                        isPastDate={isPastDate}
                        isFutureDate={isFutureDate}
                        onStatusChange={handleUpdateStatus}
                      />
                      <div className="space-y-6 flex flex-col">
                        <CapacityTracker
                          scheduledHours={scheduledHoursToday}
                          maxHours={profile.maxHours}
                          onMaxHoursChange={updateMaxHours}
                          selectedDate={selectedDate}
                        />
                        {!isPastDate && (
                          <QuickTemplates
                            onQuickAdd={handleQuickAdd}
                            onStudyAdd={handleStudyAdd}
                            showStudyMenu={showStudyMenu}
                            setShowStudyMenu={setShowStudyMenu}
                          />
                        )}
                        <Filters
                          searchQuery={searchQuery}       setSearchQuery={setSearchQuery}
                          filterStatus={filterStatus}     setFilterStatus={setFilterStatus}
                          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
                          filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        />
                         <FocusCard currentStreak={profile.currentStreak} tasks={unfilteredSortedTasks} />
                      </div>
                    </div>

                    {/* Task Form & Analytics Panel (hidden on past dates) */}
                    {!isPastDate && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <TaskForm
                          selectedDate={selectedDate}
                          todayStr={todayStr}
                          taskName={taskName}             setTaskName={setTaskName}
                          taskDate={taskDate}             setTaskDate={setTaskDate}
                          taskStartTime={taskStartTime}   setTaskStartTime={setTaskStartTime}
                          taskEndTime={taskEndTime}       setTaskEndTime={setTaskEndTime}
                          taskPriority={taskPriority}     setTaskPriority={setTaskPriority}
                          taskCategory={taskCategory}     setTaskCategory={setTaskCategory}
                          taskNotes={taskNotes}           setTaskNotes={setTaskNotes}
                          taskRecurrence={taskRecurrence} setTaskRecurrence={setTaskRecurrence}
                          derivedDuration={taskDuration}
                          onSubmit={handleAddTask}
                        />
                        <AnalyticsPanel
                          analytics={dailyAnalytics}
                          selectedDate={selectedDate}
                          isPastDate={isPastDate}
                        />
                      </div>
                    )}

                    {/* Master Task List + Analytics/Quests */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <TaskList
                        tasks={sortedTasks}
                        selectedDate={selectedDate}
                        isPastDate={isPastDate}
                        isFutureDate={isFutureDate}
                        onStatusChange={handleUpdateStatus}
                        onDelete={handleDeleteTask}
                      />
                      {!isPastDate && (
                        <ChallengeBoard
                          profile={profile}
                          updateProfileData={updateProfileData}
                          tasks={unfilteredSortedTasks}
                          selectedDate={selectedDate}
                          addTask={addTask}
                          showSuccess={showSuccess}
                          showError={showError}
                        />
                      )}
                      {isPastDate && (
                        <div className="space-y-6">
                          <AnalyticsPanel
                            analytics={dailyAnalytics}
                            selectedDate={selectedDate}
                            isPastDate={isPastDate}
                          />
                          <ChallengeBoard
                            profile={profile}
                            updateProfileData={updateProfileData}
                            tasks={unfilteredSortedTasks}
                            selectedDate={selectedDate}
                            addTask={addTask}
                            showSuccess={showSuccess}
                            showError={showError}
                          />
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* ============================== */}
                {/* GYM TAB                        */}
                {/* ============================== */}
                {activeTab === 'gym' && (
                  <GymPlanner user={user} />
                )}

                {/* ============================== */}
                {/* MEALS                          */}
                {/* ============================== */}
                {activeTab === 'meals' && (
                  <MealPlanner user={user} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
