// src/components/tasks/TaskForm.jsx

import React from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';

const TaskForm = ({
  selectedDate, todayStr,
  taskName,       setTaskName,
  taskDate,       setTaskDate,
  taskStartTime,  setTaskStartTime,
  taskEndTime,    setTaskEndTime,
  taskPriority,   setTaskPriority,
  taskCategory,   setTaskCategory,
  taskNotes,      setTaskNotes,
  taskRecurrence, setTaskRecurrence,
  derivedDuration,
  onSubmit,
}) => (
  <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
    <div className="flex flex-col mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Plus className="w-5 h-5 text-indigo-500" /> Create New Task
      </h3>
      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2.5 py-1 rounded-md flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" /> Task will be scheduled for: {selectedDate}
      </p>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Name *</label>
          <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-medium" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date *</label>
          <input type="date" min={todayStr} value={taskDate} onChange={(e) => setTaskDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
          <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Time *</label>
          <input type="time" value={taskStartTime} onChange={(e) => setTaskStartTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Time *</label>
          <input type="time" value={taskEndTime} onChange={(e) => setTaskEndTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Calculated Duration</label>
          <div className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" /> {derivedDuration} Hours
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recurrence</label>
          <select value={taskRecurrence} onChange={(e) => setTaskRecurrence(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-medium">
            <option value="One Time">One Time</option>
            <option value="Daily">Daily</option>
            <option value="3 Days">3 Days</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority (XP)</label>
          <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-medium">
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.value} XP)</option>)}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes / Description</label>
          <textarea rows="2" value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)}
            placeholder="Add details..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"></textarea>
        </div>
      </div>

      <button type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> Add Task to Schedule
      </button>
    </form>
  </div>
);

export default TaskForm;
