// src/components/tasks/TaskCard.jsx

import React from 'react';
import { Calendar, Clock, Repeat, Trash2, Lock } from 'lucide-react';
import { PRIORITIES, getPriorityTailwind } from '../../constants/priorities';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Skipped'];

const TaskCard = ({ task, isPastDate, isFutureDate, onStatusChange, onDelete }) => (
  <div
    className={`group flex flex-col p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border transition-all duration-200 relative ${
      task.isOverdue
        ? 'border-red-300 dark:border-red-800/80 bg-red-50/30 dark:bg-red-900/10'
        : task.currentStatus === 'Completed'
        ? 'border-gray-100 dark:border-gray-800 opacity-70 bg-gray-50 dark:bg-gray-800/30'
        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
    }`}
  >
    {task.isOverdue && (
      <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
        OVERDUE
      </span>
    )}

    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityTailwind(task.priority)}`}>
            {PRIORITIES.find((p) => p.value === task.priority)?.label}
          </span>
          {task.xpReward && (
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-0.5">
              +{task.xpReward} XP
            </span>
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {task.category}
          </span>
          {task.time > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{task.time}h</span>
          )}
          {task.recurrence !== 'One Time' && (
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded flex items-center gap-1">
              <Repeat className="w-3 h-3" /> {task.recurrence}
            </span>
          )}
        </div>

        <h4 className={`font-bold text-base mt-1 ${
          task.currentStatus === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'
        }`}>
          {task.name}
        </h4>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {task.date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {task.startTime} {task.endTime && `- ${task.endTime}`}</span>
        </div>

        {task.notes && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
            {task.notes}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {isFutureDate ? (
          <div className="text-xs font-bold px-3 py-2 rounded-xl border bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50 flex items-center gap-1.5 cursor-not-allowed select-none">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Available on Scheduled Date</span>
            <span className="sm:hidden">Locked</span>
          </div>
        ) : (
          <select
            value={task.currentStatus}
            onChange={(e) => onStatusChange(task.id, task, e.target.value)}
            disabled={isPastDate}
            className={`text-xs font-bold px-2 py-1.5 rounded-lg border outline-none transition-colors ${
              isPastDate ? 'opacity-70 cursor-not-allowed ' : 'cursor-pointer hover:border-gray-400 '
            } ${
              task.currentStatus === 'Completed'   ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
              task.currentStatus === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
              task.currentStatus === 'Skipped'     ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' :
              'bg-white text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600'
            }`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}
                disabled={s === 'Completed' && !task.isEligibleForCompletion && task.currentStatus !== 'Completed'}
              >
                {s}{s === 'Completed' && !task.isEligibleForCompletion && task.currentStatus !== 'Completed' ? ' 🔒' : ''}
              </option>
            ))}
          </select>
        )}

        {!isPastDate && (
          <button
            onClick={() => onDelete(task)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default TaskCard;
