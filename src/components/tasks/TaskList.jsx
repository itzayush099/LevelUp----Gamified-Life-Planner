// src/components/tasks/TaskList.jsx

import React from 'react';
import { Target } from 'lucide-react';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, selectedDate, isPastDate, isFutureDate, onStatusChange, onDelete }) => (
  <div className={`lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm ${isPastDate ? 'opacity-80' : ''}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" /> Master Task List
      </h3>
      <span className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full dark:text-gray-300">
        {tasks.length} Tasks for {selectedDate}
      </span>
    </div>

    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {tasks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No tasks found matching criteria.</p>
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isPastDate={isPastDate}
            isFutureDate={isFutureDate}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  </div>
);

export default TaskList;
